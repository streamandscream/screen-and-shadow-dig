import { toast } from "sonner";
import { getDeployStatus, triggerDeploy } from "@/lib/deploy.admin";

/**
 * Kicks off the Hostinger deploy after a post is published, so the page
 * exists on the live site straight away. Never blocks saving.
 */
export async function deployAfterPublish() {
  try {
    const status = await getDeployStatus();
    if (!status.configured) {
      toast.message("Saved. Set up publishing in Settings to push it live automatically.");
      return;
    }
    await triggerDeploy();
    toast.success("Published — the live site is updating now (a few minutes).");
  } catch (e) {
    toast.error(`Saved, but the live update did not start: ${(e as Error).message}`);
  }
}
