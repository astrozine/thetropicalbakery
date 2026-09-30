-- ============================================================================
-- MIGRATION 32: Sugar and caffeine on every treat
-- ============================================================================
-- Two small scales per treat, for people who avoid them for their health
-- (diabetes, no refined sugar, pregnancy, sleep, anxiety, reflux). Not
-- allergens: there is no "may contain traces of sugar". Vocabulary and the
-- filters live in src/lib/sugarCaffeine.ts:
--   sugar:    'fruta' (sem açúcar adicionado) | 'nao-refinado' (coco, mascavo…) | 'cana'
--   caffeine: 'sem' | 'pouca' (cacau/chocolate) | 'com' (café, matcha, chá, guaraná…)
-- NULL = not declared yet. The site never shows NULL as "free of": a treat
-- without a value is left out of the "Sem açúcar…" / "Sem cafeína" filters,
-- and the admin card says "Falta: açúcar e cafeína" until Dolly fills it.
--
-- Nothing is backfilled on purpose: /admin/treats reads the ingredients and
-- suggests a value with a "Usar" button, but only the chocolate's label can
-- say which sugar is in it. Box treats keep the same two keys in their JSON
-- (tasting_boxes.items), which needs no migration.
--
-- Safe before or after the deploy (the admin saves without these columns and
-- says to run this file). Safe to run twice. Existing table: no new GRANTs.
-- ============================================================================

BEGIN;

ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS sugar text;
ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS caffeine text;

ALTER TABLE public.treats DROP CONSTRAINT IF EXISTS treats_sugar_check;
ALTER TABLE public.treats ADD CONSTRAINT treats_sugar_check
  CHECK (sugar IS NULL OR sugar IN ('fruta', 'nao-refinado', 'cana'));

ALTER TABLE public.treats DROP CONSTRAINT IF EXISTS treats_caffeine_check;
ALTER TABLE public.treats ADD CONSTRAINT treats_caffeine_check
  CHECK (caffeine IS NULL OR caffeine IN ('sem', 'pouca', 'com'));

COMMIT;

-- ingredients is jsonb (a JSON array), so it is shown as-is rather than joined.
SELECT name, sugar, caffeine, ingredients
FROM public.treats
ORDER BY name;
