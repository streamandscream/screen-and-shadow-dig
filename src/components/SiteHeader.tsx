import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <header className="border-b-2 border-foreground bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between py-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>{today}</span>
          <span>Vol. 1 · The Editorial</span>
        </div>
        <div className="rule" />
        <div className="py-6 text-center">
          <Link to="/" className="inline-block">
            <h1 className="font-display text-5xl md:text-7xl tracking-tight">BOLD NEWS</h1>
            <p className="eyebrow mt-2 text-muted-foreground">The Stream · The Scream</p>
          </Link>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 border-t border-b border-foreground/80 py-3 text-sm uppercase tracking-widest font-display">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "underline underline-offset-4" }}>Home</Link>
          <Link to="/tv" activeProps={{ className: "underline underline-offset-4" }}>The Stream</Link>
          <Link to="/true-crime" activeProps={{ className: "underline underline-offset-4" }}>The Scream</Link>
          <Link to="/tv-news" activeProps={{ className: "underline underline-offset-4" }}>TV News</Link>
          {signedIn && (
            <Link to="/admin" activeProps={{ className: "underline underline-offset-4" }}>Admin</Link>
          )}
          <Link to="/search" activeProps={{ className: "underline underline-offset-4" }} className="flex items-center gap-1">
            <Search size={14} strokeWidth={2.5} />
            <span className="sr-only">Search</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-foreground bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm items-center">
        <p className="font-display text-lg">BOLD NEWS</p>
        <nav className="flex flex-wrap justify-center gap-6 uppercase tracking-widest font-display text-xs">
          <Link to="/">Home</Link>
          <Link to="/tv">The Stream</Link>
          <Link to="/true-crime">The Scream</Link>
          <Link to="/tv-news">TV News</Link>
          <Link to="/subscribe">Subscribe</Link>
        </nav>
        <p className="text-muted-foreground">© {new Date().getFullYear()} Bold News. Reviews on The Stream and The Scream.</p>
      </div>
    </footer>
  );
}
