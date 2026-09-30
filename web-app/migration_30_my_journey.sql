-- migration_30_my_journey.sql
--
-- Minha Conta, redesigned: the page now shows a loyalty stamp card, the
-- customer's own order history and a "your next step" trail (box ->
-- subscription -> events -> course -> retreat). Customers still cannot read
-- the orders table directly (migration 22 locked it down), so this adds ONE
-- read-only function that returns only the caller's own rows.
--
--   my_journey()  -> jsonb
--     paid_boxes        paid tasting-box orders + delivered subscription boxes (the stamps)
--     paid_events       paid event-menu orders
--     event_quotes      event quotes they asked for
--     course_inquiries  course sign-ups / enquiries under their e-mail
--     retreat_inquiries retreat enquiries under their e-mail
--     first_order_at    their first order, for "cliente desde"
--     orders            their 8 most recent orders (date, summary, total, stage)
--
-- "Paid" means status PAID (card / Mercado Pago) or moved past "new" in the
-- admin inbox (how a Pix payment is confirmed by hand).
-- Safe to run more than once. Until it runs, Minha Conta hides the stamps and
-- the order list and keeps working.

CREATE OR REPLACE FUNCTION public.my_journey()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    uid   uuid := auth.uid();
    mail  text := lower(COALESCE(auth.jwt() ->> 'email', ''));
    result jsonb;
BEGIN
    IF uid IS NULL THEN
        RETURN NULL;
    END IF;

    WITH mine AS (
        SELECT o.*,
               COALESCE(s.status, 'new') AS inbox,
               (upper(COALESCE(o.status, '')) = 'PAID'
                OR COALESCE(s.status, 'new') IN ('confirmed', 'preparing', 'shipped', 'delivered')) AS is_paid
        FROM public.orders o
        LEFT JOIN public.inbox_status s
               ON s.source_table = 'orders' AND s.source_id = o.id::text
        WHERE o.user_id = uid
           OR (mail <> '' AND lower(o.customer_email) = mail)
    ),
    sub_boxes AS (
        SELECT count(*) AS n
        FROM public.subscription_deliveries d
        JOIN public.subscriptions sb ON sb.id = d.subscription_id
        WHERE sb.user_id = uid AND d.status = 'delivered'
    ),
    leads AS (
        SELECT
            count(*) FILTER (WHERE interest_type = 'curso')  AS courses,
            count(*) FILTER (WHERE interest_type = 'retiro') AS retreats
        FROM public.course_registrations
        WHERE mail <> '' AND lower(email) = mail
    )
    SELECT jsonb_build_object(
        'paid_boxes',        (SELECT count(*) FROM mine WHERE is_paid AND order_kind = 'box') + (SELECT n FROM sub_boxes),
        'paid_events',       (SELECT count(*) FROM mine WHERE is_paid AND order_kind = 'events'),
        'event_quotes',      (SELECT count(*) FROM mine WHERE order_kind = 'quote'),
        'course_inquiries',  (SELECT courses FROM leads),
        'retreat_inquiries', (SELECT retreats FROM leads),
        'first_order_at',    (SELECT min(created_at) FROM mine WHERE is_paid),
        'orders', COALESCE((
            SELECT jsonb_agg(x ORDER BY x.created_at DESC)
            FROM (
                SELECT id::text AS id, created_at, requested_date, items_summary,
                       total_price::numeric AS total_price, order_kind, fulfillment,
                       CASE
                           WHEN order_kind = 'quote' THEN 'quote'
                           WHEN inbox = 'delivered' THEN 'done'
                           WHEN inbox = 'shipped' THEN 'ready'
                           WHEN inbox = 'preparing' THEN 'preparing'
                           WHEN is_paid THEN 'confirmed'
                           ELSE 'awaiting_payment'
                       END AS stage
                FROM mine
                ORDER BY created_at DESC
                LIMIT 8
            ) x
        ), '[]'::jsonb)
    ) INTO result;

    RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.my_journey() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_journey() TO authenticated;
