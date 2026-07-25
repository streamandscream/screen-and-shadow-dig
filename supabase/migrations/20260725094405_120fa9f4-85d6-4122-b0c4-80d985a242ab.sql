ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS publish_at timestamptz;
CREATE INDEX IF NOT EXISTS posts_publish_at_idx ON public.posts (publish_at) WHERE published = false AND publish_at IS NOT NULL;

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-publish-scheduled-posts') THEN
    PERFORM cron.unschedule('auto-publish-scheduled-posts');
  END IF;
END $$;

SELECT cron.schedule(
  'auto-publish-scheduled-posts',
  '* * * * *',
  $$UPDATE public.posts SET published = true, publish_at = NULL WHERE published = false AND publish_at IS NOT NULL AND publish_at <= now();$$
);