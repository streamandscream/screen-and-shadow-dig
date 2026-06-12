import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import {
  listPostsForCovers,
  updatePostCover,
  tmdbSearchCovers,
} from "@/lib/covers.functions";

export const Route = createFileRoute("/_authenticated/admin/covers")({
  component: Covers,
});

type PostRow = {
  id: string;
  slug: string;
  section: "tv" | "true_crime";
  title: string;
  cover_url: string | null;
};

function Covers() {
  const listFn = useServerFn(listPostsForCovers);
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-covers"],
    queryFn: () => listFn(),
  });
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <div className="flex items-center justify-between border-b-2 border-foreground pb-4">
          <h1 className="font-display text-4xl">Cover images</h1>
          <Link
            to="/admin"
            className="border border-foreground px-4 py-2 font-display uppercase tracking-widest text-sm"
          >
            Back to admin
          </Link>
        </div>

        {isLoading ? (
          <p className="mt-8 text-muted-foreground">Loading…</p>
        ) : !posts || posts.length === 0 ? (
          <p className="mt-8 text-muted-foreground">No posts.</p>
        ) : (
          <ul className="mt-8 divide-y divide-foreground/30">
            {(posts as PostRow[]).map((p) => (
              <li key={p.id} className="py-4">
                <CoverRow
                  post={p}
                  expanded={activeId === p.id}
                  onToggle={() => setActiveId(activeId === p.id ? null : p.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function CoverRow({
  post,
  expanded,
  onToggle,
}: {
  post: PostRow;
  expanded: boolean;
  onToggle: () => void;
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updatePostCover);
  const [url, setUrl] = useState(post.cover_url ?? "");
  const [err, setErr] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: (cover_url: string | null) => updateFn({ data: { id: post.id, cover_url } }),
    onSuccess: () => {
      setErr(null);
      qc.invalidateQueries({ queryKey: ["admin-covers"] });
    },
    onError: (e: unknown) => setErr(e instanceof Error ? e.message : "Failed"),
  });

  return (
    <div className="grid grid-cols-[120px_1fr_auto] gap-4 items-start">
      <div className="w-[120px] h-[80px] bg-paper border border-foreground/30 overflow-hidden">
        {url ? (
          <img
            src={url}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => ((e.currentTarget.style.opacity = "0.2"))}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="eyebrow text-accent-red">
            {post.section === "tv" ? "The Stream" : "The Scream"}
          </span>
        </div>
        <h3 className="font-display text-xl truncate">{post.title}</h3>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://image.tmdb.org/t/p/w500/…"
          className="mt-2 w-full border border-foreground bg-background p-2 text-sm font-mono"
        />
        {err && <p className="mt-1 text-xs text-destructive">{err}</p>}
        {expanded && <TmdbPanel title={post.title} onPick={(u) => setUrl(u)} />}
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => save.mutate(url || null)}
          disabled={save.isPending || url === (post.cover_url ?? "")}
          className="bg-foreground text-background px-3 py-2 font-display uppercase tracking-widest text-xs disabled:opacity-40"
        >
          {save.isPending ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onToggle}
          className="border border-foreground px-3 py-2 font-display uppercase tracking-widest text-xs"
        >
          {expanded ? "Close" : "TMDB"}
        </button>
        {url && (
          <button
            onClick={() => {
              setUrl("");
              save.mutate(null);
            }}
            className="text-xs underline text-destructive"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

function TmdbPanel({ title, onPick }: { title: string; onPick: (url: string) => void }) {
  const searchFn = useServerFn(tmdbSearchCovers);
  const [query, setQuery] = useState(title);
  const [type, setType] = useState<"multi" | "tv" | "movie">("multi");
  const search = useMutation({
    mutationFn: () => searchFn({ data: { query, type } }),
  });

  return (
    <div className="mt-4 border border-foreground/30 p-3">
      <div className="flex gap-2 flex-wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search TMDB…"
          className="flex-1 min-w-[200px] border border-foreground bg-background p-2 text-sm"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="border border-foreground bg-background p-2 text-sm"
        >
          <option value="multi">All</option>
          <option value="tv">TV</option>
          <option value="movie">Movie</option>
        </select>
        <button
          onClick={() => search.mutate()}
          disabled={search.isPending || !query.trim()}
          className="bg-foreground text-background px-3 py-2 font-display uppercase tracking-widest text-xs disabled:opacity-40"
        >
          {search.isPending ? "Searching…" : "Search"}
        </button>
      </div>
      {search.error && (
        <p className="mt-2 text-xs text-destructive">
          {(search.error as Error).message}
        </p>
      )}
      {search.data && search.data.length === 0 && (
        <p className="mt-2 text-xs text-muted-foreground">No results.</p>
      )}
      {search.data && search.data.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
          {search.data.map((r) => (
            <li key={`${r.media_type}-${r.id}`} className="flex flex-col">
              {r.poster_url ? (
                <img
                  src={r.poster_url}
                  alt={r.title}
                  className="w-full aspect-[2/3] object-cover border border-foreground/30"
                />
              ) : (
                <div className="w-full aspect-[2/3] bg-paper border border-foreground/30" />
              )}
              <p className="mt-1 text-xs font-display truncate">
                {r.title} {r.year && `(${r.year})`}
              </p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {r.media_type}
              </p>
              <div className="mt-1 flex gap-1">
                {r.poster_url && (
                  <button
                    onClick={() => onPick(r.poster_url!)}
                    className="flex-1 border border-foreground px-2 py-1 text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background"
                  >
                    Use poster
                  </button>
                )}
                {r.backdrop_url && (
                  <button
                    onClick={() => onPick(r.backdrop_url!)}
                    className="flex-1 border border-foreground px-2 py-1 text-[10px] uppercase tracking-widest hover:bg-foreground hover:text-background"
                  >
                    Backdrop
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
