import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Looks up poster art on TMDB for a given title.
 * Runs server-side so the TMDB key is never shipped to the browser.
 */
export const fetchTmdbCover = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ title: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const key = process.env["TMDB_API_KEY"];
    if (!key) throw new Error("TMDB is not configured");

    const isBearer = key.startsWith("ey");
    const headers: Record<string, string> = { accept: "application/json" };
    if (isBearer) headers["Authorization"] = `Bearer ${key}`;

    const base = `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(data.title)}${isBearer ? "" : `&api_key=${key}`}`;
    const res = await fetch(base, { headers });
    if (!res.ok) throw new Error(`TMDB lookup failed (${res.status})`);
    const json = (await res.json()) as { results?: Array<Record<string, any>> };
    const hit = (json.results ?? []).find((r) => r.poster_path);
    if (!hit) return { cover_url: null as string | null, name: null as string | null };
    return {
      cover_url: `https://image.tmdb.org/t/p/original${hit.poster_path}`,
      name: (hit.name ?? hit.title ?? null) as string | null,
    };
  });
