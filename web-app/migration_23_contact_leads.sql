-- ============================================================================
-- MIGRATION 23: keep a file on everyone who taps a "Falar no WhatsApp" button
-- ============================================================================
-- Every button that used to jump straight into WhatsApp now first asks for a name and a WhatsApp
-- number (or a one-tap Google / Facebook sign-in, which also gives the person an account) and
-- saves them here, so we know who is talking to us before the chat begins.
--
-- Run it any time. Until it runs the buttons still work and still open WhatsApp; the only
-- difference is that people who typed an e-mail land on the e-mail list instead of in this table.
--
-- After it runs, the leads appear in Admin > Caixa de Entrada as "Contato pelo site".
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.contact_leads (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  timestamptz NOT NULL DEFAULT now(),
    name        text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    whatsapp    text NOT NULL CHECK (char_length(whatsapp) BETWEEN 6 AND 40),
    email       text CHECK (email IS NULL OR char_length(email) <= 254),
    -- What the person was about to ask about, e.g. "Parceria: Hotéis" or "Retiro: cotação".
    topic       text CHECK (topic IS NULL OR char_length(topic) <= 300),
    -- The page the button was on.
    source_page text CHECK (source_page IS NULL OR char_length(source_page) <= 300),
    -- Set when they came in through Google / Facebook / e-mail sign-in, so the lead is tied to an account.
    user_id     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    signed_in   boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS contact_leads_created_idx ON public.contact_leads (created_at DESC);

ALTER TABLE public.contact_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can leave a contact" ON public.contact_leads;
CREATE POLICY "Anyone can leave a contact" ON public.contact_leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (user_id IS NULL OR user_id = auth.uid());

DROP POLICY IF EXISTS "Admins manage contact leads" ON public.contact_leads;
CREATE POLICY "Admins manage contact leads" ON public.contact_leads
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Visitors may only add a row (they can never read anyone back). Admins do the rest.
GRANT INSERT ON public.contact_leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_leads TO service_role;

COMMIT;

SELECT 'contact_leads is ready' AS check,
       CASE WHEN to_regclass('public.contact_leads') IS NOT NULL THEN 'yes' ELSE 'NO - PROBLEM' END AS result
UNION ALL
SELECT 'public can only add rows',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'contact_leads' AND policyname = 'Anyone can leave a contact')
            THEN 'yes' ELSE 'NO - PROBLEM' END;
