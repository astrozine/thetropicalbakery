-- ============================================================================
-- MIGRATION 25: A shorter allergen list, scoped to our kitchen
-- ============================================================================
-- Everything we make is plant-based and made without gluten, so the long legal
-- list (23 items: milk, eggs, fish, crustaceans, mustard, celery, lupin...) is
-- now 6, the ones a plant-based kitchen really handles:
--
--     castanhas, amendoim, coco, gergelim, soja, aveia
--
-- (src/lib/allergens.ts). Vegan / no gluten in the recipe / no refined sugar
-- are said once for the whole kitchen (KITCHEN_FACTS) instead of per treat.
--
-- This rewrites the ids already stored so they match:
--   * the nine separate nuts (castanha-caju, amendoa, noz...) -> 'castanhas'
--   * anything no longer on the list (gluten, leite, ovos...) is removed
--   * a CUSTOMER who marked gluten as an allergy gets the 'sem-gluten' tag
--     (and is_gluten_free) instead, so nobody's gluten concern is lost
--
-- Tables: treats (contains / may_contain, jsonb), tasting_boxes.items (jsonb,
-- each treat's contains / may_contain), and allergens_avoid on user_profiles,
-- users, email_contacts and orders (text[]).
--
-- The site already reads the old ids correctly (normalizeAllergens), so it works
-- before and after this runs. Only rewrites data. Safe to run twice.
-- ============================================================================

BEGIN;

-- Helpers live in pg_temp, so they disappear on their own when this session ends.
CREATE OR REPLACE FUNCTION pg_temp.trim_allergens(a text[]) RETURNS text[]
LANGUAGE sql IMMUTABLE AS $$
    SELECT COALESCE(array_agg(DISTINCT m ORDER BY m), '{}')
    FROM (
        SELECT CASE WHEN x IN ('castanha-caju', 'castanha-brasil', 'amendoa', 'avela', 'noz',
                               'noz-peca', 'pistache', 'macadamia', 'pinoli')
                    THEN 'castanhas' ELSE x END AS m
        FROM unnest(COALESCE(a, '{}')) AS x
    ) s
    WHERE m IN ('castanhas', 'amendoim', 'coco', 'gergelim', 'soja', 'aveia');
$$;

CREATE OR REPLACE FUNCTION pg_temp.trim_allergens_json(j jsonb) RETURNS jsonb
LANGUAGE sql IMMUTABLE AS $$
    SELECT to_jsonb(pg_temp.trim_allergens(ARRAY(
        SELECT jsonb_array_elements_text(CASE WHEN jsonb_typeof(j) = 'array' THEN j ELSE '[]'::jsonb END)
    )));
$$;

-- 1. Menu de Eventos treats -----------------------------------------------------
UPDATE public.treats
   SET contains    = pg_temp.trim_allergens_json(contains),
       may_contain = pg_temp.trim_allergens_json(may_contain)
 WHERE contains    IS DISTINCT FROM pg_temp.trim_allergens_json(contains)
    OR may_contain IS DISTINCT FROM pg_temp.trim_allergens_json(may_contain);

-- 2. Treats inside each tasting box -----------------------------------------------
UPDATE public.tasting_boxes b
   SET items = (
        SELECT COALESCE(jsonb_agg(
                   item
                   || jsonb_build_object('contains',    pg_temp.trim_allergens_json(item -> 'contains'))
                   || jsonb_build_object('may_contain', pg_temp.trim_allergens_json(item -> 'may_contain'))
                   ORDER BY ord), '[]'::jsonb)
        FROM jsonb_array_elements(b.items) WITH ORDINALITY AS t(item, ord)
   )
 WHERE jsonb_typeof(b.items) = 'array' AND jsonb_array_length(b.items) > 0;

-- 3. Customers: gluten as an allergy becomes the "Sem Glúten" tag ------------------
UPDATE public.user_profiles
   SET diet_tags = CASE WHEN 'sem-gluten' = ANY(diet_tags) THEN diet_tags ELSE diet_tags || ARRAY['sem-gluten'] END,
       is_gluten_free = TRUE
 WHERE 'gluten' = ANY(allergens_avoid);

UPDATE public.users
   SET diet_tags = CASE WHEN 'sem-gluten' = ANY(diet_tags) THEN diet_tags ELSE diet_tags || ARRAY['sem-gluten'] END,
       is_gluten_free = TRUE
 WHERE 'gluten' = ANY(allergens_avoid);

UPDATE public.email_contacts
   SET diet_tags = CASE WHEN 'sem-gluten' = ANY(diet_tags) THEN diet_tags ELSE diet_tags || ARRAY['sem-gluten'] END
 WHERE 'gluten' = ANY(allergens_avoid);

UPDATE public.orders
   SET diet_tags = CASE WHEN 'sem-gluten' = ANY(diet_tags) THEN diet_tags ELSE diet_tags || ARRAY['sem-gluten'] END
 WHERE 'gluten' = ANY(allergens_avoid);

-- 4. ...then everyone's allergy list in today's ids --------------------------------
UPDATE public.user_profiles  SET allergens_avoid = pg_temp.trim_allergens(allergens_avoid)
 WHERE allergens_avoid IS DISTINCT FROM pg_temp.trim_allergens(allergens_avoid);
UPDATE public.users          SET allergens_avoid = pg_temp.trim_allergens(allergens_avoid)
 WHERE allergens_avoid IS DISTINCT FROM pg_temp.trim_allergens(allergens_avoid);
UPDATE public.email_contacts SET allergens_avoid = pg_temp.trim_allergens(allergens_avoid)
 WHERE allergens_avoid IS DISTINCT FROM pg_temp.trim_allergens(allergens_avoid);
UPDATE public.orders         SET allergens_avoid = pg_temp.trim_allergens(allergens_avoid)
 WHERE allergens_avoid IS DISTINCT FROM pg_temp.trim_allergens(allergens_avoid);

COMMIT;

-- Check: every id still stored, and how often. Only the six should appear.
SELECT id, count(*) FROM (
    SELECT jsonb_array_elements_text(contains) AS id FROM public.treats
    UNION ALL SELECT jsonb_array_elements_text(may_contain) FROM public.treats
    UNION ALL SELECT jsonb_array_elements_text(i -> 'contains') FROM public.tasting_boxes, jsonb_array_elements(items) i
    UNION ALL SELECT jsonb_array_elements_text(i -> 'may_contain') FROM public.tasting_boxes, jsonb_array_elements(items) i
    UNION ALL SELECT unnest(allergens_avoid) FROM public.user_profiles
    UNION ALL SELECT unnest(allergens_avoid) FROM public.users
    UNION ALL SELECT unnest(allergens_avoid) FROM public.email_contacts
) all_ids
GROUP BY id ORDER BY count(*) DESC;
