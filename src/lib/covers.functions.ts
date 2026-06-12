import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const POST_COLS = "id, slug, section, title, cover_url";

export const listPostsForCovers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("posts")
      .select(POST_COLS)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const updatePostCover = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      cover_url: z.string().url().max(1000).nullable(),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("posts")
      .update({ cover_url: data.cover_url })
      .eq("id", data.id)
      .select("id, cover_url")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

type TmdbResult = {
  id: number;
  media_type: "tv" | "movie";
  title: string;
  year: string | null;
  overview: string;
  poster_url: string | null;
  backdrop_url: string | null;
};

export const tmdbSearchCovers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      query: z.string().min(1).max(200),
      type: z.enum(["tv", "movie", "multi"]).default("multi"),
    }).parse(d)
  )
  .handler(async ({ data }): Promise<TmdbResult[]> => {
    const key = process.env.TMDB_API_KEY;
    if (!key) throw new Error("TMDB_API_KEY not configured. Add it in project secrets.");
    const endpoint =
      data.type === "multi" ? "search/multi" : data.type === "tv" ? "search/tv" : "search/movie";
    const url = `https://api.themoviedb.org/3/${endpoint}?query=${encodeURIComponent(data.query)}&include_adult=false&language=en-US&page=1`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${key}`, accept: "application/json" },
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`TMDB error ${res.status}: ${txt.slice(0, 200)}`);
    }
    const json = (await res.json()) as { results?: Array<Record<string, any>> };
    const img = (p: string | null | undefined, size = "w500") =>
      p ? `https://image.tmdb.org/t/p/${size}${p}` : null;
    return (json.results ?? [])
      .filter((r) => (data.type === "multi" ? r.media_type === "tv" || r.media_type === "movie" : true))
      .slice(0, 12)
      .map((r) => {
        const media_type: "tv" | "movie" =
          data.type === "multi" ? (r.media_type as "tv" | "movie") : data.type;
        const title = (media_type === "tv" ? r.name : r.title) ?? r.title ?? r.name ?? "Untitled";
        const date = (media_type === "tv" ? r.first_air_date : r.release_date) ?? "";
        return {
          id: r.id as number,
          media_type,
          title,
          year: date ? String(date).slice(0, 4) : null,
          overview: r.overview ?? "",
          poster_url: img(r.poster_path),
          backdrop_url: img(r.backdrop_path, "w780"),
        };
      });
  });
