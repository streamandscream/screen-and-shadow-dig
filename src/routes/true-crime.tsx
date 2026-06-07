import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.functions";

const q = queryOptions({
  queryKey: ["posts", "true_crime"],
  queryFn: () => listPublishedPosts({ data: { section: "true_crime" } }),
});

export const Route = createFileRoute("/true-crime")({
  head: () => ({ meta: [
    { title: "True Crime Documentaries — Bold News" },
    { name: "description", content: "Deep dives into true crime documentaries: The Nightmare Upstairs, Mean Girl Murders, A Plan to Kill, and more." },
    { property: "og:title", content: "True Crime Documentaries — Bold News" },
    { property: "og:description", content: "Deep dives into true crime documentaries." },
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
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">True Crime Documentaries</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">Anatomy of the cases that gripped a nation. Long reads on the documentaries worth watching with the lights on.</p>
        <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
          {data.map((p) => <PostCard key={p.id} post={p} />)}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
