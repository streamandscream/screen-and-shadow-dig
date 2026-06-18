import { createFileRoute, useSearch, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { listTvNews, type TvNewsStatus } from "@/lib/tv-news.functions";

const STATUSES: { value: "" | TvNewsStatus; label: string }[] = [
  { value: "", label: "All" },
  { value: "renewed", label: "Renewed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "ended", label: "Ended" },
];

const newsQuery = (status: "" | TvNewsStatus) =>
  queryOptions({
    queryKey: ["tv-news", status],
    queryFn: () => listTvNews({ data: status ? { status } : undefined }),
  });

export const Route = createFileRoute("/tv-news")({
  validateSearch: (search: Record<string, unknown>): { status: "" | TvNewsStatus } => {
    const s = search.status;
    if (s === "renewed" || s === "cancelled" || s === "ended") return { status: s };
    return { status: "" };
  },
  head: () => ({
    meta: [
      { title: "TV News — Cancelled & Renewed | Bold News" },
      { name: "description", content: "Track which TV shows have been renewed, cancelled, or ended. Up-to-date industry news." },
      { property: "og:title", content: "TV News — Cancelled & Renewed | Bold News" },
      { property: "og:description", content: "Track which TV shows have been renewed, cancelled, or ended." },
    ],
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(newsQuery(deps.status)),
  errorComponent: ({ error }) => <p className="p-10">{error.message}</p>,
  notFoundComponent: () => <p className="p-10">Not found</p>,
  component: TvNewsPage,
});

const statusStyles: Record<TvNewsStatus, string> = {
  renewed: "bg-foreground text-background",
  cancelled: "bg-accent-red text-background",
  ended: "bg-paper text-foreground border border-foreground",
  other: "bg-paper text-foreground border border-foreground",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function TvNewsPage() {
  const { status } = useSearch({ from: "/tv-news" });
  const navigate = useNavigate({ from: "/tv-news" });
  const { data: items } = useSuspenseQuery(newsQuery(status));

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-12 w-full flex-1">
        <p className="eyebrow text-accent-red">Industry Wire</p>
        <h1 className="font-display text-6xl mt-2 border-b-2 border-foreground pb-4">
          TV News: Cancelled & Renewed
        </h1>
        <div className="mt-8 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => navigate({ search: { status: s.value } })}
              className={
                "px-4 py-2 text-xs uppercase tracking-widest font-display border-2 border-foreground transition-colors " +
                (status === s.value
                  ? "bg-foreground text-background"
                  : "bg-background text-foreground hover:bg-paper")
              }
            >
              {s.label}
            </button>
          ))}
        </div>

        <section className="mt-10">
          {items.length === 0 ? (
            <p className="text-muted-foreground">No news yet. The ingestion job will populate this feed shortly.</p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {items.map((item) => {
                const rest = item.show_title && item.title.includes(":")
                  ? item.title.slice(item.title.indexOf(":") + 1).trim()
                  : item.title;
                return (
                  <li key={item.id} className="py-5">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid grid-cols-[120px_1fr] gap-4 items-start group"
                    >
                      <div className="aspect-video bg-paper overflow-hidden border border-border">
                        {item.image_url ? (
                          <img src={item.image_url} alt="" loading="lazy" className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        {item.status !== "other" && (
                          <span
                            className={
                              "inline-block mb-1 px-2 py-0.5 text-[10px] uppercase tracking-widest font-display " +
                              statusStyles[item.status]
                            }
                          >
                            {item.status}
                          </span>
                        )}
                        <h2 className="font-display text-lg leading-snug group-hover:underline underline-offset-4">
                          {item.show_title ? (
                            <>
                              <em>{item.show_title}:</em> {rest}
                            </>
                          ) : (
                            item.title
                          )}
                        </h2>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.published_at)}</p>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-10 text-xs text-muted-foreground">
          News items link to original sources. Bold News does not republish full articles.{" "}
          <Link to="/" className="underline">Back to home</Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
