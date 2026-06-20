import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  categories: string[];
};

const SOURCES = [
  { name: "TV Series Finale", url: "https://tvseriesfinale.com/feed/" },
];

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function tagContent(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function allTagContents(block: string, tag: string): string[] {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) out.push(m[1]);
  return out;
}

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = decodeEntities(tagContent(block, "title"));
    const link = decodeEntities(tagContent(block, "link"));
    const description = decodeEntities(tagContent(block, "description"));
    const pubDate = decodeEntities(tagContent(block, "pubDate"));
    const categories = allTagContents(block, "category").map(decodeEntities);
    if (title && link) items.push({ title, link, description, pubDate, categories });
  }
  return items;
}

type Status = "renewed" | "cancelled" | "ended" | "other";

const NETWORKS = [
  "Netflix", "Hulu", "Prime Video", "Amazon", "Apple TV+", "Apple TV", "Disney+",
  "Disney Plus", "Paramount+", "Paramount", "Peacock", "Max", "HBO Max", "HBO",
  "BritBox", "BBC", "ITV", "Channel 4", "Channel 5", "AMC", "FX", "NBC", "CBS",
  "ABC", "Fox", "The CW", "CW", "Showtime", "Starz", "Acorn TV",
];

function classify(title: string, categories: string[]): { status: Status; show_title: string | null; network: string | null } {
  const t = title.toLowerCase();
  // Skip network roundup posts like "Cancelled or Renewed? Status of NBC TV Shows"
  if (/cancel(l)?ed or renewed\??.*status of/i.test(title)) {
    return { status: "other", show_title: null, network: null };
  }
  let status: Status = "other";
  if (/\b(cancel{1,2}ed|cancellation)\b/.test(t)) status = "cancelled";
  else if (/\b(renew(ed|al|s)?)\b/.test(t)) status = "renewed";
  else if (/\b(final season|series finale|ends with|ending|ends after|cancel(ed|led)? after final|to end)\b/.test(t)) status = "ended";

  // Skip ratings / non-status posts
  if (status === "other") {
    if (/ratings|season \d+ ratings/i.test(title)) return { status, show_title: null, network: null };
  }

  // Show title = text before the first ":" if it looks like a show name
  const show_title = title.includes(":") ? title.split(":")[0].trim() : null;

  // Network: search title for a known name
  let network: string | null = null;
  for (const n of NETWORKS) {
    if (new RegExp(`\\b${n.replace(/\+/g, "\\+")}\\b`, "i").test(title)) { network = n; break; }
  }

  return { status, show_title, network };
}

async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 BoldNewsBot" } });
    if (!res.ok) return null;
    const html = await res.text();
    const m =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

async function runIngest() {
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const source of SOURCES) {
    const startedAt = Date.now();
    let httpStatus: number | null = null;
    let itemsFetched = 0;
    let sourceInserted = 0;
    let sourceSkipped = 0;
    let parseErrors = 0;
    let sourceError: string | null = null;

    try {
      const res = await fetch(source.url, { headers: { "User-Agent": "Mozilla/5.0 BoldNewsBot" } });
      httpStatus = res.status;
      if (!res.ok) {
        sourceError = `HTTP ${res.status}`;
        errors.push(`${source.name}: HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      let items: RssItem[] = [];
      try {
        items = parseRss(xml);
      } catch (e) {
        parseErrors += 1;
        sourceError = `parse: ${(e as Error).message}`;
        errors.push(`${source.name}: ${sourceError}`);
        continue;
      }
      itemsFetched = items.length;

      // Classify + filter: keep only renewed/cancelled/ended
      const keepable = items
        .map((item) => ({ item, c: classify(item.title, item.categories) }))
        .filter(({ c }) => c.status === "renewed" || c.status === "cancelled" || c.status === "ended");

      const urls = keepable.map(({ item }) => item.link);
      const { data: existing } = await supabaseAdmin
        .from("tv_news")
        .select("source_url")
        .in("source_url", urls);
      const have = new Set((existing ?? []).map((r) => r.source_url));
      const fresh = keepable.filter(({ item }) => !have.has(item.link));
      sourceSkipped = keepable.length - fresh.length;
      skipped += sourceSkipped;
      if (fresh.length === 0) continue;

      // Fetch og:image for each fresh item in parallel (capped)
      const images = await Promise.all(fresh.map(({ item }) => fetchOgImage(item.link)));

      const rows = fresh.map(({ item, c }, idx) => ({
        title: item.title,
        summary: item.description.slice(0, 280),
        source_url: item.link,
        source_name: source.name,
        show_title: c.show_title,
        network: c.network,
        status: c.status,
        image_url: images[idx],
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      }));

      const { error } = await supabaseAdmin.from("tv_news").insert(rows);
      if (error) {
        sourceError = `insert: ${error.message}`;
        errors.push(sourceError);
      } else {
        sourceInserted = rows.length;
        inserted += rows.length;
      }
    } catch (e) {
      sourceError = (e as Error).message;
      errors.push(`${source.name}: ${sourceError}`);
    } finally {
      const latency = Date.now() - startedAt;
      await supabaseAdmin.from("ingestion_runs").insert({
        source_name: source.name,
        source_url: source.url,
        ok: sourceError === null,
        http_status: httpStatus,
        items_fetched: itemsFetched,
        items_inserted: sourceInserted,
        items_skipped: sourceSkipped,
        parse_errors: parseErrors,
        classify_errors: 0,
        latency_ms: latency,
        error: sourceError,
      });
    }
  }

  return { inserted, skipped, errors };
}

export const Route = createFileRoute("/api/public/hooks/ingest-tv-news")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await runIngest();
          return Response.json({ success: true, ...result });
        } catch (e) {
          return Response.json({ success: false, error: (e as Error).message }, { status: 500 });
        }
      },
      GET: async () => {
        try {
          const result = await runIngest();
          return Response.json({ success: true, ...result });
        } catch (e) {
          return Response.json({ success: false, error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
