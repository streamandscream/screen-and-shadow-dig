ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS meta_description text;

-- Backfill unique, keyword-focused meta descriptions for published posts that don't have one yet.
UPDATE public.posts
SET meta_description = LEFT(
  CONCAT(
    title,
    ' review',
    CASE WHEN rating IS NOT NULL THEN ' (' || rating || '/10)' ELSE '' END,
    CASE WHEN streamer IS NOT NULL AND streamer <> '' THEN ' on ' || streamer ELSE '' END,
    '. ',
    CASE WHEN section = 'tv' THEN 'Stream & Scream''s honest take on ' ELSE 'True crime deep-dive on ' END,
    title,
    CASE WHEN tags IS NOT NULL AND array_length(tags, 1) > 0
         THEN ' — ' || array_to_string(tags[1:3], ', ')
         ELSE ''
    END,
    '.'
  ),
  200
)
WHERE meta_description IS NULL OR meta_description = '';