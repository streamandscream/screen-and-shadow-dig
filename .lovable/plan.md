
# Bold News Blog — TV Recs & True Crime

A black-and-white editorial blog with two flagship sections: **TV Show Recommendations** and **True Crime Documentaries**. Seeded with real sample posts. Backed by Lovable Cloud so you can sign in and write/edit posts directly from the site.

## Design direction
- **Palette (Paper & Ink):** off-white `#f5f3ee` page, soft paper `#e8e4dd` panels, ink `#2d2d2d` body, deep `#0d0d0d` headlines.
- **Type (Bold News):** Archivo Black for huge editorial headlines (tight tracking, all-caps for kickers), Hind for readable body and metadata.
- **Feel:** newsprint-meets-magazine. Thin hairline rules, generous whitespace, oversized headlines, small uppercase eyebrow tags ("TV PICK", "TRUE CRIME"), pull quotes, photo-first feature cards.

## Pages & routes
- `/` — Home: marquee headline, latest 1 feature + 4 secondary cards, split row "Latest TV Recs" / "Latest True Crime".
- `/tv` — TV Recommendations index.
- `/true-crime` — True Crime Documentaries index.
- `/post/$slug` — Article page: hero, meta (author, date, episodes/streamer), long-form body, rating block, related posts.
- `/about` — Short editor bio + what the blog covers.
- `/auth` — Sign in / sign up (email + password).
- `/_authenticated/admin` — Post dashboard: list, create, edit, delete, publish/unpublish.
- `/_authenticated/admin/new` and `/admin/$id/edit` — Markdown post editor with section, cover image URL, tags, rating, streamer.

## Seeded sample content (7 posts)
**TV Recs**
1. "The Diplomat" — Keri Russell's tightly wound political thriller
2. "Lioness" — Taylor Sheridan's bruising CIA operative drama
3. "Vladimir" — the chilling new prestige character study
4. "The Beast in Me" — slow-burn psychological showdown

**True Crime**
5. "The Nightmare Upstairs" — what really happened above the bookstore
6. "Mean Girl Murders" — when high-school cruelty turned lethal
7. "A Plan to Kill" — anatomy of a meticulously planned crime

Each post: cover image, 600–900 words, eyebrow tag, rating, streamer, 3–5 tags.

## Backend (Lovable Cloud)
Tables:
- `posts` — id, slug (unique), section (`tv` | `true_crime`), title, excerpt, body (markdown), cover_url, streamer, rating (1–5), tags (text[]), published (bool), author_id, created_at, updated_at.
- `profiles` — id (= auth.uid), display_name, avatar_url.

Security:
- RLS on. Public read for `posts WHERE published = true`. Authenticated users can insert and can update/delete only their own posts.
- `profiles` readable by all, writable by owner.
- Roles split into a `user_roles` table with an `app_role` enum (`admin`, `author`) and a `has_role()` security-definer function.

Auth: email + password (no email confirmation, so testing is instant).

## Technical notes
- TanStack Start with file-based routes; public routes use loaders that call a public `createServerFn` reading via `supabaseAdmin` (safe column projection).
- Admin routes live under `src/routes/_authenticated/` using the integration-managed gate; mutations go through `createServerFn` with `requireSupabaseAuth`.
- Markdown rendered with `react-markdown` + `remark-gfm`.
- Design tokens added to `src/styles.css` (oklch values for Paper & Ink palette, Archivo Black + Hind via Google Fonts).
- Cover images: Unsplash URLs for seed posts; admins paste any URL when editing.
- SEO: per-route `head()` with title/description/og tags; post pages derive og:image from cover_url.

## Out of scope for v1
Comments, likes, search, newsletter signup, image uploads (URL only), rich-text WYSIWYG (markdown only).
