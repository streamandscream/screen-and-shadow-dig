# Go live on Hostinger via GitHub Actions

The "API key" being requested is the Supabase publishable (anon) key that the build workflow needs as a GitHub repository secret. It is a public key — safe to store as a repo secret and safe to ship in the built site. No private/service key is needed anywhere.

## What to add in GitHub

Repo → Settings → Secrets and variables → Actions → New repository secret.

Supabase (values below are already in the project's `.env`, all public):

| Secret | Value |
| --- | --- |
| `SUPABASE_URL` | `https://ocdthsxwhhatspgmjtwe.supabase.co` |
| `SUPABASE_ANON_KEY` | the publishable key from `.env` (`VITE_SUPABASE_PUBLISHABLE_KEY`) |
| `VITE_SUPABASE_URL` | same URL as above |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | same publishable key |
| `VITE_SUPABASE_PROJECT_ID` | `ocdthsxwhhatspgmjtwe` |
| `VITE_GA_MEASUREMENT_ID` | your real GA4 ID (currently a placeholder in `.env`) |

Hostinger FTP (from hPanel → Files → FTP Accounts):

| Secret | Value |
| --- | --- |
| `FTP_SERVER` | FTP hostname, e.g. `ftp.streamandscream.com` |
| `FTP_USERNAME` | FTP account username |
| `FTP_PASSWORD` | FTP account password |

## Changes to make in the project

1. Reduce the secret list: have the connection-check step fall back to `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` so only one pair of Supabase secrets is required instead of two duplicated pairs.
2. Add a clearer failure message naming the exact missing secret, so a misnamed secret is obvious in the Actions log.
3. Verify the built output: confirm `bun run build:static` emits `dist/client/index.html`, hashed assets, `.htaccess`, `robots.txt`, `llms.txt`, and `sitemap.xml` — the FTP step uploads `dist/client/` to `/public_html/`.
4. Confirm the prerender step can reach Supabase during the build (post pages are generated from the `posts` table), otherwise only the shell pages are prerendered.

## Going live

1. Add the secrets above.
2. Push to `main` (or run the workflow manually via "Run workflow") to trigger deploy.
3. Point the `streamandscream.com` DNS at Hostinger and confirm SSL is issued in hPanel.
4. Load the site, click through `/tv`, `/true-crime`, `/tv-news`, a post page, and a hard refresh on a deep link to confirm `.htaccess` routing works (no 403/404).

## Technical notes

- Nothing secret ships in the bundle: the publishable key is protected by row-level security, which is already configured.
- `dangerous-clean-slate: false` means old files are left in place; if a stale `index.html` or asset lingers after the first deploy, it can be cleared manually in hPanel File Manager.
- Admin routes (`/admin`, `/auth`) are excluded from prerendering and served by the SPA shell — they will still work on Hostinger.
