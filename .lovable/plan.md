
## Goal
Show each post's tags on the full post page (under "The Verdict"), styled like the highlighted excerpt line. Tags are clickable and lead to a combined listing of all posts (TV + True Crime) with that tag.

## Changes

### 1. `src/routes/post.$slug.tsx`
Below the existing "Streamer · The Verdict" meta line, render `post.tags` as inline `#tag` links, using the same font/size as the excerpt (e.g. `text-base md:text-lg leading-snug`) with `hover:underline`, separated by spaces. Hidden when `tags` is empty.
Each tag uses `<Link to="/tag/$tag" params={{ tag }}>`.

### 2. New route `src/routes/tag.$tag.tsx` → `/tag/:tag`
- Loader uses TanStack Query (`ensureQueryData` + `useSuspenseQuery`) calling a new public server fn `listPostsByTag({ tag })`.
- Returns published posts from BOTH sections containing the tag, newest first.
- Layout mirrors `true-crime.tsx`: `SiteHeader`, page title `#tag`, subtitle "Posts tagged #tag", responsive `PostCard` grid, `SiteFooter`.
- `head()` sets title/description/og for the tag page.
- Includes `errorComponent` and `notFoundComponent`.

### 3. `src/lib/posts.functions.ts`
Add `listPostsByTag` server fn (no auth middleware, public read) using the existing publishable client pattern. Query: `posts` where `published = true` and `tags @> ARRAY[tag]`, ordered by `published_at desc`, projecting the same columns as `listPublishedPosts`.

### 4. No DB / styling-token / admin changes
- `posts.tags` column and admin tag editor already exist.
- Existing public SELECT policy on `posts` already permits this read.

## Out of scope
- Cards on home/section pages stay unchanged.
- No tag index page, no tag autocomplete.
- The unrelated tv-news date hydration warning is not touched here.
