DROP POLICY IF EXISTS "Profiles are public readable" ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
CREATE POLICY "Authenticated users can read profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);