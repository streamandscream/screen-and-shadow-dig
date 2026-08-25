# Order posts by publish date, not draft creation date

Right now every list (home, The Stream, The Scream, tags, search, sitemap) sorts by the date the draft row was created, so a review drafted months ago jumps to the top the day you publish it. The site has no stored "published date" at all — the existing `publish_at` field is only used for scheduling and is empty on all 84 published posts.

## What changes

- Add a real **published date** to every post.
- Set it automatically the moment a post flips from draft to published (and clear it if it's unpublished again).
- Backfill the 84 already-published posts from their last-edited date, which is when they were flipped live.
- Sort every public list newest-published first, falling back to the created date for anything without one.
- Show and mark up the published date on post pages (visible date line + Article/Review structured data), instead of the creation date.
- Show the published date in the editor dashboard list so the ordering is clear there too.

## Technical notes

- Migration: `ALTER TABLE public.posts ADD COLUMN published_at timestamptz`; trigger on insert/update that sets `published_at = now()` when `published` becomes true and it is null, and nulls it when `published` becomes false.
- Data backfill (`run_sql`): `UPDATE public.posts SET published_at = COALESCE(publish_at, updated_at, created_at) WHERE published AND published_at IS NULL`.
- `src/lib/posts.public.ts`: add `published_at` to `POST_COLS` and `PublicPost`; replace `.order("created_at", …)` with `.order("published_at", { ascending: false, nullsFirst: false })` then `.order("created_at", …)` as a tiebreaker in `listPublishedPosts`, `listPostsByTag`, `searchPosts`.
- `src/routes/sitemap[.]xml.ts`: order by `published_at.desc.nullslast,created_at.desc`.
- `src/routes/post.$slug.tsx`: displayed date and `datePublished` use `published_at ?? created_at`; `dateModified` stays `updated_at`.
- `src/lib/posts.admin.ts` / dashboard: keep admin list on `created_at` ordering but surface the published date column.
