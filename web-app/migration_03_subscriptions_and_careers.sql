-- ============================================================================
-- THE TROPICAL BAKERY — Migration 03
-- Weekly tasting-box subscriptions, richer customer profiles, and job applications.
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> New query ->
--             select ALL of this file (Ctrl+A, Ctrl+C) -> paste -> Run.
--             It runs as one transaction: either all of it applies, or none.
--             Running it twice is safe.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PART 1 — A proper delivery address, split into fields
--
-- One free-text address box means we get "Rua Quatorze, Casa 114, Praia do
-- Itamambuca, Ubatuba" with no CEP, and whoever is delivering has to guess.
-- Separate fields also let us group the weekly route by neighbourhood.
--
-- The old single `address` column is kept and still filled in, so nothing that
-- reads it breaks. It becomes the assembled one-line version.
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_street       TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_number       TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_complement   TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_neighborhood TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_city         TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_state        TEXT DEFAULT 'SP';
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_postal_code  TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address_reference    TEXT;


-- ----------------------------------------------------------------------------
-- PART 2 — Everything else worth knowing about a customer
--
-- These are the things that let Dolly treat someone like a regular instead of
-- an order number: allergies she must never get wrong, a birthday worth a
-- surprise box, how many people the box is feeding.
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS birth_date        DATE;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS allergies         TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS household_size    INTEGER;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS favorite_flavors  TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS avoid_ingredients TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS how_found_us      TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS customer_notes    TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS marketing_opt_in  BOOLEAN DEFAULT TRUE;


-- ----------------------------------------------------------------------------
-- PART 3 — Subscription plans
--
-- Kept in the database, not in the website's code, so prices and perks can be
-- changed from the Supabase table editor without touching the site.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    tagline         TEXT,
    -- How many months the customer commits to. 1 = no commitment.
    commitment_months INTEGER NOT NULL DEFAULT 1,
    boxes_per_week  INTEGER NOT NULL DEFAULT 1,
    -- What they pay each month. Always shown as the monthly figure, because
    -- that is the number people actually compare.
    monthly_price   NUMERIC(10,2) NOT NULL,
    price_per_box   NUMERIC(10,2) NOT NULL,
    badge           TEXT,
    perks           TEXT[] NOT NULL DEFAULT '{}',
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans"
    ON public.subscription_plans FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans"
    ON public.subscription_plans FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Seeded from the current R$99 box price. Change these rows freely.
INSERT INTO public.subscription_plans
    (id, name, tagline, commitment_months, boxes_per_week, monthly_price, price_per_box, badge, perks, sort_order)
VALUES
    ('mensal', 'Mensal', 'Para começar o ritual, sem compromisso.', 1, 1, 396.00, 99.00, NULL,
     ARRAY[
        'Uma Caixa de Degustação por semana, curada pela Dolly',
        '100% vegano, sem glúten e sem açúcar refinado',
        'Entrega inclusa em Itamambuca',
        'Adaptada às suas restrições alimentares',
        'Pause quando quiser — até 2 semanas por ciclo',
        'Cancele a qualquer momento'
     ], 1),

    ('trimestral', 'Trimestral', 'O equilíbrio entre compromisso e liberdade.', 3, 1, 356.00, 89.00, 'MAIS ESCOLHIDO',
     ARRAY[
        'Tudo do plano Mensal',
        'Economia de R$ 120 por trimestre',
        'Prioridade nas edições limitadas',
        '10% de desconto em cursos e eventos',
        'Caixa surpresa no seu aniversário'
     ], 2),

    ('anual', 'Anual', 'Para quem faz da quarta-feira um ritual.', 12, 1, 316.00, 79.00, 'MELHOR VALOR',
     ARRAY[
        'Tudo do plano Trimestral',
        'Economia de R$ 960 por ano',
        'Preço travado para sempre, mesmo se os nossos subirem',
        '20% de desconto em cursos, retiros e eventos',
        'Duas caixas-presente para dar a quem você quiser',
        'Seu nome na lista de Membros Fundadores'
     ], 3)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- PART 4 — The subscriptions themselves
--
-- Note on payment: there is no automatic recurring billing here yet. A signup
-- lands as `pending`, Dolly confirms it over WhatsApp and collects by Pix, then
-- marks it `active`. Everything needed to automate that later is already
-- stored, so nothing has to be re-entered when we add a payment processor.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Null when someone subscribed without signing in. Filled the moment
    -- they do, so the subscription follows their account.
    user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    plan_id            TEXT REFERENCES public.subscription_plans(id),

    -- pending  : signed up on the site, not yet paid/confirmed
    -- active   : paying, receiving boxes
    -- paused   : keeping their spot, no boxes for now
    -- cancelled: gone (we keep the row for the history)
    status             TEXT NOT NULL DEFAULT 'pending',

    boxes_per_week     INTEGER NOT NULL DEFAULT 1,

    -- Contact snapshot, so the weekly roster never depends on a join.
    full_name          TEXT NOT NULL,
    whatsapp_number    TEXT NOT NULL,
    email              TEXT,

    delivery_zone      TEXT,
    address_street     TEXT,
    address_number     TEXT,
    address_complement TEXT,
    address_neighborhood TEXT,
    address_city       TEXT,
    address_postal_code TEXT,
    address_reference  TEXT,
    address_oneline    TEXT,

    is_vegan           BOOLEAN DEFAULT FALSE,
    is_gluten_free     BOOLEAN DEFAULT FALSE,
    is_sugar_free      BOOLEAN DEFAULT FALSE,
    is_salt_free       BOOLEAN DEFAULT FALSE,
    is_oil_free        BOOLEAN DEFAULT FALSE,
    allergies          TEXT,

    monthly_price      NUMERIC(10,2),
    delivery_fee       NUMERIC(10,2) DEFAULT 0,

    started_on         DATE,
    next_delivery_on   DATE,
    committed_until    DATE,
    paused_until       DATE,
    cancelled_on       DATE,
    cancel_reason      TEXT,

    referred_by        TEXT,
    customer_message   TEXT,
    admin_notes        TEXT,

    created_at         TIMESTAMPTZ DEFAULT now(),
    updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_status_idx  ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_user_idx    ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_next_idx    ON public.subscriptions(next_delivery_on);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can read subscriptions"
    ON public.subscriptions FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions"
    ON public.subscriptions FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can delete subscriptions"
    ON public.subscriptions FOR DELETE TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Customers can read their own subscription" ON public.subscriptions;
CREATE POLICY "Customers can read their own subscription"
    ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid());


-- The only way the public website creates a subscription. Same pattern as the
-- CRM: it writes one row, returns nothing readable, and can't be used to read
-- anyone else's data back out.
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
    p_customer_message   TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_plan   public.subscription_plans;
    v_id     UUID;
    v_oneline TEXT;
BEGIN
    IF COALESCE(TRIM(p_full_name), '') = '' OR COALESCE(TRIM(p_whatsapp_number), '') = '' THEN
        RAISE EXCEPTION 'Nome e WhatsApp são obrigatórios';
    END IF;

    SELECT * INTO v_plan FROM public.subscription_plans
    WHERE id = p_plan_id AND is_active;

    IF v_plan.id IS NULL THEN
        RAISE EXCEPTION 'Plano inválido';
    END IF;

    v_oneline := NULLIF(CONCAT_WS(', ',
        NULLIF(TRIM(CONCAT_WS(' ', NULLIF(TRIM(p_address_street), ''), NULLIF(TRIM(p_address_number), ''))), ''),
        NULLIF(TRIM(p_address_complement), ''),
        NULLIF(TRIM(p_address_neighborhood), ''),
        NULLIF(TRIM(p_address_city), ''),
        NULLIF(TRIM(p_address_postal_code), '')
    ), '');

    INSERT INTO public.subscriptions (
        user_id, plan_id, status, boxes_per_week,
        full_name, whatsapp_number, email,
        delivery_zone, address_street, address_number, address_complement,
        address_neighborhood, address_city, address_postal_code, address_reference, address_oneline,
        is_vegan, is_gluten_free, is_sugar_free, is_salt_free, is_oil_free, allergies,
        monthly_price, delivery_fee,
        next_delivery_on, committed_until,
        referred_by, customer_message
    )
    VALUES (
        auth.uid(), v_plan.id, 'pending', GREATEST(1, COALESCE(p_boxes_per_week, 1)),
        TRIM(p_full_name), TRIM(p_whatsapp_number), NULLIF(TRIM(p_email), ''),
        p_delivery_zone, p_address_street, p_address_number, p_address_complement,
        p_address_neighborhood, p_address_city, p_address_postal_code, p_address_reference, v_oneline,
        p_is_vegan, p_is_gluten_free, p_is_sugar_free, p_is_salt_free, p_is_oil_free,
        NULLIF(TRIM(p_allergies), ''),
        v_plan.monthly_price * GREATEST(1, COALESCE(p_boxes_per_week, 1)),
        COALESCE(p_delivery_fee, 0),
        -- Boxes go out on Saturdays; point them at the next one.
        (CURRENT_DATE + ((6 - EXTRACT(DOW FROM CURRENT_DATE)::INT + 7) % 7 + 1) * INTERVAL '1 day')::DATE,
        (CURRENT_DATE + (v_plan.commitment_months || ' months')::INTERVAL)::DATE,
        NULLIF(TRIM(p_referred_by), ''), NULLIF(TRIM(p_customer_message), '')
    )
    RETURNING id INTO v_id;

    -- Also keep the CRM in step, so a subscriber shows up in the customer list
    -- like everyone else.
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
    BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT, INTEGER, NUMERIC, TEXT, TEXT
) TO anon, authenticated;


-- Links a subscription taken out while logged out to the account, as soon as
-- someone signs in with a matching WhatsApp number or e-mail.
CREATE OR REPLACE FUNCTION public.claim_my_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
    v_email TEXT;
    v_phone TEXT;
BEGIN
    IF auth.uid() IS NULL THEN RETURN 0; END IF;

    SELECT email, NULLIF(regexp_replace(COALESCE(phone, ''), '\D', '', 'g'), '')
      INTO v_email, v_phone
      FROM auth.users WHERE id = auth.uid();

    UPDATE public.subscriptions SET user_id = auth.uid(), updated_at = now()
    WHERE user_id IS NULL
      AND (
        (v_email IS NOT NULL AND lower(email) = lower(v_email))
        OR (v_phone IS NOT NULL AND right(regexp_replace(whatsapp_number, '\D', '', 'g'), 8) = right(v_phone, 8))
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_my_subscriptions() TO authenticated;


-- ----------------------------------------------------------------------------
-- PART 5 — The weekly delivery roster
--
-- This is what Dolly actually works from: for a given Saturday, who gets a
-- box, what they can't eat, and where it goes.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.subscription_deliveries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    delivery_date   DATE NOT NULL,
    -- scheduled | prepared | delivered | skipped
    status          TEXT NOT NULL DEFAULT 'scheduled',
    boxes           INTEGER NOT NULL DEFAULT 1,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE (subscription_id, delivery_date)
);

CREATE INDEX IF NOT EXISTS subscription_deliveries_date_idx
    ON public.subscription_deliveries(delivery_date);

ALTER TABLE public.subscription_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage deliveries" ON public.subscription_deliveries;
CREATE POLICY "Admins manage deliveries"
    ON public.subscription_deliveries FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Builds (or tops up) the roster for one delivery date from whoever is active.
-- Safe to run repeatedly — it never duplicates or overwrites a row.
CREATE OR REPLACE FUNCTION public.generate_delivery_roster(p_date DATE)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_count INTEGER;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Apenas administradores';
    END IF;

    INSERT INTO public.subscription_deliveries (subscription_id, delivery_date, boxes)
    SELECT s.id, p_date, s.boxes_per_week
    FROM public.subscriptions s
    WHERE s.status = 'active'
      AND (s.paused_until IS NULL OR s.paused_until < p_date)
    ON CONFLICT (subscription_id, delivery_date) DO NOTHING;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_delivery_roster(DATE) TO authenticated;


-- ----------------------------------------------------------------------------
-- PART 6 — Job applications
--
-- Bakers, drivers, and the shoppers who have to know which produce to pick.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.job_applications (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- confeitaria | entrega | compras | outro
    role          TEXT NOT NULL,
    full_name     TEXT NOT NULL,
    whatsapp      TEXT NOT NULL,
    email         TEXT,
    city          TEXT,
    experience    TEXT,
    availability  TEXT,
    has_transport BOOLEAN DEFAULT FALSE,
    motivation    TEXT,
    -- new | contacted | interviewing | hired | archived
    status        TEXT NOT NULL DEFAULT 'new',
    admin_notes   TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_applications_role_idx ON public.job_applications(role);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can apply" ON public.job_applications;
CREATE POLICY "Anyone can apply"
    ON public.job_applications FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read applications" ON public.job_applications;
CREATE POLICY "Admins can read applications"
    ON public.job_applications FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update applications" ON public.job_applications;
CREATE POLICY "Admins can update applications"
    ON public.job_applications FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete applications" ON public.job_applications;
CREATE POLICY "Admins can delete applications"
    ON public.job_applications FOR DELETE TO authenticated USING (public.is_admin());


-- ============================================================================
-- CHECK IT WORKED
-- ============================================================================

SELECT 'subscription plans created' AS check, count(*)::text AS result FROM public.subscription_plans
UNION ALL
SELECT 'subscriptions table ready',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                         WHERE table_name = 'subscriptions') THEN 'yes' ELSE 'NO - PROBLEM' END
UNION ALL
SELECT 'signup function ready',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_subscription')
            THEN 'yes' ELSE 'NO - PROBLEM' END
UNION ALL
SELECT 'weekly roster function ready',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'generate_delivery_roster')
            THEN 'yes' ELSE 'NO - PROBLEM' END
UNION ALL
SELECT 'job applications table ready',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                         WHERE table_name = 'job_applications') THEN 'yes' ELSE 'NO - PROBLEM' END
UNION ALL
SELECT 'address split into fields',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'user_profiles' AND column_name = 'address_postal_code')
            THEN 'yes' ELSE 'NO - PROBLEM' END;
