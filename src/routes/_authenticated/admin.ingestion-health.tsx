import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getIngestionHealth } from "@/lib/ingestion-health.functions";

export const Route = createFileRoute("/_authenticated/admin/ingestion-health")({
  head: () => ({
    meta: [
      { title: "Ingestion Health — Admin" },
      { name: "description", content: "Per-source RSS fetch results, parse errors, and ingestion latency." },
    ],
  }),
  component: IngestionHealth,
});

function fmtTime(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleString();
}

function IngestionHealth() {
  const fetchHealth = useServerFn(getIngestionHealth);
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["ingestion-health"],
    queryFn: () => fetchHealth(),
    refetchInterval: 30_000,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Ingestion Health</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Per-source RSS fetch results, parse errors, and latency. Auto-refreshes every 30s.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin" className="px-3 py-2 text-sm rounded-md border hover:bg-muted">
              Back to admin
            </Link>
            <button
              onClick={() => refetch()}
              className="px-3 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
              disabled={isFetching}
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {isLoading && <p className="text-muted-foreground">Loading…</p>}
        {isError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
            Failed to load: {(error as Error).message}
          </div>
        )}

        {data && (
          <>
            <section className="mb-10">
              <h2 className="text-xl font-semibold mb-3">Sources (last 24h)</h2>
              {data.sources.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No ingestion runs recorded yet. Trigger a refresh from the admin page.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.sources.map((s) => (
                    <div
                      key={s.source_name}
                      className={`rounded-lg border p-4 ${
                        s.last_ok ? "border-border" : "border-destructive/60 bg-destructive/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{s.source_name}</div>
                          <a
                            href={s.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:underline truncate block"
                          >
                            {s.source_url}
                          </a>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            s.last_ok
                              ? "bg-green-500/15 text-green-700 dark:text-green-400"
                              : "bg-destructive text-destructive-foreground"
                          }`}
                        >
                          {s.last_ok ? "OK" : "FAIL"}
                        </span>
                      </div>

                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                        <dt className="text-muted-foreground">Last run</dt>
                        <dd>{fmtTime(s.last_ran_at)}</dd>
                        <dt className="text-muted-foreground">HTTP</dt>
                        <dd>{s.last_http_status ?? "—"}</dd>
                        <dt className="text-muted-foreground">Last latency</dt>
                        <dd>{s.last_latency_ms} ms</dd>
                        <dt className="text-muted-foreground">Avg latency (24h)</dt>
                        <dd>{s.avg_latency_ms} ms</dd>
                        <dt className="text-muted-foreground">Runs / failures</dt>
                        <dd>
                          {s.runs_24h} / <span className={s.failures_24h ? "text-destructive" : ""}>{s.failures_24h}</span>
                        </dd>
                        <dt className="text-muted-foreground">Inserted (24h)</dt>
                        <dd>{s.total_inserted_24h}</dd>
                        <dt className="text-muted-foreground">Parse errors (24h)</dt>
                        <dd className={s.total_parse_errors_24h ? "text-destructive" : ""}>
                          {s.total_parse_errors_24h}
                        </dd>
                        <dt className="text-muted-foreground">Classify errors (24h)</dt>
                        <dd className={s.total_classify_errors_24h ? "text-destructive" : ""}>
                          {s.total_classify_errors_24h}
                        </dd>
                      </dl>

                      {s.last_error && (
                        <div className="mt-3 text-xs rounded border border-destructive/40 bg-destructive/10 text-destructive p-2 break-words">
                          {s.last_error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Recent runs</h2>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Source</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">HTTP</th>
                      <th className="px-3 py-2">Fetched</th>
                      <th className="px-3 py-2">Inserted</th>
                      <th className="px-3 py-2">Skipped</th>
                      <th className="px-3 py-2">Parse err</th>
                      <th className="px-3 py-2">Classify err</th>
                      <th className="px-3 py-2">Latency</th>
                      <th className="px-3 py-2">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-3 py-4 text-center text-muted-foreground">
                          No runs yet.
                        </td>
                      </tr>
                    )}
                    {data.recent.map((r) => (
                      <tr key={r.id} className="border-t">
                        <td className="px-3 py-2 whitespace-nowrap" title={r.ran_at}>
                          {fmtTime(r.ran_at)}
                        </td>
                        <td className="px-3 py-2">{r.source_name}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              r.ok
                                ? "bg-green-500/15 text-green-700 dark:text-green-400"
                                : "bg-destructive text-destructive-foreground"
                            }`}
                          >
                            {r.ok ? "OK" : "FAIL"}
                          </span>
                        </td>
                        <td className="px-3 py-2">{r.http_status ?? "—"}</td>
                        <td className="px-3 py-2">{r.items_fetched}</td>
                        <td className="px-3 py-2">{r.items_inserted}</td>
                        <td className="px-3 py-2">{r.items_skipped}</td>
                        <td className={`px-3 py-2 ${r.parse_errors ? "text-destructive" : ""}`}>
                          {r.parse_errors}
                        </td>
                        <td className={`px-3 py-2 ${r.classify_errors ? "text-destructive" : ""}`}>
                          {r.classify_errors}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">{r.latency_ms} ms</td>
                        <td className="px-3 py-2 max-w-xs truncate text-destructive" title={r.error ?? ""}>
                          {r.error ?? ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
