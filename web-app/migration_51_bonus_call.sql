-- migration_51_bonus_call.sql
-- The free 30-minute call with Dolly that comes with Sweet Escape (src/lib/bonusCall.ts).
-- One number: how many of these calls Dolly takes per week. 0 = the bonus is switched off on the site and in the e-mails.
-- Change it any time in Admin > Ligação grátis. Claims are saved in contact_leads (no new table).
-- Safe to run more than once. Run it whenever; the site uses 5 per week until it runs.

BEGIN;

INSERT INTO public.site_settings (key, value, label) VALUES
    ('bonus_call_weekly', 5, 'Ligações grátis com a Dolly por semana (bônus do Sweet Escape, 0 = desligado)')
ON CONFLICT (key) DO NOTHING;

COMMIT;

-- Verification
SELECT key, value, label FROM public.site_settings WHERE key = 'bonus_call_weekly';
