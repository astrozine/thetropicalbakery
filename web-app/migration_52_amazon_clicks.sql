-- migration_52_amazon_clicks.sql
-- Counts every visitor who taps a Kindle / paperback / hardcover card on a Sweet Escape page and leaves for Amazon,
-- and how the "Heading to Amazon?" sheet ended (direct = already seen it, skip = said no thanks, signup = left an e-mail).
-- No names or e-mails here; the sign-ups themselves are in funnel_leads (utm_campaign = 'amazon-detour').
-- Shown in Admin > Funil de Receitas. The site writes it with the service key; only admins can read it.
-- Safe to run more than once.

BEGIN;

CREATE TABLE IF NOT EXISTS public.amazon_clicks (
    id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at  timestamptz NOT NULL DEFAULT now(),
    format      text NOT NULL,
    step        text NOT NULL,
    lang        text,
    page        text
);

CREATE INDEX IF NOT EXISTS amazon_clicks_created_at_idx ON public.amazon_clicks (created_at DESC);

ALTER TABLE public.amazon_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS amazon_clicks_admin_read ON public.amazon_clicks;
CREATE POLICY amazon_clicks_admin_read ON public.amazon_clicks FOR SELECT TO authenticated USING (public.is_admin());

GRANT SELECT ON public.amazon_clicks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.amazon_clicks TO service_role;

COMMIT;

-- Verification
SELECT count(*) AS amazon_clicks_so_far FROM public.amazon_clicks;
