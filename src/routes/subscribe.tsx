import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";

export const Route = createFileRoute("/subscribe")({
  component: SubscribePage,
});

function SubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setStatus("success");
      setEmail("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <p className="eyebrow text-muted-foreground">Newsletter</p>
          <h1 className="font-display mt-4 text-4xl md:text-5xl tracking-tight">
            Subscribe to Bold News
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
                className="border-2 border-foreground bg-foreground px-6 py-3 text-sm font-medium uppercase tracking-widest text-background transition-colors hover:bg-background hover:text-foreground"
              >
                Subscribe
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
