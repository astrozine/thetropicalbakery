-- ============================================================================
-- MIGRATION 29: "Bolos & Tarteletes" becomes two groups (plus Cupcakes)
-- ============================================================================
-- The Menu de Eventos type 'bolos-tarteletes' was split into 'bolos' and
-- 'tarteletes', and 'cupcakes' was added (src/lib/treatTypes.ts). The vocabulary
-- lives in code, so the only thing to do here is move the rows that still carry
-- the old id. They all become 'bolos' (on 2026-09-29 the only one was the
-- Romeu & Julieta cheesecake); Dolly re-files any tartelette in /admin/treats.
--
-- Safe to run before or after the deploy: the code already reads the old id as
-- 'bolos' (normalizeTreatType). Safe to run twice. No new table, no GRANTs.
-- ============================================================================

BEGIN;

UPDATE public.treats SET treat_type = 'bolos' WHERE treat_type = 'bolos-tarteletes';

COMMIT;

SELECT treat_type, count(*) AS treats
FROM public.treats
GROUP BY treat_type
ORDER BY treat_type NULLS LAST;
