import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function matchPost(post: { title: string; excerpt: string; body: string; streamer: string | null; tags: string[] }, q: string) {
  const term = q.toLowerCase();
  return (
    post.title.toLowerCase().includes(term) ||
    post.excerpt.toLowerCase().includes(term) ||
    post.body.toLowerCase().includes(term) ||
    (post.streamer && post.streamer.toLowerCase().includes(term)) ||
    post.tags.some((t) => t.toLowerCase().includes(term))
  );
}

const POST_COLS = "id, slug, section, title, excerpt, body, cover_url, streamer, rating, tags, published, author_id, created_at, updated_at, justwatch_slug, justwatch_type, justwatch_country";

export const listPublishedPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { section?: "tv" | "true_crime"; limit?: number } | undefined) => d ?? {})
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("posts").select(POST_COLS).eq("published", true).order("created_at", { ascending: false });
    if (data.section) q = q.eq("section", data.section);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const searchPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { q: string }) => z.object({ q: z.string().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.from("posts").select(POST_COLS).eq("published", true).order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).filter((p) => matchPost(p, data.q));
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
  rating: z.number().int().min(1).max(5).nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(10).default([]),
  published: z.boolean().default(false),
  justwatch_slug: z.string().max(200).regex(/^[a-z0-9-]+$/).nullable().optional(),
  justwatch_type: z.enum(["tv-show", "movie"]).default("tv-show"),
  justwatch_country: z.string().min(2).max(5).regex(/^[a-z-]+$/).default("us"),
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

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PostInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = { ...data, author_id: context.userId };
    const { data: row, error } = await context.supabase.from("posts").upsert(payload, { onConflict: "id" }).select(POST_COLS).single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
