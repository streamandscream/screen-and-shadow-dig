import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { DomainHealthAlert } from "@/components/DomainHealthAlert";
import { listMyPosts, deletePost } from "@/lib/posts.admin";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Admin,
});

function Admin() {
  const router = useRouter();
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => listMyPosts(),
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  async function remove(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      return;
    }
    setDeletingId(id);
    try {
      await deletePost({ data: { id } });
      setConfirmDeleteId(null);
      await refetch();
    } catch (e) {
      toast.error(`Delete failed: ${(e as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
          <h1 className="font-display text-4xl">Editor Dashboard</h1>
          <div className="flex gap-3 flex-wrap">
            <Link to="/admin/new" className="bg-foreground text-background px-4 py-2 font-display uppercase tracking-widest text-sm">
              New post
            </Link>
            <Link to="/admin/stream" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Manage Stream
            </Link>
            <Link to="/admin/recommendations" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Recommendations
            </Link>
            <Link to="/admin/tags" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Tags
            </Link>
            <Link to="/admin/settings" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Settings
            </Link>
            <button onClick={signOut} className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Sign out
            </button>
          </div>
        </div>

        <DomainHealthAlert />

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : !posts || posts.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No posts yet. Create your first.</p>
        ) : (
          <table className="mt-8 w-full text-sm">
            <thead className="font-display uppercase tracking-widest text-xs border-b border-foreground">
              <tr><th className="text-left py-2">Title</th><th className="text-left">Section</th><th className="text-left">Status</th><th></th></tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-foreground/30">
                  <td className="py-3">{p.title}</td>
                  <td>{p.section === "tv" ? "The Stream" : "The Scream"}</td>
                  <td>{p.published ? (p.published_at ? `Published · ${new Date(p.published_at).toLocaleDateString()}` : "Published") : p.publish_at ? `Scheduled · ${new Date(p.publish_at).toLocaleString()}` : "Draft"}</td>
                  <td className="text-right">
                    <Link to="/admin/$id/edit" params={{ id: p.id }} className="underline mr-4">Edit</Link>
                    <button
                      onClick={() => remove(p.id)}
                      disabled={deletingId === p.id}
                      className="underline text-destructive disabled:opacity-50"
                    >
                      {deletingId === p.id ? "Deleting…" : confirmDeleteId === p.id ? "Click again to confirm" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p className="mt-16 border-t-2 border-foreground pt-8 text-sm text-muted-foreground">
          Note: this site is served as a static build. After adding or editing posts, redeploy
          (or re-run the build) so the sitemap and pre-rendered pages pick up the changes.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
