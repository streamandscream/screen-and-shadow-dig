import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

const BASE_URL = "https://streamandscream.com";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "daily", priority: "1.0" },
          { path: "/tv", changefreq: "daily", priority: "0.9" },
          { path: "/true-crime", changefreq: "daily", priority: "0.9" },
          { path: "/tv-news", changefreq: "daily", priority: "0.8" },
          { path: "/about", changefreq: "monthly", priority: "0.5" },
        ];

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: posts } = await supabaseAdmin
            .from("posts")
            .select("slug, updated_at, tags")
            .eq("published", true);

          for (const p of posts ?? []) {
            if (!p.slug) continue;
            entries.push({
              path: `/post/${p.slug}`,
              lastmod: p.updated_at ? new Date(p.updated_at).toISOString() : undefined,
              changefreq: "weekly",
              priority: "0.7",
            });
          }

          const tagSet = new Set<string>();
          for (const p of posts ?? []) {
            for (const t of p.tags ?? []) {
              if (typeof t === "string" && t.trim()) tagSet.add(t.trim());
            }
          }
          for (const t of tagSet) {
            entries.push({
              path: `/tag/${encodeURIComponent(t)}`,
              changefreq: "weekly",
              priority: "0.5",
            });
          }
        } catch (err) {
          console.error("sitemap: failed to load dynamic entries", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
