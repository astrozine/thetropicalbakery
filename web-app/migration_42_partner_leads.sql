-- ============================================================================
-- MIGRATION 42: the prospect list (businesses we reached out to, before they are partners)
-- ============================================================================
-- One row per hotel, pousada, restaurant, boat, studio... that we contacted (or plan to) by e-mail
-- or WhatsApp. Admin > Prospecção shows them as a pipeline: a contatar -> contatado -> respondeu ->
-- conversa / café marcado -> virou parceiro (or sem interesse), with notes and a follow-up date.
--
-- Kept apart from `partners` on purpose: a row in `partners` can sign in to the partner portal,
-- a prospect must not.
--
-- Run it any time; until it runs the Prospecção page just shows a hint. Safe to run twice.
-- The contact list itself is loaded by a separate seed file (not in git).
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.partner_leads (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      timestamptz NOT NULL DEFAULT now(),
    updated_at      timestamptz NOT NULL DEFAULT now(),
    business_name   text NOT NULL CHECK (char_length(business_name) BETWEEN 1 AND 200),
    -- pousada, restaurante, barco, yoga... (free text, from the research list)
    category        text,
    -- The section of the /b2b pages it belongs to, e.g. "Hotéis e pousadas".
    segment         text,
    location        text,
    email           text,
    whatsapp        text,
    -- "celular", "fixo (talvez sem WhatsApp)"...
    whatsapp_type   text,
    instagram       text,
    website         text,
    -- high / medium / low, from the research.
    fit             text,
    -- What we found out about them when researching (never shown to them).
    research        text,
    -- The ready-to-send WhatsApp text Dolly wrote for them.
    whatsapp_message text,
    email_status    text NOT NULL DEFAULT 'nao_enviado'
                    CHECK (email_status IN ('nao_enviado', 'enviado', 'bounce', 'sem_email')),
    whatsapp_sent   boolean NOT NULL DEFAULT false,
    stage           text NOT NULL DEFAULT 'a_contatar'
                    CHECK (stage IN ('a_contatar', 'contatado', 'respondeu', 'conversa', 'parceiro', 'sem_interesse')),
    -- Where the answer came from: whatsapp, email, instagram, pessoalmente.
    replied_via     text,
    follow_up_on    date,
    notes           text
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_leads_name_idx ON public.partner_leads (lower(business_name));
CREATE INDEX IF NOT EXISTS partner_leads_stage_idx ON public.partner_leads (stage);

ALTER TABLE public.partner_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage partner leads" ON public.partner_leads;
CREATE POLICY "Admins manage partner leads" ON public.partner_leads
    FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Private: no anon access at all.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_leads TO service_role;

COMMIT;

SELECT 'partner_leads is ready' AS check,
       CASE WHEN to_regclass('public.partner_leads') IS NOT NULL THEN 'yes' ELSE 'NO - PROBLEM' END AS result
UNION ALL
SELECT 'only admins can read it',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'partner_leads' AND policyname = 'Admins manage partner leads')
            THEN 'yes' ELSE 'NO - PROBLEM' END;
