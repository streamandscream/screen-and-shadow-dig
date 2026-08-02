/** Browser-side site settings (static-hosting compatible). */
import { supabase } from "@/integrations/supabase/client";

export const JUSTWATCH_AFFILIATE_KEY = "justwatch_affiliate_template";

export async function getJustWatchAffiliate(): Promise<string | null> {
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", JUSTWATCH_AFFILIATE_KEY)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data?.value as string | null) ?? null;
}

export async function setJustWatchAffiliate(args: { data: { value: string | null } }) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key: JUSTWATCH_AFFILIATE_KEY, value: args.data.value }, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { ok: true };
}
