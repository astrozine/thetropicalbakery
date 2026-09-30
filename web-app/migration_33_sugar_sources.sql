-- ============================================================================
-- MIGRATION 33: Which sugars a treat has (a list), and so whether it's integral
-- ============================================================================
-- Migration 32 gave each treat ONE sugar level. Real treats mix them: dates in
-- the base and an industrial vegan chocolate (milk, white, caramel, most dark)
-- that comes with crystal sugar. So sugar becomes a list Dolly ticks in
-- /admin/treats, from src/lib/sugarCaffeine.ts:
--   'nenhum'   Sem açúcar adicionado (alone, never with the others)
--   'fruta'    Tâmaras e frutas
--   'coco'     Açúcar de coco
--   'rapadura' Rapadura (also melado / mascavo)
--   'cristal'  Açúcar cristal, refined, from industrial vegan chocolate
-- "Integral" (whole food) is never stored: a treat is integral when its list
-- has no 'cristal'. With 'cristal' the site says "Vegano, não integral" and why.
-- NULL / empty = not declared: never shown as integral, left out of filters.
--
-- Whatever migration 32's single `sugar` held is carried over ('fruta' ->
-- fruta, 'cana' -> cristal; 'nao-refinado' can't be split into coco/rapadura,
-- so Dolly re-ticks those). The old column and its check stay for now, unused,
-- so the code that is live before the deploy keeps saving. Caffeine is unchanged.
--
-- Safe before or after the deploy (the admin saves without `sugars` and says to
-- run this file). Safe to run twice. Existing table: no new GRANTs.
-- ============================================================================

BEGIN;

ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS sugars text[];

ALTER TABLE public.treats DROP CONSTRAINT IF EXISTS treats_sugars_check;
ALTER TABLE public.treats ADD CONSTRAINT treats_sugars_check
  CHECK (sugars IS NULL OR sugars <@ ARRAY['nenhum', 'fruta', 'coco', 'rapadura', 'cristal']::text[]);

UPDATE public.treats
SET sugars = CASE sugar WHEN 'fruta' THEN ARRAY['fruta'] WHEN 'cana' THEN ARRAY['cristal'] END
WHERE sugars IS NULL AND sugar IN ('fruta', 'cana');

COMMIT;

SELECT name, sugars, caffeine, ingredients
FROM public.treats
ORDER BY name;
