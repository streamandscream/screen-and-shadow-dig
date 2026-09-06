CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.deploy_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  github_owner text NOT NULL,
  github_repo text NOT NULL,
  workflow_file text NOT NULL DEFAULT 'deploy.yml',
  git_ref text NOT NULL DEFAULT 'main',
  github_token text NOT NULL,
  last_triggered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- No SELECT grant: the token is never readable by the browser.
GRANT INSERT, UPDATE ON public.deploy_config TO authenticated;
GRANT ALL ON public.deploy_config TO service_role;

ALTER TABLE public.deploy_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editors can insert deploy config" ON public.deploy_config;
CREATE POLICY "Editors can insert deploy config"
  ON public.deploy_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Editors can update deploy config" ON public.deploy_config;
CREATE POLICY "Editors can update deploy config"
  ON public.deploy_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE OR REPLACE FUNCTION public.deploy_config_status()
RETURNS TABLE (configured boolean, github_owner text, github_repo text, workflow_file text, git_ref text, last_triggered_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  RETURN QUERY
  SELECT true, c.github_owner, c.github_repo, c.workflow_file, c.git_ref, c.last_triggered_at
  FROM public.deploy_config c
  WHERE c.id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text, NULL::text, NULL::timestamptz;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_site_deploy()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net
AS $$
DECLARE
  cfg public.deploy_config%ROWTYPE;
  req_id bigint;
BEGIN
  IF NOT (public.has_role(auth.uid(), 'author'::public.app_role) OR public.has_role(auth.uid(), 'admin'::public.app_role)) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT * INTO cfg FROM public.deploy_config WHERE id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deploy is not set up yet';
  END IF;

  SELECT net.http_post(
    url := 'https://api.github.com/repos/' || cfg.github_owner || '/' || cfg.github_repo || '/actions/workflows/' || cfg.workflow_file || '/dispatches',
    body := jsonb_build_object('ref', cfg.git_ref),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Accept', 'application/vnd.github+json',
      'X-GitHub-Api-Version', '2022-11-28',
      'User-Agent', 'stream-and-scream-admin',
      'Authorization', 'Bearer ' || cfg.github_token
    )
  ) INTO req_id;

  UPDATE public.deploy_config SET last_triggered_at = now() WHERE id;

  RETURN jsonb_build_object('ok', true, 'request_id', req_id);
END;
$$;

REVOKE ALL ON FUNCTION public.deploy_config_status() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.trigger_site_deploy() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deploy_config_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_site_deploy() TO authenticated;