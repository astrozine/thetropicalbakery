-- ============================================================================
-- THE TROPICAL BAKERY — Migration 02
-- Accounts (email + phone login), admin access control, and security fixes.
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> New query ->
--             select ALL of this file (Ctrl+A, Ctrl+C) -> paste -> Run.
--             It runs as one transaction: either all of it applies, or none.
--             Running it twice is safe.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- PART 1 — Who is allowed into /admin
--
-- Until now, ANY signed-in visitor could open /admin and read the whole
-- customer list, because the site only checked "is someone logged in?".
-- Now there is an explicit list of allowed people.
--
-- To add another admin later, run just this one line in the SQL Editor:
--   INSERT INTO public.admins (email, note) VALUES ('someone@example.com', 'Name');
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admins (
    email      TEXT PRIMARY KEY,
    note       TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admins (email, note) VALUES
    ('elisabeth.vandam@gmail.com', 'Main admin'),
    ('astrozine@gmail.com',        'Andrew')
ON CONFLICT (email) DO NOTHING;

-- Answers "is the person making this request an admin?" for every rule below.
-- SECURITY DEFINER so it can read the admins list even though that list is
-- itself locked down. lower() so capitalisation in an email never locks you out.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins
        WHERE lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "Admins can read the admin list" ON public.admins;
CREATE POLICY "Admins can read the admin list"
    ON public.admins FOR SELECT TO authenticated
    USING (public.is_admin());


-- ----------------------------------------------------------------------------
-- PART 2 — Customer accounts (user_profiles)
--
-- Adds phone capture, so someone who signs in with their phone number gets
-- that number saved automatically and never types it again. Also lets admins
-- see all accounts, while customers still only ever see their own.
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS phone TEXT;
-- Which button they used to sign in: google, facebook, email or phone.
-- Shown in the admin CRM so you can see how your customers prefer to log in.
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, phone, auth_provider)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.email,
        NULLIF(NEW.phone, ''),
        NEW.raw_app_meta_data->>'provider'
    )
    ON CONFLICT (id) DO UPDATE SET
        -- Never blank out something we already know about this customer.
        email         = COALESCE(EXCLUDED.email, user_profiles.email),
        phone         = COALESCE(EXCLUDED.phone, user_profiles.phone),
        full_name     = COALESCE(user_profiles.full_name, EXCLUDED.full_name),
        auth_provider = COALESCE(EXCLUDED.auth_provider, user_profiles.auth_provider);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Phone sign-ups confirm their number after the row is created, so also sync
-- on update. This is what fills in the phone for SMS/WhatsApp logins.
CREATE OR REPLACE FUNCTION public.handle_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.user_profiles SET
        email         = COALESCE(NULLIF(NEW.email, ''), email),
        phone         = COALESCE(NULLIF(NEW.phone, ''), phone),
        auth_provider = COALESCE(NEW.raw_app_meta_data->>'provider', auth_provider)
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_updated();

-- Backfill phone and login method for anyone who already signed up.
UPDATE public.user_profiles p
SET phone         = COALESCE(p.phone, NULLIF(u.phone, '')),
    auth_provider = COALESCE(p.auth_provider, u.raw_app_meta_data->>'provider')
FROM auth.users u
WHERE u.id = p.id
  AND (p.phone IS NULL OR p.auth_provider IS NULL);

DROP POLICY IF EXISTS "Admins can read all profiles" ON public.user_profiles;
CREATE POLICY "Admins can read all profiles"
    ON public.user_profiles FOR SELECT TO authenticated
    USING (public.is_admin());


-- ----------------------------------------------------------------------------
-- PART 3 — Lock down the CRM customer list
--
-- THIS IS THE IMPORTANT ONE. Right now anyone on the internet can download
-- your entire customer list — names, WhatsApp numbers, addresses and dietary
-- notes — because the website's public key allows reading this table directly.
-- Under LGPD that is personal data you are responsible for.
--
-- After this runs: the checkout can still save a customer (through the
-- controlled function below), but nobody can read, bulk-edit or delete the
-- list except an admin from PART 1.
-- ----------------------------------------------------------------------------

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Clear out whatever permissive rules are currently on the table, whatever
-- they happen to be named, so we start from a known state.
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.users', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Admins can read customers"
    ON public.users FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can edit customers"
    ON public.users FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete customers"
    ON public.users FOR DELETE TO authenticated USING (public.is_admin());

CREATE POLICY "Customers can read their own record"
    ON public.users FOR SELECT TO authenticated USING (auth_user_id = auth.uid());

-- The only way the public website is allowed to write a customer record.
-- It can add or refresh one customer, matched on WhatsApp number, and it
-- returns nothing — so it can't be abused to read the list back out.
CREATE OR REPLACE FUNCTION public.upsert_crm_customer(
    p_full_name       TEXT,
    p_whatsapp_number TEXT,
    p_location        TEXT    DEFAULT NULL,
    p_email           TEXT    DEFAULT NULL,
    p_is_vegan        BOOLEAN DEFAULT FALSE,
    p_is_gluten_free  BOOLEAN DEFAULT FALSE,
    p_is_sugar_free   BOOLEAN DEFAULT FALSE,
    p_is_salt_free    BOOLEAN DEFAULT FALSE,
    p_is_oil_free     BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF COALESCE(TRIM(p_whatsapp_number), '') = '' THEN
        RAISE EXCEPTION 'whatsapp_number is required';
    END IF;

    INSERT INTO public.users (
        full_name, whatsapp_number, location, email, auth_user_id, password_hash,
        is_vegan, is_gluten_free, is_sugar_free, is_salt_free, is_oil_free
    )
    VALUES (
        p_full_name, TRIM(p_whatsapp_number), p_location, p_email, auth.uid(),
        md5(gen_random_uuid()::text),
        p_is_vegan, p_is_gluten_free, p_is_sugar_free, p_is_salt_free, p_is_oil_free
    )
    ON CONFLICT (whatsapp_number) DO UPDATE SET
        full_name      = COALESCE(NULLIF(EXCLUDED.full_name, ''), users.full_name),
        location       = COALESCE(NULLIF(EXCLUDED.location, ''),  users.location),
        email          = COALESCE(EXCLUDED.email,        users.email),
        auth_user_id   = COALESCE(EXCLUDED.auth_user_id, users.auth_user_id),
        is_vegan       = EXCLUDED.is_vegan,
        is_gluten_free = EXCLUDED.is_gluten_free,
        is_sugar_free  = EXCLUDED.is_sugar_free,
        is_salt_free   = EXCLUDED.is_salt_free,
        is_oil_free    = EXCLUDED.is_oil_free;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_crm_customer(
    TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN
) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- PART 4 — Fix the tasting box "only N left" counter
--
-- The counter never went down, because the website was silently not allowed to
-- update the number sold. The update looked like it worked and changed nothing.
-- ----------------------------------------------------------------------------

ALTER TABLE public.tasting_boxes ENABLE ROW LEVEL SECURITY;

-- Read policy FIRST and explicitly. Switching row-level security on without one
-- would hide the boxes from the website entirely. There is nothing private in
-- this table — it's the products on sale.
DROP POLICY IF EXISTS "Anyone can view tasting boxes" ON public.tasting_boxes;
CREATE POLICY "Anyone can view tasting boxes"
    ON public.tasting_boxes FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Public can increment sold_quantity on tasting boxes" ON public.tasting_boxes;
CREATE POLICY "Public can increment sold_quantity on tasting boxes"
    ON public.tasting_boxes FOR UPDATE TO public USING (true) WITH CHECK (true);


-- ----------------------------------------------------------------------------
-- PART 5 — Lock down course & retreat enquiries
--
-- Same problem as the customer list: the names, e-mails and WhatsApp numbers
-- of everyone who enquired about a course were readable by anyone. People can
-- still submit the form; only admins can read what came in.
-- ----------------------------------------------------------------------------

ALTER TABLE public.course_registrations ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'course_registrations'
    LOOP
        EXECUTE format('DROP POLICY %I ON public.course_registrations', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Anyone can submit an enquiry"
    ON public.course_registrations FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can read enquiries"
    ON public.course_registrations FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Admins can update enquiries"
    ON public.course_registrations FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete enquiries"
    ON public.course_registrations FOR DELETE TO authenticated USING (public.is_admin());


-- ============================================================================
-- CHECK IT WORKED — these should print after the migration runs.
-- ============================================================================

SELECT 'admins on the list' AS check, count(*)::text AS result FROM public.admins
UNION ALL
SELECT 'user_profiles has a phone column',
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'user_profiles' AND column_name = 'phone')
            THEN 'yes' ELSE 'NO - PROBLEM' END
UNION ALL
SELECT 'customer list is now locked down',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies
                         WHERE tablename = 'users' AND policyname = 'Admins can read customers')
            THEN 'yes' ELSE 'NO - PROBLEM' END
UNION ALL
SELECT 'checkout can still save customers',
       CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'upsert_crm_customer')
            THEN 'yes' ELSE 'NO - PROBLEM' END
UNION ALL
SELECT 'course enquiries are now locked down',
       CASE WHEN EXISTS (SELECT 1 FROM pg_policies
                         WHERE tablename = 'course_registrations' AND policyname = 'Admins can read enquiries')
            THEN 'yes' ELSE 'NO - PROBLEM' END;
