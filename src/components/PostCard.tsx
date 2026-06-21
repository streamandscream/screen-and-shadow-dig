import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getJustWatchAffiliate } from "@/lib/settings.functions";
import { buildJustWatchUrl } from "@/lib/justwatch";

export type PostCardData = {
  slug: string;
  section: "tv" | "true_crime";
  title: string;
  excerpt: string;
  cover_url: string | null;
  streamer: string | null;
  rating: number | null;
  tags: string[];
  justwatch_slug?: string | null;
  justwatch_type?: string | null;
  justwatch_country?: string | null;
};

const label = (s: string) => (s === "tv" ? "The Stream" : "The Scream");

function useAffiliateTemplate() {
  const getFn = useServerFn(getJustWatchAffiliate);
  return useQuery({
    queryKey: ["site-setting", "justwatch_affiliate"],
    queryFn: () => getFn(),
    staleTime: 5 * 60 * 1000,
  });
}

export function WhereToWatchLink({ post, className }: { post: PostCardData; className?: string }) {
  const { data: template } = useAffiliateTemplate();
  const url = buildJustWatchUrl(post, template);
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={
        className ??
        "mt-3 inline-block border border-foreground px-3 py-2 font-display uppercase tracking-widest text-xs hover:bg-foreground hover:text-background transition-colors"
      }
    >
      Where to watch →
    </a>
  );
}

export function FeatureCard({ post }: { post: PostCardData }) {
  return (
    <article className="grid md:grid-cols-2 gap-8 border-b-2 border-foreground pb-10">
      <div>
        <Link to="/post/$slug" params={{ slug: post.slug }} className="block overflow-hidden bg-paper aspect-[2/3] md:aspect-[3/4]">
          {post.cover_url && (
            <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover object-top" loading="lazy" />
          )}
        </Link>
        {post.cover_url && <p className="card-credit mt-1">Image courtesy of TMDB. Used under license.</p>}
      </div>
      <div className="flex flex-col justify-center">
        <span className="card-eyebrow">{label(post.section)}</span>
        <Link to="/post/$slug" params={{ slug: post.slug }}>
          <h2 className="card-title-lg mt-3">{post.title}</h2>
        </Link>
        <p className="card-excerpt-lg mt-4">{post.excerpt}</p>
        <div className="card-meta mt-4 flex items-center gap-3">
          {post.streamer && <span>{post.streamer}</span>}
          {post.rating != null && <span>· The Verdict: {post.rating}/10</span>}
        </div>
      </div>
    </article>
  );
}

export function PostCard({ post, showWhereToWatch = true }: { post: PostCardData; showWhereToWatch?: boolean }) {
  return (
    <article className="flex flex-col">
      <Link to="/post/$slug" params={{ slug: post.slug }} className="block overflow-hidden bg-paper aspect-[2/3]">
        {post.cover_url && (
          <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover object-top" loading="lazy" />
        )}
      </Link>
      {post.cover_url && <p className="card-credit mt-1">Image courtesy of TMDB. Used under license.</p>}
      <span className="card-eyebrow mt-3">{label(post.section)}</span>
      <Link to="/post/$slug" params={{ slug: post.slug }}>
        <h3 className="card-title-sm mt-2">{post.title}</h3>
      </Link>
      <p className="card-excerpt-sm mt-2 line-clamp-3">{post.excerpt}</p>
      <div className="card-meta mt-2">
        {post.streamer}{post.rating != null && ` · The Verdict: ${post.rating}/10`}
      </div>
      {showWhereToWatch && <WhereToWatchLink post={post} />}
    </article>
  );
}

export function HorizontalPostCard({ post, showWhereToWatch = true }: { post: PostCardData; showWhereToWatch?: boolean }) {
  return (
    <article className="grid grid-cols-1 sm:grid-cols-[12rem_minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)] gap-6 border-b border-foreground/20 pb-8">
      <div>
        <Link to="/post/$slug" params={{ slug: post.slug }} className="block overflow-hidden bg-paper aspect-[2/3]">
          {post.cover_url && (
            <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover object-top" loading="lazy" />
          )}
        </Link>
        {post.cover_url && <p className="card-credit mt-1">Image courtesy of TMDB. Used under license.</p>}
      </div>
      <div className="min-w-0 flex flex-col">
        <span className="card-eyebrow">{label(post.section)}</span>
        <Link to="/post/$slug" params={{ slug: post.slug }}>
          <h3 className="card-title-lg mt-2">{post.title}</h3>
        </Link>
        <p className="card-excerpt-sm mt-3">{post.excerpt}</p>
        <div className="card-meta mt-3">
          {post.streamer}{post.rating != null && ` · The Verdict: ${post.rating}/10`}
        </div>
        {showWhereToWatch && <WhereToWatchLink post={post} />}
      </div>
    </article>
  );
}
