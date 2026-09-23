-- ============================================================================
-- Social login + CRM linkage
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- Safe to run more than once.
-- ============================================================================
--
-- Why this is needed: AuthContext.tsx reads and writes `public.user_profiles`,
-- but that table was never created. Every profile read returned "table not
-- found" and every profile write threw — which is what broke Google login
-- (no saved details to pre-fill) AND what caused the "Ocorreu um erro ao
-- processar seu pedido" alert on /caixas for logged-in customers, since the
-- checkout calls updateProfile() inside its try block before sending the order.

-- ---------------------------------------------------------------------------
-- 1. The account-bound profile. This is what lets us pre-fill forms so
--    customers never retype their details.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    delivery_zone TEXT,
    is_vegan BOOLEAN DEFAULT FALSE,
    is_gluten_free BOOLEAN DEFAULT FALSE,
    is_sugar_free BOOLEAN DEFAULT FALSE,
    is_salt_free BOOLEAN DEFAULT FALSE,
    is_oil_free BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Each customer can only ever see or touch their own row.
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 2. Create the profile automatically the moment someone signs in with
--    Google or Facebook, seeded with the name/email the provider gives us.
--    Without this, a first-time Google user would still have to type their name.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name, email)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name'
        ),
        NEW.email
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill anyone who already signed in before this migration ran.
INSERT INTO public.user_profiles (id, full_name, email)
SELECT
    id,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
    email
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Keep updated_at honest.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_modtime ON public.user_profiles;
CREATE TRIGGER update_user_profiles_modtime
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();

-- ---------------------------------------------------------------------------
-- 4. Tie the CRM to accounts. The `users` CRM table is keyed by WhatsApp
--    number; this lets an order placed by a logged-in customer be attributed
--    to their account instead of only to a phone number.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS email TEXT;

CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON public.users(auth_user_id);
