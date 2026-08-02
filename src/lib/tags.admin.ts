/** Browser-side tag management (static-hosting compatible, RLS enforced). */
import { supabase } from "@/integrations/supabase/client";

export async function listTags(): Promise<{ name: string; count: number }[]> {
  const [{ data: catalog, error: catErr }, { data: posts, error: postErr }] = await Promise.all([
    supabase.from("tags").select("name").order("name", { ascending: true }),
    supabase.from("posts").select("tags"),
  ]);
  if (catErr) throw new Error(catErr.message);
  if (postErr) throw new Error(postErr.message);
  const counts = new Map<string, number>();
  for (const row of posts ?? []) {
    for (const t of row.tags ?? []) counts.set(t, (counts.get(t) ?? 0) + 1);
  }
  const names = new Set<string>([...(catalog ?? []).map((c) => c.name), ...counts.keys()]);
  return Array.from(names)
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, count: counts.get(name) ?? 0 }));
}

export async function createTag(args: { data: { name: string } }) {
  const name = args.data.name.trim();
  const { error } = await supabase.from("tags").insert({ name });
  if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
  return { ok: true };
}

export async function renameTag(args: { data: { oldName: string; newName: string } }) {
  const { error } = await supabase.rpc("rename_tag", {
    _old: args.data.oldName.trim(),
    _new: args.data.newName.trim(),
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function deleteTag(args: { data: { name: string } }) {
  const { error } = await supabase.rpc("delete_tag", { _name: args.data.name.trim() });
  if (error) throw new Error(error.message);
  return { ok: true };
}
