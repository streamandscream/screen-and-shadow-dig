CREATE TYPE public.tv_news_status AS ENUM ('renewed', 'cancelled', 'ended', 'other');

CREATE TABLE public.tv_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  source_url text NOT NULL UNIQUE,
  source_name text NOT NULL,
  show_title text,
  network text,
  status public.tv_news_status NOT NULL DEFAULT 'other',
  image_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tv_news_published_at_idx ON public.tv_news (published_at DESC);
CREATE INDEX tv_news_status_idx ON public.tv_news (status);

GRANT SELECT ON public.tv_news TO anon, authenticated;
GRANT ALL ON public.tv_news TO service_role;

ALTER TABLE public.tv_news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads tv news" ON public.tv_news
  FOR SELECT
  TO anon, authenticated
  USING (true);