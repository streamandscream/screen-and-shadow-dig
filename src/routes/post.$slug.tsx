import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostBody } from "@/components/PostBody";
import { getPostBySlug } from "@/lib/posts.functions";

const postQuery = (slug: string) => queryOptions({
  queryKey: ["post", slug],
  queryFn: () => getPostBySlug({ data: { slug } }),
});

export const Route = createFileRoute("/post/$slug")({
  loader: async ({ context, params }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return post;
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: `${loaderData.title} — Bold News` },
      { name: "description", content: loaderData.excerpt },
      { property: "og:title", content: loaderData.title },
      { property: "og:description", content: loaderData.excerpt },
      ...(loaderData.cover_url ? [{ property: "og:image", content: loaderData.cover_url }] : []),
    ] : [],
  }),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-20 text-center flex-1">
        <h1 className="font-display text-5xl">Story not found</h1>
        <p className="mt-4 text-muted-foreground">That headline doesn't exist (yet).</p>
        <Link to="/" className="eyebrow underline mt-6 inline-block">Back to front page</Link>
      </main>
      <SiteFooter />
    </div>
  ),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  if (!post) return null;
  const sectionLabel = post.section === "tv" ? "TV Pick" : "True Crime";
  const sectionTo = post.section === "tv" ? "/tv" : "/true-crime";
  const date = new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 w-full flex-1">
        <Link to={sectionTo} className="eyebrow text-accent-red">{sectionLabel}</Link>
        <h1 className="font-display text-5xl md:text-6xl mt-3">{post.title}</h1>
        <p className="mt-4 text-xl text-muted-foreground">{post.excerpt}</p>
        <div className="mt-4 flex flex-wrap gap-3 items-center text-xs uppercase tracking-widest text-muted-foreground border-y border-foreground/50 py-3">
          <span>{date}</span>
          {post.streamer && <span>· {post.streamer}</span>}
          {post.rating != null && <span>· {"★".repeat(post.rating)}{"☆".repeat(5 - post.rating)}</span>}
          {post.tags?.length > 0 && <span>· {post.tags.join(", ")}</span>}
        </div>
        {post.cover_url && (
          <>
            <img src={post.cover_url} alt={post.title} className="mt-6 w-full h-[420px] object-cover bg-paper" />
            <p className="mt-1 text-[10px] text-muted-foreground">Image courtesy of TMDB. Used under license.</p>
          </>
        )}
        <div className="mt-8">
          <PostBody>{post.body}</PostBody>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
