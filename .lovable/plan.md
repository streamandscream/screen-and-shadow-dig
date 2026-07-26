## Goal
Get `streamandscream.com` verified in Google Search Console (GSC) under your connected Google account, then submit `https://streamandscream.com/sitemap.xml` so Google starts crawling.

## Steps

1. **Confirm the GSC connector.** Check `standard_connectors--list_connections` for a linked Google Search Console connection with gateway access. If none is linked, prompt you to connect it before continuing.

2. **Request a META verification token** from Google Site Verification for `https://streamandscream.com/`. Google returns a `<meta name="google-site-verification" content="...">` token string.

3. **Embed the meta tag in the site head.** Add the tag to `src/routes/__root.tsx` inside the `head()` `meta` array so it renders in the server HTML at every URL (including the root). This is the only file change.

4. **Publish the site** so the meta tag is live on `https://streamandscream.com/`. Google can only verify against the deployed production domain, not the preview.

5. **Call Site Verification `webResource` verify** for `https://streamandscream.com/`. On success, the domain is verified for your Google account.

6. **Add the property to Search Console** via `PUT /webmasters/v3/sites/https%3A%2F%2Fstreamandscream.com%2F` so it appears in your GSC property list.

7. **Submit the sitemap** via `PUT /webmasters/v3/sites/https%3A%2F%2Fstreamandscream.com%2F/sitemaps/https%3A%2F%2Fstreamandscream.com%2Fsitemap.xml`.

8. **Report back** with verification status and sitemap submission confirmation.

## Notes
- Requires a publish between step 3 and step 5 — verification fails if the meta tag isn't in the live HTML at `streamandscream.com`.
- The meta tag is harmless to leave in permanently; removing it later would un-verify the property.
- No DB, schema, or route logic changes — only one edit to `src/routes/__root.tsx`.
