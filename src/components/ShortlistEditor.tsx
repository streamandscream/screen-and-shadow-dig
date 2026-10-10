import { useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PosterOrbit } from "@/components/PosterOrbit";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import type { PublicPost } from "@/lib/posts.public";
import type { ShortlistDraftItem } from "@/lib/shortlists.admin";

export type ShortlistForm = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  meta_description: string;
  anchor_post_id: string;
  cover_url: string;
  cover_alt: string;
  published: boolean;
  publish_at: string | null;
  items: ShortlistDraftItem[];
};

type Props = {
  form: ShortlistForm;
  setForm: (form: ShortlistForm) => void;
  posts: PublicPost[];
  save: () => void;
  saving: boolean;
  error: string | null;
};

const fieldClass = "w-full border border-foreground bg-background p-3";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="eyebrow mb-1 block">{label}</label>{children}</div>;
}

export function ShortlistEditor({ form, setForm, posts, save, saving, error }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const publishedPosts = useMemo(() => posts.filter((post) => post.published), [posts]);
  const postMap = useMemo(() => new Map(posts.map((post) => [post.id, post])), [posts]);
  const anchor = form.anchor_post_id ? postMap.get(form.anchor_post_id) ?? null : null;
  const picks = form.items.map((item) => postMap.get(item.post_id)).filter((post): post is PublicPost => Boolean(post));

  const setItem = (index: number, patch: Partial<ShortlistDraftItem>) => {
    const items = form.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item);
    setForm({ ...form, items });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= form.items.length) return;
    const items = [...form.items];
    [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
    setForm({ ...form, items: items.map((item, itemIndex) => ({ ...item, position: itemIndex + 1 })) });
  };

  const addItem = () => {
    if (form.items.length >= 5) return;
    setForm({ ...form, items: [...form.items, { post_id: "", position: form.items.length + 1, reason: "" }] });
  };

  async function uploadCover(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
      if (file.size > 10 * 1024 * 1024) throw new Error("Image must be under 10MB.");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sign in again before uploading.");
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userData.user.id}/shortlists/${Date.now()}.${extension}`;
      const { error: uploadFailure } = await supabase.storage.from("covers").upload(path, file, { upsert: true, contentType: file.type });
      if (uploadFailure) throw uploadFailure;
      const { data, error: signingFailure } = await supabase.storage.from("covers").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      if (signingFailure || !data?.signedUrl) throw signingFailure || new Error("Could not create the cover URL.");
      setForm({ ...form, cover_url: data.signedUrl });
    } catch (uploadIssue) {
      setUploadError(uploadIssue instanceof Error ? uploadIssue.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
          <h1 className="font-display text-4xl">{form.id ? "Edit shortlist" : "New shortlist"}</h1>
          <Link to="/admin/shortlists/" className="eyebrow hover:underline">Back to shortlists</Link>
        </div>
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-5">
            <Field label="Title"><input className={fieldClass} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></Field>
            <Field label="Slug"><input className={fieldClass} value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></Field>
            <Field label="Introduction"><textarea className={fieldClass} rows={3} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} /></Field>
            <Field label={`SEO description (${form.meta_description.length}/200)`}><textarea className={fieldClass} rows={2} maxLength={200} value={form.meta_description} onChange={(event) => setForm({ ...form, meta_description: event.target.value })} /></Field>
            <Field label="Opening copy (Markdown)"><textarea className={`${fieldClass} font-mono text-sm`} rows={9} value={form.body} onChange={(event) => setForm({ ...form, body: event.target.value })} /></Field>
            <Field label="Featured show (optional)">
              <select className={fieldClass} value={form.anchor_post_id} onChange={(event) => setForm({ ...form, anchor_post_id: event.target.value })}>
                <option value="">Use the shortlist title</option>
                {publishedPosts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
              </select>
            </Field>

            <section className="border-t-2 border-foreground pt-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Ranked picks</h2>
                <span className="eyebrow">{form.items.length}/5</span>
              </div>
              <div className="mt-4 space-y-5">
                {form.items.map((item, index) => (
                  <div key={`${index}-${item.post_id}`} className="border border-foreground/30 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="card-eyebrow">No. {index + 1}</span>
                      <div className="flex gap-1">
                        <Button type="button" variant="ghost" size="icon" aria-label="Move pick up" disabled={index === 0} onClick={() => moveItem(index, -1)}><ArrowUp /></Button>
                        <Button type="button" variant="ghost" size="icon" aria-label="Move pick down" disabled={index === form.items.length - 1} onClick={() => moveItem(index, 1)}><ArrowDown /></Button>
                        <Button type="button" variant="ghost" size="icon" aria-label="Remove pick" onClick={() => setForm({ ...form, items: form.items.filter((_, itemIndex) => itemIndex !== index).map((entry, itemIndex) => ({ ...entry, position: itemIndex + 1 })) })}><Trash2 /></Button>
                      </div>
                    </div>
                    <select className={`${fieldClass} mt-3`} value={item.post_id} onChange={(event) => setItem(index, { post_id: event.target.value })}>
                      <option value="">Choose a reviewed title</option>
                      {publishedPosts.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
                    </select>
                    <textarea className={`${fieldClass} mt-3`} rows={2} placeholder="Why this is a must-watch pick…" value={item.reason} onChange={(event) => setItem(index, { reason: event.target.value })} />
                  </div>
                ))}
              </div>
              {form.items.length < 5 && <Button type="button" variant="outline" className="mt-4" onClick={addItem}>Add pick</Button>}
            </section>

            <section className="border border-foreground/30 p-4 space-y-4">
              <h2 className="eyebrow">Manual cover (optional)</h2>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadCover(file); event.target.value = ""; }} />
              <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}><Upload />{uploading ? "Uploading…" : "Upload cover"}</Button>
              <Field label="Or paste a URL"><input className={fieldClass} value={form.cover_url} onChange={(event) => setForm({ ...form, cover_url: event.target.value })} /></Field>
              <Field label="Cover description"><input className={fieldClass} value={form.cover_alt} onChange={(event) => setForm({ ...form, cover_alt: event.target.value })} /></Field>
              {uploadError && <p className="text-sm text-destructive">{uploadError}</p>}
            </section>

            <section className="border border-foreground/30 p-4 space-y-4">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked, publish_at: event.target.checked ? null : form.publish_at })} /><span className="eyebrow">Published now</span></label>
              <Field label="Or schedule publication">
                <input type="datetime-local" className={fieldClass} value={form.publish_at ? form.publish_at.slice(0, 16) : ""} onChange={(event) => setForm({ ...form, publish_at: event.target.value ? new Date(event.target.value).toISOString() : null, published: false })} />
              </Field>
              <p className="text-sm text-muted-foreground">Publishing requires three to five different picks and a reason for each.</p>
            </section>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Button type="button" size="lg" disabled={saving} onClick={save}>{saving ? "Saving…" : "Save shortlist"}</Button>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <p className="eyebrow mb-3">Poster Orbit preview</p>
            <PosterOrbit title={form.title || "The Shortlist"} anchor={anchor} picks={picks} coverUrl={form.cover_url} coverAlt={form.cover_alt} linked={false} />
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}