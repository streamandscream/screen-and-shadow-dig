## Goal
Target two SEO keywords — **"best true crime 2026"** and **"true crime like the crash"** — with the `/true-crime` landing page as the ranking target.

## Approach
Google ranks a landing page for a query when the page's title, description, H1, visible copy, and structured data all reinforce that query. Right now `/true-crime` is titled "The Scream — True Crime Documentary Reviews" with a generic intro. We'll rework the on-page SEO of that single route so both keywords are naturally represented, without changing site structure or business logic.

## Changes to `src/routes/true-crime.tsx`

1. **Title tag** (≤60 chars):
   `Best True Crime 2026 — Reviews & Picks | The Scream`

2. **Meta description** (≤160 chars):
   `The best true crime of 2026 — honest reviews of the docs and series everyone's talking about, including true crime like The Crash. Updated weekly.`

3. **og:title / og:description / twitter:\*** — mirror the above.

4. **Visible copy under H1** — replace the current intro with a short paragraph that naturally uses both phrases, e.g.:
   *"Looking for the best true crime 2026 has to offer? The Scream is our running verdict on the year's most talked-about docs and series — from ice-cold cases to buzzy dramatizations. Love true crime like The Crash? You're in the right place."*

5. **H1** stays `The Scream` (brand), but we add an H2 immediately below: `Best True Crime of 2026` so the keyword lives in a heading.

6. **JSON-LD** — extend the existing `CollectionPage` with a `description` matching the new meta and add a `FAQPage` block answering:
   - "What is the best true crime to watch in 2026?"
   - "What should I watch if I liked The Crash?"
   Each answer links/refers to reviews on the page, reinforcing topical relevance.

7. **Internal linking** — add a small inline line under the intro: "New here? Start with [The Crash review] or browse every pick below." linking to the existing Crash post (if slug exists) to strengthen the "like The Crash" association.

## Out of scope
- No new routes, no new posts, no schema/DB changes.
- No changes to `/tv`, home, or post detail pages.
- Sitemap already includes `/true-crime`; no change needed.

## Note on ranking
On-page SEO gets you eligible to rank; actual ranking for "best true crime 2026" is competitive and will also depend on fresh posts and backlinks over time. This change is the prerequisite.
