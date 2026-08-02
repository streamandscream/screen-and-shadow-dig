/**
 * Browser-safe TV news reads (static-hosting compatible).
 */
import { supabase } from "@/integrations/supabase/client";

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

export async function listTvNews(args?: {
  data?: { status?: TvNewsStatus; limit?: number };
}): Promise<TvNewsItem[]> {
  const data = args?.data ?? {};
  let q = supabase
    .from("tv_news")
    .select(
      "id, title, summary, source_url, source_name, show_title, network, status, image_url, published_at",
    )
    .order("published_at", { ascending: false })
    .limit(data.limit ?? 60);
  if (data.status) q = q.eq("status", data.status);
  const { data: rows, error } = await q;
  if (error) throw new Error(error.message);
  return (rows ?? []) as TvNewsItem[];
}
