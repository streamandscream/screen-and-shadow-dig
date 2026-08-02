import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { upsertPost } from "@/lib/posts.admin";
import { Editor } from "./admin.$id.edit";

export const Route = createFileRoute("/_authenticated/admin/new")({
  component: NewPost,
});

function NewPost() {
  const navigate = useNavigate();
  const saveFn = upsertPost;
  const [form, setForm] = useState<any>({
    slug: "", section: "tv", title: "", excerpt: "", body: "", cover_url: "",
    streamer: "", rating: null, tags: [], published: false,
    justwatch_slug: "", justwatch_type: "tv-show", justwatch_country: "us",
    next_binge: [], vibe: "", publish_at: null, meta_description: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setSaving(true); setErr(null);
    try {
      const payload: any = { ...form, cover_url: form.cover_url || null, streamer: form.streamer || null, justwatch_slug: form.justwatch_slug || null, vibe: form.vibe || null };
      delete payload.id;
      await saveFn({ data: payload });
      navigate({ to: "/admin" });
    } catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
    finally { setSaving(false); }
  }

  return <Editor form={form} setForm={setForm} save={save} saving={saving} err={err} />;
}
