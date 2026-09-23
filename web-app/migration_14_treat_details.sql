-- ============================================================================
-- MIGRATION 14: Ingredients + allergens on the Menu de Eventos treats
-- ============================================================================
-- Treats in the Menu de Eventos (public.treats) now carry the same details as
-- the treats inside a Degustation Box (migration 13): an emoji, a list of
-- ingredients, the allergens they contain, and the allergens they may contain
-- (cross-contamination). Allergen ids are the ones in src/lib/allergens.ts.
--
-- A treat can be shared between the two: box items keep a `treat_id` pointing
-- at the treats row, and the admin keeps both sides in step.
-- ============================================================================

BEGIN;

ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS emoji       text;
ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS ingredients jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS contains    jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS may_contain jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;

SELECT count(*) AS treats, count(*) FILTER (WHERE jsonb_array_length(ingredients) > 0) AS with_ingredients
FROM public.treats;
