# Fix Google sitemap discovery for review pages

- Make every review resolve to one canonical trailing-slash URL, redirecting the duplicate slashless version before serving the page.
- Keep sitemap entries on the direct 200 trailing-slash URLs and verify the three named reviews are present under their exact published slugs.
- Deploy the corrected web-server rules, confirm the live response and canonical tags agree, then resubmit the sitemap to Google.

## Technical details

Google currently treats **A Toxic Love Story** as a duplicate because both URL forms load while its declared canonical uses a trailing slash. **The Bear** was fetched successfully but is not yet indexed. **Margo’s Got Money Trouble** is published at `/post/margos-got-money-troubles/` (plural), so checks must use that exact sitemap URL. The Apache rule will redirect only extensionless, slashless routes whose prerendered `index.html` exists; sitemap URLs themselves will remain direct 200 responses.
