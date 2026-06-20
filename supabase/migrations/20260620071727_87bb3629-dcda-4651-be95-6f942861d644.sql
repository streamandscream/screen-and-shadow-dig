
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authors and admins can view tags" ON public.tags
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors and admins can insert tags" ON public.tags
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors and admins can update tags" ON public.tags
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors and admins can delete tags" ON public.tags
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER tags_updated_at
  BEFORE UPDATE ON public.tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the catalog with any tag names already used on posts so the admin sees them immediately.
INSERT INTO public.tags (name)
SELECT DISTINCT unnest(tags) FROM public.posts WHERE tags IS NOT NULL
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.rename_tag(_old text, _new text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old text := btrim(_old);
  v_new text := btrim(_new);
BEGIN
  IF NOT (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF v_old = '' OR v_new = '' THEN
    RAISE EXCEPTION 'Tag name cannot be empty';
  END IF;
  IF v_old = v_new THEN
    RETURN;
  END IF;

  -- Update posts: replace old with new, dedupe.
  UPDATE public.posts
  SET tags = (
    SELECT COALESCE(array_agg(DISTINCT t ORDER BY t), ARRAY[]::text[])
    FROM unnest(
      array_replace(tags, v_old, v_new)
    ) AS t
  )
  WHERE v_old = ANY(tags);

  -- Merge catalog rows.
  IF EXISTS (SELECT 1 FROM public.tags WHERE name = v_new) THEN
    DELETE FROM public.tags WHERE name = v_old;
  ELSE
    UPDATE public.tags SET name = v_new WHERE name = v_old;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_tag(_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text := btrim(_name);
BEGIN
  IF NOT (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF v_name = '' THEN
    RAISE EXCEPTION 'Tag name cannot be empty';
  END IF;

  UPDATE public.posts
  SET tags = array_remove(tags, v_name)
  WHERE v_name = ANY(tags);

  DELETE FROM public.tags WHERE name = v_name;
END;
$$;
