// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Static (Hostinger / Apache shared hosting) build:
//   STATIC_BUILD=1 vite build
// Produces a fully static site (SPA shell + prerendered HTML per page) in .output/public,
// with index.html at the root. Inside Lovable the normal edge build is used untouched.
const STATIC = process.env["STATIC_BUILD"] === "1";
const SITE_URL = process.env["SITE_URL"] || "https://streamandscream.com";

async function getPostPages(): Promise<{ path: string }[]> {
  const url = process.env["VITE_SUPABASE_URL"];
  const key = process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) return [];
  try {
    const res = await fetch(
      `${url}/rest/v1/posts?select=slug&published=eq.true&order=created_at.desc&limit=1000`,
      { headers: { apikey: key, Accept: "application/json" } },
    );
    if (!res.ok) return [];
    const rows = (await res.json()) as { slug: string }[];
    return rows.filter((r) => r.slug).map((r) => ({ path: `/post/${r.slug}` }));
  } catch {
    return [];
  }
}

const staticPages = STATIC ? await getPostPages() : [];

export default defineConfig({
  ...(STATIC ? { nitro: { preset: "static" as const } } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    ...(STATIC ? {} : { server: { entry: "server" as const } }),
    ...(STATIC
      ? {
          spa: { enabled: true },
        }
      : {}),
  },
});
