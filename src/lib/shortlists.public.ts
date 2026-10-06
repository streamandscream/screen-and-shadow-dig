import { supabase } from "@/integrations/supabase/client";
import { POST_COLS, type PublicPost } from "./posts.public";

export type ShortlistRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  anchor_post_id: string | null;
  cover_url: string | null;
  cover_alt: string | null;
  meta_description: string | null;
  published: boolean;
  publish_at: string | null;
  published_at: string | null;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ShortlistItem = {
  id: string;
  shortlist_id: string;
  post_id: string;
  position: number;
  reason: string;
  post: PublicPost;
};

export type Shortlist = ShortlistRow & { anchor: PublicPost | null; items: ShortlistItem[] };

const SHORTLIST_COLS = "id, slug, title, excerpt, body, anchor_post_id, cover_url, cover_alt, meta_description, published, publish_at, published_at, author_id, created_at, updated_at";

async function hydrateShortlists(rows: ShortlistRow[]): Promise<Shortlist[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const postIds = rows.flatMap((row) => row.anchor_post_id ? [row.anchor_post_id] : []);
  const { data: itemRows, error: itemError } = await supabase
    .from("shortlist_items")
    .select("id, shortlist_id, post_id, position, reason")
    .in("shortlist_id", ids)
    .order("position", { ascending: true });
  if (itemError) throw new Error(itemError.message);
  for (const item of itemRows ?? []) postIds.push(item.post_id);
  const uniquePostIds = Array.from(new Set(postIds));
  const { data: posts, error: postError } = uniquePostIds.length
    ? await supabase.from("posts").select(POST_COLS).in("id", uniquePostIds)
    : { data: [], error: null };
  if (postError) throw new Error(postError.message);
  const postMap = new Map((posts ?? []).map((post) => [post.id, post as unknown as PublicPost]));

  return rows.map((row) => ({
    ...row,
    anchor: row.anchor_post_id ? postMap.get(row.anchor_post_id) ?? null : null,
    items: (itemRows ?? [])
      .filter((item) => item.shortlist_id === row.id)
      .map((item) => ({ ...item, post: postMap.get(item.post_id) }))
      .filter((item): item is ShortlistItem => Boolean(item.post)),
  }));
}

export async function listPublishedShortlists(): Promise<Shortlist[]> {
  const { data, error } = await supabase
    .from("shortlists")
    .select(SHORTLIST_COLS)
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(error.message);
  return hydrateShortlists((data ?? []) as ShortlistRow[]);
}

export async function getPublishedShortlist(args: { data: { slug: string } }): Promise<Shortlist | null> {
  const { data, error } = await supabase
    .from("shortlists")
    .select(SHORTLIST_COLS)
    .eq("slug", args.data.slug)
    .eq("published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return (await hydrateShortlists([data as ShortlistRow]))[0] ?? null;
}

export { SHORTLIST_COLS, hydrateShortlists };