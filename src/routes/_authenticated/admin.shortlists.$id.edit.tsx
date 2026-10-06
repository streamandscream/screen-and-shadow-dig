import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShortlistEditor, type ShortlistForm } from "@/components/ShortlistEditor";
import { listMyPosts } from "@/lib/posts.admin";
import { getShortlist, saveShortlist } from "@/lib/shortlists.admin";
import { deployAfterPublish } from "@/lib/deploy-after-publish";

export const Route = createFileRoute("/_authenticated/admin/shortlists/$id/edit")({ component: EditShortlist });

function EditShortlist() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: list, isLoading: listLoading } = useQuery({ queryKey: ["admin-shortlist", id], queryFn: () => getShortlist(id) });
  const { data: posts = [], isLoading: postsLoading } = useQuery({ queryKey: ["my-posts"], queryFn: listMyPosts });
  const [form, setForm] = useState<ShortlistForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!list) return;
    setForm({ id: list.id, title: list.title, slug: list.slug, excerpt: list.excerpt, body: list.body, meta_description: list.meta_description || "", anchor_post_id: list.anchor_post_id || "", cover_url: list.cover_url || "", cover_alt: list.cover_alt || "", published: list.published, publish_at: list.publish_at, items: list.items.map((item) => ({ post_id: item.post_id, position: item.position, reason: item.reason })) });
  }, [list]);
  async function save() {
    if (!form) return;
    setSaving(true); setError(null);
    try {
      await saveShortlist(form);
      if (form.published) await deployAfterPublish();
      navigate({ to: "/admin/shortlists/" });
    } catch (issue) { setError(issue instanceof Error ? issue.message : "Save failed."); }
    finally { setSaving(false); }
  }
  if (listLoading || postsLoading || !form) return <p className="p-10">Loading…</p>;
  return <ShortlistEditor form={form} setForm={setForm} posts={posts} save={save} saving={saving} error={error} />;
}