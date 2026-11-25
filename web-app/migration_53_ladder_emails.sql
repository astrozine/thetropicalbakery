-- Migration 53: the value-ladder e-mails (2026-11-25)
--
-- 1. The automation 'livro-sequencia' (src/lib/email/automations.ts): 3 e-mails to Sweet Escape buyers on the site,
--    1, 3 and 7 days after the book is paid. Seeded OFF: switching it on in Admin > E-mails > Automações is the
--    decision to start mailing buyers.
-- 2. Book buyers' language on the list. Until now a site book buyer was saved as Portuguese whatever page they
--    bought on, so Dolly's Sunday letter (sent per language) would reach English readers in Portuguese. This sets
--    each one's language from their book order. Only touches contacts still marked 'pt' whose order says otherwise.
--
-- Safe to run more than once.

BEGIN;

DO $$
BEGIN
    IF to_regclass('public.email_automations') IS NOT NULL THEN
        INSERT INTO public.email_automations (id, enabled, threshold, offset_days, send_hour) VALUES
            ('livro-sequencia', false, NULL, NULL, 10)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- The order's address ends in "· <page language> · <book language>"; the page language is the one they read.
UPDATE public.email_contacts c
SET locale = o.lang, updated_at = now()
FROM (
    SELECT DISTINCT ON (lower(customer_email))
           lower(customer_email) AS email,
           substring(delivery_address from '·\s*(en|pt|es|nl|de)\s*(?:·\s*(?:en|pt|es|nl|de)\s*)?$') AS lang
    FROM public.orders
    WHERE pix_transaction_id LIKE 'EBK%' AND customer_email IS NOT NULL
    ORDER BY lower(customer_email), created_at DESC
) o
WHERE lower(c.email) = o.email
  AND o.lang IS NOT NULL
  AND o.lang <> 'pt'
  AND c.locale = 'pt'
  AND c.source = 'ebook';

COMMIT;

-- Check: the rule is there and off, and how many contacts speak each language now.
SELECT id, enabled, send_hour FROM public.email_automations WHERE id = 'livro-sequencia';
SELECT locale, count(*) FROM public.email_contacts GROUP BY locale ORDER BY 2 DESC;
