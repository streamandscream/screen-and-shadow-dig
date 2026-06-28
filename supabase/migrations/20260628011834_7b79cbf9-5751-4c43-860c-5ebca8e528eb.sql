
-- Allow updates/deletes when the existing row has no author yet, and let any author/admin claim it.
DROP POLICY IF EXISTS "Authors update own" ON public.posts;
DROP POLICY IF EXISTS "Authors delete own" ON public.posts;
DROP POLICY IF EXISTS "Authors read own posts" ON public.posts;

CREATE POLICY "Authors update own or unowned"
ON public.posts FOR UPDATE TO authenticated
USING (
  auth.uid() = author_id
  OR author_id IS NULL
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  auth.uid() = author_id
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authors delete own or admin"
ON public.posts FOR DELETE TO authenticated
USING (
  auth.uid() = author_id
  OR author_id IS NULL
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated read all posts"
ON public.posts FOR SELECT TO authenticated
USING (true);

-- Backfill missing author_id so future edits work cleanly.
UPDATE public.posts
SET author_id = (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
WHERE author_id IS NULL;
