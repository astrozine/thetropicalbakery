-- ============================================================================
-- MIGRATION 46: Subscription plans say only what is true of the treats
-- ============================================================================
-- The Mensal plan card on /assinatura still promised "100% vegano, sem glúten e sem açúcar refinado",
-- written before the site's claims were corrected: no recipe uses wheat, but traces of gluten are
-- possible (bought-in flours), and the vegan chocolate some treats use comes with sugar. The rest of
-- the site already says "sem trigo" (see KITCHEN_FACTS in src/lib/allergens.ts); this brings the plan
-- in line. Only that one line changes; Dolly's other perks are untouched.
--
-- Also re-applies migration 44 (proposals can sell a "pacote"), which only widens an allowed list and
-- cannot be checked from outside the database. Running it again is harmless.
--
-- Safe to run twice. No deploy order: run it any time.
-- ============================================================================

BEGIN;

UPDATE public.subscription_plans
   SET perks = array_replace(perks,
         '100% vegano, sem glúten e sem açúcar refinado',
         '100% vegano e sem trigo nas receitas')
 WHERE '100% vegano, sem glúten e sem açúcar refinado' = ANY (perks);

-- Migration 44, again (idempotent).
ALTER TABLE public.payment_offers DROP CONSTRAINT IF EXISTS payment_offers_kind_check;
ALTER TABLE public.payment_offers ADD CONSTRAINT payment_offers_kind_check CHECK (kind IN ('retiro', 'curso', 'pacote'));

COMMIT;

-- Check: every plan's perks, and no row left with the old claim (expect old_claim = false everywhere).
SELECT id, perks,
       EXISTS (SELECT 1 FROM unnest(perks) p WHERE p ILIKE '%glúten%' OR p ILIKE '%refinado%') AS old_claim
  FROM public.subscription_plans
 ORDER BY sort_order;
