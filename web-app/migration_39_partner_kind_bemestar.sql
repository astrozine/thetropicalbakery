-- migration_39_partner_kind_bemestar.sql
-- A new kind of partner: yoga and pilates studios, gyms, retreats and spas (the /b2b/bem-estar page).
-- Only widens the CHECK on partners.kind; nothing else changes. Safe to run twice.
-- Until this runs, the form on /b2b/bem-estar still works: it files the application as 'outro'.

BEGIN;

ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_kind_check;
ALTER TABLE public.partners ADD CONSTRAINT partners_kind_check
  CHECK (kind IN ('hotel', 'pousada', 'airbnb', 'restaurante', 'padaria', 'barco', 'bemestar', 'afiliado', 'outro'));

COMMIT;

-- Check: the constraint now lists 'bemestar'.
SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint
WHERE conrelid = 'public.partners'::regclass AND conname = 'partners_kind_check';
