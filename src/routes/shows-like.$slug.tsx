import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import {
  getPostBySlug,
  listPublishedPosts,
  buildSimilarPosts,
  type PublicPost,
  type SimilarPost,
} from "@/lib/posts.public";

const BASE = "https://streamandscream.com";

const similarQuery = (slug: string) =>
  queryOptions({
    queryKey: ["shows-like", slug],
    queryFn: async () => {
      const [post, all] = await Promise.all([
        getPostBySlug({ data: { slug } }),
        listPublishedPosts(),
      ]);
      if (!post) return null;
      return { post, similar: buildSimilarPosts(post, all) };
    },
  });

type LoaderData = { post: PublicPost; similar: SimilarPost[] };

const sectionLabel = (s: string) => (s === "tv" ? "The Stream" : "The Scream");

/** Plain-text, length-capped copy for JSON-LD values. */
const clean = (v: string | null | undefined, max = 260) => {
  const t = (v ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[*_#>`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
};




export const Route = createFileRoute("/shows-like/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(similarQuery(params.slug));
    if (!data || data.similar.length < 3) throw notFound();
    return data as LoaderData;
  },
  head: ({ params, loaderData }) => {
    const url = `${BASE}/shows-like/${params.slug}`;
    if (!loaderData) {
      return {
        meta: [
          { title: "Unavailable — Stream & Scream" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { post, similar } = loaderData as LoaderData;
    const count = similar.length;
    const top = similar.slice(0, 2).map((s) => s.post.title);
    const title = `Shows Like ${post.title} — ${count} Similar Series to Watch Next | Stream & Scream`;
    const description = `Loved ${post.title}? Here are ${count} similar shows worth your time, including ${top.join(" and ")} — with verdicts and where to watch.`;
    const image = post.cover_url;
    const label = sectionLabel(post.section);
    const sectionUrl = post.section === "tv" ? `${BASE}/tv` : `${BASE}/true-crime`;
    const rated = similar.filter((s) => s.post.rating != null);
    const best = rated.length
      ? rated.reduce((a, b) => ((b.post.rating ?? 0) > (a.post.rating ?? 0) ? b : a))
      : null;
    const streamers = Array.from(
      new Set(similar.map((s) => s.post.streamer).filter((v): v is string => !!v)),
    ).slice(0, 4);
    const publisher = {
      "@type": "Organization",
      "@id": `${BASE}/#organization`,
      name: "Stream & Scream",
      url: `${BASE}/`,
    };

    const faq: Array<{ q: string; a: string }> = [
      {
        q: `What should I watch after ${post.title}?`,
        a: `Start with ${top.join(" or ")}. Both land in the same corner of ${label} as ${post.title}, and we've reviewed every pick on this list.`,
      },
      {
        q: `Is ${post.title} worth watching?`,
        a: clean(
          post.rating != null
            ? `We gave ${post.title} ${post.rating}/10. ${post.excerpt}`
            : post.excerpt,
          320,
        ),
      },
      {
        q: `How many shows like ${post.title} are on this list?`,
        a: `We list ${count} shows like ${post.title}: ${similar.map((s) => s.post.title).join(", ")}. Every one has a full Stream & Scream review.`,
      },
    ];
    if (best?.post.rating != null) {
      faq.push({
        q: `Which show like ${post.title} is rated highest?`,
        a: `${best.post.title} is our highest-rated pick here with ${best.post.rating}/10${best.post.streamer ? `, streaming on ${best.post.streamer}` : ""}. ${clean(best.post.excerpt, 180)}`,
      });
    }
    if (streamers.length) {
      faq.push({
        q: `Where can I stream shows like ${post.title}?`,
        a: `The picks on this page are spread across ${streamers.join(", ")}${post.streamer ? `, while ${post.title} itself streams on ${post.streamer}` : ""}. Each review says where to watch.`,
      });
    }

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:site_name", content: "Stream & Scream" },
        { property: "og:title", content: `Shows Like ${post.title}` },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: `Shows Like ${post.title}` },
        { name: "twitter:description", content: description },
        ...(image ? [{ name: "twitter:image", content: image }] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "CollectionPage",
                "@id": `${url}#webpage`,
                url,
                name: `Shows Like ${post.title}`,
                description: clean(description, 300),
                inLanguage: "en",
                isPartOf: { "@type": "WebSite", "@id": `${BASE}/#website`, name: "Stream & Scream", url: `${BASE}/` },
                publisher,
                ...(image ? { primaryImageOfPage: { "@type": "ImageObject", url: image } } : {}),
                about: {
                  "@type": "TVSeries",
                  name: post.title,
                  url: `${BASE}/post/${post.slug}`,
                  ...(post.cover_url ? { image: post.cover_url } : {}),
                },
                mainEntity: { "@id": `${url}#itemlist` },
                breadcrumb: { "@id": `${url}#breadcrumb` },
              },
              {
                "@type": "ItemList",
                "@id": `${url}#itemlist`,
                name: `Shows like ${post.title}`,
                description: clean(`Ranked list of ${count} shows similar to ${post.title}, reviewed by Stream & Scream.`, 300),
                url,
                numberOfItems: count,
                itemListOrder: "https://schema.org/ItemListOrderDescending",
                itemListElement: similar.map((s, i) => ({
                  "@type": "ListItem",
                  position: i + 1,
                  url: `${BASE}/post/${s.post.slug}`,
                  name: s.post.title,
                  item: {
                    "@type": "TVSeries",
                    "@id": `${BASE}/post/${s.post.slug}#show`,
                    name: s.post.title,
                    url: `${BASE}/post/${s.post.slug}`,
                    description: clean(s.post.excerpt, 300),
                    ...(s.post.cover_url ? { image: s.post.cover_url } : {}),
                    ...(s.post.tags?.length ? { genre: s.post.tags.slice(0, 5) } : {}),
                    ...(s.post.streamer
                      ? {
                          potentialAction: {
                            "@type": "WatchAction",
                            target: `${BASE}/post/${s.post.slug}`,
                            name: `Watch on ${s.post.streamer}`,
                          },
                        }
                      : {}),
                    ...(s.post.rating != null
                      ? {
                          review: {
                            "@type": "Review",
                            name: `${s.post.title} review`,
                            url: `${BASE}/post/${s.post.slug}`,
                            reviewBody: clean(s.post.excerpt, 300),
                            author: { "@type": "Organization", name: "Stream & Scream" },
                            publisher,
                            reviewRating: {
                              "@type": "Rating",
                              ratingValue: s.post.rating,
                              bestRating: 10,
                              worstRating: 0,
                            },
                          },
                        }
                      : {}),
                  },
                })),
              },
              {
                "@type": "BreadcrumbList",
                "@id": `${url}#breadcrumb`,
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
                  { "@type": "ListItem", position: 2, name: label, item: sectionUrl },
                  { "@type": "ListItem", position: 3, name: post.title, item: `${BASE}/post/${post.slug}` },
                  { "@type": "ListItem", position: 4, name: `Shows like ${post.title}`, item: url },
                ],
              },
              {
                "@type": "FAQPage",
                "@id": `${url}#faq`,
                mainEntity: faq.map(({ q, a }) => ({
                  "@type": "Question",
                  name: clean(q, 160),
                  acceptedAnswer: { "@type": "Answer", text: clean(a, 500) },
                })),
              },
            ],
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
        <h1 className="font-display text-5xl">Nothing to match yet</h1>
        <p className="mt-4 text-muted-foreground">We haven't reviewed enough lookalikes for that one.</p>
        <Link to="/" className="eyebrow underline mt-6 inline-block">Back to front page</Link>
      </main>
      <SiteFooter />
    </div>
  ),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(similarQuery(slug));
  if (!data) return null;
  const { post, similar } = data;
  const label = sectionLabel(post.section);
  const sectionTo = post.section === "tv" ? "/tv" : "/true-crime";

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12 w-full flex-1">
        <Link to={sectionTo} className="eyebrow text-accent-red">{label}</Link>
        <h1 className="font-display text-[30px] md:text-[50px] mt-3">Shows Like {post.title}</h1>
        <p className="mt-5 text-[17px] leading-relaxed">
          If <Link to="/post/$slug" params={{ slug: post.slug }} className="underline underline-offset-4 decoration-foreground/30 hover:text-accent-red">{post.title}</Link>
          {post.rating != null ? ` (our verdict: ${post.rating}/10)` : ""} left you scrolling for something similar,
          these {similar.length} picks scratch the same itch. Every one has been watched and reviewed by us — no
          algorithm filler, just what actually comes next.
        </p>
        {post.streamer && (
          <p className="mt-3 text-[17px] leading-relaxed">
            {post.title} streams on {post.streamer}; the picks below are spread across the usual suspects, and each
            review says where to watch.
          </p>
        )}

        <div className="mt-10 flex flex-col gap-8">
          {similar.map((s, i) => (
            <article
              key={s.post.slug}
              className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-6 border-b border-foreground/20 pb-8"
            >
              <div>
                <Link to="/post/$slug" params={{ slug: s.post.slug }} className="block overflow-hidden bg-paper aspect-[2/3]">
                  {s.post.cover_url && (
                    <img src={s.post.cover_url} alt={s.post.title} className="w-full h-full object-cover object-top" loading="lazy" />
                  )}
                </Link>
                {s.post.cover_url && <p className="card-credit mt-1">Image courtesy of TMDB. Used under license.</p>}
              </div>
              <div className="min-w-0">
                <span className="card-eyebrow">{i + 1}. {sectionLabel(s.post.section)}</span>
                <Link to="/post/$slug" params={{ slug: s.post.slug }}>
                  <h2 className="card-title-lg mt-2">{s.post.title}</h2>
                </Link>
                <p className="card-meta mt-2">
                  {s.post.streamer}
                  {s.post.rating != null && `${s.post.streamer ? " · " : ""}The Verdict: ${s.post.rating}/10`}
                </p>
                <p className="mt-3 text-[17px] leading-relaxed">
                  <strong>Why it's a match:</strong> {s.reason}.
                </p>
                <p className="card-excerpt-sm mt-2">{s.post.excerpt}</p>
                <Link
                  to="/post/$slug"
                  params={{ slug: s.post.slug }}
                  className="eyebrow text-accent-red hover:underline mt-3 inline-block"
                >
                  Read the review →
                </Link>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 border-t-2 border-foreground pt-6">
          <h2 className="eyebrow text-accent-red m-0">What should I watch after {post.title}?</h2>
          <p className="mt-2 text-[17px] leading-relaxed">
            Start with {similar.slice(0, 2).map((s) => s.post.title).join(" or ")}. Both sit in the same corner of {label} as {post.title},
            and we've reviewed every title on this page so you're not going in blind.
          </p>
          <h2 className="eyebrow text-accent-red m-0 mt-6">Is {post.title} worth watching?</h2>
          <p className="mt-2 text-[17px] leading-relaxed">
            {post.rating != null ? `We gave it ${post.rating}/10. ` : ""}{post.excerpt}
          </p>
        </section>

        <div className="mt-12 border-t-2 border-foreground pt-6 flex flex-col gap-2">
          <Link to="/post/$slug" params={{ slug: post.slug }} className="eyebrow text-accent-red hover:underline">
            ← Read our {post.title} review
          </Link>
          <Link to={sectionTo} className="eyebrow text-accent-red hover:underline">
            ← Back to {label}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
