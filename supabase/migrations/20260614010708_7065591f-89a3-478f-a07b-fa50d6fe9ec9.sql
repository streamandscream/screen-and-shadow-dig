DROP POLICY IF EXISTS "Authenticated can insert" ON public.posts;
CREATE POLICY "Authors or admins can insert posts"
ON public.posts
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = author_id
  AND (public.has_role(auth.uid(), 'author'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
);