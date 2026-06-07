import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.functions";

const q = queryOptions({
  queryKey: ["posts", "tv"],
  queryFn: () => listPublishedPosts({ data: { section: "tv" } }),
});

export const Route = createFileRoute("/tv")({
  head: () => ({ meta: [
    { title: "TV Recommendations — Bold News" },
    { name: "description", content: "Reviews and recommendations on prestige TV: The Diplomat, Lioness, Vladimir, The Beast in Me, and more." },
    { property: "og:title", content: "TV Recommendations — Bold News" },
    { property: "og:description", content: "Reviews and recommendations on prestige TV." },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(q),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(q);
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <p className="eyebrow text-accent-red">Section</p>
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">TV Recommendations</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Prestige drama, sharp thrillers, and slow burns worth your evening. Honest takes on what's actually worth watching.</p>
        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {data.map((p) => <PostCard key={p.id} post={p} />)}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
