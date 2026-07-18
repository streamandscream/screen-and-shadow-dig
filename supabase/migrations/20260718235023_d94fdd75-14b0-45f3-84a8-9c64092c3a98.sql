ALTER TABLE public.outbound_clicks
  ADD COLUMN IF NOT EXISTS merchant_id text,
  ADD COLUMN IF NOT EXISTS original_url text;
CREATE INDEX IF NOT EXISTS outbound_clicks_merchant_id_idx ON public.outbound_clicks (merchant_id);