import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { HorizontalPostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.functions";

const postsQuery = (minRating?: number, maxRating?: number, sort?: string) =>
  queryOptions({
    queryKey: ["posts", "tv", minRating, maxRating, sort],
    queryFn: () => listPublishedPosts({ data: { section: "tv", minRating, maxRating, sort } }),
  });

export const Route = createFileRoute("/tv")({
  validateSearch: (search: Record<string, unknown>) => ({
    minRating: typeof search.minRating === "string" ? Number(search.minRating) || undefined : undefined,
    maxRating: typeof search.maxRating === "string" ? Number(search.maxRating) || undefined : undefined,
    sort: typeof search.sort === "string" && ["newest", "highest_score", "lowest_score"].includes(search.sort) ? search.sort : undefined,
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
    sort: search.sort,
  }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(postsQuery(deps.minRating, deps.maxRating, deps.sort)),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Page,
});

function Page() {
  const { minRating, maxRating, sort } = useSearch({ from: "/tv" });
  const navigate = useNavigate({ from: "/tv" });
  const { data } = useSuspenseQuery(postsQuery(minRating, maxRating, sort));

  const updateSort = (value: string) => {
    navigate({
      search: {
        minRating,
        maxRating,
        sort: value || undefined,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">The Stream</h1>
        <div className="mt-4 max-w-2xl text-muted-foreground whitespace-pre-line">Prestige dramas, sharp thrillers, angsty new-adult sagas, and slow-burn gems—because your watchlist deserves stories that linger long after the screen fades to black.{"\n\n"}</div>

        <div className="mt-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label htmlFor="sort" className="eyebrow text-muted-foreground">Sort</label>
            <select
              id="sort"
              value={sort ?? "newest"}
              onChange={(e) => updateSort(e.target.value)}
              className="bg-background border-2 border-foreground px-3 py-2 text-sm text-foreground outline-none cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="highest_score">Highest score</option>
              <option value="lowest_score">Lowest score</option>
            </select>
          </div>
        </div>

        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {data.map((p) => <PostCard key={p.id} post={p} showWhereToWatch={false} />)}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
