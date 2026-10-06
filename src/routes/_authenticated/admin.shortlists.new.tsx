import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShortlistEditor, type ShortlistForm } from "@/components/ShortlistEditor";
import { listMyPosts } from "@/lib/posts.admin";
import { saveShortlist } from "@/lib/shortlists.admin";
import { deployAfterPublish } from "@/lib/deploy-after-publish";

export const Route = createFileRoute("/_authenticated/admin/shortlists/new")({ component: NewShortlist });

const initial: ShortlistForm = { title: "", slug: "", excerpt: "", body: "", meta_description: "", anchor_post_id: "", cover_url: "", cover_alt: "", published: false, publish_at: null, items: [] };

function NewShortlist() {
  const navigate = useNavigate();
  const { data: posts = [], isLoading } = useQuery({ queryKey: ["my-posts"], queryFn: listMyPosts });
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function save() {
    setSaving(true); setError(null);
    try {
      await saveShortlist(form);
      if (form.published) await deployAfterPublish();
      navigate({ to: "/admin/shortlists/" });
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Save failed."); }
    finally { setSaving(false); }
  }
  if (isLoading) return <p className="p-10">Loading…</p>;
  return <ShortlistEditor form={form} setForm={setForm} posts={posts} save={save} saving={saving} error={error} />;
}