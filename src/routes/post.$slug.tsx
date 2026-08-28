import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostBody } from "@/components/PostBody";
import { WhereToWatchLink } from "@/components/PostCard";
import { getPostBySlug, getPostsByTitles, buildQuickAnswers } from "@/lib/posts.public";

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
  head: ({ params, loaderData }) => {
    const url = `https://streamandscream.com/post/${params.slug}`;
    if (!loaderData) {
      return { meta: [{ title: "Not found — Stream & Scream" }, { name: "robots", content: "noindex" }] };
    }
    const image = loaderData.cover_url;
    const description = (loaderData as any).meta_description?.trim() || `${loaderData.excerpt} Read our spoiler-free review and find shows like it.`;
    // Structured data must be plain text: strip markdown syntax from the body.
    const plainBody = loaderData.body
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^>\s?/gm, "")
      .replace(/[*_`]+/g, "")
      .replace(/\s*\n\s*\n\s*/g, " ")
      .replace(/\s*\n\s*/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
    const ratingText = loaderData.rating != null
      ? ` (${String(loaderData.rating).replace(/\.0$/, "")}/10)`
      : "";
    const baseTitle = /review/i.test(loaderData.title) ? loaderData.title : `${loaderData.title} Review`;
    const withQuestion = `${baseTitle}: Is It Worth Watching?${ratingText} — Stream & Scream`;
    const seoTitle = withQuestion.length <= 60 ? withQuestion : `${baseTitle}${ratingText} — Stream & Scream`;
    const socialTitle = /review/i.test(loaderData.title)
      ? `${loaderData.title}${ratingText}`
      : `${loaderData.title} Review${ratingText}`;
    const sectionName = loaderData.section === "tv" ? "The Stream" : "The Scream";
    return {
      meta: [
        { title: seoTitle },
        { name: "description", content: description },
        { property: "og:site_name", content: "Stream & Scream" },
        { property: "og:title", content: socialTitle },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:locale", content: "en_GB" },
        { property: "article:section", content: sectionName },
        ...((loaderData.tags ?? []).map((t: string) => ({ property: "article:tag", content: t }))),
        ...(image ? [{ property: "og:image", content: image }, { property: "og:image:alt", content: `${loaderData.title} poster art` }] : []),
        { name: "twitter:card", content: image ? "summary_large_image" : "summary" },
        { name: "twitter:title", content: socialTitle },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }, { name: "twitter:image:alt", content: `${loaderData.title} poster art` }] : []),
      ],

      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            "name": /review/i.test(loaderData.title) ? loaderData.title : `${loaderData.title} review`,
            "description": description,
            "reviewBody": plainBody.length > 1200
              ? `${plainBody.slice(0, 1200).trimEnd()}…`
              : plainBody,



            "url": url,
            ...(image ? { "image": image, "thumbnailUrl": image } : {}),
            "datePublished": (loaderData as any).published_at ?? loaderData.created_at,
            "dateModified": (loaderData as any).updated_at ?? loaderData.created_at,
            "inLanguage": "en",
            "author": {
              "@type": "Organization",
              "name": "Stream & Scream",
              "url": "https://streamandscream.com",
            },
            "publisher": {
              "@type": "Organization",
              "name": "Stream & Scream",
              "url": "https://streamandscream.com",
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": url },
            "itemReviewed": {
              "@type": "TVSeries",
              "name": loaderData.title,
              ...(image ? { "image": image } : {}),
              ...(loaderData.tags && loaderData.tags.length ? { "genre": loaderData.tags } : {}),
              ...((loaderData as any).streamer ? {
                "potentialAction": {
                  "@type": "WatchAction",
                  "target": (loaderData as any).streamer_url ?? url,
                  "expectsAcceptanceOf": {
                    "@type": "Offer",
                    "category": "subscription",
                    "seller": { "@type": "Organization", "name": (loaderData as any).streamer },
                  },
                },
              } : {}),
            },
            ...(loaderData.rating != null
              ? {
                  "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": loaderData.rating,
                    "bestRating": 10,
                    "worstRating": 0,
                  },
                }
              : {}),
            ...(loaderData.tags && loaderData.tags.length
              ? { "keywords": loaderData.tags.join(", ") }
              : {}),

          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": loaderData.title,
            "description": description,
            "url": url,
            ...(image ? { "image": image } : {}),
            "datePublished": (loaderData as any).published_at ?? loaderData.created_at,
            "dateModified": (loaderData as any).updated_at ?? loaderData.created_at,
            "inLanguage": "en-GB",
            "author": {
              "@type": "Organization",
              "name": "Stream & Scream",
              "url": "https://streamandscream.com",
            },
            "publisher": {
              "@type": "Organization",
              "name": "Stream & Scream",
              "url": "https://streamandscream.com",
            },
            "mainEntityOfPage": { "@type": "WebPage", "@id": url },
            ...(loaderData.tags && loaderData.tags.length
              ? { "keywords": loaderData.tags.join(", ") }
              : {}),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://streamandscream.com/" },
              {
                "@type": "ListItem",
                "position": 2,
                "name": loaderData.section === "tv" ? "The Stream" : "The Scream",
                "item": loaderData.section === "tv" ? "https://streamandscream.com/tv" : "https://streamandscream.com/true-crime",
              },
              { "@type": "ListItem", "position": 3, "name": loaderData.title, "item": url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": buildQuickAnswers(loaderData as any).map((qa) => ({
              "@type": "Question",
              "name": qa.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": qa.answer,
              },
            })),
          }),
        },
      ],
    };
  },
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
  const quickAnswers = buildQuickAnswers(post as any);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12 w-full flex-1">
        <Link to={sectionTo} className="eyebrow text-accent-red">{sectionLabel}</Link>
        <h1 className="font-display text-[30px] md:text-[50px] mt-3">{post.title}</h1>
        {post.cover_url && (
          <figure className="mt-6">
            <img
              src={post.cover_url}
              alt={post.cover_alt || `${post.title} poster art`}
              className="block max-h-[70vh] w-auto max-w-full h-auto object-contain"
            />
            <figcaption className="mt-1 text-[10px] text-muted-foreground">Image courtesy of TMDB. Used under license.</figcaption>
          </figure>
        )}
        {(post as any).vibe && (
          <blockquote className="mt-8 border-l-4 border-accent-red pl-5">
            <p className="font-display text-[28px] md:text-4xl italic leading-tight">“{(post as any).vibe}”</p>
          </blockquote>
        )}
        <WhereToWatchLink post={post as any} className="mt-8 inline-block border border-foreground px-5 py-3 font-display uppercase tracking-widest text-sm hover:bg-foreground hover:text-background transition-colors" />
        <div className="mt-8">
          <PostBody>{post.body}</PostBody>
        </div>

        <section className="mt-10 border-t-2 border-foreground pt-6" aria-labelledby="quick-answers-heading">
          <h2 id="quick-answers-heading" className="eyebrow text-accent-red m-0">What to know before you watch</h2>
          <dl className="mt-6 space-y-6">
            {quickAnswers.map((qa) => (
              <div key={qa.question}>
                <dt><h3 className="font-display text-lg md:text-xl">{qa.question}</h3></dt>
                <dd className="font-sans text-[17px] leading-snug mt-2 text-muted-foreground">
                {qa.question.startsWith("What should I watch after")
                    ? renderAfterAnswer(qa.answer, post.next_binge, linkMap, post.slug)
                    : qa.question.startsWith("Where can I watch")
                      ? renderWatchAnswer(qa.answer, post as any)
                      : qa.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {post.rating != null && (
          <div className="mt-10 border-t-2 border-foreground pt-6">
            <h2 className="eyebrow text-accent-red m-0">The verdict</h2>
            <p className="font-sans mt-2">
              {post.rating}/10
            </p>
          </div>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className={post.rating != null ? "mt-4" : "mt-10 border-t-2 border-foreground pt-6"}>
            <h2 className="eyebrow text-accent-red m-0">Tags</h2>
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
          <aside className="mt-12 border-t-2 border-foreground pt-6">
            <h2 className="eyebrow text-accent-red m-0">More like this</h2>
            <p className="font-sans text-[17px] leading-snug mt-2">
              If you loved {post.title}, try{" "}
              {post.next_binge.map((title: string, i: number) => {
                const matchSlug = linkMap.get(title.toLowerCase().trim());
                const isLast = i === post.next_binge.length - 1;
                return (
                  <span key={title}>
                    {matchSlug ? (
                      <Link to="/post/$slug" params={{ slug: matchSlug }} className="underline underline-offset-4 decoration-foreground/30 hover:decoration-accent-red hover:text-accent-red transition-colors">
                        {title}
                      </Link>
                    ) : (
                      <span>{title}</span>
                    )}
                    {post.next_binge.length > 1 && i === post.next_binge.length - 2 ? " and " : isLast ? "" : ", "}
                  </span>
                );
              })}.
              See <Link to="/shows-like/$slug" params={{ slug: post.slug }} className="underline hover:text-accent-red transition-colors">more shows like {post.title}</Link>.
            </p>
          </aside>
        ) : null}

        <div className="mt-12 border-t-2 border-foreground pt-6">
          <Link to={sectionTo} className="eyebrow text-accent-red hover:underline">
            ← Back to {sectionLabel}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function renderAfterAnswer(answer: string, nextBinge: string[], linkMap: Map<string, string>, postSlug: string) {
  if (!nextBinge.length) return answer;
  return (
    <>
      Try{" "}
      {nextBinge.map((title: string, i: number) => {
        const matchSlug = linkMap.get(title.toLowerCase().trim());
        const isLast = i === nextBinge.length - 1;
        return (
          <span key={title}>
            {matchSlug ? (
              <Link to="/post/$slug" params={{ slug: matchSlug }} className="underline underline-offset-4 decoration-foreground/30 hover:decoration-accent-red hover:text-accent-red transition-colors">
                {title}
              </Link>
            ) : (
              <span>{title}</span>
            )}
            {nextBinge.length > 1 && i === nextBinge.length - 2 ? " and " : isLast ? "" : ", "}
          </span>
        );
      })}.
      {" "}See <Link to="/shows-like/$slug" params={{ slug: postSlug }} className="underline hover:text-accent-red transition-colors">more shows like this</Link>.
    </>
  );
}

function renderWatchAnswer(answer: string, post: any) {
  return (
    <>
      {answer}{" "}
      <WhereToWatchLink post={post} className="underline hover:text-accent-red transition-colors" />
    </>
  );
}

