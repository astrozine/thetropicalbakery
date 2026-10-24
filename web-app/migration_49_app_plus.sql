-- migration_49_app_plus.sql
--
-- Tropical+ of the "Bateu Vontade?" app becomes its own little product: a one-time purchase (orders.order_kind
-- 'app', reference APP…), lifetime, tied to the buyer's account. And every signed-in person gets ONE craving plan
-- in full as a gift, so they try the paid part before paying anything.
--
--   is_tropical_plus()   now also true for a paid app purchase (card: status PAID; Pix: confirmed by Dolly in the
--                        inbox). Box buyers and subscribers keep it, as a thank-you.
--   app_free_plan        the one gifted plan per person (which craving, when). Written only by the server
--                        (/api/vontade/plan, service key); the person can read their own row.
--
-- Safe to run more than once. Needs migration 48.

BEGIN;

CREATE OR REPLACE FUNCTION public.is_tropical_plus()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;
    -- Bought the app's Tropical+.
    IF EXISTS (
        SELECT 1 FROM public.orders o
        WHERE o.user_id = auth.uid()
          AND (o.order_kind = 'app' OR o.pix_transaction_id LIKE 'APP%')
          AND (
              upper(coalesce(o.status, '')) = 'PAID'
              OR EXISTS (
                  SELECT 1 FROM public.inbox_status i
                  WHERE i.source_table = 'orders' AND i.source_id = o.id::text
                    AND i.status NOT IN ('new', 'cancelled')
              )
          )
    ) THEN
        RETURN true;
    END IF;
    -- A thank-you for the bakery's own customers.
    IF EXISTS (SELECT 1 FROM public.subscriptions WHERE user_id = auth.uid() AND status IS DISTINCT FROM 'cancelled') THEN
        RETURN true;
    END IF;
    RETURN COALESCE((public.my_journey() ->> 'paid_boxes')::int, 0) >= 1;
END;
$$;
REVOKE ALL ON FUNCTION public.is_tropical_plus() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tropical_plus() TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.app_free_plan (
    user_id     uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- chocolate | cremoso | fresquinho | crocante | salgadinho | umami | queijo | frito | refri | paoemassa
    craving     text NOT NULL,
    claimed_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.app_free_plan ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS app_free_plan_own ON public.app_free_plan;
CREATE POLICY app_free_plan_own ON public.app_free_plan
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin());
GRANT SELECT ON public.app_free_plan TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_free_plan TO service_role;

COMMIT;

-- Verification: the function exists and the table is empty.
SELECT public.is_tropical_plus() AS plus_for_this_session, (SELECT count(*) FROM public.app_free_plan) AS gifted_plans;
