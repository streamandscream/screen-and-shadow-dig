ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_published_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.published AND NEW.published_at IS NULL THEN
    NEW.published_at = COALESCE(NEW.publish_at, now());
  ELSIF NOT NEW.published THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_set_published_at ON public.posts;
CREATE TRIGGER posts_set_published_at
BEFORE INSERT OR UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_published_at();