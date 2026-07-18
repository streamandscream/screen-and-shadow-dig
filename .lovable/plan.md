## Goal
1. Ship a dynamic `sitemap.xml` covering every public route + all published posts + tags.
2. Give every public page a unique `<title>`, `<meta description>`, canonical link, and matching `og:url`.

## 1. Dynamic sitemap

Create `src/routes/sitemap[.]xml.ts` as a TanStack server route (`/sitemap.xml`). Handler:
- Static entries: `/`, `/about`, `/tv`, `/true-crime`, `/tv-news`, `/subscribe`, `/search`.
- Dynamic entries from `supabaseAdmin` (loaded inside handler):
  - `posts` where `status = 'published'` → `/post/{slug}`, `lastmod` from `updated_at`.
  - Distinct `tags` from published posts → `/tag/{tag}`.
- Skip `/auth` and every `/admin/*` route (private/authenticated).
- Response: `Content-Type: application/xml`, 1h cache.
- `BASE_URL = ""` placeholder + TODO comment (project has no published URL yet, per Lovable sitemap guidance). URLs render as relative `/path`, which crawlers resolve against the request host — stays correct after publish/rename.

## 2. Per-page metadata + canonical

Rules applied to every route:
- Unique `title`, `description`, `og:title`, `og:description`.
- Add `<link rel="canonical" href="/route">` in `links` (leaf routes only — root keeps none, per canonical guidance).
- Add `og:url` meta pointing to the same relative path.
- For `/post/$slug` and `/tag/$tag`, canonical/og:url are built from `params`.

Routes to update:
| Route | Change |
|---|---|
| `/` (index.tsx) | Add `head()` — currently inherits root only. Title: "Stream & Scream — TV Reviews & True Crime Documentaries". |
| `/about` | Add canonical + og:url (already has title/desc). |
| `/tv` | Add canonical + og:url + description meta. |
| `/true-crime` | Same. |
| `/tv-news` | Add canonical + og:url. |
| `/search` | Add canonical + og:url + `robots: noindex` (search results shouldn't be indexed). |
| `/subscribe` | Add full `head()` (title, desc, canonical, og:url). |
| `/auth` | Add `head()` with `robots: noindex, nofollow` + minimal title. |
| `/post/$slug` | Add canonical + og:url from `params.slug`; keep existing dynamic title/desc/og:image. |
| `/tag/$tag` | Add canonical + og:url from `params.tag`. |

Root (`__root.tsx`): leave alone — it already sets site-wide defaults and (correctly) has no canonical.

## 3. robots.txt

Check `public/robots.txt`. If it exists, no changes required unless it's missing a `Sitemap:` directive — leave off since there's no absolute base URL yet (matches guidance). If missing entirely, don't create one; the user didn't ask.

## Notes
- All new content lives in existing route files + one new sitemap route file — no schema/data changes.
- Canonicals are relative until the project gets a stable published URL; once published, they'll automatically resolve to the right origin.
