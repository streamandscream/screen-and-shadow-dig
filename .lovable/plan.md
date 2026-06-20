# Make image crops less aggressive

A hybrid treatment so posters look intentional everywhere and important details (titles, faces) stop getting chopped off.

## What changes

1. **List/grid cards (`PostCard`)** — replace `h-56 object-cover` with a fixed `aspect-[2/3]` box and `object-cover object-top`. Posters keep a uniform card height-by-width, but cropping happens at the bottom (least important area) instead of the middle.

2. **Feature card (`FeatureCard`)** — replace `h-72 md:h-96 object-cover` with `aspect-[2/3] md:aspect-[3/4] object-cover object-top`. Stays visually strong next to the headline column without lopping off faces.

3. **Post detail page (`post.$slug.tsx`)** — the hero image is the moment it should matter, so switch from `h-[420px] object-cover` to a letterboxed full poster: a `bg-paper` container with `aspect-[2/3] max-h-[70vh]` and `object-contain object-center`. Nothing on the official poster gets cut.

4. Keep the TMDB attribution caption in all three places.

## Files

- `src/components/PostCard.tsx` — update `FeatureCard` and `PostCard` image wrappers.
- `src/routes/post.$slug.tsx` — update hero image wrapper.

## Out of scope

No backend, ingestion, or TMDB changes. We're not switching to backdrop images or regenerating covers — purely a presentation tweak.
