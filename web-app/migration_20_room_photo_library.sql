-- ============================================================================
-- MIGRATION 20: Room photo library (show / hide / hero) for /admin/retreats
-- ============================================================================
-- `gallery` (migration 10) is what the Retiros page SHOWS, in order — the first
-- photo is the hero. That can't remember photos Dolly has hidden, so a hidden
-- photo would be lost the moment she saved.
--
-- `gallery_library` remembers EVERY photo of a room (shown or hidden, in her
-- order). The admin page reads it to draw all the tiles; the public page never
-- needs it.
--
-- Safe to run more than once.
-- ============================================================================

BEGIN;

ALTER TABLE public.retreat_rooms
  ADD COLUMN IF NOT EXISTS gallery_library text[] NOT NULL DEFAULT '{}';

COMMIT;
