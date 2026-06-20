import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function matchPost(post: { title: string; excerpt: string; body: string; streamer: string | null; tags: string[] }, q: string) {
  if (!q.trim()) return true;
  const term = q.toLowerCase();
  return (
    post.title.toLowerCase().includes(term) ||
    post.excerpt.toLowerCase().includes(term) ||
    post.body.toLowerCase().includes(term) ||
    (post.streamer && post.streamer.toLowerCase().includes(term)) ||
    post.tags.some((t) => t.toLowerCase().includes(term))
  );
}

export const getSearchFilters = createServerFn({ method: "GET" })
  .handler(async () => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("posts").select("tags, streamer").eq("published", true);
    if (error) throw new Error(error.message);
    const tags = new Set<string>();
    const streamers = new Set<string>();
    for (const row of rows ?? []) {
      for (const t of row.tags) tags.add(t);
      if (row.streamer) streamers.add(row.streamer);
    }
    return {
      tags: Array.from(tags).sort(),
      streamers: Array.from(streamers).sort(),
    };
  });

const POST_COLS = "id, slug, section, title, excerpt, body, cover_url, streamer, rating, tags, published, author_id, created_at, updated_at, justwatch_slug, justwatch_type, justwatch_country, favourite_episode, next_binge, vibe";

export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) =>
    z.object({
      section: z.enum(["tv", "true_crime"]).optional(),
      sections: z.array(z.enum(["tv", "true_crime"])).optional(),
      limit: z.number().int().positive().optional(),
      minRating: z.number().int().min(1).max(10).optional(),
      maxRating: z.number().int().min(1).max(10).optional(),
      sort: z.enum(["newest", "highest_score", "lowest_score"]).optional().default("newest"),
    }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("posts").select(POST_COLS).eq("published", true);
    if (data.sort === "highest_score") {
      q = q.order("rating", { ascending: false }).order("created_at", { ascending: false });
    } else if (data.sort === "lowest_score") {
      q = q.order("rating", { ascending: true }).order("created_at", { ascending: false });
    } else {
      q = q.order("created_at", { ascending: false });
    }
    if (data.sections && data.sections.length > 0) {
      q = q.in("section", data.sections);
    } else if (data.section) {
      q = q.eq("section", data.section);
    }
    if (data.limit) q = q.limit(data.limit);
    if (data.minRating != null) q = q.gte("rating", data.minRating);
    if (data.maxRating != null) q = q.lte("rating", data.maxRating);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listPostsByTag = createServerFn({ method: "GET" })
  .inputValidator((d: { tag: string }) => z.object({ tag: z.string().min(1).max(50) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("posts")
      .select(POST_COLS)
      .eq("published", true)
      .contains("tags", [data.tag])
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPostsByTitles = createServerFn({ method: "GET" })
  .inputValidator((d: { titles: string[] }) =>
    z.object({ titles: z.array(z.string().min(1).max(200)).max(10) }).parse(d)
  )
  .handler(async ({ data }) => {
    if (data.titles.length === 0) return [] as { title: string; slug: string }[];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("posts")
      .select("title, slug")
      .eq("published", true)
      .in("title", data.titles);
    if (error) throw new Error(error.message);
    const lookup = new Map<string, string>();
    for (const r of rows ?? []) lookup.set(r.title.toLowerCase().trim(), r.slug);
    const extras: { title: string; slug: string }[] = [];
    // case-insensitive fallback
    if ((rows ?? []).length < data.titles.length) {
      const { data: all } = await supabaseAdmin.from("posts").select("title, slug").eq("published", true);
      for (const r of all ?? []) lookup.set(r.title.toLowerCase().trim(), r.slug);
    }
    for (const t of data.titles) {
      const slug = lookup.get(t.toLowerCase().trim());
      if (slug) extras.push({ title: t, slug });
    }
    return extras;
  });

export const searchPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { q?: string; tag?: string; streamer?: string }) =>
    z.object({
      q: z.string().max(100).optional(),
      tag: z.string().max(50).optional(),
      streamer: z.string().max(100).optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("posts").select(POST_COLS).eq("published", true).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).filter((p) => {
      const textMatch = matchPost(p, data.q ?? "");
      const tagMatch = !data.tag || p.tags.includes(data.tag);
      const streamerMatch = !data.streamer || p.streamer === data.streamer;
      return textMatch && tagMatch && streamerMatch;
    });
  });

export const getPostBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("posts").select(POST_COLS).eq("slug", data.slug).eq("published", true).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

const PostInput = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  section: z.enum(["tv", "true_crime"]),
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(500),
  body: z.string().min(1).max(50000),
  cover_url: z.string().url().nullable().optional(),
  streamer: z.string().max(100).nullable().optional(),
  rating: z.number().int().min(1).max(10).nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
  published: z.boolean().default(false),
  justwatch_slug: z.string().max(200).regex(/^[a-z0-9-]+$/).nullable().optional(),
  justwatch_type: z.enum(["tv-show", "movie"]).default("tv-show"),
  justwatch_country: z.string().min(2).max(5).regex(/^[a-z-]+$/).default("us"),
  favourite_episode: z.string().max(300).nullable().optional(),
  next_binge: z.array(z.string().min(1).max(120)).max(3).default([]),
  vibe: z.string().max(160).nullable().optional(),
});

export const listMyPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("posts").select(POST_COLS).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyPost = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("posts").select(POST_COLS).eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });

async function tmdbPoster(title: string, type: "tv-show" | "movie"): Promise<string | null> {
  const key = process.env.TMDB_API_KEY;
  if (!key || !title.trim()) return null;
  const endpoint = type === "movie" ? "movie" : "tv";
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/${endpoint}?query=${encodeURIComponent(title.trim())}&include_adult=false&language=en-US&page=1`,
      { headers: { Authorization: `Bearer ${key}`, accept: "application/json" } },
    );
    if (!res.ok) return null;
    const json: any = await res.json();
    const top = json?.results?.[0];
    return top?.poster_path ? `https://image.tmdb.org/t/p/original${top.poster_path}` : null;
  } catch { return null; }
}

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PostInput.parse(d))
  .handler(async ({ data, context }) => {
    let cover_url = data.cover_url ?? null;
    if (data.published && !cover_url) {
      const type = data.section === "tv" ? data.justwatch_type : "movie";
      cover_url = await tmdbPoster(data.title, type);
    }
    const payload = { ...data, cover_url, author_id: context.userId };
    const { data: row, error } = await context.supabase.from("posts").upsert(payload, { onConflict: "id" }).select(POST_COLS).single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const [{ data: isAuthor }, { data: isAdmin }] = await Promise.all([
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "author" }),
      context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
    ]);
    if (!isAuthor && !isAdmin) throw new Error("You do not have permission to delete posts.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateRecommendations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      id: z.string().uuid(),
      favourite_episode: z.string().max(300).nullable(),
      next_binge: z.array(z.string().min(1).max(120)).max(3),
    }).parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("posts")
      .update({
        favourite_episode: data.favourite_episode,
        next_binge: data.next_binge,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
