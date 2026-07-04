DROP POLICY IF EXISTS "Authors update own or unowned" ON public.posts;
DROP POLICY IF EXISTS "Authors delete own or admin" ON public.posts;

CREATE POLICY "Authors or admins can update posts"
ON public.posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authors or admins can delete posts"
ON public.posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'author') OR public.has_role(auth.uid(), 'admin'));