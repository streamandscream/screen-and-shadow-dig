/**
 * Browser-side admin data layer (static-hosting compatible).
 * All calls run as the signed-in user and are enforced by row-level security:
 * only accounts with the author or admin role can write.
 */
import { supabase } from "@/integrations/supabase/client";
import { POST_COLS, type PublicPost } from "./posts.public";

export type AdminPost = PublicPost;

export async function listMyPosts(): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as AdminPost[];
}

export async function getMyPost(args: { data: { id: string } }): Promise<AdminPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_COLS)
    .eq("id", args.data.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as unknown as AdminPost | null;
}

export async function upsertPost(args: { data: Record<string, unknown> }) {
  const { data: userRes } = await supabase.auth.getUser();
  const payload = { ...args.data, author_id: userRes.user?.id ?? null };
  const { data, error } = await supabase
    .from("posts")
    .upsert(payload as never, { onConflict: "id" })
    .select(POST_COLS)
    .single();
  if (error) throw new Error(error.message);
  return data as unknown as AdminPost;
}

export async function deletePost(args: { data: { id: string } }) {
  const { error } = await supabase.from("posts").delete().eq("id", args.data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function updateRecommendations(args: {
  data: { id: string; next_binge: string[] };
}) {
  const { error } = await supabase
    .from("posts")
    .update({ next_binge: args.data.next_binge })
    .eq("id", args.data.id);
  if (error) throw new Error(error.message);
  return { ok: true };
}
