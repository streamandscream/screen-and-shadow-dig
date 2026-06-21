import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TvNewsScheduleStatus = {
  lastSuccessAt: string | null;
  lastInserted: number | null;
  lastSkipped: number | null;
  nextRunAt: string;
  scheduleCron: string;
  scheduleLabel: string;
};

const SCHEDULE_HOURS_UTC = [9, 21];
const SCHEDULE_CRON = "0 9,21 * * *";
const SCHEDULE_LABEL = "Twice daily at 09:00 and 21:00 UTC";

function computeNextRun(now: Date): Date {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    SCHEDULE_HOURS_UTC[0], 0, 0, 0
  ));
  for (let dayOffset = 0; dayOffset < 2; dayOffset++) {
    for (const h of SCHEDULE_HOURS_UTC) {
      const candidate = new Date(Date.UTC(
        now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset,
        h, 0, 0, 0
      ));
      if (candidate.getTime() > now.getTime()) return candidate;
    }
  }
  return next;
}

export const getTvNewsScheduleStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TvNewsScheduleStatus> => {
    const { data } = await context.supabase
      .from("ingestion_runs")
      .select("ran_at, items_inserted, items_skipped")
      .eq("ok", true)
      .order("ran_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      lastSuccessAt: data?.ran_at ?? null,
      lastInserted: data?.items_inserted ?? null,
      lastSkipped: data?.items_skipped ?? null,
      nextRunAt: computeNextRun(new Date()).toISOString(),
      scheduleCron: SCHEDULE_CRON,
      scheduleLabel: SCHEDULE_LABEL,
    };
  });
