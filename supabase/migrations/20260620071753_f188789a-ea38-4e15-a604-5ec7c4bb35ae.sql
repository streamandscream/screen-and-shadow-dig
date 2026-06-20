
REVOKE EXECUTE ON FUNCTION public.rename_tag(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.delete_tag(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rename_tag(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_tag(text) TO authenticated;
