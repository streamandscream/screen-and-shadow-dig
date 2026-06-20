# Remove "Our favourite episode" field

Strip the `favourite_episode` field from the database, admin portal, and public post page.

## Database
- Migration: `ALTER TABLE public.posts DROP COLUMN favourite_episode;`

## Server data layer (`src/lib/posts.functions.ts`)
- Remove `favourite_episode` from `POST_COLS` select list.
- Remove it from the upsert input validator and from the update payload mapping.

## Admin portal
- `admin.$id.edit.tsx`: remove the "Our favourite episode" `<Field>` input and the `favourite_episode` key from the save payload.
- `admin.new.tsx`: remove `favourite_episode` from initial form state and from the insert payload.
- `admin.recommendations.tsx`: remove the entire "Our favourite episode" input, its state (`episode`, setter), and the field from the save payload. Update the page subtitle to mention only "Your next binge".

## Public post page (`src/routes/post.$slug.tsx`)
- Remove the favourite-episode block. Simplify the surrounding conditional so the recommendations section renders based on `next_binge` only.

## Notes
Supabase types regenerate after the migration runs, so the code edits land after the column drop is approved.
