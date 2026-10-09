-- ============================================================================
-- MIGRATION 47: Retreat calendar, in step with Airbnb / Booking.com
-- ============================================================================
-- The house is rented on Airbnb, so a retreat can only be sold on nights Airbnb hasn't sold. Airbnb has no open
-- API for small hosts; what every platform does offer is an iCal link in both directions. So:
--
--   IN  (Airbnb -> site): each listing's "Export calendar" link is pasted into /admin/retreats/reservas. The site
--       reads it (at most every 10 minutes, when someone opens the package builder) and keeps the booked nights in
--       retreat_busy_nights. The package builder only offers dates that are free.
--   OUT (site -> Airbnb): every room gets its own link /api/retreats/ical/<room>?token=..., pasted into Airbnb under
--       "Import calendar". A retreat reservation made in the admin shows up there and Airbnb blocks those nights
--       (Airbnb re-reads imported calendars about every 2 hours).
--
-- Only dates travel through these links, never names. Safe to run twice.
-- ============================================================================

BEGIN;

-- Per room: the platform links we read, and the secret part of the link Airbnb reads from us. Admin only.
CREATE TABLE IF NOT EXISTS public.retreat_calendar (
    room_id          text PRIMARY KEY REFERENCES public.retreat_rooms(id) ON DELETE CASCADE,
    import_urls      text[] NOT NULL DEFAULT '{}',
    export_token     text NOT NULL DEFAULT replace(gen_random_uuid()::text, '-', ''),
    last_synced_at   timestamptz,
    last_sync_error  text
);
INSERT INTO public.retreat_calendar (room_id) SELECT id FROM public.retreat_rooms ON CONFLICT (room_id) DO NOTHING;

ALTER TABLE public.retreat_calendar ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS retreat_calendar_admin ON public.retreat_calendar;
CREATE POLICY retreat_calendar_admin ON public.retreat_calendar
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retreat_calendar TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retreat_calendar TO service_role;

-- Nights already taken on Airbnb / Booking (copied from their iCal links). A "night" is the date you sleep there:
-- a stay 10 -> 13 takes the nights 10, 11 and 12. Public: it is just dates, and the package builder needs it.
CREATE TABLE IF NOT EXISTS public.retreat_busy_nights (
    room_id  text NOT NULL REFERENCES public.retreat_rooms(id) ON DELETE CASCADE,
    night    date NOT NULL,
    source   text NOT NULL DEFAULT 'ical',
    PRIMARY KEY (room_id, night, source)
);
ALTER TABLE public.retreat_busy_nights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS retreat_busy_public_read ON public.retreat_busy_nights;
CREATE POLICY retreat_busy_public_read ON public.retreat_busy_nights FOR SELECT USING (true);
GRANT SELECT ON public.retreat_busy_nights TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retreat_busy_nights TO service_role;

-- Our own retreat reservations. 'reservado' = deposit promised, dates held; 'confirmado' = deposit paid.
-- Both block the room (and go out to Airbnb). 'cancelado' frees the nights again.
CREATE TABLE IF NOT EXISTS public.retreat_bookings (
    id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id        text NOT NULL REFERENCES public.retreat_rooms(id),
    check_in       date NOT NULL,
    check_out      date NOT NULL,
    guests         integer NOT NULL DEFAULT 1,
    courses        text[] NOT NULL DEFAULT '{}',
    guest_name     text NOT NULL,
    whatsapp       text,
    email          text,
    status         text NOT NULL DEFAULT 'reservado' CHECK (status IN ('reservado', 'confirmado', 'cancelado')),
    total          numeric(10, 2),
    deposit_paid   numeric(10, 2) NOT NULL DEFAULT 0,
    notes          text,
    created_at     timestamptz NOT NULL DEFAULT now(),
    CHECK (check_out > check_in)
);
CREATE INDEX IF NOT EXISTS retreat_bookings_dates ON public.retreat_bookings (room_id, check_in, check_out);
ALTER TABLE public.retreat_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS retreat_bookings_admin ON public.retreat_bookings;
CREATE POLICY retreat_bookings_admin ON public.retreat_bookings
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retreat_bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retreat_bookings TO service_role;

-- Share of the package paid up front to hold the dates (the rest 30 days before arrival).
INSERT INTO public.site_settings (key, value, label) VALUES ('retreat_deposit_percent', 30, 'Retiro: sinal para reservar as datas (%)') ON CONFLICT (key) DO NOTHING;

COMMIT;

-- Verification
SELECT room_id, array_length(import_urls, 1) AS feeds, export_token FROM public.retreat_calendar ORDER BY room_id;
