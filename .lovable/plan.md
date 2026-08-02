## Goal

Produce a plain static build (`dist/`) with `index.html` at the root, relative asset paths, and an Apache `.htaccess`, so GitHub → Hostinger deployment works with no Node server and no 403/routing errors.

## Important trade-off (please read)

The site currently runs server-side: server functions in `src/lib/*.functions.ts` (posts, tags, TMDB fetch, analytics, SEO ping, subscribers, TV-news ingestion), a webhook route under `src/routes/api/public/`, and a server-generated `sitemap.xml`. Apache shared hosting cannot run any of that. Going static means those must be re-implemented client-side or dropped. What survives and how:

- Public reads (posts, tags, search, TV news) → move to direct browser calls to the backend using the public anon key, protected by the existing row-level policies.
- Admin (login, create/edit/delete, image upload, scheduling) → keep working, but as browser-side calls with the logged-in session. Anything that relied on admin-only server privileges (delete bypass, TMDB key, SEO ping, ingestion webhook) will not work on Hostinger.
- TMDB fetch + TV-news ingestion + SEO ping + outbound-click logging → these need a secret key or a server. They get removed from the static build; ingestion would have to be triggered elsewhere (e.g. a scheduled backend job) if you still want it.
- SSR-rendered meta tags → replaced by build-time generated static pages for existing posts plus client-side meta updates. Search-engine previews for brand-new posts added after a build will not appear until the next build/deploy.

## Plan

1. **Switch the build to static output**
   - Configure the build to emit a fully static site into `dist/` with no server bundle, and set the asset base to relative (`./`) so files resolve from any web root.
   - Verify `dist/index.html` exists at the top level and that `dist/assets/*` are referenced relatively.

2. **Remove the server dependency from public pages**
   - Replace loader calls into `*.functions.ts` with direct browser data fetching for: home, `/tv`, `/true-crime`, `/post/$slug`, `/tag/$tag`, `/search`, `/tv-news`.
   - Delete or neutralise routes that cannot exist statically: `src/routes/api/public/*`, any server-only route handlers.

3. **Static SEO artefacts**
   - Generate `sitemap.xml`, `robots.txt`, and `llms.txt` into `dist/` at build time from the live post list, using the `streamandscream.com` base URL.
   - Prerender each existing post/category page to its own `index.html` so crawlers get real title/description/JSON-LD, with the SPA taking over on hydration.

4. **Apache routing + permissions**
   - Add `public/.htaccess` with: SPA fallback (rewrite non-file, non-directory requests to `/index.html`), directory index set to `index.html`, `Options -Indexes`, correct MIME/compression/cache headers for `.js`, `.css`, `.webmanifest`, and no `Require all denied` leftovers.
   - This addresses the 403: it currently happens because the web root has no `index.html` to serve.

5. **GitHub → Hostinger deploy**
   - Add a GitHub Actions workflow that installs, builds, and publishes only the contents of `dist/` (not the repo source) to the Hostinger web root via FTP/SSH deploy, using repository secrets for credentials.
   - Ensure the deployed root contains `index.html`, `.htaccess`, `assets/`, and the generated SEO files — nothing else.

6. **Verify**
   - Build locally, serve `dist/` and check: root loads, a deep link like `/post/<slug>` loads on refresh, assets return 200, `sitemap.xml` and `robots.txt` are reachable.

## Technical notes

- Admin pages will be client-rendered only and excluded from prerender/sitemap.
- The anon/publishable backend key is safe in the client bundle; the service-role key and TMDB key must never ship — hence those features are dropped rather than ported.
- Content changes made in the admin UI will show immediately for visitors (data is fetched live), but prerendered HTML and the sitemap only refresh on the next build/deploy.
