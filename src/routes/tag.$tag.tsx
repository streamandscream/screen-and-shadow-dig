import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostCard } from "@/components/PostCard";
import { listPostsByTag } from "@/lib/posts.functions";

const tagQuery = (tag: string) =>
  queryOptions({
    queryKey: ["posts", "tag", tag],
    queryFn: () => listPostsByTag({ data: { tag } }),
  });

export const Route = createFileRoute("/tag/$tag")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(tagQuery(params.tag)),
  head: ({ params }) => {
    const url = `https://streamandscream.com/tag/${encodeURIComponent(params.tag)}`;
    const image = "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png";
    return {
      meta: [
        { title: `#${params.tag} — Stream & Scream` },
        { name: "description", content: `Every Stream & Scream review tagged #${params.tag} — reviews, verdicts, and where to watch.` },
        { property: "og:title", content: `#${params.tag} — Stream & Scream` },
        { property: "og:description", content: `Every Stream & Scream review tagged #${params.tag}.` },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: image },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `#${params.tag} — Stream & Scream` },
        { name: "twitter:description", content: `Every Stream & Scream review tagged #${params.tag}.` },
        { name: "twitter:image", content: image },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Page,
});

function Page() {
  const { tag } = Route.useParams();
  const { data } = useSuspenseQuery(tagQuery(tag));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <p className="eyebrow text-accent-red">Tag</p>
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">#{tag}</h1>
        <p className="mt-4 text-muted-foreground">Every post tagged #{tag}, newest first.</p>

        {data.length === 0 ? (
          <p className="mt-10">
            No posts tagged #{tag} yet.{" "}
            <Link to="/" className="underline">Back to home</Link>
          </p>
        ) : (
          <section className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {data.map((p) => <PostCard key={p.id} post={p} />)}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
