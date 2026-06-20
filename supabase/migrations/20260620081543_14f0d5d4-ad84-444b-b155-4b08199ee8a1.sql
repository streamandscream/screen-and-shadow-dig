ALTER TABLE public.posts ALTER COLUMN rating TYPE numeric(3,1) USING rating::numeric;
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_rating_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_rating_check CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10 AND (rating * 2) = floor(rating * 2)));