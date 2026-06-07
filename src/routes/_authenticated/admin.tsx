import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { listMyPosts, deletePost } from "@/lib/posts.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

function Admin() {
  const router = useRouter();
  const listFn = useServerFn(listMyPosts);
  const delFn = useServerFn(deletePost);
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => listFn(),
  });

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    await delFn({ data: { id } });
    refetch();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
          <h1 className="font-display text-4xl">Editor Dashboard</h1>
          <div className="flex gap-3">
            <Link to="/admin/new" className="bg-foreground text-background px-4 py-2 font-display uppercase tracking-widest text-sm">
              New post
            </Link>
            <button onClick={signOut} className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Sign out
            </button>
          </div>
        </div>

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
                  <td>{p.section === "tv" ? "TV" : "True Crime"}</td>
                  <td>{p.published ? "Published" : "Draft"}</td>
                  <td className="text-right">
                    <Link to="/admin/$id/edit" params={{ id: p.id }} className="underline mr-4">Edit</Link>
                    <button onClick={() => remove(p.id)} className="underline text-destructive">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
