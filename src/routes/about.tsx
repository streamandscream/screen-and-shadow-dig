import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Stream & Scream Editorial Desk" },
      { name: "description", content: "About Stream & Scream — sharp, no-spoilers reviews on prestige TV and true crime documentaries." },
      { property: "og:title", content: "About — Stream & Scream Editorial Desk" },
      { property: "og:description", content: "About Stream & Scream — sharp, no-spoilers reviews on prestige TV and true crime documentaries." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://streamandscream.com/about" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "About — Stream & Scream Editorial Desk" },
      { name: "twitter:description", content: "About Stream & Scream — sharp, no-spoilers reviews." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
    ],
    links: [{ rel: "canonical", href: "https://streamandscream.com/about" }],
  }),
  component: () => (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-16 w-full flex-1">
        <p className="eyebrow text-accent-red">About</p>
        <h1 className="font-display text-5xl mt-2 border-b-2 border-foreground pb-4">The Editorial Desk</h1>
        <div className="prose-article mt-6">
          <p>Stream & Scream is a one-screen-at-a-time blog covering two obsessions: prestige television and true crime documentaries.</p>
          <p>We don't review everything. We review the things that stick — the slow burns, the political thrillers, the documentaries that change how you think about a case. Every piece comes with a verdict, a streamer, and an honest take on whether it's worth your evening.</p>
          <p>No spoilers above the fold. No recap-as-review filler. Just the part you actually want: should you watch it.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  ),
});
