import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { HorizontalPostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.functions";

const postsQuery = (sort?: string) =>
  queryOptions({
    queryKey: ["posts", "true_crime", sort],
    queryFn: () => listPublishedPosts({ data: { section: "true_crime", sort } }),
  });

export const Route = createFileRoute("/true-crime")({
  validateSearch: (search: Record<string, unknown>) => ({
    sort: typeof search.sort === "string" && ["newest", "highest_score", "lowest_score"].includes(search.sort) ? search.sort : undefined,
  }),
  head: () => ({
    meta: [
      { title: "The Scream — True Crime Documentary Reviews" },
      { name: "description", content: "True crime and documentary picks for the endlessly curious. Honest verdicts on the cases and docs everyone's talking about." },
      { property: "og:title", content: "The Scream — True Crime Documentary Reviews" },
      { property: "og:description", content: "True crime and documentary picks for the endlessly curious." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://streamandscream.com/true-crime" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "The Scream — True Crime Documentary Reviews" },
      { name: "twitter:description", content: "True crime and documentary picks for the endlessly curious." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
    ],
    links: [{ rel: "canonical", href: "https://streamandscream.com/true-crime" }],
  }),
  loaderDeps: ({ search }) => ({
    sort: search.sort,
  }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(postsQuery(deps.sort)),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Page,
});

function Page() {
  const { sort } = useSearch({ from: "/true-crime" });
  const navigate = useNavigate({ from: "/true-crime" });
  const { data } = useSuspenseQuery(postsQuery(sort));

  const updateSort = (value: string) => {
    navigate({
      search: {
        sort: value || undefined,
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12 w-full flex-1">
        
        <h1 className="font-display text-[40px] mt-2 border-b-2 border-foreground pb-4">The Scream</h1>
        <div className="mt-4 max-w-2xl text-muted-foreground whitespace-pre-line">True crime and documentary picks for the endlessly curious—where every story pulls you deeper, and the truth is never simple.{"\n\n"}</div>

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

        <section className="mt-10 flex flex-col gap-10">
          {data.map((p) => <HorizontalPostCard key={p.id} post={p} />)}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
