import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostBody } from "@/components/PostBody";
import { WhereToWatchLink } from "@/components/PostCard";
import { getPostBySlug, getPostsByTitles } from "@/lib/posts.functions";

const postQuery = (slug: string) => queryOptions({
  queryKey: ["post", slug],
  queryFn: () => getPostBySlug({ data: { slug } }),
});

const bingeLinksQuery = (titles: string[]) => queryOptions({
  queryKey: ["binge-links", [...titles].sort()],
  queryFn: () => getPostsByTitles({ data: { titles } }),
  enabled: titles.length > 0,
  staleTime: 5 * 60 * 1000,
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
  const bingeTitles: string[] = post?.next_binge ?? [];
  const { data: bingeLinks } = useQuery(bingeLinksQuery(bingeTitles));
  const linkMap = new Map((bingeLinks ?? []).map((b) => [b.title.toLowerCase().trim(), b.slug]));
  if (!post) return null;
  const sectionLabel = post.section === "tv" ? "The Stream" : "The Scream";
  const sectionTo = post.section === "tv" ? "/tv" : "/true-crime";
  const date = new Date(post.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 w-full flex-1">
        <Link to={sectionTo} className="eyebrow text-accent-red">{sectionLabel}</Link>
        <h1 className="font-display text-5xl md:text-6xl mt-3">{post.title}</h1>
        {post.cover_url && (
          <figure className="mt-6">
            <img
              src={post.cover_url}
              alt={post.title}
              className="block max-h-[70vh] w-auto max-w-full h-auto object-contain"
            />
            <figcaption className="mt-1 text-[10px] text-muted-foreground">Image courtesy of TMDB. Used under license.</figcaption>
          </figure>
        )}
        {(post as any).vibe && (
          <blockquote className="mt-8 border-l-4 border-accent-red pl-5">
            <p className="font-display text-3xl md:text-4xl italic leading-tight">“{(post as any).vibe}”</p>
          </blockquote>
        )}
        <WhereToWatchLink post={post as any} className="mt-8 inline-block border border-foreground px-5 py-3 font-display uppercase tracking-widest text-sm hover:bg-foreground hover:text-background transition-colors" />
        <div className="mt-8">
          <PostBody>{post.body}</PostBody>
        </div>
        {post.rating != null && (
          <div className="mt-10 border-t-2 border-foreground pt-6">
            <p className="eyebrow text-accent-red">The verdict</p>
            <p className="font-sans text-[17px] mt-2">
              {post.rating}/10
            </p>
          </div>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className={post.rating != null ? "mt-4" : "mt-10 border-t-2 border-foreground pt-6"}>
            <p className="eyebrow text-accent-red">Tags</p>
            <p className="text-sm md:text-base leading-snug">
              {post.tags.map((t: string, i: number) => (
                <span key={t}>
                  {i > 0 && " "}
                  <Link to="/tag/$tag" params={{ tag: t }} className="hover:underline hover:text-accent-red active:text-accent-red transition-colors">
                    #{t}
                  </Link>
                </span>
              ))}
            </p>
          </div>
        )}
        {post.next_binge && post.next_binge.length > 0 ? (
          <aside className="mt-12 border-t-2 border-foreground pt-6 space-y-6">
            {post.next_binge && post.next_binge.length > 0 && (
              <div>
                <p className="eyebrow text-accent-red">Your next binge if you loved {post.title}</p>
                <ul className="mt-2 space-y-1">
                  {post.next_binge.map((title: string) => {
                    const matchSlug = linkMap.get(title.toLowerCase().trim());
                    return (
                      <li key={title} className="font-display text-xl">
                        →{" "}
                        {matchSlug ? (
                          <Link to="/post/$slug" params={{ slug: matchSlug }} className="underline hover:text-accent-red">
                            {title}
                          </Link>
                        ) : (
                          title
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </aside>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}

