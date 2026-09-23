-- ============================================================================
-- MIGRATION 13: Each treat inside a Degustation Box, one by one
-- ============================================================================
-- Until now a box had a single paragraph "description". Now a box also carries
-- an ordered list of treats, stored as JSON on the box itself, each with:
--   id, name, emoji, description, image_url,
--   ingredients  (list of text),
--   contains     (list of allergen ids, see src/lib/allergens.ts),
--   may_contain  (list of allergen ids: cross-contamination, "pode conter")
-- The public /caixas page builds its accordion (and the box-wide allergen
-- summary) from this list; the paragraph description becomes an optional intro.
-- ============================================================================

BEGIN;

ALTER TABLE public.tasting_boxes
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMIT;

SELECT id, title, jsonb_array_length(items) AS treats FROM public.tasting_boxes ORDER BY created_at DESC;
