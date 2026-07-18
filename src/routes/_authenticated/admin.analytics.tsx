import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getOutboundStats } from "@/lib/analytics.functions";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: AdminAnalytics,
});

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
}

function AdminAnalytics() {
  const statsFn = useServerFn(getOutboundStats);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["outbound-stats"],
    queryFn: () => statsFn(),
    refetchInterval: 60_000,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
          <div>
            <h1 className="font-display text-4xl">Outbound Click Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Every external link click, including Skimlinks affiliate redirects.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm"
            >
              {isFetching ? "Refreshing…" : "Refresh"}
            </button>
            <Link
              to="/admin"
              className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm"
            >
              Back to admin
            </Link>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="mt-8 text-destructive">Failed to load stats: {(error as Error).message}</p>
        ) : !data ? null : (
          <>
            <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Total clicks" value={data.totals.total} />
              <StatCard label="Affiliate clicks" value={data.totals.affiliate} />
              <StatCard label="Last 24h" value={data.totals.last24h} />
              <StatCard label="Last 7 days" value={data.totals.last7d} />
            </section>

            <section className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="font-display text-2xl border-b border-foreground pb-2">Top domains (7d)</h2>
                {data.byDomain.length === 0 ? (
                  <p className="mt-4 text-muted-foreground text-sm">No clicks yet.</p>
                ) : (
                  <table className="mt-4 w-full text-sm">
                    <thead className="font-display uppercase tracking-widest text-xs">
                      <tr>
                        <th className="text-left py-2">Domain</th>
                        <th className="text-right">Clicks</th>
                        <th className="text-right">Affiliate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byDomain.map((d) => (
                        <tr key={d.domain} className="border-b border-foreground/20">
                          <td className="py-2 truncate max-w-[200px]">{d.domain}</td>
                          <td className="text-right">{d.clicks}</td>
                          <td className="text-right">{d.affiliate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div>
                <h2 className="font-display text-2xl border-b border-foreground pb-2">Top source pages (7d)</h2>
                {data.byPath.length === 0 ? (
                  <p className="mt-4 text-muted-foreground text-sm">No clicks yet.</p>
                ) : (
                  <table className="mt-4 w-full text-sm">
                    <thead className="font-display uppercase tracking-widest text-xs">
                      <tr>
                        <th className="text-left py-2">Path</th>
                        <th className="text-right">Clicks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byPath.map((p) => (
                        <tr key={p.source_path} className="border-b border-foreground/20">
                          <td className="py-2 truncate max-w-[300px]">{p.source_path}</td>
                          <td className="text-right">{p.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl border-b border-foreground pb-2">Top Skimlinks merchants (7d)</h2>
              {data.byMerchant.length === 0 ? (
                <p className="mt-4 text-muted-foreground text-sm">No merchant-tagged clicks yet.</p>
              ) : (
                <table className="mt-4 w-full text-sm max-w-xl">
                  <thead className="font-display uppercase tracking-widest text-xs">
                    <tr>
                      <th className="text-left py-2">Merchant ID</th>
                      <th className="text-right">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byMerchant.map((m) => (
                      <tr key={m.merchant_id} className="border-b border-foreground/20">
                        <td className="py-2 font-mono">{m.merchant_id}</td>
                        <td className="text-right">{m.clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className="mt-12">
              <h2 className="font-display text-2xl border-b border-foreground pb-2">Recent clicks</h2>
              {data.recent.length === 0 ? (
                <p className="mt-4 text-muted-foreground text-sm">No clicks recorded yet.</p>
              ) : (
                <table className="mt-4 w-full text-sm">
                  <thead className="font-display uppercase tracking-widest text-xs">
                    <tr>
                      <th className="text-left py-2">When</th>
                      <th className="text-left">Domain</th>
                      <th className="text-left">Link</th>
                      <th className="text-left">Original</th>
                      <th className="text-left">Merchant</th>
                      <th className="text-left">From</th>
                      <th className="text-right">Affiliate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((c) => (
                      <tr key={c.id} className="border-b border-foreground/20 align-top">
                        <td className="py-2 whitespace-nowrap">{formatDateTime(c.created_at)}</td>
                        <td className="truncate max-w-[160px]">{c.domain}</td>
                        <td className="max-w-[280px] truncate">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="underline"
                            title={c.url}
                          >
                            {c.link_text || c.url}
                          </a>
                        </td>
                        <td className="max-w-[240px] truncate text-muted-foreground">
                          {c.original_url ? (
                            <a
                              href={c.original_url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="underline"
                              title={c.original_url}
                            >
                              {c.original_url}
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="font-mono text-xs">{c.merchant_id ?? "—"}</td>
                        <td className="truncate max-w-[200px] text-muted-foreground">{c.source_path ?? "—"}</td>
                        <td className="text-right">{c.is_affiliate ? "Yes" : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-foreground p-4">
      <p className="font-display uppercase tracking-widest text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl">{value.toLocaleString()}</p>
    </div>
  );
}
