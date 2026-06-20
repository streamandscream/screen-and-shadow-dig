## Allow half-point ratings (e.g. 7.5)

### Database
- Migration to change `public.posts.rating` from `int` to `numeric(3,1)`, with a CHECK constraint enforcing values between 1 and 10 in 0.5 increments.

### Server validators (`src/lib/posts.functions.ts`)
- Replace `z.number().int().min(1).max(10)` with `z.number().min(1).max(10).multipleOf(0.5)` for `rating` in `PostInput`.
- Same change for `minRating` / `maxRating` in `listPublishedPosts`.

### Admin form (`admin.$id.edit.tsx`)
- Change the rating input to `step={0.5}` and update the label to "The Verdict (1–10, 0.5 steps)".
- Keep `Number(e.target.value)` (no `parseInt`).

### Display
- `PostCard.tsx` and `post.$slug.tsx` already render `{post.rating}/10`, which works for decimals — no change needed.

### Filters (`tv.tsx` / `true-crime.tsx` / `search.tsx`)
- No code change required if rating sliders use whole numbers; half-step ratings still match `gte`/`lte` correctly. (If you want the slider itself to step by 0.5, say so and I'll update it.)
