import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type RssItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  image: string | null;
};

const SOURCES = [
  { name: "Deadline TV", url: "https://deadline.com/v/tv/feed/" },
];

function decode(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#039;/g, "'")
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

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRe = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = decode(tagContent(block, "title"));
    const link = decode(tagContent(block, "link"));
    const description = decode(tagContent(block, "description"));
    const pubDate = decode(tagContent(block, "pubDate"));
    const imgMatch = block.match(/<media:content[^>]+url="([^"]+)"/i) ?? block.match(/<enclosure[^>]+url="([^"]+)"/i);
    const image = imgMatch ? imgMatch[1] : null;
    if (title && link) items.push({ title, link, description, pubDate, image });
  }
  return items;
}

type Classification = {
  status: "renewed" | "cancelled" | "ended" | "other";
  show_title: string | null;
  network: string | null;
  summary: string;
};

async function classify(items: { title: string; description: string }[]): Promise<Classification[]> {
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const numbered = items.map((it, i) => `${i + 1}. TITLE: ${it.title}\n   SUMMARY: ${it.description.slice(0, 400)}`).join("\n\n");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Lovable-API-Key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content:
            "You classify TV industry news. For each item, decide if it is about a TV show being RENEWED for another season, CANCELLED, ENDED (ran its final season), or OTHER (anything else: castings, premieres, deals, ratings, awards). Extract the show title and network/streamer if mentioned. Respond ONLY with JSON: {\"items\":[{\"status\":\"renewed|cancelled|ended|other\",\"show_title\":\"...\"|null,\"network\":\"...\"|null,\"summary\":\"one short sentence\"}]}. Preserve input order.",
        },
        { role: "user", content: numbered },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  const content = json.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content) as { items?: Classification[] };
  return parsed.items ?? [];
}

async function runIngest() {
  let inserted = 0;
  let skipped = 0;
  let classified = 0;
  const errors: string[] = [];

  for (const source of SOURCES) {
    try {
      const res = await fetch(source.url, { headers: { "User-Agent": "Mozilla/5.0 BoldNewsBot" } });
      if (!res.ok) {
        errors.push(`${source.name}: HTTP ${res.status}`);
        continue;
      }
      const xml = await res.text();
      const items = parseRss(xml).slice(0, 30);

      // Filter out items already in DB
      const urls = items.map((i) => i.link);
      const { data: existing } = await supabaseAdmin
        .from("tv_news")
        .select("source_url")
        .in("source_url", urls);
      const have = new Set((existing ?? []).map((r) => r.source_url));
      const fresh = items.filter((i) => !have.has(i.link));
      skipped += items.length - fresh.length;
      if (fresh.length === 0) continue;

      // Classify in batches of 10
      const classifications: Classification[] = [];
      for (let i = 0; i < fresh.length; i += 10) {
        const batch = fresh.slice(i, i + 10);
        try {
          const c = await classify(batch);
          classifications.push(...c);
        } catch (e) {
          errors.push(`classify: ${(e as Error).message}`);
          // Fill with "other" so we can still insert raw items
          for (const _ of batch) {
            classifications.push({ status: "other", show_title: null, network: null, summary: "" });
          }
        }
      }
      classified += fresh.length;

      // Only insert items that are renewed/cancelled/ended
      const rows = fresh
        .map((item, idx) => {
          const c = classifications[idx] ?? { status: "other" as const, show_title: null, network: null, summary: "" };
          return { item, c };
        })
        .filter(({ c }) => c.status !== "other")
        .map(({ item, c }) => ({
          title: item.title,
          summary: c.summary || item.description.slice(0, 280),
          source_url: item.link,
          source_name: source.name,
          show_title: c.show_title,
          network: c.network,
          status: c.status,
          image_url: item.image,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        }));

      if (rows.length > 0) {
        const { error } = await supabaseAdmin.from("tv_news").insert(rows);
        if (error) {
          errors.push(`insert: ${error.message}`);
        } else {
          inserted += rows.length;
        }
      }
    } catch (e) {
      errors.push(`${source.name}: ${(e as Error).message}`);
    }
  }

  return { inserted, skipped, classified, errors };
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
