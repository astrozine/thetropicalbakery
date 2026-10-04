-- migration_38_partner_kind_barco.sql
-- A new kind of partner: boats, charters and marinas (the /b2b/barcos page).
-- Only widens the CHECK on partners.kind; nothing else changes. Safe to run twice.
-- Until this runs, the form on /b2b/barcos still works: it files the application as 'outro'.

BEGIN;

ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_kind_check;
ALTER TABLE public.partners ADD CONSTRAINT partners_kind_check
  CHECK (kind IN ('hotel', 'pousada', 'airbnb', 'restaurante', 'padaria', 'barco', 'afiliado', 'outro'));

COMMIT;

-- Check: the constraint now lists 'barco'.
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.partners'::regclass AND conname = 'partners_kind_check';
