import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { getDeployStatus, triggerDeploy } from "@/lib/deploy.admin";

/** Starts the Hostinger deploy so newly published posts go live. */
export function DeployButton({ className = "" }: { className?: string }) {
  const { data, refetch } = useQuery({
    queryKey: ["deploy-status"],
    queryFn: () => getDeployStatus(),
  });
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    try {
      await triggerDeploy();
      toast.success("Deploy started — the live site updates in a few minutes.");
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  if (data && !data.configured) {
    return (
      <Link
        to="/admin/settings"
        className={`border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm ${className}`}
      >
        Set up publishing
      </Link>
    );
  }

  return (
    <button
      onClick={run}
      disabled={running}
      title={
        data?.last_triggered_at
          ? `Last run ${new Date(data.last_triggered_at).toLocaleString()}`
          : undefined
      }
      className={`bg-foreground text-background px-4 py-2 font-display uppercase tracking-widest text-sm disabled:opacity-50 ${className}`}
    >
      {running ? "Starting…" : "Publish live"}
    </button>
  );
}
