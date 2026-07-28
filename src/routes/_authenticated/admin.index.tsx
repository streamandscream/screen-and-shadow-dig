import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { listMyPosts, deletePost } from "@/lib/posts.functions";
import { getTvNewsScheduleStatus } from "@/lib/tv-news-schedule.functions";
import { supabase } from "@/integrations/supabase/client";
import { pingSitemap } from "@/lib/seo-ping.functions";

function formatDateTime(iso: string | null): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diffMs = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const hours = Math.round(mins / 60);
  const days = Math.round(hours / 24);
  const value = days >= 1 ? `${days}d` : hours >= 1 ? `${hours}h` : `${mins}m`;
  return diffMs >= 0 ? `in ${value}` : `${value} ago`;
}

export const Route = createFileRoute("/_authenticated/admin/")({
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
  const statusFn = useServerFn(getTvNewsScheduleStatus);
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => listFn(),
  });
  const { data: schedule, refetch: refetchSchedule } = useQuery({
    queryKey: ["tv-news-schedule"],
    queryFn: () => statusFn(),
    refetchInterval: 60_000,
  });
  const [ingesting, setIngesting] = useState(false);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const pingFn = useServerFn(pingSitemap);
  const [pinging, setPinging] = useState(false);

  const [redirectIssues, setRedirectIssues] = useState<
    { url: string; status: number; location: string | null }[] | null
  >(null);

  async function notifySearchEngines() {
    setPinging(true);
    setRedirectIssues(null);
    try {
      const r = await pingFn();
      const issues = r.redirectCheck?.issues ?? [];
      setRedirectIssues(issues);
      const okCount = r.results.filter((x) => x.ok).length;
      const summary = r.results.map((x) => `${x.service}: ${x.ok ? "✓" : "✗ " + (x.message ?? "")}`).join(" | ");
      if (issues.length > 0) {
        toast.warning(`${issues.length} sitemap URL${issues.length === 1 ? "" : "s"} redirect (3xx) — see details below`);
      } else if (okCount === r.results.length) {
        toast.success(`Notified ${okCount} search engines · ${r.redirectCheck?.checked ?? 0} URLs clean`);
      } else {
        toast.message(summary);
      }
    } catch (e) {
      toast.error(`Ping failed: ${(e as Error).message}`);
    } finally {
      setPinging(false);
    }
  }

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
      await delFn({ data: { id } });
      setConfirmDeleteId(null);
      await refetch();
    } catch (e) {
      toast.error(`Delete failed: ${(e as Error).message}`);
    } finally {
      setDeletingId(null);
    }
  }

  async function forceIngest() {
    setIngesting(true);
    setIngestResult(null);
    try {
      const res = await fetch("/api/public/hooks/ingest-tv-news", { method: "POST" });
      const json = (await res.json()) as IngestResult;
      setIngestResult(json);
      refetchSchedule();
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
            <Link to="/admin/analytics" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Analytics
            </Link>

            <Link to="/admin/settings" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Settings
            </Link>
            <button
              onClick={notifySearchEngines}
              disabled={pinging}
              className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm disabled:opacity-50"
              title="Resubmit sitemap to Google and notify Bing/Yandex via IndexNow"
            >
              {pinging ? "Pinging…" : "Ping search engines"}
            </button>
            <button onClick={signOut} className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
              Sign out
            </button>
          </div>
        </div>

        {redirectIssues && (
          <div className={`mt-6 border p-4 text-sm ${redirectIssues.length > 0 ? "border-destructive" : "border-foreground/30"}`}>
            <p className="font-display uppercase tracking-widest text-xs">
              Sitemap redirect check
            </p>
            {redirectIssues.length === 0 ? (
              <p className="mt-2 text-muted-foreground">All sitemap URLs returned 2xx — no 3xx redirects detected before pinging Search Console.</p>
            ) : (
              <>
                <p className="mt-2 text-destructive">
                  {redirectIssues.length} URL{redirectIssues.length === 1 ? "" : "s"} redirect before reaching a final page. Fix these before resubmitting so Google indexes the canonical URL.
                </p>
                <ul className="mt-3 space-y-1 font-mono text-xs">
                  {redirectIssues.map((issue) => (
                    <li key={issue.url}>
                      <span className="text-destructive">[{issue.status || "ERR"}]</span> {issue.url}
                      {issue.location ? <> → {issue.location}</> : null}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

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
                  <td>{p.published ? "Published" : (p as any).publish_at ? `Scheduled · ${new Date((p as any).publish_at).toLocaleString()}` : "Draft"}</td>
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

        <section className="mt-16 border-t-2 border-foreground pt-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl">TV News Ingestion</h2>
              <p className="text-muted-foreground text-sm mt-1">Manually pull the latest cancelled / renewed updates from Deadline TV.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin/ingestion-health"
                className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm"
              >
                Health
              </Link>
              <button
                onClick={forceIngest}
                disabled={ingesting}
                className="bg-foreground text-background px-4 py-2 font-display uppercase tracking-widest text-sm disabled:opacity-50"
              >
                {ingesting ? "Refreshing…" : "Force refresh now"}
              </button>
            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border border-foreground/30 p-4">
            <div>
              <p className="font-display uppercase tracking-widest text-xs text-muted-foreground">Last successful refresh</p>
              <p className="mt-1 font-semibold">{formatDateTime(schedule?.lastSuccessAt ?? null)}</p>
              {schedule?.lastSuccessAt && (
                <p className="text-xs text-muted-foreground">{formatRelative(schedule.lastSuccessAt)}{schedule.lastInserted != null ? ` • ${schedule.lastInserted} inserted, ${schedule.lastSkipped} skipped` : ""}</p>
              )}
            </div>
            <div>
              <p className="font-display uppercase tracking-widest text-xs text-muted-foreground">Next scheduled run</p>
              <p className="mt-1 font-semibold">{schedule ? formatDateTime(schedule.nextRunAt) : "—"}</p>
              {schedule && <p className="text-xs text-muted-foreground">{formatRelative(schedule.nextRunAt)}</p>}
            </div>
            <div>
              <p className="font-display uppercase tracking-widest text-xs text-muted-foreground">Schedule</p>
              <p className="mt-1 font-semibold">{schedule?.scheduleLabel ?? "—"}</p>
              {schedule && <p className="text-xs text-muted-foreground font-mono">{schedule.scheduleCron}</p>}
            </div>
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
