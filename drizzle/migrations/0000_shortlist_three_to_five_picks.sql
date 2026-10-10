CREATE OR REPLACE FUNCTION public.validate_shortlist_publish()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
DECLARE
  item_count integer;
  was_published boolean := CASE WHEN TG_OP = 'UPDATE' THEN OLD.published ELSE false END;
BEGIN
  IF NEW.published AND NOT was_published THEN
    SELECT count(*) INTO item_count FROM public.shortlist_items WHERE shortlist_id = NEW.id;
    IF item_count < 3 OR item_count > 5 THEN
      RAISE EXCEPTION 'A published shortlist must have between three and five recommendations';
    END IF;
  END IF;
  IF NEW.published AND NEW.published_at IS NULL THEN
    NEW.published_at = COALESCE(NEW.publish_at, now());
  ELSIF NOT NEW.published THEN
    NEW.published_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_due_posts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  n integer; post_count integer; shortlist_count integer;
BEGIN
  WITH due AS (
    UPDATE public.posts SET published = true, publish_at = NULL
    WHERE published = false AND publish_at IS NOT NULL AND publish_at <= now()
    RETURNING 1
  ) SELECT count(*) INTO post_count FROM due;

  WITH valid_shortlists AS (
    SELECT s.id FROM public.shortlists s
    JOIN public.shortlist_items i ON i.shortlist_id = s.id
    WHERE s.published = false AND s.publish_at IS NOT NULL AND s.publish_at <= now()
    GROUP BY s.id HAVING count(*) BETWEEN 3 AND 5
  ), due AS (
    UPDATE public.shortlists s SET published = true, publish_at = NULL
    FROM valid_shortlists v WHERE s.id = v.id RETURNING 1
  ) SELECT count(*) INTO shortlist_count FROM due;

  n := post_count + shortlist_count;
  IF n > 0 THEN PERFORM public.deploy_site_internal(); END IF;
END;
$$;