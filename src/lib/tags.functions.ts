import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TagName = z.string().trim().min(1).max(50);

async function assertEditor(context: { supabase: any; userId: string }) {
  const [{ data: isAuthor }, { data: isAdmin }] = await Promise.all([
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "author" }),
    context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" }),
  ]);
  if (!isAuthor && !isAdmin) throw new Error("You do not have permission to manage tags.");
}

export const listTags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertEditor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: catalog, error: catErr }, { data: posts, error: postErr }] = await Promise.all([
      supabaseAdmin.from("tags").select("name").order("name", { ascending: true }),
      supabaseAdmin.from("posts").select("tags"),
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
  });

export const createTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: TagName }).parse(d))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("tags").insert({ name: data.name });
    if (error && !/duplicate key/i.test(error.message)) throw new Error(error.message);
    return { ok: true };
  });

export const renameTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { oldName: string; newName: string }) =>
    z.object({ oldName: TagName, newName: TagName }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.rpc("rename_tag", {
      _old: data.oldName,
      _new: data.newName,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => z.object({ name: TagName }).parse(d))
  .handler(async ({ data, context }) => {
    await assertEditor(context);
    const { error } = await context.supabase.rpc("delete_tag", { _name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
