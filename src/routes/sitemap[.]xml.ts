import { createFileRoute } from "@tanstack/react-router";

const BASE_URL = "https://streamandscream.com";

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

// Public Supabase REST read for published post slugs. Uses the publishable
// (anon) key so this works in the edge/preview environment without a session.
async function getPublishedSlugs(): Promise<string[]> {
  const url = process.env["VITE_SUPABASE_URL"] || process.env["SUPABASE_URL"];
  const key =
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"] ||
    process.env["VITE_SUPABASE_ANON_KEY"] ||
    process.env["SUPABASE_ANON_KEY"];
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/posts?select=slug&published=eq.true&order=created_at.desc&limit=1000`,
      { headers: { apikey: key, Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string }[];
    return rows.filter((r) => r.slug).map((r) => r.slug);
  } catch {
    return [];
  }
}

const AMP = String.fromCharCode(38) + "amp;"; // &
const LT = String.fromCharCode(60) + "lt;"; // <
const GT = String.fromCharCode(62) + "gt;"; // >
const QUOT = String.fromCharCode(38) + "quot;"; // "
const APOS = String.fromCharCode(38) + "apos;"; // '

function escapeXml(value: string): string {
  return value
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT)
    .replace(/'/g, APOS);
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const staticEntries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/tv", changefreq: "daily", priority: "0.9" },
          { path: "/true-crime", changefreq: "daily", priority: "0.9" },
          { path: "/tv-news", changefreq: "daily", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
        ];

        const slugs = await getPublishedSlugs();
        const postEntries: SitemapEntry[] = slugs.map((slug) => ({
          path: `/post/${slug}`,
          changefreq: "weekly",
          priority: "0.7",
        }));

        const entries = [...staticEntries, ...postEntries];

        const urls = entries.map((e) =>
          [
            "  <url>",
            `    <loc>${escapeXml(BASE_URL + e.path)}</loc>`,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            "  </url>",
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...urls,
          "</urlset>",
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
