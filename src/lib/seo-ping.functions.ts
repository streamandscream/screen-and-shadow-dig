import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://streamandscream.com/";
const SITEMAP_URL = "https://streamandscream.com/sitemap.xml";

const MAX_ATTEMPTS = 4; // total tries: 1 initial + 3 retries
const BASE_DELAY_MS = 500;
const MAX_DELAY_MS = 8_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// A response is retryable if it's a transient network/server issue.
// 408 Timeout, 425 Too Early, 429 Rate Limit, and any 5xx are retried.
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function fetchWithBackoff(
  url: string,
  init: RequestInit,
  label: string,
): Promise<{ res?: Response; error?: Error; attempts: number }> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || !isRetryableStatus(res.status)) {
        return { res, attempts: attempt };
      }
      lastError = new Error(`HTTP ${res.status}`);
      // Drain body so the connection can be reused
      try { await res.arrayBuffer(); } catch { /* ignore */ }
    } catch (e) {
      lastError = e as Error;
    }

    if (attempt < MAX_ATTEMPTS) {
      const jitter = Math.random() * BASE_DELAY_MS;
      const delay = Math.min(BASE_DELAY_MS * 2 ** (attempt - 1) + jitter, MAX_DELAY_MS);
      console.warn(`[pingSitemap] ${label} attempt ${attempt} failed (${lastError?.message}); retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
  return { error: lastError, attempts: MAX_ATTEMPTS };
}

type RedirectIssue = { url: string; status: number; location: string | null };

async function checkSitemapRedirects(): Promise<{
  checked: number;
  issues: RedirectIssue[];
  error?: string;
}> {
  try {
    const smRes = await fetch(SITEMAP_URL, { headers: { Accept: "application/xml" } });
    if (!smRes.ok) return { checked: 0, issues: [], error: `Sitemap fetch ${smRes.status}` };
    const xml = await smRes.text();
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g))
      .map((m) => m[1].trim())
      .filter((u) => u.startsWith("http"));

    const issues: RedirectIssue[] = [];
    const concurrency = 8;
    let i = 0;
    async function worker() {
      while (i < urls.length) {
        const idx = i++;
        const url = urls[idx];
        try {
          let res = await fetch(url, { method: "HEAD", redirect: "manual" });
          if (res.status === 405 || res.status === 501) {
            res = await fetch(url, { method: "GET", redirect: "manual" });
          }
          if (res.status >= 300 && res.status < 400) {
            issues.push({ url, status: res.status, location: res.headers.get("location") });
          }
        } catch (e) {
          issues.push({ url, status: 0, location: (e as Error).message });
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));
    return { checked: urls.length, issues };
  } catch (e) {
    return { checked: 0, issues: [], error: (e as Error).message };
  }
}

export const pingSitemap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAuthor }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "author" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (!isAuthor && !isAdmin) throw new Error("Forbidden");

    // Pre-flight: flag any sitemap URLs that would redirect before we tell Google.
    const redirectCheck = await checkSitemapRedirects();

    const results: {
      service: string;
      ok: boolean;
      status?: number;
      message?: string;
      attempts?: number;
    }[] = [];

    // Google Search Console — resubmit sitemap via connector gateway
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gscKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
    if (lovableKey && gscKey) {
      const path = `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
      const { res, error, attempts } = await fetchWithBackoff(
        `https://connector-gateway.lovable.dev/google_search_console${path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": gscKey,
          },
        },
        "Google Search Console",
      );
      if (res) {
        results.push({
          service: "Google Search Console",
          ok: res.ok,
          status: res.status,
          message: res.ok ? "Sitemap resubmitted" : await res.text(),
          attempts,
        });
      } else {
        results.push({
          service: "Google Search Console",
          ok: false,
          message: error?.message ?? "Unknown error",
          attempts,
        });
      }
    } else {
      results.push({ service: "Google Search Console", ok: false, message: "Connector not linked" });
    }

    // IndexNow — notifies Bing, Yandex, Seznam, Naver
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      const { res, error, attempts } = await fetchWithBackoff(
        "https://api.indexnow.org/IndexNow",
        {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host: "streamandscream.com",
            key: indexNowKey,
            keyLocation: "https://streamandscream.com/api/public/indexnow-key.txt",
            urlList: [SITEMAP_URL, "https://streamandscream.com/"],
          }),
        },
        "IndexNow",
      );
      if (res) {
        const ok = res.ok || res.status === 202;
        results.push({
          service: "IndexNow (Bing/Yandex)",
          ok,
          status: res.status,
          message: ok ? "Notified" : await res.text(),
          attempts,
        });
      } else {
        results.push({
          service: "IndexNow (Bing/Yandex)",
          ok: false,
          message: error?.message ?? "Unknown error",
          attempts,
        });
      }
    } else {
      results.push({ service: "IndexNow (Bing/Yandex)", ok: false, message: "INDEXNOW_KEY secret not set" });
    }

    return { results, redirectCheck, pingedAt: new Date().toISOString() };
  });
