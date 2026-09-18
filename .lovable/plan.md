# Replace post sharing with social icon row

Remove the existing Share buttons and add a single social-sharing row at the bottom of every published post and draft preview.

## What will change
- Remove the Share button beside “Where to watch”.
- Replace the bottom Share button with four circular icons styled like the reference: Pinterest, X, Facebook, and Instagram.
- Pinterest, X, and Facebook open their standard sharing pages for the current review.
- Instagram copies the review link, briefly confirms it was copied, then opens Instagram for manual pasting.
- Keep accessible labels and keyboard focus states while matching the site’s editorial styling.

## Technical details
- Refactor the existing share component into the fixed four-icon row using Lucide icons where available and a simple X glyph.
- Keep canonical trailing-slash review URLs and existing title, description, and cover-image sharing data.
- Apply this through the shared post page so it covers published reviews and draft previews without backend changes.
