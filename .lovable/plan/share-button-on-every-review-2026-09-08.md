# Share button on every review

Add a share control to each post page so readers can pass a review along by message, Pinterest, email, or social media.

## What readers will see

- A **Share** button on every review, placed just below the "Where to watch" button (and repeated near the bottom next to "Back to…" so it's reachable after finishing the review).
- On phones, tapping it opens the device's built-in share sheet (Messages, WhatsApp, Instagram, etc. — whatever they have installed) via the Web Share API.
- On desktop, or if the native sheet isn't available, a small menu opens with:
  - **Copy link** (with a "Link copied" confirmation)
  - **Pinterest** — shares the post URL with the cover image and title as the description
  - **Email** — opens their mail app with the review title as subject and a link in the body
  - **Facebook**, **X (Twitter)**, **WhatsApp** — standard share URLs, each opening in a new tab
- Shared text uses the review title and the post's SEO description.

## Technical details

- New `src/components/ShareButton.tsx`: `navigator.share()` when `navigator.canShare` supports it, otherwise a dropdown menu (click-outside / Escape to close). Pure client component, no backend changes.
- Pinterest share URL: `https://pinterest.com/pin/create/button/?url=…&media=…&description=…` using the post's absolute URL and cover image.
- Share URLs are built from `https://streamandscream.com/post/<slug>` (with trailing slash, matching the live canonical URLs).
- Wire into `src/routes/post.$slug.tsx` in the two placements above.
- Style matches the existing editorial look: bordered uppercase display-font button, same hover treatment as "Where to watch".
- Because the live site is static, the change goes live on the next deploy (Publish live button or the GitHub workflow).
