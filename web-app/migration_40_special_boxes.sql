-- ============================================================================
-- MIGRATION 40: Special editions ("edição especial") next to the box of the week
-- ============================================================================
-- Until now at most two boxes were live: the ready weekly box and next week's pre-sale. Dolly also
-- makes themed boxes (Dia das Crianças, Natal, Páscoa...) that should be on sale AT THE SAME TIME,
-- so a customer can order one, the other, or both in the same checkout.
--
--   edition      'weekly'  the box of the week (ready or pre-sale), exactly as before. Subscribers
--                          choose their treats from it, and a new one replaces the last one of its kind.
--                'special' a themed box. Any number can be live next to the weekly ones; publishing
--                          one never takes another box off the site. Delivered only inside its own
--                          delivery days (it never rolls over to later weeks), and orders_close_on,
--                          if set, closes it.
--   fixed_price  NULL      sold in the usual 2 / 4 / 6-treat sizes at the usual prices.
--                a number  sold as it is (all its treats, one box) at this price. The server charges
--                          exactly this; the browser never says what a box costs.
--
-- Only adds columns to an existing table, so no new grants are needed. Safe to run twice.
-- Every existing box becomes 'weekly' with no fixed price, so nothing changes until Dolly uses it.
-- ============================================================================

BEGIN;

ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS edition text NOT NULL DEFAULT 'weekly';
ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS fixed_price numeric(10,2);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasting_boxes_edition_check') THEN
    ALTER TABLE public.tasting_boxes
      ADD CONSTRAINT tasting_boxes_edition_check CHECK (edition IN ('weekly', 'special'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasting_boxes_fixed_price_check') THEN
    ALTER TABLE public.tasting_boxes
      ADD CONSTRAINT tasting_boxes_fixed_price_check CHECK (fixed_price IS NULL OR fixed_price > 0);
  END IF;
END $$;

COMMIT;

-- Check: every box, how it is sold, and which are on the site.
SELECT id, title, is_active, edition, sale_mode, fixed_price, delivery_from, delivery_until, total_quantity, sold_quantity
FROM public.tasting_boxes ORDER BY is_active DESC, created_at DESC LIMIT 10;
