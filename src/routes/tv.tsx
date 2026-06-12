import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.functions";

const postsQuery = (minRating?: number, maxRating?: number) =>
  queryOptions({
    queryKey: ["posts", "tv", minRating, maxRating],
    queryFn: () => listPublishedPosts({ data: { section: "tv", minRating, maxRating } }),
  });

export const Route = createFileRoute("/tv")({
  validateSearch: (search: Record<string, unknown>) => ({
    minRating: typeof search.minRating === "string" ? Number(search.minRating) || undefined : undefined,
    maxRating: typeof search.maxRating === "string" ? Number(search.maxRating) || undefined : undefined,
  }),
  head: () => ({ meta: [
    { title: "The Stream — Bold News" },
    { name: "description", content: "Reviews and recommendations on prestige TV: The Diplomat, Lioness, Vladimir, The Beast in Me, and more." },
    { property: "og:title", content: "The Stream — Bold News" },
    { property: "og:description", content: "Reviews and recommendations on prestige TV." },
  ] }),
  loaderDeps: ({ search }) => ({
    minRating: search.minRating,
    maxRating: search.maxRating,
  }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(postsQuery(deps.minRating, deps.maxRating)),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Page,
});

function Page() {
  const { minRating, maxRating } = useSearch({ from: "/tv" });
  const navigate = useNavigate({ from: "/tv" });
  const { data } = useSuspenseQuery(postsQuery(minRating, maxRating));

  const updateFilter = (key: "minRating" | "maxRating", value: string) => {
    const num = value ? Number(value) : undefined;
    navigate({
      search: (prev) => ({
        ...prev,
        [key]: num,
      }),
    });
  };

  const clearFilters = () => {
    navigate({ search: { minRating: undefined, maxRating: undefined } });
  };

  const active = minRating != null || maxRating != null;

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <p className="eyebrow text-accent-red">Section</p>
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">The Stream</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Prestige drama, sharp thrillers, and slow burns worth your evening. Honest takes on what's actually worth watching.</p>

        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="min-rating" className="eyebrow text-muted-foreground">Min Verdict</label>
            <select
              id="min-rating"
              value={minRating ?? ""}
              onChange={(e) => updateFilter("minRating", e.target.value)}
              className="bg-background border-2 border-foreground px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="">Any</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="max-rating" className="eyebrow text-muted-foreground">Max Verdict</label>
            <select
              id="max-rating"
              value={maxRating ?? ""}
              onChange={(e) => updateFilter("maxRating", e.target.value)}
              className="bg-background border-2 border-foreground px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="">Any</option>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          {active && (
            <button
              onClick={clearFilters}
              className="eyebrow text-accent-red underline hover:no-underline"
            >
              Clear
            </button>
          )}
        </div>

        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {data.map((p) => <PostCard key={p.id} post={p} />)}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
