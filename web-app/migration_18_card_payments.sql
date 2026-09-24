-- ============================================================================
-- MIGRATION 18: Card (Mercado Pago) and PayPal payments
-- ============================================================================
-- Pix stays exactly as it was (Dolly confirms it by hand). Card and PayPal
-- payments confirm themselves: the payment company tells the site, the site
-- checks with them, and then marks the order paid.
--
-- This only adds a few columns to `orders` so we can see how and when an order
-- was paid. Safe to run more than once.
-- ============================================================================

BEGIN;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_provider text;         -- 'pix' | 'mercadopago' | 'paypal'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id       text;         -- the provider's own payment number
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid_at          timestamptz;

-- The site looks orders up by this reference when a payment comes back.
CREATE INDEX IF NOT EXISTS orders_pix_transaction_idx ON public.orders (pix_transaction_id);

COMMIT;
