import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { HorizontalPostCard } from "@/components/PostCard";
import { listPublishedPosts } from "@/lib/posts.public";

const homePostsQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { sections: ["tv", "true_crime"], limit: 12 } }),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homePostsQuery),
  head: () => ({
    meta: [
      { title: "Stream & Scream — TV Reviews & True Crime Documentary Picks" },
      { name: "description", content: "Sharp, opinionated reviews of TV shows and true crime documentaries. The latest picks from The Stream and The Scream." },
      { property: "og:title", content: "Stream & Scream — TV Reviews & True Crime Documentary Picks" },
      { property: "og:description", content: "Sharp, opinionated reviews of TV shows and true crime documentaries. The latest picks from The Stream and The Scream." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://streamandscream.com/" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Stream & Scream — TV Reviews & True Crime Documentary Picks" },
      { name: "twitter:description", content: "Sharp, opinionated reviews of TV shows and true crime documentaries." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
    ],
    links: [{ rel: "canonical", href: "https://streamandscream.com/" }],
  }),
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
        <h1 className="font-display text-[40px] mb-10 border-b-2 border-foreground pb-4">
          Bold News — Reviews of Prestige TV and True Crime
        </h1>
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
