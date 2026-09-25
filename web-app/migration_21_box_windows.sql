-- ============================================================================
-- MIGRATION 21: Delivery window and ordering window for each Degustation Box
-- ============================================================================
-- A box edition now has:
--   delivery_from / delivery_until  the days this edition goes out. Each customer still
--                                   picks their own day, but only open calendar days
--                                   inside this window are offered.
--   orders_open_from                first day orders are accepted (empty = open now)
--   orders_close_on                 last day orders are accepted (empty = worked out from the
--                                   delivery window and the minimum notice in the calendar)
-- Ordering also stops by itself when the box sells out.
--
-- Only adds columns to an existing table, so no new grants are needed. Safe to run twice.
-- Boxes without these dates keep working exactly as before.
-- ============================================================================

BEGIN;

ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS delivery_from    date;
ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS delivery_until   date;
ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS orders_open_from date;
ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS orders_close_on  date;

COMMIT;

SELECT id, title, delivery_from, delivery_until, orders_open_from, orders_close_on FROM public.tasting_boxes WHERE is_active;
