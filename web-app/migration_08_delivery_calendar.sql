-- ============================================================================
-- MIGRATION 08: Delivery calendar (which dates deliveries actually go out)
-- ============================================================================
-- Today the checkout's delivery-date field is a free date picker — a customer
-- can "choose" a Tuesday even though Dolly only delivers some Saturdays. This
-- adds a real calendar of dates she opens or closes, and the checkout will
-- only let customers pick from the open ones.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.delivery_dates (
    delivery_date DATE PRIMARY KEY,
    is_open       BOOLEAN NOT NULL DEFAULT false,
    notes         TEXT, -- e.g. "Edição Outono", "Só até 15h"
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_dates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read delivery dates" ON public.delivery_dates;
CREATE POLICY "Anyone can read delivery dates"
    ON public.delivery_dates FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage delivery dates" ON public.delivery_dates;
CREATE POLICY "Admins can manage delivery dates"
    ON public.delivery_dates FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Tracks whether we've already e-mailed customers about a given open date,
-- so re-opening the admin page never sends a second blast for the same date.
ALTER TABLE public.delivery_dates
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

COMMIT;

-- Verification
SELECT delivery_date, is_open, notes FROM public.delivery_dates ORDER BY delivery_date;
