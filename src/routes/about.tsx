import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — Bold News" },
    { name: "description", content: "About Bold News — sharp reviews on prestige TV and true crime documentaries." },
  ] }),
  component: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16 w-full flex-1">
        <p className="eyebrow text-accent-red">About</p>
        <h1 className="font-display text-5xl mt-2 border-b-2 border-foreground pb-4">The Editorial Desk</h1>
        <div className="prose-article mt-6">
          <p>Bold News is a one-screen-at-a-time blog covering two obsessions: prestige television and true crime documentaries.</p>
          <p>We don't review everything. We review the things that stick — the slow burns, the political thrillers, the documentaries that change how you think about a case. Every piece comes with a verdict, a streamer, and an honest take on whether it's worth your evening.</p>
          <p>No spoilers above the fold. No recap-as-review filler. Just the part you actually want: should you watch it.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});
