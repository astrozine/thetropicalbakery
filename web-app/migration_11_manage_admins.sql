-- ============================================================================
-- MIGRATION 11: Manage administrators from /admin/administradores
-- ============================================================================
-- The `admins` table already decides who is an administrator (see migration 02
-- and public.is_admin()). Until now it could only be edited in the SQL editor.
-- This lets an existing admin add and remove admins from the backend, and
-- keeps the list from ever becoming empty.
-- ============================================================================

BEGIN;

DROP POLICY IF EXISTS "Admins can add admins" ON public.admins;
CREATE POLICY "Admins can add admins"
    ON public.admins FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can remove admins" ON public.admins;
CREATE POLICY "Admins can remove admins"
    ON public.admins FOR DELETE TO authenticated
    USING (public.is_admin());

-- Never allow the last administrator to be removed (would lock everyone out).
CREATE OR REPLACE FUNCTION public.prevent_last_admin_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF (SELECT count(*) FROM public.admins) <= 1 THEN
        RAISE EXCEPTION 'Não é possível remover o último administrador.';
    END IF;
    RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS keep_one_admin ON public.admins;
CREATE TRIGGER keep_one_admin
    BEFORE DELETE ON public.admins
    FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_delete();

COMMIT;

SELECT email, note FROM public.admins ORDER BY created_at;
