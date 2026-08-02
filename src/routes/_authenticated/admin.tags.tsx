import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { listTags, createTag, renameTag, deleteTag } from "@/lib/tags.admin";

export const Route = createFileRoute("/_authenticated/admin/tags")({
  component: TagsAdmin,
});

function TagsAdmin() {
  const listFn = listTags;
  const createFn = createTag;
  const renameFn = renameTag;
  const deleteFn = deleteTag;

  const { data: tags, isLoading, refetch } = useQuery({
    queryKey: ["admin-tags"],
    queryFn: () => listFn(),
  });

  const [newTag, setNewTag] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function add() {
    const name = newTag.trim();
    if (!name) return;
    setCreating(true);
    try {
      await createFn({ data: { name } });
      setNewTag("");
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  async function saveRename(oldName: string) {
    const next = draft.trim();
    if (!next || next === oldName) {
      setEditing(null);
      return;
    }
    setBusy(oldName);
    try {
      await renameFn({ data: { oldName, newName: next } });
      setEditing(null);
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function remove(name: string, count: number) {
    const msg =
      count > 0
        ? `Delete "${name}"? It will be removed from ${count} post${count === 1 ? "" : "s"}.`
        : `Delete "${name}"?`;
    if (!confirm(msg)) return;
    setBusy(name);
    try {
      await deleteFn({ data: { name } });
      await refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const filtered = (tags ?? []).filter((t) =>
    !filter.trim() ? true : t.name.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4 flex-wrap gap-4">
          <div>
            <p className="eyebrow text-accent-red">Admin</p>
            <h1 className="font-display text-4xl mt-1">Manage tags</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Create new tags, rename existing ones (updates every post that uses them), or delete tags from the catalog and from posts.
            </p>
          </div>
          <Link
            to="/admin"
            className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-8 border border-foreground p-4">
          <p className="eyebrow mb-2">Create new tag</p>
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") add(); }}
              placeholder="e.g. mystery"
              maxLength={50}
              className="flex-1 bg-background border border-foreground px-3 py-2 text-sm outline-none"
            />
            <button
              onClick={add}
              disabled={creating || !newTag.trim()}
              className="bg-foreground text-background px-4 py-2 font-display uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {creating ? "Adding…" : "Add"}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tags…"
            className="w-full bg-background border-2 border-foreground px-4 py-3 text-sm outline-none"
          />
        </div>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No tags found.</p>
        ) : (
          <table className="mt-6 w-full text-sm">
            <thead className="font-display uppercase tracking-widest text-xs border-b border-foreground">
              <tr>
                <th className="text-left py-2">Tag</th>
                <th className="text-left">Used in</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const isEditing = editing === t.name;
                const isBusy = busy === t.name;
                return (
                  <tr key={t.name} className="border-b border-foreground/30">
                    <td className="py-3 pr-4">
                      {isEditing ? (
                        <input
                          autoFocus
                          value={draft}
                          maxLength={50}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveRename(t.name);
                            if (e.key === "Escape") setEditing(null);
                          }}
                          className="bg-background border border-foreground px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="font-medium">#{t.name}</span>
                      )}
                    </td>
                    <td className="pr-4 text-muted-foreground">
                      {t.count} post{t.count === 1 ? "" : "s"}
                    </td>
                    <td className="text-right py-3 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveRename(t.name)}
                            disabled={isBusy}
                            className="underline mr-4 disabled:opacity-50"
                          >
                            {isBusy ? "Saving…" : "Save"}
                          </button>
                          <button
                            onClick={() => setEditing(null)}
                            className="underline text-muted-foreground"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditing(t.name); setDraft(t.name); }}
                            className="underline mr-4"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => remove(t.name, t.count)}
                            disabled={isBusy}
                            className="underline text-destructive disabled:opacity-50"
                          >
                            {isBusy ? "Deleting…" : "Delete"}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
