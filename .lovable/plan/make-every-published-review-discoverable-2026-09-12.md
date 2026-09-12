# Make every published review discoverable

- Make the Hostinger static build stop immediately if it cannot load the complete published-post list, instead of silently producing an incomplete site.
- Validate the finished static output contains one HTML page and one canonical sitemap entry for every published review.
- Strengthen deployment checks so an incomplete build can never replace the working live site.
- Confirm all current published reviews return directly at their canonical trailing-slash URLs, then resubmit the updated sitemap to Google Search Console.

## Technical details

The database remains the source of truth. Scheduled posts become eligible when published, and the existing recurring GitHub deployment rebuilds their page and sitemap. Validation will compare the fetched slug manifest against `dist/client/post/<slug>/index.html` and `sitemap.xml` before any upload begins.
