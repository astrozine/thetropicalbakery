-- ============================================================================
-- MIGRATION 57: which country each free-recipes sign-up came from
-- ============================================================================
-- The site now notes the visitor's country (two letters, e.g. US, GB, AU) when someone asks for the free
-- recipes, from the hosting's own location header. Shown and filterable in Admin > Clientes. Sign-ups from
-- before this migration have no country. Safe to run more than once.
-- ============================================================================

ALTER TABLE public.funnel_leads ADD COLUMN IF NOT EXISTS country text
    CHECK (country IS NULL OR country ~ '^[A-Z]{2}$');

-- Check: should show one row, "country".
SELECT column_name FROM information_schema.columns WHERE table_name = 'funnel_leads' AND column_name = 'country';
