import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { searchPosts } from "@/lib/posts.functions";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // Debounce query
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 200);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["header-search", debounced],
    queryFn: () => searchPosts({ data: { q: debounced } }),
    enabled: debounced.length >= 2 && menuOpen,
    staleTime: 30_000,
  });

  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const navLinks = [
    { to: "/", label: "Home", exact: true },
    { to: "/tv", label: "The Stream" },
    { to: "/true-crime", label: "The Scream" },
    { to: "/tv-news", label: "TV News" },
    ...(signedIn ? [{ to: "/admin" as const, label: "Admin" }] : []),
    
  ];

  const closeMenu = () => {
    setMenuOpen(false);
    setQuery("");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate({ to: "/search", search: { q, tag: "", streamer: "" } });
    closeMenu();
  };

  const topResults = results.slice(0, 6);

  return (
    <header className="border-b-2 border-foreground bg-background">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between py-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          <span>{today}</span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              className="p-1 -mr-1"
            >
              {menuOpen ? <X size={20} strokeWidth={2.5} /> : <Menu size={20} strokeWidth={2.5} />}
            </button>
            {menuOpen && (
              <nav className="absolute right-0 top-full mt-2 w-72 border border-foreground/80 bg-background py-3 text-sm uppercase tracking-widest font-display shadow-lg z-50">
                <form onSubmit={submitSearch} className="px-4 pb-3 border-b border-foreground/20 mb-3">
                  <div className="flex items-center border border-foreground/60 bg-background">
                    <Search size={14} className="ml-2 text-muted-foreground" />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search shows..."
                      className="flex-1 bg-transparent px-2 py-2 text-xs tracking-normal normal-case text-foreground placeholder:text-muted-foreground outline-none font-sans"
                    />
                  </div>
                  {debounced.length >= 2 && (
                    <div className="mt-2 max-h-72 overflow-y-auto">
                      {isFetching && topResults.length === 0 ? (
                        <p className="text-[11px] normal-case tracking-normal text-muted-foreground py-2 font-sans">Searching…</p>
                      ) : topResults.length === 0 ? (
                        <p className="text-[11px] normal-case tracking-normal text-muted-foreground py-2 font-sans">No matches</p>
                      ) : (
                        <ul className="flex flex-col">
                          {topResults.map((p) => (
                            <li key={p.id}>
                              <Link
                                to="/post/$slug"
                                params={{ slug: p.slug }}
                                onClick={closeMenu}
                                className="block py-1.5 text-xs normal-case tracking-normal font-sans text-foreground hover:text-accent-red"
                              >
                                {p.title}
                              </Link>
                            </li>
                          ))}
                          {results.length > topResults.length && (
                            <li>
                              <button
                                type="submit"
                                className="mt-1 text-[11px] uppercase tracking-widest text-accent-red underline"
                              >
                                See all {results.length} results
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  )}
                </form>
                <div className="flex flex-col items-start gap-3 px-4">
                  {navLinks.map((link) => (
                    <Link
                      key={link.to}
                      to={link.to}
                      activeOptions={link.exact ? { exact: true } : undefined}
                      activeProps={{ className: "underline underline-offset-4" }}
                      onClick={closeMenu}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </nav>
            )}
          </div>
        </div>
        <div className="rule" />
        <div className="py-6 text-center">
          <Link to="/" className="inline-block">
            <h1 className="font-display text-5xl md:text-7xl tracking-tight lowercase">stream & scream</h1>
          </Link>
        </div>
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
