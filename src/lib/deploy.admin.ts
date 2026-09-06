/**
 * Browser-side controls for publishing the static site to Hostinger.
 * The GitHub token lives only in the database (write-only for editors) and is
 * never returned to the browser.
 */
import { supabase } from "@/integrations/supabase/client";

export type DeployStatus = {
  configured: boolean;
  github_owner: string | null;
  github_repo: string | null;
  workflow_file: string | null;
  git_ref: string | null;
  last_triggered_at: string | null;
};

export async function getDeployStatus(): Promise<DeployStatus> {
  const { data, error } = await (supabase as any).rpc("deploy_config_status");
  if (error) throw new Error(error.message);
  const row = Array.isArray(data) ? data[0] : data;
  return (
    (row as DeployStatus) ?? {
      configured: false,
      github_owner: null,
      github_repo: null,
      workflow_file: null,
      git_ref: null,
      last_triggered_at: null,
    }
  );
}

export async function saveDeployConfig(input: {
  github_owner: string;
  github_repo: string;
  workflow_file: string;
  git_ref: string;
  github_token: string;
}) {
  const { error } = await (supabase as any)
    .from("deploy_config")
    .upsert({ id: true, ...input }, { onConflict: "id" });
  if (error) throw new Error(error.message);
  return { ok: true };
}

export async function triggerDeploy() {
  const { data, error } = await (supabase as any).rpc("trigger_site_deploy");
  if (error) throw new Error(error.message);
  return data as { ok: boolean; request_id: number };
}
