import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { HorizontalPostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.public";

const SORTS = ["newest", "highest_score", "lowest_score"] as const;
type Sort = (typeof SORTS)[number];
type ListSearch = { minRating?: number; maxRating?: number; sort?: Sort };

const postsQuery = (sort?: "newest" | "highest_score" | "lowest_score") =>
  queryOptions({
    queryKey: ["posts", "true_crime", sort],
    queryFn: () => listPublishedPosts({ data: { section: "true_crime", sort } }),
  });

export const Route = createFileRoute("/true-crime")({
  validateSearch: (search: Record<string, unknown>): ListSearch => {
    const minRating = typeof search["minRating"] === "string" ? Number(search["minRating"]) || undefined : undefined;
    const maxRating = typeof search["maxRating"] === "string" ? Number(search["maxRating"]) || undefined : undefined;
    const rawSort = search["sort"];
    const sort = typeof rawSort === "string" && SORTS.includes(rawSort as Sort) ? (rawSort as Sort) : undefined;
    return { ...(minRating !== undefined ? { minRating } : {}), ...(maxRating !== undefined ? { maxRating } : {}), ...(sort ? { sort } : {}) };
  },
  head: ({ loaderData }: { loaderData?: any }) => ({
    meta: [
      { title: "Best True Crime 2026 — Reviews & Picks | The Scream" },
      { name: "description", content: "The best true crime of 2026 — honest reviews of the docs and series everyone's talking about, including true crime like The Crash. Updated weekly." },
      { property: "og:title", content: "Best True Crime 2026 — Reviews & Picks | The Scream" },
      { property: "og:description", content: "The best true crime of 2026 — honest reviews of the docs and series everyone's talking about, including true crime like The Crash. Updated weekly." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://streamandscream.com/true-crime" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Best True Crime 2026 — Reviews & Picks | The Scream" },
      { name: "twitter:description", content: "The best true crime of 2026 — honest reviews of the docs and series everyone's talking about, including true crime like The Crash." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
    ],
    links: [{ rel: "canonical", href: "https://streamandscream.com/true-crime" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Best True Crime 2026 — Reviews & Picks",
          "url": "https://streamandscream.com/true-crime",
          "description": "The best true crime of 2026 — honest reviews of the docs and series everyone's talking about, including true crime like The Crash.",
          "mainEntity": {
            "@type": "ItemList",
            "itemListOrder": "https://schema.org/ItemListOrderDescending",
            "numberOfItems": (loaderData ?? []).length,
            "itemListElement": (loaderData ?? []).slice(0, 30).map((p: any, i: number) => ({
              "@type": "ListItem",
              "position": i + 1,
              "url": `https://streamandscream.com/post/${p.slug}`,
              "name": p.title,
            })),
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is the best true crime to watch in 2026?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Our running verdict on the best true crime of 2026 lives on The Scream — updated as new docs and series drop, with honest ratings out of 10.",
              },
            },
            {
              "@type": "Question",
              "name": "What should I watch if I liked true crime like The Crash?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "If you loved The Crash, browse The Scream for more slow-burn true crime picks with the same twisty, character-driven energy. Start with our review of The Crash, then work through the list below.",
              },
            },
            {
              "@type": "Question",
              "name": "What shows are like A Toxic Love Story?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "If you're looking for shows like A Toxic Love Story, try Mr & Mrs Murder, The Trial of Karen Read, and Unknown Number: The High School Catfish — all reviewed on The Scream. Read our full A Toxic Love Story verdict at https://streamandscream.com/post/a-toxic-love-story.",
              },
            },
          ],
        }),
      },
    ],
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

  const updateSort = (value: "newest" | "highest_score" | "lowest_score" | "") => {
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
        <h2 className="font-display text-2xl mt-6">Best True Crime of 2026</h2>
        <div className="mt-3 max-w-2xl text-muted-foreground">
          Looking for the best true crime 2026 has to offer? The Scream is our running verdict on the year's most talked-about docs and series — from ice-cold cases to buzzy dramatizations. Love true crime like <a href="/post/the-crash" className="underline hover:no-underline">The Crash</a>? You're in the right place. Hunting for <a href="/post/a-toxic-love-story" className="underline hover:no-underline">shows like A Toxic Love Story</a>? Start with our verdict, then follow the twists.
        </div>


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
