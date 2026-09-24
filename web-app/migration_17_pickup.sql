-- ============================================================================
-- MIGRATION 17: Pickup ("Retirada") orders, with a private pickup address
-- ============================================================================
-- The bakery is a home bakery, so its street address is NOT published anywhere
-- on the site. It is shown only to a signed-in customer who has a pickup order
-- whose payment has been confirmed, on their Minha Conta page.
--
--   * orders.fulfillment  'delivery' | 'pickup'
--   * orders.user_id      the signed-in customer who placed it (if any)
--   * pickup_info         ONE row: the address + how-to-pick-up notes.
--                         Admins only. Not readable by the public, and not in
--                         the site's code either.
--   * my_pickup_orders()  what Minha Conta calls. Returns the caller's own
--                         pickup orders and hands out the address only once the
--                         admin has marked the order "Pagamento Confirmado" or
--                         later, and not any more after it's been picked up.
--
-- After running this, fill in the address at Admin > Calendário de Entregas >
-- "Retirada no home bakery".
-- ============================================================================

BEGIN;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment text;   -- 'delivery' | 'pickup'
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders (user_id) WHERE user_id IS NOT NULL;

-- ---------------------------------------------------------------- private info
CREATE TABLE IF NOT EXISTS public.pickup_info (
    id           smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),   -- exactly one row
    address      text NOT NULL DEFAULT '',
    instructions text NOT NULL DEFAULT '',                        -- hours, gate, "ring the bell"...
    updated_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.pickup_info (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.pickup_info ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage pickup info" ON public.pickup_info;
CREATE POLICY "Admins can manage pickup info"
    ON public.pickup_info FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Data API access. Deliberately NO grant to anon: visitors can never read this table.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pickup_info TO authenticated, service_role;

-- ------------------------------------------------------------- order progress
-- The admin inbox keeps each order's step here. Same definition as migration 09;
-- created here too (IF NOT EXISTS) so this migration runs on its own.
CREATE TABLE IF NOT EXISTS public.inbox_status (
    source_table TEXT NOT NULL,
    source_id    TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'new',
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (source_table, source_id)
);

ALTER TABLE public.inbox_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage inbox status" ON public.inbox_status;
CREATE POLICY "Admins can manage inbox status"
    ON public.inbox_status FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.inbox_status TO authenticated, service_role;

-- ------------------------------------------------------------- customer lookup
-- Order progress lives in inbox_status (the admin inbox), using the same steps:
--   new -> confirmed -> preparing -> shipped ("Pronta para retirada") -> delivered ("Retirado")
CREATE OR REPLACE FUNCTION public.my_pickup_orders()
RETURNS TABLE (
    order_id            text,
    requested_date      date,
    items_summary       text,
    total_price         numeric,
    stage               text,     -- awaiting_payment | confirmed | preparing | ready | picked_up
    pickup_address      text,     -- null until payment is confirmed, and again once picked up
    pickup_instructions text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        o.id::text,
        o.requested_date,
        o.items_summary,
        o.total_price::numeric,
        CASE COALESCE(s.status, 'new')
            WHEN 'confirmed' THEN 'confirmed'
            WHEN 'preparing' THEN 'preparing'
            WHEN 'shipped'   THEN 'ready'
            WHEN 'delivered' THEN 'picked_up'
            ELSE 'awaiting_payment'
        END,
        CASE WHEN COALESCE(s.status, 'new') IN ('confirmed', 'preparing', 'shipped')
             THEN NULLIF(p.address, '') END,
        CASE WHEN COALESCE(s.status, 'new') IN ('confirmed', 'preparing', 'shipped')
             THEN NULLIF(p.instructions, '') END
    FROM public.orders o
    LEFT JOIN public.inbox_status s
           ON s.source_table = 'orders' AND s.source_id = o.id::text
    LEFT JOIN public.pickup_info p ON p.id = 1
    WHERE o.fulfillment = 'pickup'
      AND auth.uid() IS NOT NULL
      AND (
            o.user_id = auth.uid()
            OR (COALESCE(auth.jwt() ->> 'email', '') <> ''
                AND lower(o.customer_email) = lower(auth.jwt() ->> 'email'))
          )
      AND (o.requested_date IS NULL OR o.requested_date >= current_date - 14)
    ORDER BY o.requested_date NULLS LAST, o.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.my_pickup_orders() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_pickup_orders() TO authenticated;

COMMIT;

SELECT 'pickup_info rows' AS what, count(*)::text AS n FROM public.pickup_info
UNION ALL
SELECT 'anon can read pickup_info?',
       has_table_privilege('anon', 'public.pickup_info', 'SELECT')::text;   -- must say false
