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
      <Link to="/post/$slug" params={{ slug: post.slug }} className="block overflow-hidden bg-paper">
        {post.cover_url && (
          <>
            <img src={post.cover_url} alt={post.title} className="w-full h-72 md:h-96 object-cover" loading="lazy" />
            <p className="mt-1 text-[10px] text-muted-foreground">Image courtesy of TMDB. Used under license.</p>
          </>
        )}
      </Link>
      <div className="flex flex-col justify-center">
        <span className="eyebrow text-accent-red">{label(post.section)}</span>
        <Link to="/post/$slug" params={{ slug: post.slug }}>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">{post.title}</h2>
        </Link>
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>
        <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-widest text-muted-foreground">
          {post.streamer && <span>{post.streamer}</span>}
          {post.rating != null && <span>· The Verdict: {post.rating}/10</span>}
        </div>
        <WhereToWatchLink post={post} />
      </div>
    </article>
  );
}

export function PostCard({ post, showWhereToWatch = true }: { post: PostCardData; showWhereToWatch?: boolean }) {
  return (
    <article className="flex flex-col">
      <Link to="/post/$slug" params={{ slug: post.slug }} className="block overflow-hidden bg-paper">
        {post.cover_url && (
          <>
            <img src={post.cover_url} alt={post.title} className="w-full h-56 object-cover" loading="lazy" />
            <p className="mt-1 text-[10px] text-muted-foreground">Image courtesy of TMDB. Used under license.</p>
          </>
        )}
      </Link>
      <span className="eyebrow mt-3 text-accent-red">{label(post.section)}</span>
      <Link to="/post/$slug" params={{ slug: post.slug }}>
        <h3 className="mt-2 font-display text-2xl">{post.title}</h3>
      </Link>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
      <div className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        {post.streamer}{post.rating != null && ` · The Verdict: ${post.rating}/10`}
      </div>
      {showWhereToWatch && <WhereToWatchLink post={post} />}
    </article>
  );
}
