## Summary
Add a section-specific "← Back to" link at the bottom of every post detail page, placed after the "Your next binge" section (or after tags if no binge links exist).

## What changes
1. In `src/routes/post.$slug.tsx`, insert a `<Link>` near the bottom of `<main>` that uses the existing `sectionLabel` and `sectionTo` variables.

## Why this works
The post page already derives the correct section label and route:
- `section === "tv"` → label "The Stream", path `/tv`
- otherwise → label "The Scream", path `/true-crime`

Reusing those variables keeps the link consistent with the section breadcrumb already shown at the top of the page.

## Design
- Text: `← Back to { data`
- Style: eyebrow text, red accent, underline on hover—matching the existing section breadcrumb at the top of the post.
- Placement: after the "Your next binge" block (or after tags/rating if no binge block), with appropriate top margin (`mt-12`) and a border-top separator to visually close the article before the footer.