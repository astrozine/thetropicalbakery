-- ============================================================================
-- MIGRATION 18: What people write when they ask about a course or retreat
-- ============================================================================
-- The interest form (Agendar Curso / Agendar Retiro) now asks "how many people"
-- and "tell us what you imagine". They show up on Admin > Inscrições em Cursos.
-- Until this is run the form still works: it keeps the text inside the
-- interest line instead, so nothing anyone writes is lost.
-- ============================================================================

BEGIN;

ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS group_size smallint;
ALTER TABLE public.course_registrations ADD COLUMN IF NOT EXISTS message    text;

COMMIT;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'course_registrations'
  AND column_name IN ('group_size', 'message');
