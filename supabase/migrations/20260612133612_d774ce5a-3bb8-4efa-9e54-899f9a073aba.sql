ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS favourite_episode text,
  ADD COLUMN IF NOT EXISTS next_binge text[] NOT NULL DEFAULT '{}';