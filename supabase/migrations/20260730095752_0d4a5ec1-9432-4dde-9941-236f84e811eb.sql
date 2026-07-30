DROP POLICY IF EXISTS "covers_read_all" ON storage.objects;
DROP POLICY IF EXISTS "covers_insert_auth" ON storage.objects;
DROP POLICY IF EXISTS "covers_update_auth" ON storage.objects;
DROP POLICY IF EXISTS "covers_delete_auth" ON storage.objects;

CREATE POLICY "covers_select_editors" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'covers'
  AND (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'))
);