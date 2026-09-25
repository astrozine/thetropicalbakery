-- ============================================================================
-- MIGRATION 19: point two treats at the light versions of their photos
-- ============================================================================
-- Two treat photos were 1.9 MB and 2.4 MB PNG screenshots. Light WebP copies of the same
-- pictures now live next to them (about 110 KB each). The old PNGs stay on the site, so nothing
-- breaks if you skip this; running it just makes those two treats load much faster.
-- (The file name of the first one contains a comma, which is why it is repointed rather than
-- resized on the fly.)
-- ============================================================================

BEGIN;

UPDATE public.treats
   SET image_url = '/menu-items/1000231026_3b42196b4ea44c55b3834d9f1bf36302-2_17_2026_8_48_32_AM.webp'
 WHERE image_url = '/menu-items/1000231026_3b42196b4ea44c55b3834d9f1bf36302-2_17_2026, 8_48_32 AM.png';

UPDATE public.treats
   SET image_url = '/menu-items/20260208_082125_0000.webp'
 WHERE image_url = '/menu-items/20260208_082125_0000.png';

COMMIT;

SELECT name, image_url FROM public.treats WHERE image_url LIKE '%.webp' ORDER BY name;
