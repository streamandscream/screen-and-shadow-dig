import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { listMyPosts, deletePost } from "@/lib/posts.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

type IngestResult = {
  success: boolean;
  inserted: number;
  skipped: number;
  classified: number;
  errors: string[];
  error?: string;
};

function Admin() {
  const router = useRouter();
  const listFn = useServerFn(listMyPosts);
  const delFn = useServerFn(deletePost);
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => listFn(),
  });
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);

  async function signOut() {
    await supabase.auth.signOut();
    router.navigate({ to: "/" });
  }

  async function remove(id: string) {
    if (!confirm("Delete this post?")) return;
    await delFn({ data: { id } });
    refetch();
  }

  async function forceIngest() {
    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await fetch("/api/public/hooks/ingest-tv-news", { method: "POST" });
      const json = (await res.json()) as IngestResult;
      setIngestResult(json);
    } catch (e) {
      setIngestResult({ success: false, inserted: 0, skipped: 0, classified: 0, errors: [(e as Error).message], error: (e as Error).message });
    } finally {
      setIngesting(false);
    }
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
            <Link to="/admin/settings" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Settings
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

        <section className="mt-16 border-t-2 border-foreground pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">TV News Ingestion</h2>
              <p className="text-muted-foreground text-sm mt-1">Manually pull the latest cancelled / renewed updates from Deadline TV.</p>
            </div>
            <button
              onClick={forceIngest}
              disabled={ingesting}
              className="bg-foreground text-background px-4 py-2 font-display uppercase tracking-widest text-sm disabled:opacity-50"
            >
              {ingesting ? "Refreshing…" : "Force refresh now"}
            </button>
          </div>

          {ingestResult && (
            <div className="mt-6 text-sm">
              {ingestResult.success ? (
                <div className="space-y-1">
                  <p className="font-medium">Done.</p>
                  <p>Inserted: <span className="font-semibold">{ingestResult.inserted}</span></p>
                  <p>Skipped (already known): <span className="font-semibold">{ingestResult.skipped}</span></p>
                  <p>Classified: <span className="font-semibold">{ingestResult.classified}</span></p>
                  {ingestResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-destructive font-medium">Errors ({ingestResult.errors.length}):</p>
                      <ul className="list-disc pl-5 text-destructive/90">
                        {ingestResult.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-destructive">Failed: {ingestResult.error ?? ingestResult.errors[0] ?? "Unknown error"}</p>
              )}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
