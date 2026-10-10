import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PosterOrbit } from "@/components/PosterOrbit";
import { PostBody } from "@/components/PostBody";
import { ShareButton } from "@/components/ShareButton";
import { getPublishedShortlist } from "@/lib/shortlists.public";

const BASE = "https://streamandscream.com";
const detailQuery = (slug: string) => queryOptions({ queryKey: ["shortlist", slug], queryFn: () => getPublishedShortlist({ data: { slug } }) });

export const Route = createFileRoute("/shortlist/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(detailQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return { meta: [{ title: "Shortlist unavailable — Stream & Scream" }, { name: "robots", content: "noindex" }] };
    const url = `${BASE}/shortlist/${params.slug}/`;
    const description = loaderData.meta_description || loaderData.excerpt;
    const anchorTitle = loaderData.anchor?.title || loaderData.title;
    const streamers = Array.from(
      new Set(loaderData.items.map((i) => i.post.streamer).filter((v): v is string => !!v)),
    );
    const faq: Array<{ q: string; a: string }> = [
      {
        q: `What should I watch after ${anchorTitle}?`,
        a: `Start with ${loaderData.items.slice(0, 2).map((i) => i.post.title).join(" or ")}. Every pick on this list has a full Stream & Scream review with a verdict and where to watch.`,
      },
      {
        q: `Are there shows like ${anchorTitle}?`,
        a: `Yes — this Shortlist gathers ${loaderData.items.length} shows like ${anchorTitle}: ${loaderData.items.map((i) => i.post.title).join(", ")}.`,
      },
      ...(streamers.length
        ? [{ q: `Where can I watch shows like ${anchorTitle}?`, a: `The picks are spread across ${streamers.join(", ")}. Each review says where to watch.` }]
        : []),
    ];
    const rawImage = loaderData.cover_url || loaderData.anchor?.cover_url;
    const image = rawImage?.startsWith("/") ? `${BASE}${rawImage}` : rawImage;
    return {
      meta: [
        { title: `${loaderData.title} | Stream & Scream` },
        { name: "description", content: description },
        { property: "og:title", content: loaderData.title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Article", headline: loaderData.title, description, url, image: image || undefined, datePublished: loaderData.published_at, dateModified: loaderData.updated_at, mainEntity: { "@id": `${url}#list` } },
          { "@type": "ItemList", "@id": `${url}#list`, numberOfItems: loaderData.items.length, itemListElement: loaderData.items.map((item) => ({ "@type": "ListItem", position: item.position, name: item.post.title, url: `${BASE}/post/${item.post.slug}/` })) },
          { "@type": "BreadcrumbList", itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
            { "@type": "ListItem", position: 2, name: "The Shortlist", item: `${BASE}/shortlist/` },
            { "@type": "ListItem", position: 3, name: loaderData.title, item: url },
          ] },
          { "@type": "FAQPage", mainEntity: faq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
        ],
      }) }],
    };
  },
  errorComponent: ({ error }) => <p className="p-10">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p className="p-10">This shortlist is not available.</p>,
  component: ShortlistDetail,
});

function ShortlistDetail() {
  const { slug } = Route.useParams();
  const { data: list } = useSuspenseQuery(detailQuery(slug));
  if (!list) return null;
  const anchorTitle = list.anchor?.title || list.title;
  const streamers = Array.from(
    new Set(list.items.map((i) => i.post.streamer).filter((v): v is string => !!v)),
  );
  const shareImage = list.cover_url || list.anchor?.cover_url;
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12 w-full flex-1">
        <Link to="/shortlist/" className="card-eyebrow">The Shortlist</Link>
        <h1 className="font-display text-[40px] md:text-[59px] mt-3">{list.title}</h1>
        <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{list.excerpt}</p>
        <PosterOrbit title={list.title} anchor={list.anchor} picks={list.items.map((item) => item.post)} coverUrl={list.cover_url} coverAlt={list.cover_alt} className="mt-8" />
        <p className="card-credit mt-1">Poster artwork courtesy of TMDB. Used under license.</p>
        {list.body && <div className="mt-8"><PostBody>{list.body}</PostBody></div>}
        <section className="mt-12" aria-label="Recommendations">
          {list.items.map((item) => (
            <article key={item.id} className="grid grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[9rem_minmax(0,1fr)] gap-5 border-t border-foreground/20 py-8">
              <Link to="/post/$slug/" params={{ slug: item.post.slug }} className="block aspect-[2/3] overflow-hidden bg-paper">
                {item.post.cover_url && <img src={item.post.cover_url} alt={`${item.post.title} poster`} className="h-full w-full object-cover object-top" loading="lazy" />}
              </Link>
              <div className="min-w-0">
                <span className="card-eyebrow">No. {item.position}</span>
                <Link to="/post/$slug/" params={{ slug: item.post.slug }}><h2 className="card-title-md mt-2">{item.post.title}</h2></Link>
                <p className="card-meta mt-2">{item.post.streamer}{item.post.rating != null && `${item.post.streamer ? " · " : ""}${item.post.rating}/10`}</p>
                <p className="mt-3 leading-relaxed">{item.reason}</p>
                <Link to="/post/$slug/" params={{ slug: item.post.slug }} className="card-eyebrow mt-3 inline-block hover:underline">Read the review →</Link>
              </div>
            </article>
          ))}
        </section>
        <section className="mt-12 border-t-2 border-foreground pt-6" aria-label="Quick answers">
          <h2 className="eyebrow text-accent-red m-0">What should I watch after {anchorTitle}?</h2>
          <p className="mt-2 leading-relaxed">
            Start with {list.items.slice(0, 2).map((i) => i.post.title).join(" or ")}. Every pick on this list has a
            full Stream & Scream review with a verdict and where to watch.
          </p>
          <h2 className="eyebrow text-accent-red m-0 mt-6">Are there shows like {anchorTitle}?</h2>
          <p className="mt-2 leading-relaxed">
            Yes — this Shortlist gathers {list.items.length} shows like {anchorTitle}:{" "}
            {list.items.map((i) => i.post.title).join(", ")}.
          </p>
          {streamers.length > 0 && (
            <>
              <h2 className="eyebrow text-accent-red m-0 mt-6">Where can I watch shows like {anchorTitle}?</h2>
              <p className="mt-2 leading-relaxed">
                The picks are spread across {streamers.join(", ")}. Each review says where to watch.
              </p>
            </>
          )}
        </section>
        <div className="mt-8 border-t-2 border-foreground pt-6">
          <Link to="/shortlist/" className="card-eyebrow hover:underline">← Back to The Shortlist</Link>
          <ShareButton title={list.title} description={list.meta_description || list.excerpt} url={`${BASE}/shortlist/${list.slug}/`} image={shareImage} className="mt-8" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}