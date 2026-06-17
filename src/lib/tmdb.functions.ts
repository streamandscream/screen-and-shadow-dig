import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const fetchTmdbMeta = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { title: string; type: "tv-show" | "movie" }) => input)
  .handler(async ({ data }) => {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error("TMDB_API_KEY not configured");
    const title = data.title?.trim();
    if (!title) throw new Error("Title required");
    const endpoint = data.type === "movie" ? "movie" : "tv";
    const url = `https://api.themoviedb.org/3/search/${endpoint}?query=${encodeURIComponent(title)}&include_adult=false&language=en-US&page=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, accept: "application/json" },
    });
    if (!res.ok) throw new Error(`TMDB ${res.status}`);
    const json: any = await res.json();
    const top = json?.results?.[0];
    if (!top) return { found: false as const };
    return {
      found: true as const,
      cover_url: top.poster_path ? `https://image.tmdb.org/t/p/original${top.poster_path}` : null,
      overview: top.overview ?? "",
      tmdb_id: top.id,
      name: top.name ?? top.title ?? "",
    };
  });
