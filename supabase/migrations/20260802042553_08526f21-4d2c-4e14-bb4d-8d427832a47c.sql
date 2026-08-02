GRANT SELECT ON public.posts TO anon, authenticated;
GRANT SELECT ON public.tv_news TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;