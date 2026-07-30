The `articleSection` error appears because the post page's JSON-LD uses `@type: "Review"`, and `articleSection` is not a valid property on a `Review` schema in Schema.org (it only belongs to `Article` / `NewsArticle`).

Fix:
1. Open `src/routes/post.$slug.tsx`.
2. Remove the line `"articleSection": loaderData.section === "tv" ? "The Stream" : "The Scream",` from the `Review` JSON-LD object.
3. Keep the existing `keywords` field (which is valid on `Review`) and the `BreadcrumbList` schema that already names the section.
4. Verify the build passes and that the page still renders one JSON-LD `Review` block plus one `BreadcrumbList` block.

This keeps the structured data lean and valid without re-adding the duplicate `Article` block we previously removed.
