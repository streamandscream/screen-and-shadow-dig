CREATE TABLE public.ingestion_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_name text NOT NULL,
  source_url text NOT NULL,
  ok boolean NOT NULL,
  http_status integer,
  items_fetched integer NOT NULL DEFAULT 0,
  items_inserted integer NOT NULL DEFAULT 0,
  items_skipped integer NOT NULL DEFAULT 0,
  parse_errors integer NOT NULL DEFAULT 0,
  classify_errors integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  error text,
  ran_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ingestion_runs TO authenticated;
GRANT ALL ON public.ingestion_runs TO service_role;

ALTER TABLE public.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read ingestion runs"
ON public.ingestion_runs FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX ingestion_runs_ran_at_idx ON public.ingestion_runs (ran_at DESC);
CREATE INDEX ingestion_runs_source_ran_at_idx ON public.ingestion_runs (source_name, ran_at DESC);