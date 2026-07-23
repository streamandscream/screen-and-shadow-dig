import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { subscribeEmail } from "@/lib/subscribers.functions";

export const Route = createFileRoute("/subscribe")({
  head: () => ({
    meta: [
      { title: "Subscribe — Stream & Scream Newsletter" },
      { name: "description", content: "Get the latest Stream & Scream reviews and true crime picks delivered to your inbox." },
      { property: "og:title", content: "Subscribe — Stream & Scream Newsletter" },
      { property: "og:description", content: "Get the latest Stream & Scream reviews and true crime picks delivered to your inbox." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://streamandscream.com/subscribe" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Subscribe — Stream & Scream Newsletter" },
      { name: "twitter:description", content: "Get the latest reviews and picks delivered to your inbox." },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/b0139682-870e-420a-b74e-01fbe6391786/id-preview-4d192517--dad7afb7-252d-48b3-bcc7-2f67eb212463.lovable.app-1784689894793.png" },
    ],
    links: [{ rel: "canonical", href: "https://streamandscream.com/subscribe" }],
  }),
  component: SubscribePage,
});

function SubscribePage() {
  const subscribe = useServerFn(subscribeEmail);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    setStatus("submitting");
    setErrorMsg(null);
    try {
      await subscribe({ data: { email: value, source: "subscribe-page" } });
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="eyebrow text-muted-foreground">Newsletter</p>
          <h1 className="font-display mt-4 text-4xl md:text-5xl tracking-tight">
            Subscribe to Stream & Scream
          </h1>
          <p className="mt-4 text-muted-foreground">
            Get the latest reviews and picks from The Stream and The Scream
            delivered to your inbox.
          </p>

          {status === "success" ? (
            <div className="mt-10 border border-foreground/20 p-8">
              <p className="font-display text-lg">You&apos;re on the list.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Thanks for subscribing. Watch your inbox.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-10 flex flex-col sm:flex-row gap-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="flex-1 border-2 border-foreground bg-transparent px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="border-2 border-foreground bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground disabled:opacity-60"
              >
                {status === "submitting" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
          )}
          {status === "error" && errorMsg && (
            <p className="mt-4 text-sm text-destructive">{errorMsg}</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
