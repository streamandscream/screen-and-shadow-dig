
-- Restrict covers bucket writes to authors/admins
DROP POLICY IF EXISTS "covers_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "covers_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "covers_delete_auth" ON storage.objects;

CREATE POLICY "covers_insert_editors" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'covers' AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "covers_update_editors" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'covers' AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')))
  WITH CHECK (bucket_id = 'covers' AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')));

CREATE POLICY "covers_delete_editors" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'covers' AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin')));

-- Lock down SECURITY DEFINER functions: revoke public/anon, keep authenticated only where needed
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rename_tag(text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.delete_tag(text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rename_tag(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tag(text) TO authenticated;
