import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SITE_URL = "https://streamandscream.com/";
const SITEMAP_URL = "https://streamandscream.com/sitemap.xml";

export const pingSitemap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [{ data: isAuthor }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "author" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (!isAuthor && !isAdmin) throw new Error("Forbidden");

    const results: { service: string; ok: boolean; status?: number; message?: string }[] = [];

    // Google Search Console — resubmit sitemap via connector gateway
    const lovableKey = process.env.LOVABLE_API_KEY;
    const gscKey = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
    if (lovableKey && gscKey) {
      const path = `/webmasters/v3/sites/${encodeURIComponent(SITE_URL)}/sitemaps/${encodeURIComponent(SITEMAP_URL)}`;
      try {
        const res = await fetch(`https://connector-gateway.lovable.dev/google_search_console${path}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": gscKey,
          },
        });
        results.push({
          service: "Google Search Console",
          ok: res.ok,
          status: res.status,
          message: res.ok ? "Sitemap resubmitted" : await res.text(),
        });
      } catch (e) {
        results.push({ service: "Google Search Console", ok: false, message: (e as Error).message });
      }
    } else {
      results.push({ service: "Google Search Console", ok: false, message: "Connector not linked" });
    }

    // IndexNow — notifies Bing, Yandex, Seznam, Naver
    const indexNowKey = process.env.INDEXNOW_KEY;
    if (indexNowKey) {
      try {
        const res = await fetch("https://api.indexnow.org/IndexNow", {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            host: "streamandscream.com",
            key: indexNowKey,
            keyLocation: `https://streamandscream.com/${indexNowKey}.txt`,
            urlList: [SITEMAP_URL, "https://streamandscream.com/"],
          }),
        });
        results.push({
          service: "IndexNow (Bing/Yandex)",
          ok: res.ok || res.status === 202,
          status: res.status,
          message: res.ok || res.status === 202 ? "Notified" : await res.text(),
        });
      } catch (e) {
        results.push({ service: "IndexNow (Bing/Yandex)", ok: false, message: (e as Error).message });
      }
    } else {
      results.push({ service: "IndexNow (Bing/Yandex)", ok: false, message: "INDEXNOW_KEY secret not set" });
    }

    return { results, pingedAt: new Date().toISOString() };
  });
