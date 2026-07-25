import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { TagPicker } from "@/components/TagPicker";
import { upsertPost, getMyPost } from "@/lib/posts.functions";
import { fetchTmdbMeta } from "@/lib/tmdb.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/$id/edit")({
  component: EditPost,
});

function EditPost() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const getFn = useServerFn(getMyPost);
  const saveFn = useServerFn(upsertPost);
  const { data: post, isLoading } = useQuery({ queryKey: ["my-post", id], queryFn: () => getFn({ data: { id } }) });
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => { if (post) setForm(post); }, [post]);

  async function save() {
    if (!form) return;
    setSaving(true); setErr(null);
    try {
      const publishAtIso = form.publish_at ? new Date(form.publish_at).toISOString() : null;
      const scheduled = !!publishAtIso && new Date(publishAtIso).getTime() > Date.now();
      await saveFn({ data: {
        id: form.id, slug: form.slug, section: form.section, title: form.title,
        excerpt: form.excerpt, body: form.body, cover_url: form.cover_url || null,
        streamer: form.streamer || null, rating: form.rating, tags: form.tags || [],
        published: scheduled ? false : form.published,
        justwatch_slug: form.justwatch_slug || null,
        justwatch_type: form.justwatch_type || "tv-show",
        justwatch_country: form.justwatch_country || "us",

        next_binge: form.next_binge || [],
        vibe: form.vibe || null,
        publish_at: scheduled ? publishAtIso : null,
      } });
      navigate({ to: "/admin" });
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  if (isLoading || !form) return <div className="p-10">Loading…</div>;
  return <Editor form={form} setForm={setForm} save={save} saving={saving} err={err} />;
}

function Editor({ form, setForm, save, saving, err }: any) {
  const tmdbFn = useServerFn(fetchTmdbMeta);
  const [tmdbStatus, setTmdbStatus] = useState<string | null>(null);
  const [tmdbLoading, setTmdbLoading] = useState(false);
  async function runTmdb() {
    if (!form.title?.trim()) { setTmdbStatus("Enter a title first"); return; }
    setTmdbLoading(true); setTmdbStatus(null);
    try {
      const type = form.section === "tv" ? "tv-show" : (form.justwatch_type === "movie" ? "movie" : "tv-show");
      const res: any = await tmdbFn({ data: { title: form.title.trim(), type } });
      if (!res.found) { setTmdbStatus("No TMDB match — paste a manual cover URL below"); return; }
      setForm({
        ...form,
        cover_url: res.cover_url || form.cover_url,
        excerpt: form.excerpt?.trim() ? form.excerpt : (res.overview || ""),
      });
      setTmdbStatus(`Matched: ${res.name}`);
    } catch (e) {
      setTmdbStatus(e instanceof Error ? e.message : "TMDB lookup failed");
    } finally { setTmdbLoading(false); }
  }
  const coverPreview = form.cover_url?.trim() ? form.cover_url.trim() : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  async function uploadCover(file: File) {
    setUploading(true); setUploadErr(null);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Please choose an image file");
      if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB");
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${form.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("covers").upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data, error: signErr } = await supabase.storage.from("covers").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signErr || !data?.signedUrl) throw signErr || new Error("Could not create URL");
      setForm({ ...form, cover_url: data.signedUrl });
    } catch (e) {
      setUploadErr(e instanceof Error ? e.message : "Upload failed");
    } finally { setUploading(false); }
  }
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 w-full flex-1">
        <h1 className="font-display text-4xl border-b-2 border-foreground pb-4">Edit post</h1>
        <div className="mt-6 space-y-4">
          <Field label="Title">
            <div className="flex gap-2">
              <input className="w-full border border-foreground bg-background p-3" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <button type="button" onClick={runTmdb} disabled={tmdbLoading} className="border border-foreground px-4 font-display uppercase text-xs tracking-widest disabled:opacity-50 whitespace-nowrap">
                {tmdbLoading ? "Fetching…" : "Fetch TMDB"}
              </button>
            </div>
            {tmdbStatus && <p className="mt-1 text-xs text-muted-foreground">{tmdbStatus}</p>}
          </Field>
          <Field label="Slug"><input className="w-full border border-foreground bg-background p-3" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></Field>
          <Field label="Section">
            <select className="w-full border border-foreground bg-background p-3" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })}>
              <option value="tv">TV</option><option value="true_crime">True Crime</option>
            </select>
          </Field>
          <Field label="Excerpt"><textarea className="w-full border border-foreground bg-background p-3" rows={2} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} /></Field>
          <Field label="The Vibe (one-line tagline)"><input placeholder="Cozy whodunit with bite." maxLength={160} className="w-full border border-foreground bg-background p-3" value={form.vibe || ""} onChange={(e) => setForm({ ...form, vibe: e.target.value })} /></Field>
          <div className="border border-foreground/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Cover image</p>
              {coverPreview && (
                <button type="button" onClick={() => setForm({ ...form, cover_url: "" })} className="text-xs underline text-muted-foreground">
                  Remove cover
                </button>
              )}
            </div>
            {coverPreview ? (
              <img src={coverPreview} alt="Cover preview" className="w-32 h-48 object-cover border border-foreground/20" />
            ) : (
              <div className="w-32 h-48 bg-muted flex items-center justify-center text-xs text-muted-foreground border border-foreground/20">
                No cover
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = ""; }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border border-foreground px-4 py-2 font-display uppercase text-xs tracking-widest disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "Upload image"}
              </button>
              {uploadErr && <p className="mt-1 text-xs text-destructive">{uploadErr}</p>}
            </div>
            <Field label="Or paste a URL">
              <input placeholder="Paste image URL when TMDB has no match…" className="w-full border border-foreground bg-background p-3" value={form.cover_url || ""} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Streamer"><input className="w-full border border-foreground bg-background p-3" value={form.streamer || ""} onChange={(e) => setForm({ ...form, streamer: e.target.value })} /></Field>
            <Field label="The Verdict (1–10, 0.5 steps)"><input type="number" min={1} max={10} step={0.5} className="w-full border border-foreground bg-background p-3" value={form.rating ?? ""} onChange={(e) => setForm({ ...form, rating: e.target.value ? Number(e.target.value) : null })} /></Field>
          </div>
          <Field label="Tags">
            <TagPicker value={form.tags || []} onChange={(arr) => setForm({ ...form, tags: arr })} />
          </Field>
          <Field label="Body (Markdown)"><textarea className="w-full border border-foreground bg-background p-3 font-mono text-sm" rows={20} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></Field>
          <Field label="More like this (2–3 titles, comma separated)">
            <CsvInput value={form.next_binge || []} onChange={(arr) => setForm({ ...form, next_binge: arr.slice(0, 3) })} />

          </Field>
          <div className="border-t border-foreground/30 pt-4">
            <p className="eyebrow mb-2">Where to watch (JustWatch)</p>
            <div className="grid grid-cols-3 gap-4">
              <Field label="JustWatch slug">
                <input placeholder="the-diplomat" className="w-full border border-foreground bg-background p-3" value={form.justwatch_slug || ""} onChange={(e) => setForm({ ...form, justwatch_slug: e.target.value })} />
              </Field>
              <Field label="Type">
                <select className="w-full border border-foreground bg-background p-3" value={form.justwatch_type || "tv-show"} onChange={(e) => setForm({ ...form, justwatch_type: e.target.value })}>
                  <option value="tv-show">TV show</option>
                  <option value="movie">Movie</option>
                </select>
              </Field>
              <Field label="Country">
                <input placeholder="us" className="w-full border border-foreground bg-background p-3" value={form.justwatch_country || "us"} onChange={(e) => setForm({ ...form, justwatch_country: e.target.value.toLowerCase() })} />
              </Field>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">From the JustWatch URL, e.g. justwatch.com/us/tv-show/<strong>the-diplomat</strong>.</p>
          </div>
          <div className="border border-foreground/30 p-4 space-y-3">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked, publish_at: e.target.checked ? null : form.publish_at })} />
              <span className="eyebrow">Published now</span>
            </label>
            <Field label="Or schedule publish date & time (your local time)">
              <div className="flex gap-2 items-center">
                <input
                  type="datetime-local"
                  className="border border-foreground bg-background p-3"
                  value={toLocalInput(form.publish_at)}
                  onChange={(e) => setForm({ ...form, publish_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                />
                {form.publish_at && (
                  <button type="button" onClick={() => setForm({ ...form, publish_at: null })} className="text-xs underline text-muted-foreground">
                    Clear
                  </button>
                )}
              </div>
              {form.publish_at && new Date(form.publish_at).getTime() > Date.now() && (
                <p className="mt-1 text-xs text-muted-foreground">Will auto-publish {new Date(form.publish_at).toLocaleString()}.</p>
              )}
            </Field>
          </div>
          {err && <p className="text-destructive text-sm">{err}</p>}
          <button disabled={saving} onClick={save} className="bg-foreground text-background py-3 px-6 font-display uppercase tracking-widest disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="eyebrow block mb-1">{label}</label>{children}</div>;
}

function CsvInput({ value, onChange }: { value: string[]; onChange: (arr: string[]) => void }) {
  const [text, setText] = useState(value.join(", "));
  const lastEmitted = useRef(value.join(", "));
  useEffect(() => {
    const joined = value.join(", ");
    if (joined !== lastEmitted.current) {
      setText(joined);
      lastEmitted.current = joined;
    }
  }, [value]);
  return (
    <input
      className="w-full border border-foreground bg-background p-3"
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        const arr = next.split(",").map((s) => s.trim()).filter(Boolean);
        lastEmitted.current = arr.join(", ");
        onChange(arr);
      }}
    />
  );
}

export { Editor };
