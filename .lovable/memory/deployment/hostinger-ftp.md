---
name: Hostinger FTP deploy gotchas
description: Rules for the GitHub Actions FTP deploy to Hostinger (403 causes, lftp mirror syntax, chrooted web root)
type: feature
---
Live site streamandscream.com is a static build deployed to Hostinger over FTPS by `.github/workflows/deploy.yml`.

- The FTP account is chrooted: its login root IS the web root. `DEPLOY_DIR=/`. Never use absolute paths like `/domains/.../public_html/`.
- lftp `mirror --reverse dist/client/ /` recreates `dist/client` INSIDE the web root, which makes the site 403 at `/`. Always `lcd dist/client;` then `mirror --reverse ... . '/'`.
- Exclusions must be anchored (`^index\.html$`), otherwise every nested prerendered `index.html` is skipped and post pages 404.
- Symptom map: `/` 403 + everything else 404 = the web root is missing index.html/.htaccess (upload landed in the wrong folder).
- New published posts only appear live after a deploy. The GitHub workflow runs every 15 minutes as a safety net, while immediate admin publishing can dispatch it sooner when configured.
- Canonical public page URLs, generated links, and sitemap entries use trailing slashes. Deployment must verify a slashed post URL returns 200 without following redirects and appears in the live sitemap.
