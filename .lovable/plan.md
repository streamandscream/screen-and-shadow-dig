# Restructure post page + shorten sample reviews

## New post page layout (src/routes/post.$slug.tsx)

Reorder and simplify the article page so every post follows this exact flow:

1. **Section eyebrow** (The Stream / The Scream) + **Title** (H1)
2. **Cover image**
3. **Quote / one-liner** — the existing `vibe` field, styled as a pull quote (large, italic, accent-red rule)
4. **Where to watch** — JustWatch button
5. **Short review body** — plain paragraphs only, no H2 subheadings
6. **Our favourite episode** (Stream only, if present)
7. **Your next binge if you loved [title]** — 2–3 linked picks

Remove from the page:
- The excerpt paragraph under the title (the vibe replaces it as the hook)
- The date / streamer / rating / tags metadata strip
- Any H2 rendering inside `PostBody` — switch the markdown renderer to strip/flatten headings so older bodies with `##` sections render as plain paragraphs (keeps existing data safe while enforcing the new look)

## Shorten Dahmer and Lioness as examples

Rewrite both review bodies to ~3 short paragraphs, no subheadings, no bullet lists. Tight critic voice, ending on a verdict line. Update via a data change to `posts.body` for slugs `dahmer` and `special-ops-lioness`. Leave all other posts untouched for now — these two are the template the rest will follow later.

## Out of scope (this step)

- Bulk-regenerating the other 60+ Stream bodies (next step, once you approve the Dahmer/Lioness shape)
- Editing the admin editor
- Any True Crime (`/the-scream`) layout changes beyond the shared post page (it already uses the same route, so it inherits the new layout automatically)

## Technical notes

- `PostBody` currently renders markdown as-is. Add a `remark` step (or simple component override) so `h1`–`h6` render as `<p class="font-display ...">` or are demoted to plain paragraphs, ensuring no subheadings appear even if old markdown contains `##`.
- Vibe block moves above "Where to watch" and grows in visual weight (larger display type, accent rule).
- Two `supabase--insert` UPDATE statements for the Dahmer + Lioness bodies.
