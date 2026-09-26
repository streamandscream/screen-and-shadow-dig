# Move The Girlfriend from The Scream to The Stream

## What happens

One review moves sections: **The Girlfriend** (2025, Prime Video, 7.5/10) leaves The Scream (true crime) and joins **The Stream** (TV). Its web address, rating, cover art, review text, quick answers, tags and recommendations all stay exactly as they are — only the shelf it sits on changes.

Because the review is already live, this also moves it out of the published Scream listing and into the published Stream listing, so the live site needs a rebuild to show the change.

## Steps

1. **Switch the post's section** to TV. Nothing else about the entry is touched.
2. **Confirm the move** by reading the record back, then checking in the browser that:
   - The Stream page now lists The Girlfriend and the Scream page no longer does
   - The review page's breadcrumb and "back to" link read The Stream
   - The Stream admin page lists it
3. **Rebuild and publish the site** (the same "Publish live" control you use today) so the live Stream and Scream pages and the review page's breadcrumb reflect the move.

## Why no code changes are needed

Everything section-related is read from the post itself: page headings, the "back to" link, breadcrumbs, structured data, and which listing page the card appears on. The recommendation links into this review (the `You` page already points at it) keep working, and both reviews are now in the same section, so it will rank as a better match there. The review's tags contain nothing true-crime specific, so tag pages are unaffected. The sitemap is unaffected because the web address does not change.

## Technical details

- `posts.section` for `slug = 'the-girlfriend'` is currently `true_crime` (confirmed by reading the row); it becomes `tv`. This is a data update, not a schema change, so it runs as an update on the existing row rather than a migration.
- Verified current values that stay unchanged: `published = true`, `published_at = 2026-09-26 02:18 UTC`, `rating = 7.5`, `streamer = Prime Video`, `justwatch_type = tv-show`, `next_binge = {You, Love Story, Tell Me Lies}`, tags `{thriller, psychological-thriller, family-drama, mother-son, binge-worthy, chemistry, drama}`. The review body never refers to true crime or The Scream, so no copy needs rewriting.
- No other post's `next_binge` or tags reference this review in a section-dependent way. `You` is already in the TV section, so it stays a valid recommendation.
- One side effect of an existing convention: on the home page, the "where to watch" line is only shown for true-crime cards, so that line will no longer appear on this card's home-page tile. Say the word if you want it shown for Stream cards too — that is a small separate change.
- Live rebuild is required because the site on Hostinger is a pre-built static bundle: the two listing pages and this review page are stored as generated files, and only a new build refreshes them. The preview reflects the change immediately.
