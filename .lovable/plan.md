# Rank for "shows like X" searches

Goal: capture searches like "shows like The Traitors" or "shows similar to A Toxic Love Story" and land those people on a real Stream & Scream page.

## The idea

Every published review gets a companion page:

`/shows-like/<show-slug>` — e.g. `/shows-like/a-toxic-love-story`

Each page answers the exact query a person typed: "if you loved X, watch these". It is built from data you already keep in the admin form (the "next binge" recommendations, tags, section and ratings), so there is no new writing chore per post unless you want one.

## What each page contains

- H1: "Shows Like <Title>" with a one-paragraph intro explaining why people who loved it will like the picks.
- A ranked list of 4-8 matches, each with poster, verdict score, one-line "why it's a match", and a link to the full review.
- Matching logic, in order: the post's existing "next binge" entries that exist on the site, then same-section posts sharing the most tags, then highest-rated in the same section as filler.
- A short "Where to watch" mention where the streamer is known.
- Link back to the source review and to the section hub (The Stream / The Scream).

## SEO wiring

- Title: `Shows Like <Title> — 7 Similar Series to Watch Next | Stream & Scream`
- Meta description naming the show plus two of the top matches.
- Self-referencing canonical and og:url, og:image reusing the show's cover.
- JSON-LD: `ItemList` of the recommendations + `BreadcrumbList`.
- Also targets "shows similar to X" and "what to watch after X" through the intro copy and an on-page FAQ block (`FAQPage` schema) answering "What should I watch after <Title>?" and "Is <Title> worth watching?".

## Discovery

- Each review page gets a prominent link: "Shows like <Title> →" placed near the existing recommendations block.
- The new pages are added to `sitemap.xml` (priority 0.6) and to the static prerender page list in `vite.config.ts`, so they ship as real HTML on Hostinger rather than SPA-only routes.
- `llms.txt` gets a line describing the new section.

## Scope

Start with published posts only, and only where at least 3 sensible matches can be assembled — thin pages hurt more than they help. On the current catalogue that is roughly the full published set.

## Technical notes

- New route `src/routes/shows-like.$slug.tsx`, loading through the existing browser-safe `listPublishedPosts` / `getPostBySlug` helpers in `src/lib/posts.public.ts` (no new server functions, keeps the static build working).
- New helper `buildSimilarPosts(post, allPosts)` in `src/lib/posts.public.ts` implementing the ranking rules above, plus the "why it's a match" string from shared tags/section.
- `vite.config.ts`: extend the existing `getPostPages()` fetch to also emit `/shows-like/<slug>` paths; the prerender filter stays as-is.
- `src/routes/sitemap[.]xml.ts`: add the same slugs as a third entry group.
- Reuses `HorizontalPostCard` and the existing typography scale — no new visual style.
