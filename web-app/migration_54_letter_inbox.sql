-- Migration 54: Dolly's weekly letter inbox (2026-11-25)
--
-- 1. letter_submissions: what Dolly sends from /carta/escrever (photos + a few lines). The site writes it with the
--    service key; only admins can read it (Admin > E-mails opens it as the Sunday letter, ready to send).
-- 2. The automation 'carta-pedido' (Thursday e-mail to Dolly with her link). Seeded OFF: switch it on in
--    Admin > E-mails > Automações.
-- Photos go to the existing public 'uploads' bucket, folder cartas/.
--
-- Safe to run more than once.

BEGIN;

CREATE TABLE IF NOT EXISTS public.letter_submissions (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at  timestamptz NOT NULL DEFAULT now(),
    sunday      date NOT NULL,
    lang        text NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'pt')),
    title       text CHECK (title IS NULL OR char_length(title) <= 120),
    story       text NOT NULL CHECK (char_length(story) <= 4000),
    tip         text CHECK (tip IS NULL OR char_length(tip) <= 2000),
    photos      text[] NOT NULL DEFAULT '{}'
);

ALTER TABLE public.letter_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS letter_submissions_admin ON public.letter_submissions;
CREATE POLICY letter_submissions_admin ON public.letter_submissions
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.letter_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.letter_submissions TO service_role;

DO $$
BEGIN
    IF to_regclass('public.email_automations') IS NOT NULL THEN
        INSERT INTO public.email_automations (id, enabled, threshold, offset_days, send_hour) VALUES
            ('carta-pedido', false, NULL, NULL, 9)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

COMMIT;

-- Check: the table exists with RLS on, and the rule is there (enabled = false).
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'letter_submissions';
SELECT id, enabled, send_hour FROM public.email_automations WHERE id = 'carta-pedido';
