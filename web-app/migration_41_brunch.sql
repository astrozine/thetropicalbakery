-- migration_41_brunch.sql
--
-- Brunch Tropical: Dolly's ticketed brunches (tea, healthy treats, a conversation about wellness as a
-- career) and the Círculo Tropical, the private group of everyone who comes.
--
--   brunch_events          one row per brunch: theme, date, venue (our house, a partner pousada, a beach,
--                          a restaurant…), price, seats, music / pop-up extras and sponsors. Public reads
--                          published ones; only admins write.
--   brunch_event_private   the exact address and arrival notes. Admins only; paying guests get it through
--                          my_brunches() / brunch_room().
--   brunch_tickets         one seat per person per brunch. Created ONLY by the server (brunch_reserve, service
--                          role), first come first served, with a hold while the Pix is pending. Admins read
--                          and manage them; customers see their own through my_brunches().
--   brunch_profiles        the networking card each guest fills in: emoji, photo, headline, bio, what they offer
--                          and what they look for. Visible to the people at the same brunch (via brunch_room()).
--   brunch_messages        the group chat of one brunch. Read/write for paid guests of that brunch and admins
--                          (admins post as the host). Realtime-enabled.
--
-- Payment: a ticket is an order in `orders` (order_kind = 'brunch', reference BRU…), created by
-- POST /api/brunch/order through createBrunchOrder (server price). Card / PayPal confirm themselves
-- (markOrderPaid); a Pix confirmed by hand in the inbox flips the ticket by the trigger at the bottom.
--
-- Safe to run more than once. Until it runs, /brunch shows "em breve" and the admin a "rode a migration 41" hint.
-- Run it BEFORE or right after the deploy; nothing else on the site depends on it.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ------------------------------------------------------------------ events
CREATE TABLE IF NOT EXISTS public.brunch_events (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug                text UNIQUE NOT NULL,
    title               text NOT NULL,
    subtitle            text,
    -- What the conversation is about this time.
    theme               text,
    description         text,
    starts_at           timestamptz NOT NULL,
    ends_at             timestamptz,
    -- casa | pousada | praia | restaurante | espaco | outro
    venue_kind          text NOT NULL DEFAULT 'casa',
    venue_name          text,
    -- Public, e.g. "Um jardim a 100 m da praia de Itamambuca". The exact address is private.
    venue_blurb         text,
    venue_photo         text,
    venue_url           text,
    city                text DEFAULT 'Itamambuca, Ubatuba',
    price               numeric(10,2) NOT NULL DEFAULT 0,
    capacity            integer NOT NULL DEFAULT 12 CHECK (capacity > 0),
    cover_url           text,
    gallery             text[] NOT NULL DEFAULT '{}',
    -- The value stack shown on the page: "Chá e café da Mata Atlântica", "Mesa de doces da Dolly"…
    includes            text[] NOT NULL DEFAULT '{}',
    -- "🎶 Música ao vivo", "🛍️ Pop-up de marcas locais"…
    extras              text[] NOT NULL DEFAULT '{}',
    -- [{ "name", "kind": "patrocinador"|"popup"|"anfitriao", "logo_url", "url", "blurb" }]
    sponsors            jsonb NOT NULL DEFAULT '[]'::jsonb,
    -- Until this moment only Círculo members (past guests, active subscribers) can buy.
    members_first_until timestamptz,
    -- Pinned at the top of the group chat.
    host_note           text,
    status              text NOT NULL DEFAULT 'rascunho'
                        CHECK (status IN ('rascunho', 'publicado', 'encerrado', 'cancelado')),
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS brunch_events_starts_idx ON public.brunch_events (starts_at);

ALTER TABLE public.brunch_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brunch_events_public_read ON public.brunch_events;
CREATE POLICY brunch_events_public_read ON public.brunch_events
    FOR SELECT USING (status IN ('publicado', 'encerrado') OR public.is_admin());
DROP POLICY IF EXISTS brunch_events_admin_write ON public.brunch_events;
CREATE POLICY brunch_events_admin_write ON public.brunch_events
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT ON public.brunch_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_events TO service_role;

-- ---------------------------------------------------------- private venue
CREATE TABLE IF NOT EXISTS public.brunch_event_private (
    event_id       uuid PRIMARY KEY REFERENCES public.brunch_events(id) ON DELETE CASCADE,
    address        text,
    maps_url       text,
    arrival_notes  text,
    updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brunch_event_private ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brunch_private_admin ON public.brunch_event_private;
CREATE POLICY brunch_private_admin ON public.brunch_event_private
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_event_private TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_event_private TO service_role;

-- ----------------------------------------------------------------- tickets
CREATE TABLE IF NOT EXISTS public.brunch_tickets (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id           uuid NOT NULL REFERENCES public.brunch_events(id) ON DELETE CASCADE,
    user_id            uuid,
    email              text NOT NULL,
    full_name          text,
    whatsapp           text,
    -- orders.pix_transaction_id (BRU…). Null for a waiting-list entry or a free brunch.
    reference          text UNIQUE,
    price              numeric(10,2) NOT NULL DEFAULT 0,
    -- reservado = waiting for payment (holds a seat until hold_until) | pago | espera = waiting list | cancelado
    status             text NOT NULL DEFAULT 'reservado'
                       CHECK (status IN ('reservado', 'pago', 'espera', 'cancelado')),
    hold_until         timestamptz,
    paid_at            timestamptz,
    checked_in_at      timestamptz,
    -- The ticket price as credit on an annual box subscription (src/lib/brunch.ts, CREDIT_DAYS).
    credit_claimed_at  timestamptz,
    credit_applied_at  timestamptz,
    -- "I'd like to bring my pop-up table" — Dolly answers by hand.
    popup_request      text,
    admin_notes        text,
    created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS brunch_tickets_one_per_person
    ON public.brunch_tickets (event_id, lower(email)) WHERE status <> 'cancelado';
CREATE INDEX IF NOT EXISTS brunch_tickets_user_idx ON public.brunch_tickets (user_id);

ALTER TABLE public.brunch_tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brunch_tickets_admin ON public.brunch_tickets;
CREATE POLICY brunch_tickets_admin ON public.brunch_tickets
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_tickets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_tickets TO service_role;

-- ---------------------------------------------------------------- profiles
CREATE TABLE IF NOT EXISTS public.brunch_profiles (
    user_id        uuid PRIMARY KEY,
    display_name   text,
    emoji          text DEFAULT '🌺',
    photo_url      text,
    headline       text,
    bio            text,
    instagram      text,
    business_name  text,
    business_url   text,
    -- "Posso ajudar com…" / "Estou procurando…": what makes the room useful to each other.
    offers         text,
    seeks          text,
    updated_at     timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.brunch_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brunch_profiles_own ON public.brunch_profiles;
CREATE POLICY brunch_profiles_own ON public.brunch_profiles
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR public.is_admin())
    WITH CHECK (user_id = auth.uid() OR public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_profiles TO service_role;

-- ----------------------------------------------------------------- helpers
-- Has the caller paid for this brunch? (by account, or by the e-mail they bought with)
CREATE OR REPLACE FUNCTION public.brunch_is_member(p_event uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.brunch_tickets t
        WHERE t.event_id = p_event AND t.status = 'pago'
          AND (t.user_id = auth.uid()
               OR (COALESCE(auth.jwt() ->> 'email', '') <> '' AND lower(t.email) = lower(auth.jwt() ->> 'email')))
    );
$$;
REVOKE ALL ON FUNCTION public.brunch_is_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.brunch_is_member(uuid) TO authenticated;

-- Seats per published brunch, for the public pages. Counts only numbers, never names.
CREATE OR REPLACE FUNCTION public.brunch_availability()
RETURNS TABLE (event_id uuid, capacity integer, taken integer, waiting integer)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
    SELECT e.id, e.capacity,
           (SELECT count(*)::int FROM public.brunch_tickets t
             WHERE t.event_id = e.id
               AND (t.status = 'pago' OR (t.status = 'reservado' AND t.hold_until > now()))),
           (SELECT count(*)::int FROM public.brunch_tickets t WHERE t.event_id = e.id AND t.status = 'espera')
    FROM public.brunch_events e
    WHERE e.status IN ('publicado', 'encerrado');
$$;
GRANT EXECUTE ON FUNCTION public.brunch_availability() TO anon, authenticated, service_role;

-- ------------------------------------------------------------ reservation
-- The ONLY way a seat is taken. Called by the server (createBrunchOrder) with the service key, after it has
-- read the price itself. Locks the brunch row so two people can never get the last seat.
-- Returns { result: 'ok' | 'espera' | 'ja_tem' | 'so_membros' | 'fechado', ticket_id }.
CREATE OR REPLACE FUNCTION public.brunch_reserve(
    p_event      uuid,
    p_user       uuid,
    p_email      text,
    p_name       text,
    p_whatsapp   text,
    p_reference  text,
    p_price      numeric,
    p_hold_hours integer DEFAULT 24,
    p_waitlist   boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    ev       public.brunch_events%ROWTYPE;
    mail     text := lower(trim(p_email));
    taken    integer;
    existing public.brunch_tickets%ROWTYPE;
    new_id   uuid;
    is_alum  boolean;
BEGIN
    SELECT * INTO ev FROM public.brunch_events WHERE id = p_event FOR UPDATE;
    IF NOT FOUND OR ev.status <> 'publicado' OR ev.starts_at <= now() THEN
        RETURN jsonb_build_object('result', 'fechado');
    END IF;

    SELECT * INTO existing FROM public.brunch_tickets
     WHERE event_id = p_event AND lower(email) = mail AND status <> 'cancelado'
     LIMIT 1;
    IF FOUND THEN
        IF existing.status = 'pago' THEN
            RETURN jsonb_build_object('result', 'ja_tem', 'ticket_id', existing.id);
        END IF;
        -- An unpaid hold or a waiting-list place is replaced by this new attempt.
        UPDATE public.brunch_tickets SET status = 'cancelado' WHERE id = existing.id;
    END IF;

    IF ev.members_first_until IS NOT NULL AND now() < ev.members_first_until THEN
        SELECT EXISTS (
                   SELECT 1 FROM public.brunch_tickets t
                   WHERE t.status = 'pago' AND t.event_id <> p_event
                     AND (lower(t.email) = mail OR (p_user IS NOT NULL AND t.user_id = p_user)))
            OR EXISTS (
                   SELECT 1 FROM public.subscriptions s
                   WHERE s.status = 'active'
                     AND (lower(COALESCE(s.email, '')) = mail OR (p_user IS NOT NULL AND s.user_id = p_user)))
          INTO is_alum;
        IF NOT is_alum THEN
            RETURN jsonb_build_object('result', 'so_membros');
        END IF;
    END IF;

    SELECT count(*) INTO taken FROM public.brunch_tickets t
     WHERE t.event_id = p_event
       AND (t.status = 'pago' OR (t.status = 'reservado' AND t.hold_until > now()));

    IF taken >= ev.capacity THEN
        IF NOT p_waitlist THEN
            RETURN jsonb_build_object('result', 'lotado');
        END IF;
        INSERT INTO public.brunch_tickets (event_id, user_id, email, full_name, whatsapp, price, status)
        VALUES (p_event, p_user, mail, p_name, p_whatsapp, p_price, 'espera')
        RETURNING id INTO new_id;
        RETURN jsonb_build_object('result', 'espera', 'ticket_id', new_id);
    END IF;

    INSERT INTO public.brunch_tickets (event_id, user_id, email, full_name, whatsapp, reference, price, status, hold_until, paid_at)
    VALUES (p_event, p_user, mail, p_name, p_whatsapp, p_reference, p_price,
            CASE WHEN p_price <= 0 THEN 'pago' ELSE 'reservado' END,
            now() + make_interval(hours => GREATEST(1, p_hold_hours)),
            CASE WHEN p_price <= 0 THEN now() END)
    RETURNING id INTO new_id;
    RETURN jsonb_build_object('result', 'ok', 'ticket_id', new_id, 'left', ev.capacity - taken - 1);
END;
$$;
REVOKE ALL ON FUNCTION public.brunch_reserve(uuid, uuid, text, text, text, text, numeric, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.brunch_reserve(uuid, uuid, text, text, text, text, numeric, integer, boolean) TO service_role;

-- --------------------------------------------------------- the member side
-- Everything Minha Conta needs: the caller's tickets (with the address once paid), their networking card,
-- and whether they are a Círculo member (has been to a brunch). Also links tickets bought under their
-- e-mail to their account.
CREATE OR REPLACE FUNCTION public.my_brunches()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    uid  uuid := auth.uid();
    mail text := lower(COALESCE(auth.jwt() ->> 'email', ''));
    result jsonb;
BEGIN
    IF uid IS NULL THEN RETURN NULL; END IF;

    IF mail <> '' THEN
        UPDATE public.brunch_tickets SET user_id = uid WHERE user_id IS NULL AND lower(email) = mail;
    END IF;

    SELECT jsonb_build_object(
        'alumni', EXISTS (SELECT 1 FROM public.brunch_tickets t JOIN public.brunch_events e ON e.id = t.event_id
                          WHERE t.user_id = uid AND t.status = 'pago' AND e.starts_at < now()),
        'profile', (SELECT to_jsonb(p) FROM public.brunch_profiles p WHERE p.user_id = uid),
        'tickets', COALESCE((
            SELECT jsonb_agg(x ORDER BY x.starts_at)
            FROM (
                SELECT t.id, t.status, t.reference, t.price, t.hold_until, t.paid_at, t.checked_in_at,
                       t.credit_claimed_at, t.credit_applied_at, t.popup_request,
                       e.id AS event_id, e.slug, e.title, e.subtitle, e.theme, e.starts_at, e.ends_at,
                       e.venue_kind, e.venue_name, e.city, e.cover_url, e.status AS event_status,
                       CASE WHEN t.status = 'pago' THEN pv.address END       AS address,
                       CASE WHEN t.status = 'pago' THEN pv.maps_url END      AS maps_url,
                       CASE WHEN t.status = 'pago' THEN pv.arrival_notes END AS arrival_notes,
                       (SELECT count(*) FROM public.brunch_tickets o WHERE o.event_id = e.id AND o.status = 'pago') AS guests
                FROM public.brunch_tickets t
                JOIN public.brunch_events e ON e.id = t.event_id
                LEFT JOIN public.brunch_event_private pv ON pv.event_id = e.id
                WHERE t.user_id = uid AND t.status <> 'cancelado'
            ) x
        ), '[]'::jsonb)
    ) INTO result;
    RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.my_brunches() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_brunches() TO authenticated;

-- The private room of one brunch: the event (with the address), and the networking card of every paid guest.
-- Paid guests of that brunch and admins only; anyone else gets NULL.
CREATE OR REPLACE FUNCTION public.brunch_room(p_event uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    result jsonb;
BEGIN
    IF auth.uid() IS NULL OR NOT (public.brunch_is_member(p_event) OR public.is_admin()) THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_build_object(
        'event', (SELECT to_jsonb(e) || jsonb_build_object(
                     'address', pv.address, 'maps_url', pv.maps_url, 'arrival_notes', pv.arrival_notes)
                  FROM public.brunch_events e
                  LEFT JOIN public.brunch_event_private pv ON pv.event_id = e.id
                  WHERE e.id = p_event),
        'is_admin', public.is_admin(),
        'members', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'user_id', t.user_id,
                'ticket_id', t.id,
                'first_name', split_part(COALESCE(t.full_name, ''), ' ', 1),
                'display_name', p.display_name, 'emoji', p.emoji, 'photo_url', p.photo_url,
                'headline', p.headline, 'bio', p.bio, 'instagram', p.instagram,
                'business_name', p.business_name, 'business_url', p.business_url,
                'offers', p.offers, 'seeks', p.seeks,
                'is_me', t.user_id = auth.uid()
            ) ORDER BY t.paid_at NULLS LAST)
            FROM public.brunch_tickets t
            LEFT JOIN public.brunch_profiles p ON p.user_id = t.user_id
            WHERE t.event_id = p_event AND t.status = 'pago'
        ), '[]'::jsonb),
        -- Hosts who posted in this room (admins), so their own photo shows when they have set one.
        'hosts', COALESCE((
            SELECT jsonb_agg(DISTINCT jsonb_build_object(
                'user_id', m.user_id, 'display_name', p.display_name, 'emoji', p.emoji, 'photo_url', p.photo_url))
            FROM public.brunch_messages m
            LEFT JOIN public.brunch_profiles p ON p.user_id = m.user_id
            WHERE m.event_id = p_event AND m.is_host
        ), '[]'::jsonb)
    ) INTO result;
    RETURN result;
END;
$$;

-- -------------------------------------------------------------------- chat
CREATE TABLE IF NOT EXISTS public.brunch_messages (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    uuid NOT NULL REFERENCES public.brunch_events(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL DEFAULT auth.uid(),
    body        text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
    is_host     boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brunch_messages_event_idx ON public.brunch_messages (event_id, created_at);

ALTER TABLE public.brunch_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brunch_messages_read ON public.brunch_messages;
CREATE POLICY brunch_messages_read ON public.brunch_messages
    FOR SELECT TO authenticated USING (public.brunch_is_member(event_id) OR public.is_admin());
DROP POLICY IF EXISTS brunch_messages_write ON public.brunch_messages;
CREATE POLICY brunch_messages_write ON public.brunch_messages
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND (public.brunch_is_member(event_id) OR public.is_admin()));
DROP POLICY IF EXISTS brunch_messages_delete ON public.brunch_messages;
CREATE POLICY brunch_messages_delete ON public.brunch_messages
    FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.is_admin());
GRANT SELECT, INSERT, DELETE ON public.brunch_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_messages TO service_role;

-- Nobody can claim to be the host: the flag is decided here, from the admin list.
CREATE OR REPLACE FUNCTION public.brunch_messages_stamp()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    NEW.is_host := public.is_admin();
    NEW.created_at := now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS brunch_messages_stamp ON public.brunch_messages;
CREATE TRIGGER brunch_messages_stamp BEFORE INSERT ON public.brunch_messages
    FOR EACH ROW EXECUTE FUNCTION public.brunch_messages_stamp();

-- Live updates in the chat.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
       AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'brunch_messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.brunch_messages;
    END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.brunch_room(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.brunch_room(uuid) FROM anon;

-- ------------------------------------------------------- member actions
-- "Use my ticket as credit on the annual subscription." Paid tickets only, until CREDIT_DAYS (30) after the
-- brunch. Dolly then takes it off the first payment and marks it applied in /admin/brunch.
CREATE OR REPLACE FUNCTION public.brunch_claim_credit(p_ticket uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    t public.brunch_tickets%ROWTYPE;
    starts timestamptz;
BEGIN
    SELECT * INTO t FROM public.brunch_tickets WHERE id = p_ticket AND user_id = auth.uid();
    IF NOT FOUND OR t.status <> 'pago' THEN RETURN 'not_found'; END IF;
    IF t.credit_claimed_at IS NOT NULL THEN RETURN 'already'; END IF;
    SELECT starts_at INTO starts FROM public.brunch_events WHERE id = t.event_id;
    IF now() > starts + interval '30 days' THEN RETURN 'expired'; END IF;
    UPDATE public.brunch_tickets SET credit_claimed_at = now() WHERE id = p_ticket;
    RETURN 'ok';
END;
$$;
REVOKE ALL ON FUNCTION public.brunch_claim_credit(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.brunch_claim_credit(uuid) TO authenticated;

-- "I'd like to bring my pop-up table." Free text, Dolly answers by hand.
CREATE OR REPLACE FUNCTION public.brunch_request_popup(p_ticket uuid, p_text text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    UPDATE public.brunch_tickets
       SET popup_request = NULLIF(left(trim(COALESCE(p_text, '')), 600), '')
     WHERE id = p_ticket AND user_id = auth.uid() AND status = 'pago';
    RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.brunch_request_popup(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.brunch_request_popup(uuid, text) TO authenticated;

-- ------------------------------------------------ a Pix confirmed by hand
-- When Dolly moves a brunch order forward in the inbox, the seat becomes paid; cancelling it frees the seat.
CREATE OR REPLACE FUNCTION public.brunch_follow_inbox()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    ref text;
BEGIN
    IF NEW.source_table <> 'orders' THEN RETURN NEW; END IF;
    SELECT pix_transaction_id INTO ref FROM public.orders WHERE id::text = NEW.source_id::text;
    IF ref IS NULL OR ref NOT LIKE 'BRU%' THEN RETURN NEW; END IF;

    IF NEW.status IN ('confirmed', 'preparing', 'shipped', 'delivered') THEN
        UPDATE public.brunch_tickets SET status = 'pago', paid_at = COALESCE(paid_at, now())
         WHERE reference = ref AND status IN ('reservado', 'cancelado');
    ELSIF NEW.status = 'cancelled' THEN
        UPDATE public.brunch_tickets SET status = 'cancelado' WHERE reference = ref AND status = 'reservado';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS brunch_follow_inbox ON public.inbox_status;
CREATE TRIGGER brunch_follow_inbox AFTER INSERT OR UPDATE OF status ON public.inbox_status
    FOR EACH ROW EXECUTE FUNCTION public.brunch_follow_inbox();

-- ---------------------------------------------------------- guest photos
-- Public bucket; each person writes only inside their own folder (<user id>/…).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brunch', 'brunch', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS brunch_photos_read ON storage.objects;
CREATE POLICY brunch_photos_read ON storage.objects FOR SELECT USING (bucket_id = 'brunch');
DROP POLICY IF EXISTS brunch_photos_write ON storage.objects;
CREATE POLICY brunch_photos_write ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'brunch' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
DROP POLICY IF EXISTS brunch_photos_update ON storage.objects;
CREATE POLICY brunch_photos_update ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'brunch' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));
DROP POLICY IF EXISTS brunch_photos_delete ON storage.objects;
CREATE POLICY brunch_photos_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'brunch' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin()));

-- ------------------------------------------------------- e-mail automations
-- Seeded OFF, like every automation: switching one on is a decision to mail real people.
DO $$
BEGIN
    IF to_regclass('public.email_automations') IS NOT NULL THEN
        INSERT INTO public.email_automations (id, enabled, threshold, offset_days, send_hour) VALUES
            ('brunch-reminder',    false, NULL, 2,    9),
            ('brunch-chat-digest', false, NULL, NULL, 19),
            ('brunch-followup',    false, NULL, 1,    10),
            ('brunch-last-seats',  false, 3,    NULL, 11)
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- ------------------------------------------------------- the guests' vote
-- "Monte o brunch": the guests of a brunch vote on which treats Dolly makes and which topics the conversation
-- covers. Each guest has 3 votes per kind (a budget makes every vote mean something), may suggest up to 3 options
-- of their own, and sees the tally move live. Voting closes at votes_close_at (default: 2 days before, so the
-- kitchen can plan). Dolly marks the winners (chosen = true). Keep the numbers in step with src/lib/brunch.ts.
ALTER TABLE public.brunch_events ADD COLUMN IF NOT EXISTS votes_close_at timestamptz;

CREATE TABLE IF NOT EXISTS public.brunch_poll_options (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id      uuid NOT NULL REFERENCES public.brunch_events(id) ON DELETE CASCADE,
    kind          text NOT NULL CHECK (kind IN ('doce', 'tema')),
    label         text NOT NULL CHECK (char_length(trim(label)) BETWEEN 2 AND 120),
    details       text,
    treat_id      uuid,
    image_url     text,
    suggested_by  uuid DEFAULT auth.uid(),
    chosen        boolean NOT NULL DEFAULT false,
    created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brunch_poll_options_event_idx ON public.brunch_poll_options (event_id);

CREATE TABLE IF NOT EXISTS public.brunch_votes (
    option_id   uuid NOT NULL REFERENCES public.brunch_poll_options(id) ON DELETE CASCADE,
    event_id    uuid NOT NULL REFERENCES public.brunch_events(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL DEFAULT auth.uid(),
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (option_id, user_id)
);
CREATE INDEX IF NOT EXISTS brunch_votes_event_idx ON public.brunch_votes (event_id);

-- Is the vote of this brunch still open?
CREATE OR REPLACE FUNCTION public.brunch_votes_open(p_event uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT now() < COALESCE(e.votes_close_at, e.starts_at - interval '2 days')
    FROM public.brunch_events e WHERE e.id = p_event;
$$;
GRANT EXECUTE ON FUNCTION public.brunch_votes_open(uuid) TO authenticated;

ALTER TABLE public.brunch_poll_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brunch_options_read ON public.brunch_poll_options;
CREATE POLICY brunch_options_read ON public.brunch_poll_options
    FOR SELECT TO authenticated USING (public.brunch_is_member(event_id) OR public.is_admin());
DROP POLICY IF EXISTS brunch_options_suggest ON public.brunch_poll_options;
CREATE POLICY brunch_options_suggest ON public.brunch_poll_options
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin() OR (public.brunch_is_member(event_id) AND suggested_by = auth.uid()));
DROP POLICY IF EXISTS brunch_options_admin ON public.brunch_poll_options;
CREATE POLICY brunch_options_admin ON public.brunch_poll_options
    FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS brunch_options_delete ON public.brunch_poll_options;
CREATE POLICY brunch_options_delete ON public.brunch_poll_options
    FOR DELETE TO authenticated USING (public.is_admin() OR suggested_by = auth.uid());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_poll_options TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_poll_options TO service_role;

ALTER TABLE public.brunch_votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brunch_votes_read ON public.brunch_votes;
CREATE POLICY brunch_votes_read ON public.brunch_votes
    FOR SELECT TO authenticated USING (public.brunch_is_member(event_id) OR public.is_admin());
DROP POLICY IF EXISTS brunch_votes_cast ON public.brunch_votes;
CREATE POLICY brunch_votes_cast ON public.brunch_votes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() AND (public.brunch_is_member(event_id) OR public.is_admin()));
DROP POLICY IF EXISTS brunch_votes_take_back ON public.brunch_votes;
CREATE POLICY brunch_votes_take_back ON public.brunch_votes
    FOR DELETE TO authenticated USING (user_id = auth.uid() AND public.brunch_votes_open(event_id));
GRANT SELECT, INSERT, DELETE ON public.brunch_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brunch_votes TO service_role;

-- A suggestion from a guest: never pre-chosen, at most 3 per person per brunch, only while the vote is open.
CREATE OR REPLACE FUNCTION public.brunch_option_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    -- A treat picked from the menu: its real name and photo come from the treats table, never from the browser.
    IF NEW.treat_id IS NOT NULL THEN
        SELECT COALESCE(t.name, NEW.label), t.image_url INTO NEW.label, NEW.image_url
          FROM public.treats t WHERE t.id = NEW.treat_id;
        IF EXISTS (SELECT 1 FROM public.brunch_poll_options
                   WHERE event_id = NEW.event_id AND treat_id = NEW.treat_id) THEN
            RAISE EXCEPTION 'Esse doce já está na votação: é só votar nele.';
        END IF;
    END IF;
    IF public.is_admin() THEN RETURN NEW; END IF;
    NEW.chosen := false;
    NEW.suggested_by := auth.uid();
    IF NEW.treat_id IS NULL THEN NEW.image_url := NULL; END IF;
    IF NOT public.brunch_votes_open(NEW.event_id) THEN
        RAISE EXCEPTION 'A votação deste brunch já fechou.';
    END IF;
    IF (SELECT count(*) FROM public.brunch_poll_options
        WHERE event_id = NEW.event_id AND suggested_by = auth.uid()) >= 3 THEN
        RAISE EXCEPTION 'Você já sugeriu 3 ideias neste brunch.';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS brunch_option_check ON public.brunch_poll_options;
CREATE TRIGGER brunch_option_check BEFORE INSERT ON public.brunch_poll_options
    FOR EACH ROW EXECUTE FUNCTION public.brunch_option_check();

-- A vote: the brunch comes from the option (never from the browser), the vote must be open, and each person has
-- 3 votes per kind (treats / topics) per brunch.
CREATE OR REPLACE FUNCTION public.brunch_vote_check()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    opt public.brunch_poll_options%ROWTYPE;
BEGIN
    SELECT * INTO opt FROM public.brunch_poll_options WHERE id = NEW.option_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Opção não encontrada.'; END IF;
    NEW.event_id := opt.event_id;
    NEW.user_id := auth.uid();
    IF NOT public.brunch_votes_open(opt.event_id) THEN
        RAISE EXCEPTION 'A votação deste brunch já fechou.';
    END IF;
    IF (SELECT count(*) FROM public.brunch_votes v JOIN public.brunch_poll_options o ON o.id = v.option_id
        WHERE v.event_id = opt.event_id AND v.user_id = auth.uid() AND o.kind = opt.kind) >= 3 THEN
        RAISE EXCEPTION 'Você já usou os seus 3 votos aqui. Tire um para votar em outro.';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS brunch_vote_check ON public.brunch_votes;
CREATE TRIGGER brunch_vote_check BEFORE INSERT ON public.brunch_votes
    FOR EACH ROW EXECUTE FUNCTION public.brunch_vote_check();

-- The tally moves live in the room.
DO $$
DECLARE t text;
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOREACH t IN ARRAY ARRAY['brunch_votes', 'brunch_poll_options'] LOOP
            IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t) THEN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
            END IF;
        END LOOP;
    END IF;
END $$;

-- ------------------------------------------------------------ touch
CREATE OR REPLACE FUNCTION public.brunch_touch() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS brunch_events_touch ON public.brunch_events;
CREATE TRIGGER brunch_events_touch BEFORE UPDATE ON public.brunch_events FOR EACH ROW EXECUTE FUNCTION public.brunch_touch();
DROP TRIGGER IF EXISTS brunch_profiles_touch ON public.brunch_profiles;
CREATE TRIGGER brunch_profiles_touch BEFORE UPDATE ON public.brunch_profiles FOR EACH ROW EXECUTE FUNCTION public.brunch_touch();

-- ------------------------------------------------------------ verify
SELECT
    (SELECT count(*) FROM public.brunch_events)  AS brunches,
    (SELECT count(*) FROM public.brunch_tickets) AS tickets,
    (SELECT public FROM storage.buckets WHERE id = 'brunch') AS photo_bucket_public,
    EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'brunch_messages') AS chat_realtime;
