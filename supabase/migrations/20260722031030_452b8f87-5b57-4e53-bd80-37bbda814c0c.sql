
DROP POLICY IF EXISTS covers_insert_auth ON storage.objects;
DROP POLICY IF EXISTS covers_update_auth ON storage.objects;
DROP POLICY IF EXISTS covers_delete_auth ON storage.objects;

CREATE POLICY covers_insert_auth ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'covers' AND (public.has_role(auth.uid(),'author') OR public.has_role(auth.uid(),'admin')));

CREATE POLICY covers_update_auth ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'covers' AND (public.has_role(auth.uid(),'author') OR public.has_role(auth.uid(),'admin')))
WITH CHECK (bucket_id = 'covers' AND (public.has_role(auth.uid(),'author') OR public.has_role(auth.uid(),'admin')));

CREATE POLICY covers_delete_auth ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'covers' AND (public.has_role(auth.uid(),'author') OR public.has_role(auth.uid(),'admin')));
