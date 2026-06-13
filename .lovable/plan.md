# Link recommendations to existing posts

Right now "Your next binge" titles in `src/routes/post.$slug.tsx` are plain text. When a title matches another published post (by title), render it as a link to that post; otherwise keep it as plain text.

## Approach

1. Add a server fn `getPostsByTitles(titles: string[])` in `src/lib/posts.functions.ts` that returns `[{ title, slug }]` for any published posts whose title matches (case-insensitive) one of the input titles.
2. In `src/routes/post.$slug.tsx`, when a post has `next_binge`, also load that lookup via TanStack Query (keyed by the titles array) and render each binge item as a `<Link to="/post/$slug">` when a match exists, otherwise plain text (current styling preserved, arrow prefix kept).
3. No schema change. Matching is purely by post title string.

## Notes / open question

- Match is exact (case-insensitive, trimmed). Fuzzy matching ("The Bear" vs "The Bear (Season 2)") is out of scope unless you want it.
- Should this also apply elsewhere (e.g. tags)? Current scope is only the "Your next binge" list on the post page.
