-- ============================================================================
-- MIGRATION 27: Treat type (Menu de Eventos)
-- ============================================================================
-- What KIND of treat something is (cookie, cake, entremet, raw, chocolate,
-- baked good), for public.treats only. Lets the admin group the catalogue
-- into sections and show a small tag on each card. The vocabulary lives in
-- src/lib/treatTypes.ts, not here: this is a free-text column, enforced by
-- the admin UI (same approach as `emoji`), so adding a new type never needs
-- a migration. Not synced into Degustation Boxes — see treatSync.ts.
--
-- The table already exists, so no new GRANTs are needed (see CLAUDE.md: the
-- 2026-10-30 change only affects brand-new tables).
-- ============================================================================

BEGIN;

ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS treat_type text;

COMMIT;

SELECT count(*) AS treats, count(*) FILTER (WHERE treat_type IS NOT NULL AND treat_type <> '') AS with_type
FROM public.treats;
