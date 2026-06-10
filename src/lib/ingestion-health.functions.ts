import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IngestionRun = {
  id: string;
  source_name: string;
  source_url: string;
  ok: boolean;
  http_status: number | null;
  items_fetched: number;
  items_inserted: number;
  items_skipped: number;
  parse_errors: number;
  classify_errors: number;
  latency_ms: number;
  error: string | null;
  ran_at: string;
};

export type SourceHealth = {
  source_name: string;
  source_url: string;
  last_ok: boolean;
  last_ran_at: string;
  last_error: string | null;
  last_http_status: number | null;
  last_latency_ms: number;
  runs_24h: number;
  failures_24h: number;
  avg_latency_ms: number;
  total_inserted_24h: number;
  total_parse_errors_24h: number;
  total_classify_errors_24h: number;
};

export const getIngestionHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [recentRes, windowRes] = await Promise.all([
      supabase
        .from("ingestion_runs")
        .select("*")
        .order("ran_at", { ascending: false })
        .limit(50),
      supabase
        .from("ingestion_runs")
        .select("*")
        .gte("ran_at", since)
        .order("ran_at", { ascending: false }),
    ]);

    if (recentRes.error) throw new Error(recentRes.error.message);
    if (windowRes.error) throw new Error(windowRes.error.message);

    const recent = (recentRes.data ?? []) as IngestionRun[];
    const window = (windowRes.data ?? []) as IngestionRun[];

    const bySource = new Map<string, IngestionRun[]>();
    for (const r of window) {
      const arr = bySource.get(r.source_name) ?? [];
      arr.push(r);
      bySource.set(r.source_name, arr);
    }
    // Also seed with sources only present in recent (in case nothing in 24h)
    for (const r of recent) {
      if (!bySource.has(r.source_name)) bySource.set(r.source_name, []);
    }

    const sources: SourceHealth[] = [];
    for (const [name, runs] of bySource) {
      const last = recent.find((r) => r.source_name === name) ?? runs[0];
      if (!last) continue;
      const failures = runs.filter((r) => !r.ok).length;
      const avgLatency = runs.length
        ? Math.round(runs.reduce((s, r) => s + r.latency_ms, 0) / runs.length)
        : last.latency_ms;
      sources.push({
        source_name: name,
        source_url: last.source_url,
        last_ok: last.ok,
        last_ran_at: last.ran_at,
        last_error: last.error,
        last_http_status: last.http_status,
        last_latency_ms: last.latency_ms,
        runs_24h: runs.length,
        failures_24h: failures,
        avg_latency_ms: avgLatency,
        total_inserted_24h: runs.reduce((s, r) => s + r.items_inserted, 0),
        total_parse_errors_24h: runs.reduce((s, r) => s + r.parse_errors, 0),
        total_classify_errors_24h: runs.reduce((s, r) => s + r.classify_errors, 0),
      });
    }
    sources.sort((a, b) => a.source_name.localeCompare(b.source_name));

    return { sources, recent };
  });
