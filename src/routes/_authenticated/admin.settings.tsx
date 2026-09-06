import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getJustWatchAffiliate, setJustWatchAffiliate } from "@/lib/settings.public";
import { getDeployStatus, saveDeployConfig } from "@/lib/deploy.admin";
import { DeployButton } from "@/components/DeployButton";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const getFn = getJustWatchAffiliate;
  const setFn = setJustWatchAffiliate;
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["site-setting", "justwatch_affiliate"],
    queryFn: () => getFn(),
  });
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => { setValue(data ?? ""); }, [data]);

  async function save() {
    setSaving(true); setStatus(null);
    try {
      await setFn({ data: { value: value.trim() || null } });
      setStatus("Saved.");
      refetch();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 w-full flex-1">
        <h1 className="font-display text-4xl border-b-2 border-foreground pb-4">Site settings</h1>

        <section className="mt-8">
          <h2 className="font-display text-2xl">JustWatch affiliate link</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            JustWatch (and most streamer affiliate programs that go through them) use the Impact network. Paste your
            affiliate deep-link template below, with <code className="bg-paper px-1">{"{url}"}</code> where the JustWatch URL goes.
            Leave blank to link directly to JustWatch without an affiliate tag.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Example: <code className="bg-paper px-1">https://imp.pxf.io/c/PUB_ID/PROG_ID/13744?u={"{url}"}</code>
          </p>

          {isLoading ? (
            <p className="mt-4 text-muted-foreground">Loading…</p>
          ) : (
            <div className="mt-4 space-y-3">
              <input
                className="w-full border border-foreground bg-background p-3 font-mono text-sm"
                placeholder="https://imp.pxf.io/c/.../13744?u={url}"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <button
                  disabled={saving}
                  onClick={save}
                  className="bg-foreground text-background py-3 px-6 font-display uppercase tracking-widest disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                {status && <span className="text-sm text-muted-foreground">{status}</span>}
              </div>
            </div>
          )}
        </section>

        <DeploySettings />
      </main>
      <SiteFooter />
    </div>
  );
}

function DeploySettings() {
  const { data, refetch } = useQuery({ queryKey: ["deploy-status"], queryFn: () => getDeployStatus() });
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [workflow, setWorkflow] = useState("deploy.yml");
  const [ref, setRef] = useState("main");
  const [token, setToken] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.configured) return;
    setOwner(data.github_owner ?? "");
    setRepo(data.github_repo ?? "");
    setWorkflow(data.workflow_file ?? "deploy.yml");
    setRef(data.git_ref ?? "main");
  }, [data]);

  async function save() {
    setSaving(true); setStatus(null);
    try {
      if (!token.trim()) throw new Error("Paste your GitHub access token to save.");
      await saveDeployConfig({
        github_owner: owner.trim(),
        github_repo: repo.trim(),
        workflow_file: workflow.trim() || "deploy.yml",
        git_ref: ref.trim() || "main",
        github_token: token.trim(),
      });
      setToken("");
      setStatus("Saved.");
      refetch();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-16 border-t-2 border-foreground pt-8">
      <h2 className="font-display text-2xl">Publishing to your live site</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your live site is a static copy that gets rebuilt by GitHub. Enter your details once, and
        the “Publish live” button (and publishing a review) will start that rebuild for you.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        The token needs the <strong>Actions: read and write</strong> permission on this one
        repository. It is stored privately and never shown again.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input className="border border-foreground bg-background p-3 text-base" placeholder="GitHub username or org" value={owner} onChange={(e) => setOwner(e.target.value)} />
        <input className="border border-foreground bg-background p-3 text-base" placeholder="Repository name" value={repo} onChange={(e) => setRepo(e.target.value)} />
        <input className="border border-foreground bg-background p-3 text-base" placeholder="deploy.yml" value={workflow} onChange={(e) => setWorkflow(e.target.value)} />
        <input className="border border-foreground bg-background p-3 text-base" placeholder="main" value={ref} onChange={(e) => setRef(e.target.value)} />
        <input className="border border-foreground bg-background p-3 text-base sm:col-span-2" type="password" placeholder={data?.configured ? "Paste a new token to replace the saved one" : "GitHub access token"} value={token} onChange={(e) => setToken(e.target.value)} />
      </div>

      <div className="mt-4 flex items-center gap-3 flex-wrap">
        <button
          disabled={saving}
          onClick={save}
          className="bg-foreground text-background py-3 px-6 font-display uppercase tracking-widest disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {data?.configured && <DeployButton className="py-3 px-6" />}
        {status && <span className="text-sm text-muted-foreground">{status}</span>}
      </div>

      {data?.last_triggered_at && (
        <p className="mt-3 text-xs text-muted-foreground">
          Last update started {new Date(data.last_triggered_at).toLocaleString()}.
        </p>
      )}
    </section>
  );
}
