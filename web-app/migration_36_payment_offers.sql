-- ============================================================================
-- MIGRATION 36: Payment proposals ("propostas") for courses and retreats
-- ============================================================================
-- Dolly writes a personal offer for someone who showed interest in a course or a retreat
-- (/admin/propostas) and sends them the link /proposta/<id>. That page sells it and takes the
-- payment (Pix, card, international card, PayPal). Paying creates a normal order (reference PRP…)
-- so it lands in the inbox like every other order; order_reference links the two.
--
-- Private table: only admins read or write it. The client's page reads its one row on the server
-- with the service key, by its unguessable id. Safe to run twice.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.payment_offers (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              text NOT NULL DEFAULT 'retiro' CHECK (kind IN ('retiro', 'curso')),
  lang              text NOT NULL DEFAULT 'pt' CHECK (lang IN ('pt', 'en')),
  customer_name     text NOT NULL,
  customer_email    text,
  customer_whatsapp text,
  title             text NOT NULL,
  dates_label       text,
  price             numeric(10,2) NOT NULL CHECK (price > 0),
  anchor_price      numeric(10,2),
  included          jsonb NOT NULL DEFAULT '[]'::jsonb,
  bonuses           jsonb NOT NULL DEFAULT '[]'::jsonb,
  note              text,
  image_url         text,
  expires_on        date,
  status            text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'cancelled')),
  order_reference   text,
  lead_source       text,
  lead_id           text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_offers_created_idx ON public.payment_offers (created_at DESC);

ALTER TABLE public.payment_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage payment offers" ON public.payment_offers;
CREATE POLICY "Admins manage payment offers" ON public.payment_offers
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- New table: Supabase no longer grants Data API access by itself. Admins (authenticated + is_admin)
-- and the server only; the public never reads this table.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_offers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_offers TO service_role;

COMMIT;

-- Check: the table exists and is empty (or holds the proposals sent so far).
SELECT count(*) AS proposals FROM public.payment_offers;
