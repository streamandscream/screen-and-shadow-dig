import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostCard } from "@/components/PostCard";
import { searchPosts, getSearchFilters } from "@/lib/posts.functions";

const searchQuery = (q: string, tag: string, streamer: string) =>
  queryOptions({
    queryKey: ["posts", "search", q, tag, streamer],
    queryFn: () =>
      searchPosts({
        data: {
          q: q || undefined,
          tag: tag || undefined,
          streamer: streamer || undefined,
        },
      }),
  });

const filterOptionsQuery = () =>
  queryOptions({
    queryKey: ["posts", "filter-options"],
    queryFn: () => getSearchFilters(),
  });

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
    tag: typeof search.tag === "string" ? search.tag : "",
    streamer: typeof search.streamer === "string" ? search.streamer : "",
  }),
  head: () => ({
    meta: [
      { title: "Search — Bold News" },
      { name: "description", content: "Search Bold News for TV recommendations and true crime documentaries." },
    ],
  }),
  loaderDeps: ({ search }) => ({
    q: search.q,
    tag: search.tag,
    streamer: search.streamer,
  }),
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(filterOptionsQuery());
    if (deps.q || deps.tag || deps.streamer) {
      return context.queryClient.ensureQueryData(
        searchQuery(deps.q, deps.tag, deps.streamer)
      );
    }
    return [];
  },
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: SearchPage,
});

function SearchPage() {
  const { q, tag, streamer } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });
  const active = q || tag || streamer;

  const { data: results } = useSuspenseQuery(
    active ? searchQuery(q, tag, streamer) : searchQuery("", "", "")
  );
  const { data: options } = useSuspenseQuery(filterOptionsQuery());

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newQ = String(formData.get("q") ?? "").trim();
    navigate({ search: { q: newQ, tag, streamer } });
  };

  const updateFilter = (key: "tag" | "streamer", value: string) => {
    navigate({
      search: {
        q,
        tag: key === "tag" ? value : tag,
        streamer: key === "streamer" ? value : streamer,
      },
    });
  };

  const clearAll = () => {
    navigate({ search: { q: "", tag: "", streamer: "" } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <p className="eyebrow text-accent-red">Search</p>
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">
          Find a show
        </h1>

        <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
          <div className="flex border-2 border-foreground">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search titles, streamers, tags..."
              className="flex-1 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="submit"
              className="border-l-2 border-foreground bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-primary-foreground hover:bg-foreground/90 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="tag-filter" className="eyebrow text-muted-foreground">
              Tag
            </label>
            <select
              id="tag-filter"
              value={tag}
              onChange={(e) => updateFilter("tag", e.target.value)}
              className="bg-background border-2 border-foreground px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="">All tags</option>
              {options.tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="streamer-filter" className="eyebrow text-muted-foreground">
              Streamer
            </label>
            <select
              id="streamer-filter"
              value={streamer}
              onChange={(e) => updateFilter("streamer", e.target.value)}
              className="bg-background border-2 border-foreground px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="">All streamers</option>
              {options.streamers.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {active && (
            <button
              onClick={clearAll}
              className="eyebrow text-accent-red underline hover:no-underline"
            >
              Clear all
            </button>
          )}
        </div>

        <section className="mt-10">
          <p className="eyebrow text-muted-foreground mb-6">
            {results.length} result{results.length !== 1 ? "s" : ""}
            {q && ` for “${q}”`}
            {tag && ` · tag: ${tag}`}
            {streamer && ` · streamer: ${streamer}`}
          </p>
          {results.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {results.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No shows found. Try adjusting your filters.
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
