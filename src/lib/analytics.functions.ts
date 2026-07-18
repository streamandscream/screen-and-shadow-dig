import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type OutboundClick = {
  id: string;
  created_at: string;
  url: string;
  domain: string;
  link_text: string | null;
  source_path: string | null;
  is_affiliate: boolean;
  merchant_id: string | null;
  original_url: string | null;
};

export type OutboundStats = {
  totals: { total: number; affiliate: number; last24h: number; last7d: number };
  byDomain: Array<{ domain: string; clicks: number; affiliate: number }>;
  byPath: Array<{ source_path: string; clicks: number }>;
  byMerchant: Array<{ merchant_id: string; clicks: number }>;
  recent: OutboundClick[];
};

export type OutboundStats = {
  totals: { total: number; affiliate: number; last24h: number; last7d: number };
  byDomain: Array<{ domain: string; clicks: number; affiliate: number }>;
  byPath: Array<{ source_path: string; clicks: number }>;
  recent: OutboundClick[];
};

export const getOutboundStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<OutboundStats> => {
    // Ensure caller is admin or author
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: isAuthor } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "author",
    });
    if (!isAdmin && !isAuthor) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const [{ data: recent }, { data: window7d }, { count: total }, { count: affiliate }] =
      await Promise.all([
        supabaseAdmin
          .from("outbound_clicks")
          .select("id, created_at, url, domain, link_text, source_path, is_affiliate")
          .order("created_at", { ascending: false })
          .limit(100),
        supabaseAdmin
          .from("outbound_clicks")
          .select("domain, source_path, is_affiliate, created_at")
          .gte("created_at", since7d),
        supabaseAdmin.from("outbound_clicks").select("*", { count: "exact", head: true }),
        supabaseAdmin
          .from("outbound_clicks")
          .select("*", { count: "exact", head: true })
          .eq("is_affiliate", true),
      ]);

    const rows = window7d ?? [];
    const since24h = Date.now() - 24 * 3600 * 1000;
    const last24h = rows.filter((r) => new Date(r.created_at).getTime() >= since24h).length;

    const domainMap = new Map<string, { clicks: number; affiliate: number }>();
    const pathMap = new Map<string, number>();
    for (const r of rows) {
      const d = domainMap.get(r.domain) ?? { clicks: 0, affiliate: 0 };
      d.clicks += 1;
      if (r.is_affiliate) d.affiliate += 1;
      domainMap.set(r.domain, d);
      if (r.source_path) pathMap.set(r.source_path, (pathMap.get(r.source_path) ?? 0) + 1);
    }
    const byDomain = [...domainMap.entries()]
      .map(([domain, v]) => ({ domain, ...v }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20);
    const byPath = [...pathMap.entries()]
      .map(([source_path, clicks]) => ({ source_path, clicks }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 20);

    return {
      totals: {
        total: total ?? 0,
        affiliate: affiliate ?? 0,
        last24h,
        last7d: rows.length,
      },
      byDomain,
      byPath,
      recent: (recent ?? []) as OutboundClick[],
    };
  });
