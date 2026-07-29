## Goal
Improve semantic structure on post pages by promoting section labels to real headings, without changing their visual size.

## Changes
In `src/routes/post.$slug.tsx`:
- Convert "The Verdict" label to `<h2>`
- Convert "More like this" label to `<h2>`
- Convert "Tags" label to `<h2>`

## Preserving current appearance
Each promoted heading gets utility classes matching its current rendered size/weight/tracking/color (e.g. `text-sm font-semibold uppercase tracking-wide text-muted-foreground` or whatever the current span/div uses), plus `m-0` to neutralize default `h2` margins. Net visual result: identical to today; only the underlying tag changes from `span`/`div` to `h2`.

## Out of scope
- No changes to typography scale in `src/styles.css`
- No changes to `PostBody.tsx` markdown rendering
- No changes to `<h1>` or other pages
