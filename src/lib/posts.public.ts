/**
 * Browser-safe public data layer.
 *
 * These functions replace the server-function reads for all public pages so the
 * site can be built as a fully static bundle (Hostinger / Apache shared hosting).
 * They talk to the backend directly with the publishable (anon) key and are
 * constrained by row-level security: only `published = true` rows are readable.
 */
import { supabase } from "@/integrations/supabase/client";

export const POST_COLS =
  "id, slug, section, title, excerpt, body, cover_url, streamer, rating, tags, published, author_id, created_at, updated_at, justwatch_slug, justwatch_type, justwatch_country, next_binge, vibe, publish_at, meta_description";

export type PublicPost = {
  id: string;
  slug: string;
  section: "tv" | "true_crime";
  title: string;
  excerpt: string;
  body: string;
  cover_url: string | null;
  streamer: string | null;
  rating: number | null;
  tags: string[];
  published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string | null;
  justwatch_slug: string | null;
  justwatch_type: string | null;
  justwatch_country: string | null;
  next_binge: string[];
  vibe: string | null;
  publish_at: string | null;
  meta_description: string | null;
};

type ListArgs = {
  section?: "tv" | "true_crime";
  sections?: ("tv" | "true_crime")[];
  limit?: number;
  minRating?: number;
  maxRating?: number;
  sort?: "newest" | "highest_score" | "lowest_score";
};

function matchPost(
  post: { title: string; excerpt: string; body: string; streamer: string | null; tags: string[] },
  q: string,
) {
  if (!q.trim()) return true;
  const term = q.toLowerCase();
  return (
    post.title.toLowerCase().includes(term) ||
    (post.streamer && post.streamer.toLowerCase().includes(term)) ||
    post.tags.some((t) => t.toLowerCase().includes(term))
  );
}

export async function listPublishedPosts(args?: { data?: ListArgs }): Promise<PublicPost[]> {
  const data = args?.data ?? {};
  let q = supabase.from("posts").select(POST_COLS).eq("published", true);
  if (data.sort === "highest_score") {
    q = q.order("rating", { ascending: false }).order("created_at", { ascending: false });
  } else if (data.sort === "lowest_score") {
    q = q.order("rating", { ascending: true }).order("created_at", { ascending: false });
  } else {
    q = q.order("created_at", { ascending: false });
  }
  if (data.sections && data.sections.length > 0) q = q.in("section", data.sections);
  else if (data.section) q = q.eq("section", data.section);
  if (data.limit) q = q.limit(data.limit);
  if (data.minRating != null) q = q.gte("rating", data.minRating);
  if (data.maxRating != null) q = q.lte("rating", data.maxRating);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return (rows ?? []) as unknown as PublicPost[];
}

export async function listPostsByTag(args: { data: { tag: string } }): Promise<PublicPost[]> {
  const { data: rows, error } = await supabase
    .from("posts")
    .select(POST_COLS)
    .eq("published", true)
    .contains("tags", [args.data.tag])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (rows ?? []) as unknown as PublicPost[];
}

export async function getPostBySlug(args: { data: { slug: string } }): Promise<PublicPost | null> {
  const { data: row, error } = await supabase
    .from("posts")
    .select(POST_COLS)
    .eq("slug", args.data.slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (row ?? null) as unknown as PublicPost | null;
}

export async function getPostsByTitles(args: { data: { titles: string[] } }) {
  const titles = args.data.titles ?? [];
  if (titles.length === 0) return [] as { title: string; slug: string }[];
  const { data: rows, error } = await supabase
    .from("posts")
    .select("title, slug")
    .eq("published", true);
  if (error) throw new Error(error.message);
  const lookup = new Map<string, string>();
  for (const r of rows ?? []) lookup.set(r.title.toLowerCase().trim(), r.slug);
  const out: { title: string; slug: string }[] = [];
  for (const t of titles) {
    const slug = lookup.get(t.toLowerCase().trim());
    if (slug) out.push({ title: t, slug });
  }
  return out;
}

export async function searchPosts(args: {
  data: { q?: string; tag?: string; streamer?: string };
}): Promise<PublicPost[]> {
  const { q, tag, streamer } = args.data;
  const { data: rows, error } = await supabase
    .from("posts")
    .select(POST_COLS)
    .eq("published", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((rows ?? []) as unknown as PublicPost[]).filter((p) => {
    const textMatch = matchPost(p, q ?? "");
    const tagMatch = !tag || p.tags.includes(tag);
    const streamerMatch = !streamer || p.streamer === streamer;
    return textMatch && tagMatch && streamerMatch;
  });
}

export async function getSearchFilters() {
  const { data: rows, error } = await supabase
    .from("posts")
    .select("tags, streamer")
    .eq("published", true);
  if (error) throw new Error(error.message);
  const tags = new Set<string>();
  const streamers = new Set<string>();
  for (const row of rows ?? []) {
    for (const t of row.tags ?? []) tags.add(t);
    if (row.streamer) streamers.add(row.streamer);
  }
  return { tags: Array.from(tags).sort(), streamers: Array.from(streamers).sort() };
}

export type SimilarPost = { post: PublicPost; reason: string };

const sectionName = (s: string) => (s === "tv" ? "The Stream" : "The Scream");

/**
 * Ranked "shows like X" matches for a post:
 * 1. its own next_binge picks that exist on the site
 * 2. same-section posts sharing the most tags
 * 3. highest-rated same-section posts as filler
 */
export function buildSimilarPosts(
  post: PublicPost,
  all: PublicPost[],
  limit = 8,
): SimilarPost[] {
  const pool = all.filter((p) => p.slug !== post.slug);
  const picked = new Map<string, SimilarPost>();

  const bingeTitles = (post.next_binge ?? []).map((t) => t.toLowerCase().trim());
  for (const title of bingeTitles) {
    const match = pool.find((p) => p.title.toLowerCase().trim() === title);
    if (match && !picked.has(match.slug)) {
      picked.set(match.slug, { post: match, reason: `Hand-picked next binge after ${post.title}` });
    }
  }

  const tags = new Set((post.tags ?? []).map((t) => t.toLowerCase()));
  const scored = pool
    .filter((p) => p.section === post.section && !picked.has(p.slug))
    .map((p) => ({
      p,
      shared: (p.tags ?? []).filter((t) => tags.has(t.toLowerCase())),
    }))
    .filter((x) => x.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length || (b.p.rating ?? 0) - (a.p.rating ?? 0));

  for (const { p, shared } of scored) {
    if (picked.size >= limit) break;
    picked.set(p.slug, {
      post: p,
      reason: `Same ${shared.slice(0, 2).join(" and ")} energy`,
    });
  }

  if (picked.size < limit) {
    const filler = pool
      .filter((p) => p.section === post.section && !picked.has(p.slug))
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    for (const p of filler) {
      if (picked.size >= limit) break;
      picked.set(p.slug, { post: p, reason: `One of the best-rated picks in ${sectionName(p.section)}` });
    }
  }

  return Array.from(picked.values()).slice(0, limit);
}
