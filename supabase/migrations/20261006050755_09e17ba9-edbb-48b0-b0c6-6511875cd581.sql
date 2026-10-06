CREATE OR REPLACE FUNCTION public.validate_shortlist_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  item_count integer;
  was_published boolean := CASE WHEN TG_OP = 'UPDATE' THEN OLD.published ELSE false END;
BEGIN
  IF NEW.published AND NOT was_published THEN
    SELECT count(*) INTO item_count
    FROM public.shortlist_items
    WHERE shortlist_id = NEW.id;
    IF item_count <> 5 THEN
      RAISE EXCEPTION 'A published shortlist must have exactly five recommendations';
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

DROP TRIGGER shortlists_validate_publish ON public.shortlists;
CREATE TRIGGER shortlists_validate_publish
BEFORE INSERT OR UPDATE ON public.shortlists
FOR EACH ROW EXECUTE FUNCTION public.validate_shortlist_publish();