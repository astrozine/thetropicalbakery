-- ============================================================================
-- MIGRATION 04: Retreat room pricing (Airbnb-equivalent rate + capacity)
-- ============================================================================
-- Run this once in the Supabase SQL editor. It only adds columns to the
-- existing `retreat_rooms` table, so it's safe to run even if rows already
-- exist — nothing is deleted or overwritten beyond the defaults below.
--
-- `airbnb_nightly_rate` is what the room actually rents for as a plain stay
-- on Airbnb (copy it from the live listing). The public retreat package price
-- is that rate PLUS the Tropical Bakery immersion fee (see
-- src/lib/retreatPricing.ts) — the room stays booked at market rate, the
-- workshops/food/activities are what's being sold on top of it.
-- ============================================================================

BEGIN;

ALTER TABLE public.retreat_rooms
  ADD COLUMN IF NOT EXISTS airbnb_nightly_rate numeric(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_guests integer NOT NULL DEFAULT 2;

-- Seed the known capacities for the three existing suites so the calculator
-- has sensible guest limits from day one. Andrew/Dolly still need to fill in
-- the real nightly rates in /admin/retreats.
UPDATE public.retreat_rooms SET max_guests = 6 WHERE id = 'penthouse';
UPDATE public.retreat_rooms SET max_guests = 3 WHERE id = 'big_suite';
UPDATE public.retreat_rooms SET max_guests = 2 WHERE id = 'small_suite';

COMMIT;

-- Verification
SELECT id, name, airbnb_nightly_rate, max_guests FROM public.retreat_rooms ORDER BY id;
