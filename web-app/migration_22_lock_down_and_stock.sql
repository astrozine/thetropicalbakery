-- ============================================================================
-- MIGRATION 22: Lock down who can read orders and edit the site, and make the
--               box "sold" counter safe
-- ============================================================================
-- What was wrong (found by checking with the public site key, counts only):
--   1. ORDERS could be READ by anyone. It holds names, WhatsApp numbers and
--      addresses. Now only admins can read it. Real orders are created by the server (which
--      prices them from the database); the public can only leave a lead.
--   2. The tables that hold the site's content (courses, treats, boxes, homepage
--      content, highlights, retreat rooms) could be WRITTEN by any signed-in person,
--      and customers can sign in. The box table could be edited by anyone at all.
--      Now only admins can write; everyone can still read what the public pages show.
--   3. The image storage folder ("uploads") could be changed by any signed-in person.
--      Now only admins can upload, replace or delete.
--   4. The box "sold" counter was updated from the customer's browser (read, add,
--      write), so two buyers at once could both get the last box. Now one function
--      does it in a single safe step and refuses to sell past the stock.
--
-- Idempotent: safe to run twice. Nothing is deleted, no data changes.
-- Admins are the emails in public.admins (public.is_admin()). If nobody is an admin the
-- admin pages already could not open, so this cannot lock you out.
-- ============================================================================

BEGIN;

-- --------------------------------------------------------------------------
-- 1. ORDERS: place = anyone, everything else = admins only
-- --------------------------------------------------------------------------
DO $$
DECLARE pol record;
BEGIN
    IF to_regclass('public.orders') IS NULL THEN RETURN; END IF;
    ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' LOOP
        EXECUTE format('DROP POLICY %I ON public.orders', pol.policyname);
    END LOOP;

    -- The site's checkout now creates orders on the SERVER (it prices them from the database), so the
    -- public no longer needs to write real orders. They may only leave a LEAD: a name and contact, with
    -- no status and no price (the small "quero saber mais" forms do exactly that).
    CREATE POLICY "Anyone can leave a lead" ON public.orders
        FOR INSERT TO anon, authenticated
        WITH CHECK (status IS NULL AND total_price IS NULL);

    CREATE POLICY "Admins manage orders" ON public.orders
        FOR ALL TO authenticated
        USING (public.is_admin()) WITH CHECK (public.is_admin());
END $$;

-- --------------------------------------------------------------------------
-- 2. CONTENT TABLES: public reads, only admins write
-- --------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    pol record;
    has_select boolean;
BEGIN
    FOREACH t IN ARRAY ARRAY['courses', 'site_content', 'treats', 'tasting_boxes', 'highlights', 'retreat_rooms']
    LOOP
        IF to_regclass('public.' || t) IS NULL THEN CONTINUE; END IF;
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

        -- Remove every rule that lets someone write (or that mixed read and write together).
        FOR pol IN SELECT policyname FROM pg_policies
                   WHERE schemaname = 'public' AND tablename = t AND cmd <> 'SELECT'
        LOOP
            EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
        END LOOP;

        -- The public pages must keep working: make sure reading is still allowed.
        SELECT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = t AND cmd = 'SELECT')
          INTO has_select;
        IF NOT has_select THEN
            EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO public USING (true)', 'Public can read ' || t, t);
        END IF;

        EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())',
                       'Admins manage ' || t, t);
    END LOOP;
END $$;

-- The admin pages read every course (including hidden ones); the public read rule for courses may
-- only show active ones, so admins need their own read, which the "Admins manage" rule above gives.

-- --------------------------------------------------------------------------
-- 3. IMAGE STORAGE ("uploads"): anyone can look at the pictures, only admins change them
-- --------------------------------------------------------------------------
DO $$
DECLARE pol record;
BEGIN
    IF to_regclass('storage.objects') IS NULL THEN RETURN; END IF;
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
          AND (coalesce(qual, '') ILIKE '%uploads%' OR coalesce(with_check, '') ILIKE '%uploads%')
    LOOP
        EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
    END LOOP;

    DROP POLICY IF EXISTS "Admins upload images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins replace images" ON storage.objects;
    DROP POLICY IF EXISTS "Admins delete images" ON storage.objects;
    CREATE POLICY "Admins upload images" ON storage.objects FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'uploads' AND public.is_admin());
    CREATE POLICY "Admins replace images" ON storage.objects FOR UPDATE TO authenticated
        USING (bucket_id = 'uploads' AND public.is_admin()) WITH CHECK (bucket_id = 'uploads' AND public.is_admin());
    CREATE POLICY "Admins delete images" ON storage.objects FOR DELETE TO authenticated
        USING (bucket_id = 'uploads' AND public.is_admin());
EXCEPTION WHEN insufficient_privilege THEN
    RAISE NOTICE 'Could not change the storage rules from here. Change them in Storage > Policies instead.';
END $$;

-- --------------------------------------------------------------------------
-- 4. SAFE STOCK: reserve boxes in one step, never past what was made
-- --------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reserve_box_stock(p_box_id uuid, p_qty integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
    IF p_qty IS NULL OR p_qty < 1 OR p_qty > 100 THEN RETURN false; END IF;

    UPDATE public.tasting_boxes
       SET sold_quantity = sold_quantity + p_qty
     WHERE id = p_box_id
       AND is_active
       AND (total_quantity <= 0 OR sold_quantity + p_qty <= total_quantity);

    GET DIAGNOSTICS n = ROW_COUNT;
    RETURN n > 0;   -- false = not enough left (or the box is not on sale); nothing was changed
END;
$$;

-- Giving a box back when an order could not be saved (the server does this if saving fails).
CREATE OR REPLACE FUNCTION public.release_box_stock(p_box_id uuid, p_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_qty IS NULL OR p_qty < 1 OR p_qty > 100 THEN RETURN; END IF;
    UPDATE public.tasting_boxes
       SET sold_quantity = greatest(0, sold_quantity - p_qty)
     WHERE id = p_box_id;
END;
$$;

-- Only the server (service role) may move the counter. Visitors and signed-in customers cannot.
REVOKE ALL ON FUNCTION public.reserve_box_stock(uuid, integer) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.release_box_stock(uuid, integer) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_box_stock(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_box_stock(uuid, integer) TO service_role;

COMMIT;

-- What the rules look like now (read this to check).
SELECT tablename, policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'courses', 'site_content', 'treats', 'tasting_boxes', 'highlights', 'retreat_rooms')
ORDER BY tablename, cmd, policyname;
