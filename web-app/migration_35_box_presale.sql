-- ============================================================================
-- MIGRATION 35: Pre-sale ("encomenda da próxima semana") next to the ready box
-- ============================================================================
-- A Degustation Box is now sold one of two ways:
--   'stock'    boxes already baked (how every box worked until now): on sale until they run out,
--              and the delivery window rolls over when it passes.
--   'presale'  next week's box, ordered and paid BEFORE it is baked, so Dolly only makes what was
--              ordered. Delivered only on its planned days, and orders stop on orders_close_on.
-- One of each can be live at the same time. When the pre-sale batch is baked, the admin turns it
-- into the 'stock' box with the extra boxes as its stock (button in /admin/caixas).
--
-- Only adds a column to an existing table, so no new grants are needed. Safe to run twice.
-- Every existing box becomes 'stock', so nothing changes until a pre-sale is created.
-- ============================================================================

BEGIN;

ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS sale_mode text NOT NULL DEFAULT 'stock';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasting_boxes_sale_mode_check') THEN
    ALTER TABLE public.tasting_boxes
      ADD CONSTRAINT tasting_boxes_sale_mode_check CHECK (sale_mode IN ('stock', 'presale'));
  END IF;
END $$;

COMMIT;

-- Check: the live boxes and how each one is sold.
SELECT id, title, sale_mode, is_active, delivery_from, delivery_until, orders_close_on, total_quantity, sold_quantity
FROM public.tasting_boxes WHERE is_active ORDER BY sale_mode;
