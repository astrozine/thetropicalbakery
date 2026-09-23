-- ============================================================================
-- MIGRATION 09: Unified inbox status
-- ============================================================================
-- One shadow table tracking "has Dolly seen/actioned this" across every kind
-- of inbound thing (job applications, orders, course/retreat inquiries,
-- waitlist signups) without touching each source table's own schema. Keyed
-- by (source_table, source_id) so adding a new source later is just a new
-- admin-page query, not a migration.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.inbox_status (
    source_table TEXT NOT NULL,
    source_id    TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'new',
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (source_table, source_id)
);

ALTER TABLE public.inbox_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage inbox status" ON public.inbox_status;
CREATE POLICY "Admins can manage inbox status"
    ON public.inbox_status FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

COMMIT;

-- Verification
SELECT CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables
                          WHERE table_name = 'inbox_status') THEN 'yes' ELSE 'NO - PROBLEM' END
       AS inbox_status_table_created;
