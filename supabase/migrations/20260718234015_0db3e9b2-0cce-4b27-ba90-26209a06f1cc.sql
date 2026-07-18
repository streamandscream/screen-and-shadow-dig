
CREATE TABLE public.outbound_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  url text NOT NULL,
  domain text NOT NULL,
  link_text text,
  source_path text,
  is_affiliate boolean NOT NULL DEFAULT false,
  user_agent text
);
CREATE INDEX outbound_clicks_created_at_idx ON public.outbound_clicks (created_at DESC);
CREATE INDEX outbound_clicks_domain_idx ON public.outbound_clicks (domain);

GRANT SELECT ON public.outbound_clicks TO authenticated;
GRANT ALL ON public.outbound_clicks TO service_role;

ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view outbound clicks"
  ON public.outbound_clicks
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'author'));
