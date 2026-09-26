-- ============================================================================
-- MIGRATION 24: Box sizes (2, 4 or 6 treats), a photo gallery per box, and
--               the size on every subscription
-- ============================================================================
-- 1. The three box prices become settings Dolly edits in /admin/caixas:
--      box_price_2 = 59, box_price_4 = 99, box_price_6 = 129
--    The server prices every box order from these (never from the browser).
-- 2. tasting_boxes.gallery: extra photos of THIS box, shown on the /caixas hero
--    (the hero used to show photos of earlier boxes).
-- 3. subscriptions.box_size: 2, 4 or 6 treats per box (existing ones = 4).
--    create_subscription takes p_box_size and prices the plan for that size with
--    the plan's usual discount (Trimestral ~10% off, Anual ~20% off, on every size).
--    Same sum as planBoxPrice() in src/lib/boxSizes.ts.
--
-- Treat NAMES need no change here: each treat inside a box already has a name
-- (tasting_boxes.items, migration 13) and can be linked to the Menu de Eventos.
--
-- Only adds columns, settings rows and replaces one function. Safe to run twice.
-- The site works before and after it runs.
-- ============================================================================

BEGIN;

-- 1. Prices per size ---------------------------------------------------------
INSERT INTO public.site_settings (key, value, label) VALUES
    ('box_price_2', 59,  'Caixa de Degustação com 2 doces (R$)'),
    ('box_price_4', 99,  'Caixa de Degustação com 4 doces (R$)'),
    ('box_price_6', 129, 'Caixa de Degustação com 6 doces (R$)')
ON CONFLICT (key) DO NOTHING;

-- 2. Photos of the current box ------------------------------------------------
ALTER TABLE public.tasting_boxes ADD COLUMN IF NOT EXISTS gallery jsonb NOT NULL DEFAULT '[]'::jsonb;

-- 3. Size on subscriptions ------------------------------------------------------
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS box_size integer NOT NULL DEFAULT 4;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_box_size_check') THEN
        ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_box_size_check CHECK (box_size IN (2, 4, 6));
    END IF;
END $$;

-- The old signature is dropped first: keeping both would make the site's call ambiguous.
DROP FUNCTION IF EXISTS public.create_subscription(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, INTEGER, NUMERIC, TEXT, TEXT
);

CREATE OR REPLACE FUNCTION public.create_subscription(
    p_plan_id            TEXT,
    p_full_name          TEXT,
    p_whatsapp_number    TEXT,
    p_email              TEXT    DEFAULT NULL,
    p_delivery_zone      TEXT    DEFAULT NULL,
    p_address_street     TEXT    DEFAULT NULL,
    p_address_number     TEXT    DEFAULT NULL,
    p_address_complement TEXT    DEFAULT NULL,
    p_address_neighborhood TEXT  DEFAULT NULL,
    p_address_city       TEXT    DEFAULT NULL,
    p_address_postal_code TEXT   DEFAULT NULL,
    p_address_reference  TEXT    DEFAULT NULL,
    p_is_vegan           BOOLEAN DEFAULT FALSE,
    p_is_gluten_free     BOOLEAN DEFAULT FALSE,
    p_is_sugar_free      BOOLEAN DEFAULT FALSE,
    p_is_salt_free       BOOLEAN DEFAULT FALSE,
    p_is_oil_free        BOOLEAN DEFAULT FALSE,
    p_allergies          TEXT    DEFAULT NULL,
    p_boxes_per_week     INTEGER DEFAULT 1,
    p_delivery_fee       NUMERIC DEFAULT 0,
    p_referred_by        TEXT    DEFAULT NULL,
    p_customer_message   TEXT    DEFAULT NULL,
    p_box_size           INTEGER DEFAULT 4
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan       public.subscription_plans;
    v_id         UUID;
    v_oneline    TEXT;
    v_size       INTEGER := CASE WHEN p_box_size IN (2, 4, 6) THEN p_box_size ELSE 4 END;
    v_bpw        INTEGER := GREATEST(1, COALESCE(p_boxes_per_week, 1));
    v_size_price NUMERIC;
    v_base       NUMERIC;
    v_per_box    NUMERIC;
BEGIN
    IF COALESCE(TRIM(p_full_name), '') = '' OR COALESCE(TRIM(p_whatsapp_number), '') = '' THEN
        RAISE EXCEPTION 'Nome e WhatsApp são obrigatórios';
    END IF;

    SELECT * INTO v_plan FROM public.subscription_plans
    WHERE id = p_plan_id AND is_active;

    IF v_plan.id IS NULL THEN
        RAISE EXCEPTION 'Plano inválido';
    END IF;

    -- Price of one box of this size in this plan (whole reais).
    SELECT value INTO v_size_price FROM public.site_settings WHERE key = 'box_price_' || v_size;
    SELECT max(price_per_box) INTO v_base FROM public.subscription_plans WHERE is_active;
    IF v_size_price IS NULL OR v_size_price <= 0 OR v_base IS NULL OR v_base <= 0 THEN
        v_per_box := v_plan.price_per_box;
    ELSE
        v_per_box := round(v_size_price * v_plan.price_per_box / v_base);
    END IF;

    v_oneline := NULLIF(CONCAT_WS(', ',
        NULLIF(TRIM(CONCAT_WS(' ', NULLIF(TRIM(p_address_street), ''), NULLIF(TRIM(p_address_number), ''))), ''),
        NULLIF(TRIM(p_address_complement), ''),
        NULLIF(TRIM(p_address_neighborhood), ''),
        NULLIF(TRIM(p_address_city), ''),
        NULLIF(TRIM(p_address_postal_code), '')
    ), '');

    INSERT INTO public.subscriptions (
        user_id, plan_id, status, boxes_per_week, box_size,
        full_name, whatsapp_number, email,
        delivery_zone, address_street, address_number, address_complement,
        address_neighborhood, address_city, address_postal_code, address_reference, address_oneline,
        is_vegan, is_gluten_free, is_sugar_free, is_salt_free, is_oil_free, allergies,
        monthly_price, delivery_fee,
        next_delivery_on, committed_until,
        referred_by, customer_message
    )
    VALUES (
        auth.uid(), v_plan.id, 'pending', v_bpw, v_size,
        TRIM(p_full_name), TRIM(p_whatsapp_number), NULLIF(TRIM(p_email), ''),
        p_delivery_zone, p_address_street, p_address_number, p_address_complement,
        p_address_neighborhood, p_address_city, p_address_postal_code, p_address_reference, v_oneline,
        p_is_vegan, p_is_gluten_free, p_is_sugar_free, p_is_salt_free, p_is_oil_free,
        NULLIF(TRIM(p_allergies), ''),
        v_per_box * 4 * v_bpw,
        COALESCE(p_delivery_fee, 0),
        -- Boxes go out on Saturdays; point them at the next one.
        (CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INT + 7) % 7 + 1) * INTERVAL '1 day')::DATE,
        (CURRENT_DATE + (v_plan.commitment_months || ' months')::INTERVAL)::DATE,
        NULLIF(TRIM(p_referred_by), ''), NULLIF(TRIM(p_customer_message), '')
    )
    RETURNING id INTO v_id;

    -- Also keep the CRM in step, so a subscriber shows up in the customer list like everyone else.
    BEGIN
        PERFORM public.upsert_crm_customer(
            TRIM(p_full_name), TRIM(p_whatsapp_number), v_oneline, NULLIF(TRIM(p_email), ''),
            p_is_vegan, p_is_gluten_free, p_is_sugar_free, p_is_salt_free, p_is_oil_free
        );
    EXCEPTION WHEN OTHERS THEN
        -- A CRM hiccup must never lose us a subscription.
        NULL;
    END;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_subscription(
    TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT,
    BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, INTEGER, NUMERIC, TEXT, TEXT, INTEGER
) TO anon, authenticated;

COMMIT;

-- Check: three prices, the two new columns, and one create_subscription.
SELECT key, value FROM public.site_settings WHERE key LIKE 'box_price_%' ORDER BY key;
SELECT
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'tasting_boxes' AND column_name = 'gallery') AS box_gallery,
    (SELECT count(*) FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'box_size') AS sub_box_size,
    (SELECT count(*) FROM pg_proc WHERE proname = 'create_subscription') AS create_subscription_versions;
