## Goal
Add a "Fetch TMDB" button next to the title field in the admin post editor that looks up the title on TMDB and auto-fills the cover image (and offers a sensible excerpt fallback).

## Changes

1. **New server function** `src/lib/tmdb.functions.ts`
   - `fetchTmdbMeta` (auth-required, uses `requireSupabaseAuth` middleware).
   - Input: `{ title: string; type: "tv-show" | "movie" }`.
   - Calls TMDB `search/tv` or `search/movie` with `process.env.TMDB_API_KEY` as a Bearer token.
   - Returns top match: `{ cover_url, overview, tmdb_id, name }` where `cover_url` = `https://image.tmdb.org/t/p/original{poster_path}` or `null` if no match.

2. **Editor UI** `src/routes/_authenticated/admin.$id.edit.tsx`
   - Add a small "Fetch TMDB" button next to the Title field.
   - On click: call `fetchTmdbMeta` with the current title and (for TV) `tv-show` else `movie` based on `form.section`/`form.justwatch_type`.
   - Populate `cover_url` (always overwrite if found) and set `excerpt` only if currently empty.
   - Show inline status: "Searching…", "No match found", or error.

3. No DB/migration changes. `TMDB_API_KEY` already exists in secrets.

## Out of scope
- Bulk import, episode lookup, multiple-match picker (single top result only).
