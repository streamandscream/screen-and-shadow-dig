import { Link } from "@tanstack/react-router";

export type PostCardData = {
  slug: string;
  section: "tv" | "true_crime";
  title: string;
  excerpt: string;
  cover_url: string | null;
  streamer: string | null;
  rating: number | null;
  tags: string[];
};

const label = (s: string) => (s === "tv" ? "TV Pick" : "True Crime");

export function FeatureCard({ post }: { post: PostCardData }) {
  return (
    <article className="grid md:grid-cols-2 gap-8 border-b-2 border-foreground pb-10">
      <Link to="/post/$slug" params={{ slug: post.slug }} className="block overflow-hidden bg-paper">
        {post.cover_url && (
          <img src={post.cover_url} alt={post.title} className="w-full h-72 md:h-96 object-cover" loading="lazy" />
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
          {post.rating != null && <span>· {"★".repeat(post.rating)}{"☆".repeat(5 - post.rating)}</span>}
        </div>
      </div>
    </article>
  );
}

export function PostCard({ post }: { post: PostCardData }) {
  return (
    <article className="flex flex-col">
      <Link to="/post/$slug" params={{ slug: post.slug }} className="block overflow-hidden bg-paper">
        {post.cover_url && (
          <img src={post.cover_url} alt={post.title} className="w-full h-56 object-cover" loading="lazy" />
        )}
      </Link>
      <span className="eyebrow mt-3 text-accent-red">{label(post.section)}</span>
      <Link to="/post/$slug" params={{ slug: post.slug }}>
        <h3 className="mt-2 font-display text-2xl">{post.title}</h3>
      </Link>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>
      <div className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
        {post.streamer}{post.rating != null && ` · ${"★".repeat(post.rating)}`}
      </div>
    </article>
  );
}
