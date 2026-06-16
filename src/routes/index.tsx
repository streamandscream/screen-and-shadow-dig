import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { FeatureCard, PostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.functions";

const homePostsQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { sections: ["tv", "true_crime"], limit: 6 } }),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(allPostsQuery),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Home,
});

function Home() {
  const { data: posts } = useSuspenseQuery(allPostsQuery);
  const feature = posts[0];
  const next = posts.slice(1, 5);
  const tv = posts.filter((p) => p.section === "tv").slice(0, 3);
  const tc = posts.filter((p) => p.section === "true_crime").slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        {feature ? (
          <>
            <p className="eyebrow text-accent-red mb-4">Lead Story</p>
            <FeatureCard post={feature} />
          </>
        ) : (
          <p className="text-muted-foreground">No posts yet. Sign in to publish the first one.</p>
        )}

        {next.length > 0 && (
          <section className="mt-12 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {next.map((p) => <PostCard key={p.id} post={p} />)}
          </section>
        )}

        <div className="mt-20 grid md:grid-cols-2 gap-12">
          <section>
            <div className="flex items-end justify-between border-b-2 border-foreground pb-2 mb-6">
              <h2 className="font-display text-3xl">The Stream</h2>
              <a href="/tv" className="eyebrow underline">See all</a>
            </div>
            <div className="grid gap-8">
              {tv.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
          <section>
            <div className="flex items-end justify-between border-b-2 border-foreground pb-2 mb-6">
              <h2 className="font-display text-3xl">The Scream</h2>
              <a href="/true-crime" className="eyebrow underline">See all</a>
            </div>
            <div className="grid gap-8">
              {tc.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
