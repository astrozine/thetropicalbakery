-- ============================================================================
-- MIGRATION 10: Room photo galleries editable from /admin/retreats
-- ============================================================================
-- The /retreats accordion ships with a default photo set per accommodation
-- (taken from our Airbnb listings). `gallery` lets Dolly replace a room's photos
-- from the admin panel: paste one image URL per line, in the order to show.
-- Empty gallery = keep the defaults.
--
-- Also adds a row for the whole house (11 guests) so it can carry its own
-- photos and nightly rate, and shows up in the package calculator.
-- ============================================================================

BEGIN;

ALTER TABLE public.retreat_rooms
  ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}';

INSERT INTO public.retreat_rooms (id, name, image_url, max_guests, airbnb_nightly_rate)
VALUES ('house', 'A Casa Toda', '/retreats/rooms/house-1.jpg', 11, 0)
ON CONFLICT (id) DO NOTHING;

COMMIT;

SELECT id, name, max_guests, airbnb_nightly_rate, cardinality(gallery) AS custom_photos
FROM public.retreat_rooms ORDER BY id;
