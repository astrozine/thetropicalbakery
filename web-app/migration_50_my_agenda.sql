-- migration_50_my_agenda.sql
--
-- Minha Conta, refocused (2026-11-20): the tasting box is paused, so the account
-- page now shows what a customer actually has with Dolly: classes, retreats,
-- events-menu orders, proposals waiting to be paid and, for a business, the
-- partnership. Customers still cannot read any of these tables, so this adds ONE
-- read-only function that returns only the caller's own rows (matched by their
-- login and e-mail), like my_journey() does.
--
--   my_agenda() -> jsonb
--     requests   their course / retreat requests (course_registrations) + inbox stage
--     proposals  open proposals made for them (payment_offers) + whether they are paid
--     retreats   their retreat reservations (retreat_bookings), cancelled ones left out
--     events     their events-menu orders and catering quotes (orders)
--     partner    their partner row (business, status, Dolly's note) + last restocks, or null
--
-- Columns that a missing older migration might not have are read through
-- to_jsonb(row), so the function never breaks on them. Safe to run more than
-- once. Until it runs, Minha Conta simply shows an empty agenda.

CREATE OR REPLACE FUNCTION public.my_agenda()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid  uuid := auth.uid();
    mail text := lower(COALESCE(auth.jwt() ->> 'email', ''));
    result jsonb := '{}'::jsonb;
BEGIN
    IF uid IS NULL OR mail = '' THEN
        RETURN NULL;
    END IF;

    -- Course and retreat requests from the site's forms, last 12 months.
    BEGIN
        result := result || jsonb_build_object('requests', COALESCE((
            SELECT jsonb_agg(x ORDER BY x->>'created_at' DESC)
            FROM (
                SELECT jsonb_build_object(
                    'id',         c.id::text,
                    'created_at', c.created_at,
                    'kind',       c.interest_type,
                    'interest',   to_jsonb(c) ->> 'specific_interest',
                    'date',       to_jsonb(c) ->> 'requested_date',
                    'group_size', to_jsonb(c) -> 'group_size',
                    'stage',      COALESCE(s.status, 'new')
                ) AS x
                FROM public.course_registrations c
                LEFT JOIN public.inbox_status s
                       ON s.source_table = 'course_registrations' AND s.source_id = c.id::text
                WHERE lower(c.email) = mail
                  AND c.created_at > now() - interval '12 months'
                  AND COALESCE(s.status, 'new') NOT IN ('archived', 'cancelled')
                ORDER BY c.created_at DESC
                LIMIT 10
            ) q
        ), '[]'::jsonb));
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || jsonb_build_object('requests', NULL);
    END;

    -- Proposals Dolly sent them (courses and retreats), with paid / not paid.
    BEGIN
        result := result || jsonb_build_object('proposals', COALESCE((
            SELECT jsonb_agg(x ORDER BY x->>'created_at' DESC)
            FROM (
                SELECT jsonb_build_object(
                    'id',          p.id::text,
                    'created_at',  p.created_at,
                    'kind',        p.kind,
                    'title',       p.title,
                    'dates_label', p.dates_label,
                    'price',       p.price,
                    'expires_on',  p.expires_on,
                    'paid', EXISTS (
                        SELECT 1
                        FROM public.orders o
                        LEFT JOIN public.inbox_status os
                               ON os.source_table = 'orders' AND os.source_id = o.id::text
                        WHERE p.order_reference IS NOT NULL
                          AND o.pix_transaction_id = p.order_reference
                          AND (upper(COALESCE(o.status, '')) = 'PAID'
                               OR COALESCE(os.status, 'new') IN ('confirmed', 'preparing', 'shipped', 'delivered'))
                    )
                ) AS x
                FROM public.payment_offers p
                WHERE lower(p.customer_email) = mail
                  AND p.status = 'open'
                ORDER BY p.created_at DESC
                LIMIT 10
            ) q
        ), '[]'::jsonb));
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || jsonb_build_object('proposals', NULL);
    END;

    -- Retreat reservations (dates held or confirmed).
    BEGIN
        result := result || jsonb_build_object('retreats', COALESCE((
            SELECT jsonb_agg(x ORDER BY x->>'check_in')
            FROM (
                SELECT jsonb_build_object(
                    'id',           b.id::text,
                    'check_in',     b.check_in,
                    'check_out',    b.check_out,
                    'guests',       b.guests,
                    'courses',      b.courses,
                    'status',       b.status,
                    'total',        b.total,
                    'deposit_paid', b.deposit_paid,
                    'room',         (SELECT to_jsonb(r) FROM public.retreat_rooms r WHERE r.id = b.room_id) ->> 'name'
                ) AS x
                FROM public.retreat_bookings b
                WHERE lower(b.email) = mail
                  AND b.status <> 'cancelado'
                  AND b.check_out > (now() AT TIME ZONE 'America/Sao_Paulo')::date - 60
            ) q
        ), '[]'::jsonb));
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || jsonb_build_object('retreats', NULL);
    END;

    -- Events-menu orders and catering quotes.
    BEGIN
        result := result || jsonb_build_object('events', COALESCE((
            SELECT jsonb_agg(x ORDER BY x->>'created_at' DESC)
            FROM (
                SELECT jsonb_build_object(
                    'id',             o.id::text,
                    'created_at',     o.created_at,
                    'requested_date', o.requested_date,
                    'items_summary',  o.items_summary,
                    'total_price',    o.total_price,
                    'kind',           o.order_kind,
                    'stage', CASE
                        WHEN o.order_kind = 'quote' THEN 'quote'
                        WHEN COALESCE(s.status, 'new') = 'cancelled' THEN 'cancelled'
                        WHEN COALESCE(s.status, 'new') = 'delivered' THEN 'done'
                        WHEN COALESCE(s.status, 'new') = 'shipped' THEN 'ready'
                        WHEN COALESCE(s.status, 'new') = 'preparing' THEN 'preparing'
                        WHEN upper(COALESCE(o.status, '')) = 'PAID' OR COALESCE(s.status, 'new') = 'confirmed' THEN 'confirmed'
                        ELSE 'awaiting_payment'
                    END
                ) AS x
                FROM public.orders o
                LEFT JOIN public.inbox_status s
                       ON s.source_table = 'orders' AND s.source_id = o.id::text
                WHERE (o.user_id = uid OR lower(o.customer_email) = mail)
                  AND o.order_kind IN ('events', 'quote')
                  AND o.created_at > now() - interval '12 months'
                ORDER BY o.created_at DESC
                LIMIT 10
            ) q
        ), '[]'::jsonb));
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || jsonb_build_object('events', NULL);
    END;

    -- A business partner (hotel, pousada, restaurant...): their row and last restocks.
    BEGIN
        result := result || jsonb_build_object('partner', (
            SELECT jsonb_build_object(
                'business_name',  p.business_name,
                'kind',           p.kind,
                'status',         p.status,
                'portal_message', p.portal_message,
                'restocks', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'items', r.items, 'wanted_date', r.wanted_date, 'status', r.status, 'created_at', r.created_at
                    ) ORDER BY r.created_at DESC)
                    FROM (
                        SELECT * FROM public.partner_restock_requests rr
                        WHERE rr.partner_id = p.id AND rr.status <> 'cancelado'
                        ORDER BY rr.created_at DESC
                        LIMIT 3
                    ) r
                ), '[]'::jsonb)
            )
            FROM public.partners p
            WHERE lower(p.email) = mail
            LIMIT 1
        ));
    EXCEPTION WHEN undefined_table OR undefined_column THEN
        result := result || jsonb_build_object('partner', NULL);
    END;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.my_agenda() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_agenda() TO authenticated;
