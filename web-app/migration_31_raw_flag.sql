-- ============================================================================
-- MIGRATION 31: "Raw" becomes a yes/no on every treat, not a treat type
-- ============================================================================
-- Raw is how a treat is made (no oven, nothing above ~42 °C), not what it is:
-- a raw cheesecake is still a cake. So it moves out of treats.treat_type into
-- its own column, and the Menu de Eventos shows it as a green leaf tag plus a
-- "Todos / Raw / Do forno" switch that crosses with the type pills
-- (src/lib/treatTypes.ts: RAW, isRaw). 'cake-pops' was added as a type at the
-- same time; types are free text, so that one needs nothing here.
--
-- Treats that were typed 'raw' get is_raw = true and lose that type. Two get
-- their real kind straight away, from their own descriptions: Varinhas
-- Tropicais ("pequenos bolos crus em forma de pirulito") is the cake pop, and
-- Esmeraldas de Menta ("pequenos cheesecakes crus") joins the other cheesecake
-- in Bolos. Ruby Berry Beijo shows under "Outros" until Dolly picks its kind in
-- /admin/treats. Only rows still typed 'raw' are touched, so a type Dolly has
-- already chosen is never overwritten.
--
-- Safe before or after the deploy: the code reads treat_type = 'raw' as raw
-- and falls back when the column is missing. Safe to run twice. The table
-- already exists, so no new GRANTs are needed.
-- ============================================================================

BEGIN;

ALTER TABLE public.treats ADD COLUMN IF NOT EXISTS is_raw boolean NOT NULL DEFAULT false;

UPDATE public.treats
SET is_raw = true,
    treat_type = CASE
      WHEN name ILIKE '%varinhas tropicais%' THEN 'cake-pops'
      WHEN name ILIKE '%esmeraldas de menta%' THEN 'bolos'
      ELSE NULL
    END
WHERE treat_type = 'raw';

COMMIT;

SELECT name, is_raw, treat_type
FROM public.treats
ORDER BY is_raw DESC, treat_type NULLS LAST, name;
