import { Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { listShortlistsForPost } from "@/lib/shortlists.public";

export const shortlistsForPostQuery = (postId: string) =>
  queryOptions({
    queryKey: ["shortlists-for-post", postId],
    queryFn: () => listShortlistsForPost({ data: { postId } }),
  });

/** Crawlable links from a review to every published Shortlist that features it. */
export function FeaturedShortlists({ postId, className = "" }: { postId: string; className?: string }) {
  const { data: lists } = useSuspenseQuery(shortlistsForPostQuery(postId));
  if (!lists.length) return null;
  return (
    <section className={`border-t-2 border-foreground pt-6 ${className}`} aria-label="Featured in The Shortlist">
      <h2 className="card-eyebrow">Featured in The Shortlist</h2>
      <ul className="mt-3 space-y-4">
        {lists.map((list) => (
          <li key={list.slug}>
            <Link to="/shortlist/$slug/" params={{ slug: list.slug }} className="card-title-md hover:underline">
              {list.title}
            </Link>
            {list.excerpt && <p className="mt-1 text-muted-foreground leading-relaxed">{list.excerpt}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
