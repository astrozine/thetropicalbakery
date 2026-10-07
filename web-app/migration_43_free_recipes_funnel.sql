-- ============================================================================
-- MIGRATION 43: The free-recipes funnel (/free-recipes, /receitas)
-- ============================================================================
-- Ads and posts send people to a page that gives away two recipes from Sweet Escape in exchange for an e-mail.
-- Every sign-up is one row here: who they are, where they live (Ubatuba / Paraty or not, which decides the local
-- offers), what they said they would love (box, course, brunch, events), which ad brought them, and whether they
-- bought the full book on the way (order bump, the offer on the thank-you page, or the welcome price by e-mail).
--
-- Private: only admins read it (/admin/receitas). Visitors never touch the table: the site writes it from the
-- server with the service key (/api/free-recipes/lead), and the thank-you page reads its own row there, by its
-- unguessable id. Also seeds the e-mail sequence rule, OFF, like every automation. Safe to run twice.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.funnel_leads (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at    timestamptz NOT NULL DEFAULT now(),
    email         text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
    first_name    text CHECK (first_name IS NULL OR char_length(first_name) <= 120),
    -- The language of the page they signed up on (en, pt, es, nl); the PDF and the e-mails follow it.
    lang          text NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'pt', 'es', 'nl')),
    -- 'local' (lives around Ubatuba / Paraty), 'visiting' (coming soon), 'away' (anywhere else).
    segment       text NOT NULL DEFAULT 'away' CHECK (segment IN ('local', 'visiting', 'away')),
    -- What they picked on the thank-you page: 'box', 'course', 'brunch', 'events' (null = not answered).
    interest      text CHECK (interest IS NULL OR interest IN ('box', 'course', 'brunch', 'events')),
    -- The e-book order they placed from the funnel (EBK…), and through which offer.
    book_ref      text,
    book_offer    text CHECK (book_offer IS NULL OR book_offer IN ('bump', 'oto', 'welcome')),
    -- Which ad / post brought them (utm_source, utm_campaign, utm_content), for comparing ads.
    utm_source    text CHECK (utm_source IS NULL OR char_length(utm_source) <= 120),
    utm_campaign  text CHECK (utm_campaign IS NULL OR char_length(utm_campaign) <= 120),
    utm_content   text CHECK (utm_content IS NULL OR char_length(utm_content) <= 120),
    referrer      text CHECK (referrer IS NULL OR char_length(referrer) <= 300)
);

CREATE INDEX IF NOT EXISTS funnel_leads_created_idx ON public.funnel_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS funnel_leads_email_idx ON public.funnel_leads (lower(email));

ALTER TABLE public.funnel_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS funnel_leads_admin ON public.funnel_leads;
CREATE POLICY funnel_leads_admin ON public.funnel_leads
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- No anon grant: visitors never read or write this table directly.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.funnel_leads TO service_role;

-- The e-mail sequence (src/lib/email/automations.ts, 'receitas-sequencia'). Seeded OFF: switching it on in
-- Admin > E-mails is the decision to start mailing the people who download the recipes.
DO $$
BEGIN
    IF to_regclass('public.email_automations') IS NOT NULL THEN
        INSERT INTO public.email_automations (id, enabled, threshold, offset_days, send_hour) VALUES
            ('receitas-sequencia', false, NULL, NULL, 10)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

COMMIT;

-- Check: the table exists with RLS on, and the rule is there (enabled = false).
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'funnel_leads';
SELECT id, enabled, send_hour FROM public.email_automations WHERE id = 'receitas-sequencia';
