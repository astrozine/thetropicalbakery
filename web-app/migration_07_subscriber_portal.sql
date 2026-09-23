-- ============================================================================
-- MIGRATION 07: Subscriber portal (box photo + customer's own delivery calendar)
-- ============================================================================
-- Two small gaps this closes:
-- 1. subscription_plans had no photo, so /minha-conta had nothing to show a
--    subscriber for "your box" — adds image_url, seeded with an existing
--    real box photo so it looks right immediately.
-- 2. subscription_deliveries could only be read by admins, so a logged-in
--    subscriber couldn't see their own delivery calendar at all. Adds a
--    read policy scoped to their own subscription(s), same pattern as the
--    existing "Customers can read their own subscription" policy.
-- ============================================================================

BEGIN;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS image_url text;

UPDATE public.subscription_plans SET image_url = '/box2.jpg' WHERE image_url IS NULL;

DROP POLICY IF EXISTS "Customers can read their own deliveries" ON public.subscription_deliveries;
CREATE POLICY "Customers can read their own deliveries"
    ON public.subscription_deliveries FOR SELECT TO authenticated
    USING (
        subscription_id IN (SELECT id FROM public.subscriptions WHERE user_id = auth.uid())
    );

COMMIT;

-- Verification
SELECT id, name, image_url FROM public.subscription_plans ORDER BY sort_order;
