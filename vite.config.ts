// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { writeFile } from "node:fs/promises";

// Static (Hostinger / Apache shared hosting) build:
//   STATIC_BUILD=1 vite build
// Produces a fully static site (SPA shell + prerendered HTML per page) in .output/public,
// with index.html at the root. Inside Lovable the normal edge build is used untouched.
const STATIC = process.env["STATIC_BUILD"] === "1";
const SITE_URL = process.env["SITE_URL"] || "https://streamandscream.com";

async function getPostPages(): Promise<{ path: string }[]> {
  const url = process.env["VITE_SUPABASE_URL"];
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error("Static build requires the public database URL and key to load published posts.");
  }

  const res = await fetch(
    `${url}/rest/v1/posts?select=slug&published=eq.true&order=created_at.desc&limit=1000`,
    { headers: { apikey: key, Accept: "application/json" } },
  );
  if (!res.ok) {
    throw new Error(`Could not load published posts for the static build [${res.status}]: ${await res.text()}`);
  }

  const rows = (await res.json()) as { slug?: unknown }[];
  const slugs = rows.map((row) => row.slug).filter((slug): slug is string => typeof slug === "string" && slug.length > 0);
  if (slugs.length !== rows.length) throw new Error("A published post has a missing or invalid slug.");
  if (new Set(slugs).size !== slugs.length) throw new Error("Published post slugs must be unique.");

  // The post-build check uses this exact source-of-truth list. If even one
  // page or sitemap entry is absent, the build fails before Hostinger upload.
  await writeFile(".static-post-manifest.json", JSON.stringify(slugs));

  return [
    ...slugs.map((slug) => ({ path: `/post/${slug}` })),
    ...slugs.map((slug) => ({ path: `/shows-like/${slug}` })),
  ];
}

const staticPages = STATIC ? await getPostPages() : [];

export default defineConfig({
  vite: {
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;
            if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return "react";
            if (id.includes("@tanstack")) return "tanstack";
            if (id.includes("@supabase")) return "supabase";
            return "vendor";
          },
        },
      },
    },
  },
  ...(STATIC ? { nitro: false as const } : {}),

  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    ...(STATIC ? {} : { server: { entry: "server" as const } }),
    ...(STATIC
      ? {
          spa: { enabled: true, maskPath: "/shell" },
          sitemap: { enabled: true, host: SITE_URL },
          prerender: {
            enabled: true,
            // Crawling links pulled in hundreds of low-value archive pages
            // (every /tag/*). Those routes still work client-side through the
            // Apache SPA fallback, so only the explicit page list is emitted.
            crawlLinks: false,
            autoSubfolderIndex: true,
            concurrency: 8,
            // Never prerender or list private/editor/archive routes
            filter: ({ path }: { path: string }) =>
              !path.startsWith("/admin") &&
              !path.startsWith("/auth") &&
              !path.startsWith("/api") &&
              !path.startsWith("/tag") &&
              !path.startsWith("/search"),

          },

          pages: [
            { path: "/" },
            { path: "/tv" },
            { path: "/true-crime" },
            { path: "/tv-news" },
            { path: "/about" },
            ...staticPages,
          ],
        }
      : {}),
  },
});
