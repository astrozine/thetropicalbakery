-- ============================================================================
-- MIGRATION 06: Site settings (admin-editable numbers that change over time)
-- ============================================================================
-- A tiny key/value table for figures that drift over time but aren't really
-- "content" — the federal minimum wage, the retreat immersion fee. Public can
-- read them (the pay estimator and retreat calculator run on public pages),
-- only admins can change them, and changing one is editing a row in
-- /admin/configuracoes — no code deploy needed.
--
-- Note on "real-time" figures: things like the minimum wage change once a
-- year by government decree, not continuously, so there's no live feed to
-- plug in (GOOGLEFINANCE-style formulas only work for tradable
-- assets/currencies, not statutory wage figures). A settings row Dolly can
-- edit herself each January is simpler and more reliable than wiring up an
-- external spreadsheet.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.site_settings (
    key text PRIMARY KEY,
    value numeric NOT NULL,
    label text NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.site_settings (key, value, label) VALUES
    ('minimum_wage', 1518, 'Salário mínimo vigente (R$/mês)'),
    ('retreat_immersion_fee_per_guest_per_night', 180, 'Taxa de imersão do retiro (R$/pessoa/noite)')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;
CREATE POLICY "Anyone can read site settings"
    ON public.site_settings FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
CREATE POLICY "Admins can update site settings"
    ON public.site_settings FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;

-- Verification
SELECT key, value, label FROM public.site_settings ORDER BY key;
