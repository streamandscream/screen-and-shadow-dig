import { supabase } from "@/integrations/supabase/client";
import { SHORTLIST_COLS, hydrateShortlists, type Shortlist, type ShortlistRow } from "./shortlists.public";

export type ShortlistDraftItem = { post_id: string; position: number; reason: string };

export async function listAllShortlists(): Promise<Shortlist[]> {
  const { data, error } = await supabase.from("shortlists").select(SHORTLIST_COLS).order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return hydrateShortlists((data ?? []) as ShortlistRow[]);
}

export async function getShortlist(id: string): Promise<Shortlist | null> {
  const { data, error } = await supabase.from("shortlists").select(SHORTLIST_COLS).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return (await hydrateShortlists([data as ShortlistRow]))[0] ?? null;
}

export async function saveShortlist(input: Partial<ShortlistRow> & { title: string; slug: string; excerpt: string; body: string; items: ShortlistDraftItem[] }) {
  const unique = new Set(input.items.map((item) => item.post_id));
  const willPublish = Boolean(input.published || input.publish_at);
  if (willPublish && (input.items.length !== 5 || unique.size !== 5)) throw new Error("Choose five different recommendations before publishing or scheduling.");
  if (input.items.some((item) => !item.reason.trim())) throw new Error("Add a reason for every recommendation.");

  if (willPublish) {
    const { data: selectedPosts, error: selectedError } = await supabase.from("posts").select("id, published").in("id", input.items.map((item) => item.post_id));
    if (selectedError) throw new Error(selectedError.message);
    if ((selectedPosts ?? []).length !== 5 || selectedPosts?.some((post) => !post.published)) {
      throw new Error("Every recommendation must be a published review.");
    }
  }

  const { data: userData } = await supabase.auth.getUser();
  const parent = {
    ...(input.id ? { id: input.id } : {}),
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    anchor_post_id: input.anchor_post_id || null,
    cover_url: input.cover_url || null,
    cover_alt: input.cover_alt || null,
    meta_description: input.meta_description || null,
    publish_at: input.publish_at || null,
    published: false,
    author_id: userData.user?.id ?? null,
  };
  const { data: saved, error } = await supabase.from("shortlists").upsert(parent).select(SHORTLIST_COLS).single();
  if (error) throw new Error(error.message);
  const { error: deleteError } = await supabase.from("shortlist_items").delete().eq("shortlist_id", saved.id);
  if (deleteError) throw new Error(deleteError.message);
  if (input.items.length) {
    const { error: itemError } = await supabase.from("shortlist_items").insert(input.items.map((item, index) => ({
      shortlist_id: saved.id,
      post_id: item.post_id,
      position: index + 1,
      reason: item.reason.trim(),
    })));
    if (itemError) throw new Error(itemError.message);
  }
  if (input.published) {
    const { error: publishError } = await supabase.from("shortlists").update({ published: true }).eq("id", saved.id);
    if (publishError) throw new Error(publishError.message);
  }
  return saved.id;
}

export async function deleteShortlist(id: string) {
  const { error } = await supabase.from("shortlists").delete().eq("id", id);
  if (error) throw new Error(error.message);
}