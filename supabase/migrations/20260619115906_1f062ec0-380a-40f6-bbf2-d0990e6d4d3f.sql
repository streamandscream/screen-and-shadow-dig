
CREATE POLICY "covers_read_all" ON storage.objects FOR SELECT USING (bucket_id = 'covers');
CREATE POLICY "covers_insert_auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'covers');
CREATE POLICY "covers_update_auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'covers');
CREATE POLICY "covers_delete_auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'covers');
