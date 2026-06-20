import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { HorizontalPostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.functions";

const homePostsQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { sections: ["tv", "true_crime"], limit: 12 } }),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homePostsQuery),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Home,
});

function Home() {
  const { data: posts } = useSuspenseQuery(homePostsQuery);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12 w-full flex-1">
        <div className="flex flex-col gap-10">
          {posts.map((p) => (
            <HorizontalPostCard key={p.id} post={p} showWhereToWatch={p.section === "true_crime"} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
