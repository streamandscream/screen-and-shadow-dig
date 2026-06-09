import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { PostCard } from "@/components/PostCard";
import { searchPosts } from "@/lib/posts.functions";

const searchQuery = (q: string) =>
  queryOptions({
    queryKey: ["posts", "search", q],
    queryFn: () => searchPosts({ data: { q } }),
  });

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  head: () => ({
    meta: [
      { title: "Search — Bold News" },
      { name: "description", content: "Search Bold News for TV recommendations and true crime documentaries." },
    ],
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context, deps }) => {
    if (deps.q) {
      return context.queryClient.ensureQueryData(searchQuery(deps.q));
    }
    return [];
  },
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: SearchPage,
});

function SearchPage() {
  const { q } = useSearch({ from: "/search" });
  const navigate = useNavigate({ from: "/search" });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newQ = String(formData.get("q") ?? "").trim();
    navigate({ search: { q: newQ } });
  };

  const { data: results } = useSuspenseQuery(searchQuery(q));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <p className="eyebrow text-accent-red">Search</p>
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">Find a show</h1>

        <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
          <div className="flex border-2 border-foreground">
            <input
              name="q"
              type="text"
              defaultValue={q}
              placeholder="Search titles, streamers, tags..."
              className="flex-1 bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              type="submit"
              className="border-l-2 border-foreground bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-primary-foreground hover:bg-foreground/90 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {q && (
          <section className="mt-10">
            <p className="eyebrow text-muted-foreground mb-6">
              {results.length} result{results.length !== 1 ? "s" : ""} for “{q}”
            </p>
            {results.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
                {results.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No shows found. Try a different keyword.</p>
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
