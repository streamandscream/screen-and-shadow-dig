DROP POLICY IF EXISTS "Authenticated read all posts" ON public.posts;

CREATE POLICY "Authors and admins read all posts"
ON public.posts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'author'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));