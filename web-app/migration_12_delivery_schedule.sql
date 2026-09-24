-- ============================================================================
-- MIGRATION 12: Recurring delivery schedule for the Degustation Boxes,
--               plus richer orders (box orders now go through the Pix checkout)
-- ============================================================================
-- The delivery calendar (migration 08) is ONLY for Degustation Boxes: single
-- box orders and subscriptions. Menu de Eventos items don't use it.
--
-- How a box date is decided:
--   1. RULES ("every Friday", "every other Thursday", "1st Saturday of the
--      month", starting on some date, optionally ending on another) generate
--      dates automatically, forever if there's no end date.
--   2. delivery_dates rows are per-day OVERRIDES on top of the rules:
--        is_open = true  -> an extra day, even if no rule produces it
--        is_open = false -> a blocked day (holiday, Dolly is away) even if a
--                           rule produces it
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.delivery_schedule_rules (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    frequency     text NOT NULL DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'monthly')),
    weekday       smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),      -- 0 = Sunday
    interval_weeks smallint NOT NULL DEFAULT 1 CHECK (interval_weeks BETWEEN 1 AND 8), -- weekly: 1 = every, 2 = every other...
    month_nth     smallint CHECK (month_nth IN (1, 2, 3, 4, -1)),          -- monthly: 1st..4th, -1 = last
    start_date    date NOT NULL DEFAULT CURRENT_DATE,
    end_date      date,                                                     -- null = "from now on"
    notes         text,
    is_active     boolean NOT NULL DEFAULT true,
    created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_schedule_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read delivery rules" ON public.delivery_schedule_rules;
CREATE POLICY "Anyone can read delivery rules"
    ON public.delivery_schedule_rules FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage delivery rules" ON public.delivery_schedule_rules;
CREATE POLICY "Admins can manage delivery rules"
    ON public.delivery_schedule_rules FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Which dates customers have already been told about (rule-generated dates
-- have no delivery_dates row to hang a "notified" flag on).
CREATE TABLE IF NOT EXISTS public.delivery_notifications (
    delivery_date date PRIMARY KEY,
    notified_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.delivery_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage delivery notifications" ON public.delivery_notifications;
CREATE POLICY "Admins can manage delivery notifications"
    ON public.delivery_notifications FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Minimum days between "today" and the earliest date a customer may choose
-- (a box needs to be made). Editable on the admin calendar page.
INSERT INTO public.site_settings (key, value, label) VALUES
    ('delivery_lead_days', 2, 'Antecedência mínima para entrega da caixa (dias)')
ON CONFLICT (key) DO NOTHING;

-- Orders: keep what the Pix checkout now collects for box orders.
-- (ADD COLUMN IF NOT EXISTS: safe whatever the orders table looked like before.)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_kind      text;   -- 'box' | 'events'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_zone   text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee    numeric;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dietary_notes   text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items_summary   text;

-- Data API access for the two new tables (Supabase no longer grants it automatically
-- from 2026-10-30; RLS above still decides who can do what).
GRANT SELECT ON public.delivery_schedule_rules TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_schedule_rules TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_notifications TO authenticated, service_role;

COMMIT;

SELECT 'rules' AS what, count(*)::text AS n FROM public.delivery_schedule_rules
UNION ALL
SELECT 'lead days', value::text FROM public.site_settings WHERE key = 'delivery_lead_days';
