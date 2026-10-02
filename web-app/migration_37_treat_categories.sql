-- ============================================================================
-- MIGRATION 37: Treat categories Dolly can edit (Menu de Eventos)
-- ============================================================================
-- Until now the categories (Entremets, Bolos, Tarteletes…) were written in the code
-- (src/lib/treatTypes.ts). This table holds them instead, so the admin can create, rename,
-- recolour, reorder and remove them in /admin/treats. treats.treat_type keeps pointing at
-- treat_types.id (free text, as before). Removing a category never deletes a treat: the
-- admin first clears treat_type on its treats, and they show under "Outros".
--
-- Seeded with today's eight categories, same ids, so nothing on the site moves.
-- Everyone may read (the public /menu groups by them); only admins write. Safe to run twice.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.treat_types (
  id          text PRIMARY KEY,
  label       text NOT NULL,
  emoji       text NOT NULL DEFAULT '🍫',
  accent      text NOT NULL DEFAULT '#8a7a6b',
  hint        text,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.treat_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read treat types" ON public.treat_types;
CREATE POLICY "Anyone can read treat types" ON public.treat_types FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins manage treat types" ON public.treat_types;
CREATE POLICY "Admins manage treat types" ON public.treat_types
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- New table: grant Data API access explicitly (see CLAUDE.md). The public only reads.
GRANT SELECT ON public.treat_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treat_types TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.treat_types TO service_role;

INSERT INTO public.treat_types (id, label, emoji, accent, hint, sort_order) VALUES
  ('entremets',  'Entremets (sobremesa em camadas)', '🍮', '#c2504a', 'sobremesa em camadas, moldada, ao estilo da pâtisserie francesa', 1),
  ('bolos',      'Bolos',                            '🎂', '#e8a33d', 'bolos, mini bundt cakes, cheesecakes, rocamboles', 2),
  ('tarteletes', 'Tarteletes',                       '🥧', '#b8743a', 'tarteletes e tortas com base crocante', 3),
  ('cupcakes',   'Cupcakes',                         '🧁', '#d77a9a', 'bolinhos individuais com cobertura', 4),
  ('cake-pops',  'Cake pops (bolo no palito)',       '🍭', '#b0579a', 'bolinha de bolo no palito, banhada na cobertura', 5),
  ('assados',    'Assados',                          '🥐', '#c98a4b', 'vai ao forno: barrinhas, folhados, pães doces', 6),
  ('cookies',    'Cookies',                          '🍪', '#8a5a3b', NULL, 7),
  ('chocolates', 'Chocolates',                       '🍫', '#4a332a', 'bombons, trufas e docinhos de chocolate', 8)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Check: the categories, in order.
SELECT id, label, emoji, accent, sort_order FROM public.treat_types ORDER BY sort_order, label;
