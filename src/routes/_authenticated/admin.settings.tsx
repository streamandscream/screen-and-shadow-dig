import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { getJustWatchAffiliate, setJustWatchAffiliate } from "@/lib/settings.public";

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
      </main>
      <SiteFooter />
    </div>
  );
}
