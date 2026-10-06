import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { deleteShortlist, listAllShortlists } from "@/lib/shortlists.admin";

export const Route = createFileRoute("/_authenticated/admin/shortlists/")({ component: ManageShortlists });

function ManageShortlists() {
  const { data = [], isLoading, refetch } = useQuery({ queryKey: ["admin-shortlists"], queryFn: listAllShortlists });
  const [confirmId, setConfirmId] = useState<string | null>(null);

  async function remove(id: string) {
    if (confirmId !== id) return setConfirmId(id);
    try {
      await deleteShortlist(id);
      setConfirmId(null);
      await refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between gap-4 border-b-2 border-foreground pb-4">
          <h1 className="font-display text-4xl">Manage Shortlists</h1>
          <Button asChild><Link to="/admin/shortlists/new/">New shortlist</Link></Button>
        </div>
        {isLoading ? <p className="mt-8">Loading…</p> : data.length ? (
          <div className="mt-8 divide-y divide-foreground/20 border-t border-foreground/20">
            {data.map((list) => (
              <article key={list.id} className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div><h2 className="font-display text-xl">{list.title}</h2><p className="card-meta mt-1">{list.published ? "Published" : list.publish_at ? `Scheduled · ${new Date(list.publish_at).toLocaleString()}` : "Draft"} · {list.items.length}/5 picks</p></div>
                <div className="flex items-center gap-3">
                  <Button asChild variant="outline"><Link to="/admin/shortlists/$id/edit/" params={{ id: list.id }}>Edit</Link></Button>
                  <Button type="button" variant="ghost" onClick={() => remove(list.id)}>{confirmId === list.id ? "Confirm delete" : "Delete"}</Button>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="mt-8 text-muted-foreground">No shortlists yet.</p>}
      </main>
      <SiteFooter />
    </div>
  );
}