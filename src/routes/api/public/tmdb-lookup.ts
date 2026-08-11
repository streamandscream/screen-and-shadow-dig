import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/_tmdb_lookup")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const title = url.searchParams.get("title");
        if (!title) return new Response("missing title", { status: 400 });
        const key = process.env["TMDB_API_KEY"];
        if (!key) return new Response("no key", { status: 500 });
        const isBearer = key.startsWith("ey");
        const headers: Record<string, string> = { accept: "application/json" };
        if (isBearer) headers["Authorization"] = `Bearer ${key}`;
        const base = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(title)}${isBearer ? "" : `&api_key=${key}`}`;
        const res = await fetch(base, { headers });
        const json = (await res.json()) as { results?: Array<Record<string, any>> };
        const hit = (json.results ?? []).find((r) => r.poster_path);
        return new Response(
          JSON.stringify({ cover_url: hit ? `https://image.tmdb.org/t/p/original${hit.poster_path}` : null, name: hit?.name ?? hit?.title ?? null }),
          { headers: { "content-type": "application/json" } },
        );
      },
    },
  },
});
