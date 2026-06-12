ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_rating_check;
UPDATE public.posts SET rating = rating * 2 WHERE rating IS NOT NULL;
ALTER TABLE public.posts ADD CONSTRAINT posts_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10));