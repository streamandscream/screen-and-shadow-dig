import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PosterOrbit } from "@/components/PosterOrbit";
import { listPublishedShortlists } from "@/lib/shortlists.public";

const shortlistQuery = queryOptions({ queryKey: ["shortlists", "published"], queryFn: listPublishedShortlists });

export const Route = createFileRoute("/shortlist/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(shortlistQuery),
  head: () => ({
    meta: [
      { title: "The Shortlist — Top 5 TV & Movie Picks | Stream & Scream" },
      { name: "description", content: "Five sharp picks at a time: what to watch next, seasonal favourites, and the best TV and movies for every mood." },
      { property: "og:title", content: "The Shortlist — Top 5 TV & Movie Picks" },
      { property: "og:description", content: "Five sharp picks at a time, curated by Stream & Scream." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://streamandscream.com/shortlist/" }],
  }),
  errorComponent: ({ error }) => <p className="p-10">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: ShortlistIndex,
});

function ShortlistIndex() {
  const { data } = useSuspenseQuery(shortlistQuery);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12 w-full flex-1">
        <h1 className="font-display text-[40px] border-b-2 border-foreground pb-4">The Shortlist</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Five picks. No filler. What to watch next, seasonal favourites, and the titles worth making time for.</p>
        <section className="mt-10 flex flex-col gap-12">
          {data.length ? data.map((list) => (
            <article key={list.id} className="border-b border-foreground/20 pb-10">
              <Link to="/shortlist/$slug/" params={{ slug: list.slug }} className="block">
                <PosterOrbit title={list.title} anchor={list.anchor} picks={list.items.map((item) => item.post)} coverUrl={list.cover_url} linked={false} />
                <span className="card-eyebrow mt-4 block">The Shortlist · Top 5</span>
                <h2 className="card-title-lg mt-2">{list.title}</h2>
              </Link>
              <p className="card-excerpt-lg mt-3">{list.excerpt}</p>
            </article>
          )) : <p className="text-muted-foreground">The first shortlist is being assembled.</p>}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}