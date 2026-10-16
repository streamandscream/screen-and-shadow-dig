import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { HorizontalPostCard } from "@/components/PostCard";
import { listPublishedPosts, type PublicPost } from "@/lib/posts.public";
import { listPublishedShortlists, type Shortlist } from "@/lib/shortlists.public";

const homePostsQuery = queryOptions({
  queryKey: ["posts", "home"],
  queryFn: () => listPublishedPosts({ data: { sections: ["tv", "true_crime"], limit: 12 } }),
});

const homeShortlistsQuery = queryOptions({
  queryKey: ["shortlists", "published"],
  queryFn: listPublishedShortlists,
});

const BASE = "https://streamandscream.com";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(homePostsQuery),
      context.queryClient.ensureQueryData(homeShortlistsQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Stream & Scream — TV Reviews & True Crime Documentary Picks" },
      { name: "description", content: "Stream & Scream is your home for what's worth watching. The Stream spills the tea on TV shows and binge-worthy hits; The Scream digs into true crime, twisted tales and real-life nightmares." },
      { property: "og:title", content: "Stream & Scream — TV Reviews & True Crime Documentary Picks" },
      { property: "og:description", content: "Stream & Scream is your home for what's worth watching. The Stream spills the tea on TV shows and binge-worthy hits; The Scream digs into true crime, twisted tales and real-life nightmares." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://streamandscream.com/" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Stream & Scream — TV Reviews & True Crime Documentary Picks" },
      { name: "twitter:description", content: "Stream & Scream is your home for what's worth watching — TV reviews and true crime documentaries." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
    ],
    links: [{ rel: "canonical", href: "https://streamandscream.com/" }],
  }),
  errorComponent: ({ error }) => <p className="p-10">{error instanceof Error ? error.message : String(error)}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: Home,
});

type FeedItem =
  | { kind: "post"; date: number; post: PublicPost }
  | { kind: "shortlist"; date: number; list: Shortlist };

const ts = (a: string | null, b: string) => new Date(a ?? b).getTime();

function ShortlistCard({ list }: { list: Shortlist }) {
  const raw = list.cover_url ?? list.anchor?.cover_url ?? null;
  const cover = raw && raw.startsWith("/") ? `${BASE}${raw}` : raw;
  return (
    <article className="flex gap-5">
      {cover && (
        <Link to="/shortlist/$slug/" params={{ slug: list.slug }} className="shrink-0">
          <img src={cover} alt={list.cover_alt ?? list.title} loading="lazy" className="w-28 sm:w-36 aspect-square object-cover" />
        </Link>
      )}
      <div className="min-w-0">
        <span className="card-eyebrow block">The Shortlist</span>
        <Link to="/shortlist/$slug/" params={{ slug: list.slug }} className="hover:underline">
          <h2 className="card-title-md mt-1">{list.title}</h2>
        </Link>
        {list.excerpt && <p className="mt-2 text-muted-foreground leading-relaxed">{list.excerpt}</p>}
      </div>
    </article>
  );
}

function Home() {
  const { data: posts } = useSuspenseQuery(homePostsQuery);
  const { data: lists } = useSuspenseQuery(homeShortlistsQuery);

  const feed: FeedItem[] = [
    ...posts.map((post) => ({ kind: "post" as const, date: ts(post.published_at, post.created_at), post })),
    ...lists.map((list) => ({ kind: "shortlist" as const, date: ts(list.published_at, list.created_at), list })),
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-12 w-full flex-1">
        <div className="mb-10 border-b-2 border-foreground pb-6">
          <h2 className="font-display text-[30px] mb-4">
            Welcome to Stream & Scream — your new home for what's worth watching.
          </h2>
          <p className="text-[17px] leading-relaxed mb-3">
            <strong>The Stream</strong> is where we spill the tea on the latest TV shows, binge-worthy hits, guilty pleasures and the ones that have you saying, "just one more episode."
          </p>
          <p className="text-[17px] leading-relaxed mb-3">
            <strong>The Scream</strong> is where things get darker. Expect true-crime documentaries, twisted tales, real-life nightmares and the kind of stories that make you check the locks before bed.
          </p>
          <p className="text-[17px] leading-relaxed font-display">
            Press play. Stay curious. Maybe don't watch alone.
          </p>
        </div>
        <div className="flex flex-col gap-10">
          {feed.map((item) =>
            item.kind === "post" ? (
              <HorizontalPostCard key={item.post.id} post={item.post} showWhereToWatch={item.post.section === "true_crime"} />
            ) : (
              <ShortlistCard key={item.list.id} list={item.list} />
            ),
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
