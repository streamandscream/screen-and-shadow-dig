import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TvNewsStatus = "renewed" | "cancelled" | "ended" | "other";

export type TvNewsItem = {
  id: string;
  title: string;
  summary: string | null;
  source_url: string;
  source_name: string;
  show_title: string | null;
  network: string | null;
  status: TvNewsStatus;
  image_url: string | null;
  published_at: string;
};

export const listTvNews = createServerFn({ method: "GET" })
  .inputValidator((d: { status?: TvNewsStatus; limit?: number } | undefined) =>
    z.object({
      status: z.enum(["renewed", "cancelled", "ended", "other"]).optional(),
      limit: z.number().int().min(1).max(100).optional(),
    }).parse(d ?? {})
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("tv_news")
      .select("id, title, summary, source_url, source_name, show_title, network, status, image_url, published_at")
      .order("published_at", { ascending: false })
      .limit(data.limit ?? 60);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as TvNewsItem[];
  });
