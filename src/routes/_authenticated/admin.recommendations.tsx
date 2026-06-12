import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { listMyPosts, updateRecommendations } from "@/lib/posts.functions";

export const Route = createFileRoute("/_authenticated/admin/recommendations")({
  component: RecommendationsEditor,
});

function RecommendationsEditor() {
  const listFn = useServerFn(listMyPosts);
  const saveFn = useServerFn(updateRecommendations);
  const { data: posts, isLoading, refetch } = useQuery({
    queryKey: ["my-posts"],
    queryFn: () => listFn(),
  });

  const tvPosts = (posts ?? []).filter((p) => p.section === "tv").sort((a, b) => a.title.localeCompare(b.title));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
          <h1 className="font-display text-4xl">Edit Recommendations</h1>
          <Link to="/admin" className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm">
            Back to dashboard
          </Link>
        </div>
        <p className="mt-4 text-muted-foreground text-sm">
          Quickly tweak “Our favourite episode” and “Your next binge” for every TV post.
        </p>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : tvPosts.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No TV posts yet.</p>
        ) : (
          <div className="mt-8 space-y-6">
            {tvPosts.map((post) => (
              <PostRecommendationsCard key={post.id} post={post} saveFn={saveFn} onSaved={refetch} />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function PostRecommendationsCard({ post, saveFn, onSaved }: { post: any; saveFn: ReturnType<typeof useServerFn>; onSaved: () => void }) {
  const [episode, setEpisode] = useState(post.favourite_episode || "");
  const [bingeRaw, setBingeRaw] = useState((post.next_binge || []).join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true); setSaved(false);
    try {
      const nextBinge = bingeRaw.split(",").map((s: string) => s.trim()).filter(Boolean).slice(0, 3);
      await saveFn({ data: {
        id: post.id,
        favourite_episode: episode.trim() || null,
        next_binge: nextBinge,
      }});
      setSaved(true);
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-foreground/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">{post.title}</h2>
        <Link to="/admin/$id/edit" params={{ id: post.id }} className="text-sm underline text-muted-foreground">
          Full edit
        </Link>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="eyebrow block mb-1">Our favourite episode</label>
          <input
            className="w-full border border-foreground bg-background p-3"
            placeholder="S2E5 — “The One With…”"
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
          />
        </div>
        <div>
          <label className="eyebrow block mb-1">Your next binge (2–3 titles, comma separated)</label>
          <input
            className="w-full border border-foreground bg-background p-3"
            placeholder="The Crown, Breaking Bad, Succession"
            value={bingeRaw}
            onChange={(e) => setBingeRaw(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-foreground text-background py-2 px-4 font-display uppercase tracking-widest text-sm disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {saved && <span className="text-sm text-green-600">Saved!</span>}
      </div>
    </div>
  );
}
