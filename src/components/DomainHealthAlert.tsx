import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { checkDomainHealth } from "@/lib/domain-health.functions";

export function DomainHealthAlert() {
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["domain-health"],
    queryFn: () => checkDomainHealth(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60_000,
  });

  if (error) return null;
  if (!data) {
    return (
      <p className="mt-8 border border-foreground/30 px-4 py-3 text-sm text-muted-foreground">
        Checking domain health…
      </p>
    );
  }

  const drifted = data.drifted;

  return (
    <section
      className={`mt-8 border-2 px-5 py-4 ${drifted ? "border-destructive" : "border-foreground/40"}`}
    >
      <div className="flex items-start gap-3">
        {drifted ? (
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-destructive" />
        ) : (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-muted-foreground" />
        )}
        <div className="flex-1">
          <h2 className="font-display uppercase tracking-widest text-sm">
            {drifted ? `Domain drift detected · ${data.domain}` : `Domain healthy · ${data.domain}`}
          </h2>
          <p className="mt-2 text-sm">{data.cause}</p>
          {data.fix && <p className="mt-1 text-sm text-muted-foreground">Fix: {data.fix}</p>}
          <p className="mt-2 text-xs text-muted-foreground">
            A records: {data.aRecords.length ? data.aRecords.join(", ") : "none"} · Verification TXT:{" "}
            {data.txtVerify.length ? "present" : "missing"} · HTTPS: {data.httpStatus || "no response"}
            {data.server ? ` (${data.server})` : ""} · checked{" "}
            {new Date(data.checkedAt).toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          aria-label="Re-check domain"
          className="border border-foreground px-3 py-1.5 font-display uppercase tracking-widest text-xs disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>
    </section>
  );
}
