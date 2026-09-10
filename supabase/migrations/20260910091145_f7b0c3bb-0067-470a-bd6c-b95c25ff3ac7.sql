-- lovable-cron-fallback-reviewed: 1440 runs/day; replaces an existing every-minute scheduled-publish job so timed posts go live within a minute and now also trigger the live-site update
CREATE OR REPLACE FUNCTION public.deploy_site_internal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'net'
AS $function$
DECLARE
  cfg public.deploy_config%ROWTYPE;
BEGIN
  SELECT * INTO cfg FROM public.deploy_config WHERE id;
  IF NOT FOUND OR cfg.github_token IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url := 'https://api.github.com/repos/' || cfg.github_owner || '/' || cfg.github_repo || '/actions/workflows/' || cfg.workflow_file || '/dispatches',
    body := jsonb_build_object('ref', cfg.git_ref),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'stream-and-scream-cron',
      'Authorization', 'Bearer ' || cfg.github_token
    )
  );

  UPDATE public.deploy_config SET last_triggered_at = now() WHERE id;
END;
$function$;

REVOKE ALL ON FUNCTION public.deploy_site_internal() FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.publish_due_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  n integer;
BEGIN
  WITH due AS (
    UPDATE public.posts
    SET published = true, publish_at = NULL
    WHERE published = false AND publish_at IS NOT NULL AND publish_at <= now()
    RETURNING 1
  )
  SELECT count(*) INTO n FROM due;

  IF n > 0 THEN
    PERFORM public.deploy_site_internal();
  END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.publish_due_posts() FROM public, anon, authenticated;

SELECT cron.unschedule(4);
SELECT cron.schedule('publish-due-posts', '* * * * *', $$select public.publish_due_posts();$$);