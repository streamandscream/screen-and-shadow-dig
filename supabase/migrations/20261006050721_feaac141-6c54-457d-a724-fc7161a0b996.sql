CREATE TABLE public.shortlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text NOT NULL,
  body text NOT NULL DEFAULT '',
  anchor_post_id uuid REFERENCES public.posts(id) ON DELETE SET NULL,
  cover_url text,
  cover_alt text,
  meta_description text,
  published boolean NOT NULL DEFAULT false,
  publish_at timestamptz,
  published_at timestamptz,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shortlists TO authenticated;
GRANT SELECT ON public.shortlists TO anon;
GRANT ALL ON public.shortlists TO service_role;

ALTER TABLE public.shortlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published shortlists"
ON public.shortlists FOR SELECT TO public
USING (published = true);

CREATE POLICY "Authors and admins read all shortlists"
ON public.shortlists FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors and admins create shortlists"
ON public.shortlists FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id AND (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)));

CREATE POLICY "Authors and admins update shortlists"
ON public.shortlists FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors and admins delete shortlists"
ON public.shortlists FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.shortlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shortlist_id uuid NOT NULL REFERENCES public.shortlists(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE RESTRICT,
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shortlist_id, position),
  UNIQUE (shortlist_id, post_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shortlist_items TO authenticated;
GRANT SELECT ON public.shortlist_items TO anon;
GRANT ALL ON public.shortlist_items TO service_role;

ALTER TABLE public.shortlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads published shortlist items"
ON public.shortlist_items FOR SELECT TO public
USING (EXISTS (
  SELECT 1 FROM public.shortlists s
  WHERE s.id = shortlist_id AND s.published = true
));

CREATE POLICY "Authors and admins read all shortlist items"
ON public.shortlist_items FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors and admins create shortlist items"
ON public.shortlist_items FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors and admins update shortlist items"
ON public.shortlist_items FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Authors and admins delete shortlist items"
ON public.shortlist_items FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER shortlists_updated_at
BEFORE UPDATE ON public.shortlists
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER shortlist_items_updated_at
BEFORE UPDATE ON public.shortlist_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.validate_shortlist_publish()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  item_count integer;
BEGIN
  IF NEW.published AND NOT COALESCE(OLD.published, false) THEN
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

CREATE TRIGGER shortlists_validate_publish
BEFORE UPDATE ON public.shortlists
FOR EACH ROW EXECUTE FUNCTION public.validate_shortlist_publish();

CREATE OR REPLACE FUNCTION public.publish_due_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  n integer;
  post_count integer;
  shortlist_count integer;
BEGIN
  WITH due AS (
    UPDATE public.posts
    SET published = true, publish_at = NULL
    WHERE published = false AND publish_at IS NOT NULL AND publish_at <= now()
    RETURNING 1
  )
  SELECT count(*) INTO post_count FROM due;

  WITH valid_shortlists AS (
    SELECT s.id
    FROM public.shortlists s
    JOIN public.shortlist_items i ON i.shortlist_id = s.id
    WHERE s.published = false AND s.publish_at IS NOT NULL AND s.publish_at <= now()
    GROUP BY s.id
    HAVING count(*) = 5
  ), due AS (
    UPDATE public.shortlists s
    SET published = true, publish_at = NULL
    FROM valid_shortlists v
    WHERE s.id = v.id
    RETURNING 1
  )
  SELECT count(*) INTO shortlist_count FROM due;

  n := post_count + shortlist_count;
  IF n > 0 THEN
    PERFORM public.deploy_site_internal();
  END IF;
END;
$$;