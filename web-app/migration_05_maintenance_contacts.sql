-- ============================================================================
-- MIGRATION 05: Maintenance / repair contacts catalogue
-- ============================================================================
-- A single place for "who do we call when something breaks" — plumber,
-- electrician, fridge/freezer repair, oven repair, gas, wifi/internet,
-- generator, etc. Admin-only for now: there's no separate worker login yet,
-- so this stays out of any public page. Once a worker portal exists, it can
-- read from this same table with a policy scoped to logged-in staff.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.maintenance_contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL, -- 'Encanamento', 'Elétrica', 'Geladeira/Freezer', 'Forno', 'Gás', 'Internet/Wifi', 'Gerador', 'Outro'
    name text NOT NULL,
    phone text NOT NULL,
    notes text, -- e.g. "atende fins de semana", "avisar 1 dia antes", "só emergência"
    is_emergency boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS maintenance_contacts_category_idx ON public.maintenance_contacts(category);

ALTER TABLE public.maintenance_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read maintenance contacts" ON public.maintenance_contacts;
CREATE POLICY "Admins can read maintenance contacts"
    ON public.maintenance_contacts FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage maintenance contacts" ON public.maintenance_contacts;
CREATE POLICY "Admins can manage maintenance contacts"
    ON public.maintenance_contacts FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update maintenance contacts" ON public.maintenance_contacts;
CREATE POLICY "Admins can update maintenance contacts"
    ON public.maintenance_contacts FOR UPDATE TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete maintenance contacts" ON public.maintenance_contacts;
CREATE POLICY "Admins can delete maintenance contacts"
    ON public.maintenance_contacts FOR DELETE TO authenticated USING (public.is_admin());

COMMIT;

-- Verification
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                          WHERE table_name = 'maintenance_contacts') THEN 'yes' ELSE 'NO - PROBLEM' END
       AS maintenance_contacts_table_created;
