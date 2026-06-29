import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const navLinks = [
    { to: "/", label: "Home", exact: true },
    { to: "/tv", label: "The Stream" },
    { to: "/true-crime", label: "The Scream" },
    { to: "/tv-news", label: "TV News" },
    ...(signedIn ? [{ to: "/admin" as const, label: "Admin" }] : []),
    { to: "/search", label: "Search" },
  ];

  return (
    <header className="border-b-2 border-foreground bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between py-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>{today}</span>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="p-1 -mr-1"
          >
            {menuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
          </button>
        </div>
        <div className="rule" />
        <div className="py-6 text-center">
          <Link to="/" className="inline-block">
            <h1 className="font-display text-5xl md:text-7xl tracking-tight lowercase">stream & scream</h1>
          </Link>
        </div>
        {menuOpen && (
          <nav className="border-t border-b border-foreground/80 py-4 text-sm uppercase tracking-widest font-display">
            <div className="flex flex-col items-center gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  activeOptions={link.exact ? { exact: true } : undefined}
                  activeProps={{ className: "underline underline-offset-4" }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t-2 border-foreground bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm items-center">
        <p className="font-display text-lg lowercase">stream & scream</p>
        <nav className="flex flex-wrap justify-center gap-6 uppercase tracking-widest font-display text-xs">
          <Link to="/">Home</Link>
          <Link to="/tv">The Stream</Link>
          <Link to="/true-crime">The Scream</Link>
          <Link to="/tv-news">TV News</Link>
          <Link to="/subscribe">Subscribe</Link>
        </nav>
        <p className="text-muted-foreground lowercase">© {new Date().getFullYear()} stream & scream</p>
      </div>
    </footer>
  );
}
