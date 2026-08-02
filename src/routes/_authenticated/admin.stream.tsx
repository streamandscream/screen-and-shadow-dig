import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { listMyPosts, deletePost } from "@/lib/posts.admin";

export const Route = createFileRoute("/_authenticated/admin/stream")({
  component: StreamAdmin,
});

function StreamAdmin() {
  const listFn = listMyPosts;
  const delFn = deletePost;
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => listFn(),
  });
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const streamPosts = useMemo(() => {
    const tv = (posts ?? []).filter((p) => p.section === "tv");
    if (!filter.trim()) return tv;
    const term = filter.toLowerCase();
    return tv.filter(
      (p) =>
        p.title.toLowerCase().includes(term) ||
        (p.streamer ?? "").toLowerCase().includes(term) ||
        p.tags.some((t) => t.toLowerCase().includes(term)),
    );
  }, [posts, filter]);

  async function remove(id: string, title: string) {
    if (!confirm(`Delete "${title}" from The Stream?`)) return;
    setBusyId(id);
    try {
      await delFn({ data: { id } });
      await refetch();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4 flex-wrap gap-4">
          <div>
            <p className="eyebrow text-accent-red">Admin</p>
            <h1 className="font-display text-4xl mt-1">Manage The Stream</h1>
            <p className="text-muted-foreground text-sm mt-2">
              One place to remove or edit every entry in the TV section.
            </p>
          </div>
          <Link
            to="/admin"
            className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm"
          >
            Back to dashboard
          </Link>
        </div>

        <div className="mt-6">
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by title, streamer, or tag…"
            className="w-full bg-background border-2 border-foreground px-4 py-3 text-sm outline-none"
          />
        </div>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : streamPosts.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No stream entries match.</p>
        ) : (
          <table className="mt-8 w-full text-sm">
            <thead className="font-display uppercase tracking-widest text-xs border-b border-foreground">
              <tr>
                <th className="text-left py-2">Title</th>
                <th className="text-left">Streamer</th>
                <th className="text-left">Rating</th>
                <th className="text-left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {streamPosts.map((p) => (
                <tr key={p.id} className="border-b border-foreground/30">
                  <td className="py-3 pr-4">{p.title}</td>
                  <td className="pr-4">{p.streamer ?? "—"}</td>
                  <td className="pr-4">{p.rating ?? "—"}</td>
                  <td className="pr-4">{p.published ? "Published" : "Draft"}</td>
                  <td className="text-right py-3">
                    <Link
                      to="/admin/$id/edit"
                      params={{ id: p.id }}
                      className="underline mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => remove(p.id, p.title)}
                      disabled={busyId === p.id}
                      className="underline text-destructive disabled:opacity-50"
                    >
                      {busyId === p.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          Showing {streamPosts.length} entr{streamPosts.length === 1 ? "y" : "ies"} in The Stream.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
