-- ============================================================================
-- MIGRATION 16: Partner portal (B2B) and Worker portal (equipe)
-- ============================================================================
-- Two private areas, each gated the same way /admin is: a list of people Dolly
-- approves, matched by the e-mail they log in with.
--
--  * partners              — hotels, pousadas, Airbnbs, restaurants, bakeries,
--                            affiliates. They see their own details, their
--                            restock requests, their goal for the month and,
--                            for affiliates, the sales their code brought in.
--  * partner_restock_requests — "please refill the fridge" from the portal,
--                            which lands in the admin inbox.
--  * workers, work_shifts  — the staff schedule and what each shift pays.
--
-- Nobody can read anyone else's row: every policy is "your own row, or admin".
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PARTNERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partners (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name  text NOT NULL,
    kind           text NOT NULL DEFAULT 'hotel'
                   CHECK (kind IN ('hotel', 'pousada', 'airbnb', 'restaurante', 'padaria', 'afiliado', 'outro')),
    contact_name   text,
    email          text NOT NULL,
    whatsapp       text,
    address        text,
    neighborhood   text,
    -- What we agreed: affiliate commission, or the discount/margin for a shop.
    commission_pct numeric NOT NULL DEFAULT 0,
    -- An affiliate's code, typed by customers at checkout.
    affiliate_code text,
    /** Boxes per month we're aiming at together — shown as a progress bar in the portal. */
    monthly_goal   integer NOT NULL DEFAULT 0,
    status         text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'pausado')),
    notes          text,     -- internal, never shown in the portal
    portal_message text,     -- a note Dolly writes TO the partner
    created_at     timestamptz NOT NULL DEFAULT now(),
    updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partners_email_idx ON public.partners (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS partners_code_idx ON public.partners (lower(affiliate_code)) WHERE affiliate_code IS NOT NULL;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage partners" ON public.partners;
CREATE POLICY "Admins manage partners"
    ON public.partners FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Partners read their own row" ON public.partners;
CREATE POLICY "Partners read their own row"
    ON public.partners FOR SELECT TO authenticated
    USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

-- A partner may correct their own contact details, nothing else.
DROP POLICY IF EXISTS "Partners update their own contact details" ON public.partners;
CREATE POLICY "Partners update their own contact details"
    ON public.partners FOR UPDATE TO authenticated
    USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
    WITH CHECK (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));


CREATE TABLE IF NOT EXISTS public.partner_restock_requests (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id   uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    items        text NOT NULL,
    notes        text,
    wanted_date  date,
    status       text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'confirmado', 'entregue', 'cancelado')),
    created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_restock_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage restock requests" ON public.partner_restock_requests;
CREATE POLICY "Admins manage restock requests"
    ON public.partner_restock_requests FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Partners read their own requests" ON public.partner_restock_requests;
CREATE POLICY "Partners read their own requests"
    ON public.partner_restock_requests FOR SELECT TO authenticated
    USING (partner_id IN (SELECT id FROM public.partners WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))));

DROP POLICY IF EXISTS "Partners create their own requests" ON public.partner_restock_requests;
CREATE POLICY "Partners create their own requests"
    ON public.partner_restock_requests FOR INSERT TO authenticated
    WITH CHECK (partner_id IN (SELECT id FROM public.partners WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))));


-- ----------------------------------------------------------------------------
-- WORKERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workers (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name   text NOT NULL,
    email       text NOT NULL,
    whatsapp    text,
    role        text NOT NULL DEFAULT 'cozinha'
                CHECK (role IN ('cozinha', 'entregas', 'atendimento', 'retiros', 'limpeza', 'outro')),
    -- Either an hourly rate or a fixed monthly wage; the portal shows whichever is set.
    hourly_rate  numeric NOT NULL DEFAULT 0,
    monthly_wage numeric NOT NULL DEFAULT 0,
    status      text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
    notes       text,        -- internal
    portal_message text,     -- a note Dolly writes TO the worker
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS workers_email_idx ON public.workers (lower(email));

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage workers" ON public.workers;
CREATE POLICY "Admins manage workers"
    ON public.workers FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Workers read their own row" ON public.workers;
CREATE POLICY "Workers read their own row"
    ON public.workers FOR SELECT TO authenticated
    USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));


CREATE TABLE IF NOT EXISTS public.work_shifts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    worker_id   uuid NOT NULL REFERENCES public.workers(id) ON DELETE CASCADE,
    shift_date  date NOT NULL,
    start_time  time,
    end_time    time,
    task        text,
    status      text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'feito', 'faltou', 'cancelado')),
    -- Filled in when the shift is paid, so the portal can show what's still owed.
    paid        boolean NOT NULL DEFAULT false,
    notes       text,
    created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_shifts_worker_date_idx ON public.work_shifts (worker_id, shift_date);

ALTER TABLE public.work_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage shifts" ON public.work_shifts;
CREATE POLICY "Admins manage shifts"
    ON public.work_shifts FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Workers read their own shifts" ON public.work_shifts;
CREATE POLICY "Workers read their own shifts"
    ON public.work_shifts FOR SELECT TO authenticated
    USING (worker_id IN (SELECT id FROM public.workers WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))));


-- ----------------------------------------------------------------------------
-- Affiliate codes on orders, so an affiliate's portal can count their sales.
-- ----------------------------------------------------------------------------
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS affiliate_code text;
CREATE INDEX IF NOT EXISTS orders_affiliate_idx ON public.orders (lower(affiliate_code)) WHERE affiliate_code IS NOT NULL;

-- Totals for one affiliate. SECURITY DEFINER because an affiliate must be able
-- to see their own numbers without being able to read the orders table.
CREATE OR REPLACE FUNCTION public.affiliate_summary()
RETURNS TABLE (orders_count integer, revenue numeric, commission numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
    v_code text;
    v_pct  numeric;
BEGIN
    SELECT affiliate_code, commission_pct INTO v_code, v_pct
    FROM public.partners
    WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
      AND affiliate_code IS NOT NULL
    LIMIT 1;

    IF v_code IS NULL THEN
        RETURN QUERY SELECT 0, 0::numeric, 0::numeric;
        RETURN;
    END IF;

    RETURN QUERY
    SELECT count(*)::integer,
           COALESCE(sum(o.total_price), 0)::numeric,
           ROUND(COALESCE(sum(o.total_price), 0) * COALESCE(v_pct, 0) / 100, 2)
    FROM public.orders o
    WHERE lower(o.affiliate_code) = lower(v_code);
END;
$$;

GRANT EXECUTE ON FUNCTION public.affiliate_summary() TO authenticated;


-- ----------------------------------------------------------------------------
-- "Which private areas does this person have?" — one call for the account menu.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.my_portals()
RETURNS TABLE (is_partner boolean, is_worker boolean, partner_status text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        EXISTS (SELECT 1 FROM public.partners p WHERE lower(p.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))),
        EXISTS (SELECT 1 FROM public.workers w  WHERE lower(w.email) = lower(COALESCE(auth.jwt() ->> 'email', '')) AND w.status = 'ativo'),
        (SELECT p.status FROM public.partners p WHERE lower(p.email) = lower(COALESCE(auth.jwt() ->> 'email', '')) LIMIT 1);
$$;

GRANT EXECUTE ON FUNCTION public.my_portals() TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- Applying to be a partner from a B2B page. Creates a 'pendente' row for Dolly
-- to approve; re-applying just updates the details.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.partner_apply(
    p_business_name text,
    p_kind          text,
    p_contact_name  text,
    p_email         text,
    p_whatsapp      text DEFAULT NULL,
    p_address       text DEFAULT NULL,
    p_neighborhood  text DEFAULT NULL,
    p_notes         text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text := lower(trim(p_email));
BEGIN
    IF v_email = '' OR position('@' in v_email) = 0 THEN
        RAISE EXCEPTION 'E-mail inválido';
    END IF;

    INSERT INTO public.partners (business_name, kind, contact_name, email, whatsapp, address, neighborhood, notes, status)
    VALUES (p_business_name, COALESCE(NULLIF(p_kind, ''), 'outro'), p_contact_name, v_email, p_whatsapp, p_address, p_neighborhood, p_notes, 'pendente')
    ON CONFLICT (lower(email)) DO UPDATE SET
        business_name = COALESCE(NULLIF(EXCLUDED.business_name, ''), partners.business_name),
        contact_name  = COALESCE(NULLIF(EXCLUDED.contact_name, ''),  partners.contact_name),
        whatsapp      = COALESCE(NULLIF(EXCLUDED.whatsapp, ''),      partners.whatsapp),
        address       = COALESCE(NULLIF(EXCLUDED.address, ''),       partners.address),
        neighborhood  = COALESCE(NULLIF(EXCLUDED.neighborhood, ''),  partners.neighborhood),
        notes         = COALESCE(NULLIF(EXCLUDED.notes, ''),         partners.notes),
        updated_at    = now();

    -- They'll want the partner e-mails.
    PERFORM public.email_contact_upsert(v_email, p_contact_name, ARRAY['parceiro'], 'parceria');
END;
$$;

GRANT EXECUTE ON FUNCTION public.partner_apply(text, text, text, text, text, text, text, text) TO anon, authenticated;

-- Data API access for the new tables (Supabase stops granting it automatically on 2026-10-30).
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners                 TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_restock_requests TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workers                  TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.work_shifts              TO authenticated, service_role;

COMMIT;

SELECT 'partners' AS what, count(*)::text AS n FROM public.partners
UNION ALL SELECT 'workers', count(*)::text FROM public.workers
UNION ALL SELECT 'shifts', count(*)::text FROM public.work_shifts;
