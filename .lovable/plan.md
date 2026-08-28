# Turn review pages into search-focused answer pages

Goal: each important review page should visibly answer the decision-making searches people type around that show, so Google can match the page to queries like "Is Grace and Frankie worth watching?", "Shows like Grace and Frankie", and "Best Netflix comfort shows".

## The approach

Keep every review on its existing `/post/<slug>` URL. Add a short "Quick answers" block inside the page, just before or after the main review body, that directly answers the most common question-style searches for that title. Then back it with FAQ structured data and cross-links to related pages.

This is visible content with real headings — not hidden metadata or keyword stuffing.

## What each review page will gain

### 1. A "Quick answers" section

A compact block containing 3-5 question/answer pairs, for example for Grace and Frankie:

- **Is Grace and Frankie worth watching?** — Yes, especially if you want a warm, funny show about older women starting over. Rating and short verdict.
- **What is Grace and Frankie about?** — Two women in their 70s become unlikely roommates after their husbands leave them to marry each other.
- **Where can I watch Grace and Frankie in the UK?** — Netflix (or streamer field).
- **Is Grace and Frankie funny or sad?** — Tone summary from vibe + tags.
- **What should I watch after Grace and Frankie?** — Link to `/shows-like/grace-and-frankie`.

These use natural, complete-sentence answers and are styled as part of the article flow. The questions themselves can be real H2/H3 headings for hierarchy and indexability.

### 2. FAQPage JSON-LD

The same Q&A pairs are also emitted as `FAQPage` schema in the page `<head>`, giving Google explicit question/answer pairs to show in "People also ask" and similar surfaces.

### 3. Smarter title and meta description

Existing title format becomes more search-intent friendly where it does not already include key question words. Example:

- Title: `Grace and Frankie Review: Is It Worth Watching? | Stream & Scream`
- Description: `Grace and Frankie is a warm Netflix comedy about two women rebuilding their lives in their 70s. Read our spoiler-free review and find shows like it.`

The change is applied only when it improves clarity; existing strong titles are preserved.

### 4. Internal links to capture broader searches

From each review, link outward to capture broader discovery queries:

- Link to `/shows-like/<slug>` for "shows like X".
- Link to tag pages for key descriptors (e.g. `/tag/netflix`, `/tag/comedy`, `/tag/friendship`) for searches like "best Netflix comfort shows" or "funny shows about friendship".
- Optionally add a short "If you loved this, try..." sentence paragraph linking to the top 3 similar posts, using the existing `next_binge` matches.

## How the answers are generated

Default answers are auto-built from fields that already exist:

- **Is it worth watching?** → rating + verdict tone from `excerpt` / `vibe`.
- **What is it about?** → `excerpt`.
- **Where to watch?** → `streamer` field + JustWatch link.
- **Tone / style** → `tags` + `vibe`.
- **Shows like this** → existing `next_binge` / `shows-like` logic.

For the most important reviews, add two optional admin fields so the answers can be hand-tuned:

- `quick_take` — one-line verdict / worth-watching answer.
- `what_is_it_about` — spoiler-free premise summary.

If these fields are blank, the page falls back to the auto-generated answers.

## SEO wiring

- One H1 per review page stays the show title.
- "Quick answers" section uses H2 heading "What to know before you watch" or similar.
- Each question inside the block uses H3.
- FAQPage schema added to `head()` in `src/routes/post.$slug.tsx`.
- Title/description templates updated in the same file.
- Cross-links use existing tag route and `/shows-like` route.

## Admin changes

- Add `quick_take` (text) and `what_is_it_about` (text) columns to the `posts` table.
- Add matching inputs to the admin editor at `/admin/new` and `/admin/:id/edit`.
- The fields are optional; existing reviews continue working unchanged.

## Out of scope (this round)

- New standalone "best of" collection hub pages (e.g. `/best/netflix-comfort-shows`). Tag pages already cover the same intent. We can add dedicated hubs later if tag pages do not rank.
- Rewriting the full review body. Only the new quick-answer block and metadata are added; the existing sassy review stays intact.

## Files to change

- `src/routes/post.$slug.tsx` — render the quick-answers block, update title/description, add FAQPage schema.
- `src/lib/posts.public.ts` — include new columns in `POST_COLS` / `PublicPost`.
- `src/routes/_authenticated/admin.new.tsx` and `admin.$id.edit.tsx` — add optional fields.
- Supabase migration — add `quick_take` and `what_is_it_about` columns to `posts`.

## Success measure

After deployment, review pages should contain natural answers to common question searches and valid FAQPage schema. The next Google Search Console check can then show whether impression queries start including question phrases like "is X worth watching" and "what is X about".
