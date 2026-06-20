# Single-column post layout

Yes — responsive horizontal cards on web, stacked vertical on mobile.

## 1. New `HorizontalPostCard` in `src/components/PostCard.tsx`
Add a new exported component (keep existing `PostCard` intact for any other usages):

- Mobile: vertical (poster on top, text below) — same as current `PostCard`.
- `sm:` and up: 2-column row — poster on left (~fixed width, e.g. `sm:w-48 md:w-56`, aspect `2/3`), text block on right (title, eyebrow, full excerpt, streamer + verdict, optional Where-to-watch).
- Use `grid sm:grid-cols-[12rem_minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)] gap-6` with `min-w-0` on the text column so long titles/excerpts truncate cleanly.
- Reuse `WhereToWatchLink` and the existing `card-*` typography classes (no design token changes).

## 2. `src/routes/index.tsx` (home)
- Remove the two-column `grid md:grid-cols-2` wrapper.
- Combine `tv` + `tc` posts into a single list sorted by newest first (the loader already returns newest first from `listPublishedPosts`; just merge and re-sort by `published_at` desc — or fetch with no section filter).
- Render as a single vertical stack of `HorizontalPostCard`s.
- Drop the per-section headers + "See all" links (since it's now one merged feed). The site header nav still links to `/tv` and `/true-crime`.
- Also remove the stray trailing `.` after the `tv.map(...)` block (existing bug).

## 3. `src/routes/tv.tsx` and `src/routes/true-crime.tsx`
- Replace `section className="mt-10 grid md:grid-cols-2 lg:grid-cols-3 gap-10"` with a single-column stack: `section className="mt-10 flex flex-col gap-8 divide-y divide-foreground/20"` (or just `gap-10`).
- Swap `<PostCard>` for `<HorizontalPostCard>`. Keep the `showWhereToWatch` prop behavior (off on /tv, on on /true-crime).

## Technical notes
- No data/API changes. No new dependencies.
- `PostCardData` type unchanged.
- The home loader currently passes `sections: ["tv", "true_crime"], limit: 6`. To honor "newest first across both", I'll keep that call and sort the combined array by `published_at` client-side (the field already exists on returned rows; if not, I'll add it to the select in `listPublishedPosts`).
