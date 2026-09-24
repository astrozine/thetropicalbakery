-- ============================================================================
-- MIGRATION 19: Detailed dietary profiles (and e-mails that speak to them)
-- ============================================================================
-- Until now a customer was five yes/no boxes (vegano, sem glúten, sem açúcar,
-- sem sal, sem óleo). This keeps those five working exactly as they are, and
-- adds the detail underneath:
--
--   diet_tags        text[]  how they eat + what they avoid for their health,
--                            e.g. {'vegano','diabetes','pressao-alta'}
--                            (ids from src/lib/dietary.ts)
--   allergens_avoid  text[]  what makes them ill, using the SAME ids the treats
--                            declare in contains / may_contain
--                            (ids from src/lib/allergens.ts) — that is what
--                            makes "esta caixa é segura para você" automatic
--   diet_notes       text    anything in their own words
--
-- Stored in four places, each for its own reason:
--   user_profiles   the customer's own account (they edit it in Minha Conta)
--   users           the CRM list Dolly works from
--   email_contacts  what the e-mail audience filters read
--   orders          what the kitchen sees for THAT order
--
-- Run migrations 02 and 15 first (this one extends `users` and `email_contacts`).
-- Safe to run more than once.
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------- columns
ALTER TABLE public.user_profiles  ADD COLUMN IF NOT EXISTS diet_tags       text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.user_profiles  ADD COLUMN IF NOT EXISTS allergens_avoid text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.user_profiles  ADD COLUMN IF NOT EXISTS diet_notes      text;

ALTER TABLE public.users          ADD COLUMN IF NOT EXISTS diet_tags       text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.users          ADD COLUMN IF NOT EXISTS allergens_avoid text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.users          ADD COLUMN IF NOT EXISTS diet_notes      text;

ALTER TABLE public.email_contacts ADD COLUMN IF NOT EXISTS diet_tags       text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.email_contacts ADD COLUMN IF NOT EXISTS allergens_avoid text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.email_contacts ADD COLUMN IF NOT EXISTS diet_notes      text;

ALTER TABLE public.orders         ADD COLUMN IF NOT EXISTS diet_tags       text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.orders         ADD COLUMN IF NOT EXISTS allergens_avoid text[] NOT NULL DEFAULT '{}';

-- Finding "everyone who avoids castanha-de-caju" fast.
CREATE INDEX IF NOT EXISTS email_contacts_diet_idx      ON public.email_contacts USING GIN (diet_tags);
CREATE INDEX IF NOT EXISTS email_contacts_allergens_idx ON public.email_contacts USING GIN (allergens_avoid);
CREATE INDEX IF NOT EXISTS users_diet_idx               ON public.users          USING GIN (diet_tags);
CREATE INDEX IF NOT EXISTS users_allergens_idx          ON public.users          USING GIN (allergens_avoid);

-- ------------------------------------------------- backfill from the old flags
-- Anyone who already ticked a box keeps that choice, now as a tag.
UPDATE public.user_profiles SET diet_tags = ARRAY(SELECT DISTINCT unnest(
        CASE WHEN is_vegan       THEN ARRAY['vegano']     ELSE '{}'::text[] END ||
        CASE WHEN is_gluten_free THEN ARRAY['sem-gluten'] ELSE '{}'::text[] END ||
        CASE WHEN is_sugar_free  THEN ARRAY['sem-acucar'] ELSE '{}'::text[] END ||
        CASE WHEN is_salt_free   THEN ARRAY['sem-sal']    ELSE '{}'::text[] END ||
        CASE WHEN is_oil_free    THEN ARRAY['sem-oleo']   ELSE '{}'::text[] END))
WHERE diet_tags = '{}'
  AND (is_vegan OR is_gluten_free OR is_sugar_free OR is_salt_free OR is_oil_free);

UPDATE public.users SET diet_tags = ARRAY(SELECT DISTINCT unnest(
        CASE WHEN is_vegan       THEN ARRAY['vegano']     ELSE '{}'::text[] END ||
        CASE WHEN is_gluten_free THEN ARRAY['sem-gluten'] ELSE '{}'::text[] END ||
        CASE WHEN is_sugar_free  THEN ARRAY['sem-acucar'] ELSE '{}'::text[] END ||
        CASE WHEN is_salt_free   THEN ARRAY['sem-sal']    ELSE '{}'::text[] END ||
        CASE WHEN is_oil_free    THEN ARRAY['sem-oleo']   ELSE '{}'::text[] END))
WHERE diet_tags = '{}'
  AND (is_vegan OR is_gluten_free OR is_sugar_free OR is_salt_free OR is_oil_free);


-- ----------------------------------------------------------------------------
-- The CRM upsert, now carrying the detail. The old 9-argument version is
-- dropped and replaced by one with three extra optional arguments, so calls
-- that don't pass them keep working unchanged.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.upsert_crm_customer(TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN);

CREATE OR REPLACE FUNCTION public.upsert_crm_customer(
    p_full_name       TEXT,
    p_whatsapp_number TEXT,
    p_location        TEXT    DEFAULT NULL,
    p_email           TEXT    DEFAULT NULL,
    p_is_vegan        BOOLEAN DEFAULT FALSE,
    p_is_gluten_free  BOOLEAN DEFAULT FALSE,
    p_is_sugar_free   BOOLEAN DEFAULT FALSE,
    p_is_salt_free    BOOLEAN DEFAULT FALSE,
    p_is_oil_free     BOOLEAN DEFAULT FALSE,
    p_diet_tags       TEXT[]  DEFAULT NULL,
    p_allergens       TEXT[]  DEFAULT NULL,
    p_diet_notes      TEXT    DEFAULT NULL
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
        is_vegan, is_gluten_free, is_sugar_free, is_salt_free, is_oil_free,
        diet_tags, allergens_avoid, diet_notes
    )
    VALUES (
        p_full_name, TRIM(p_whatsapp_number), p_location, p_email, auth.uid(),
        md5(gen_random_uuid()::text),
        p_is_vegan, p_is_gluten_free, p_is_sugar_free, p_is_salt_free, p_is_oil_free,
        COALESCE(p_diet_tags, '{}'), COALESCE(p_allergens, '{}'), NULLIF(TRIM(COALESCE(p_diet_notes, '')), '')
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
        is_oil_free    = EXCLUDED.is_oil_free,
        -- NULL means "the form didn't ask": keep what we already knew.
        diet_tags       = CASE WHEN p_diet_tags  IS NULL THEN users.diet_tags       ELSE COALESCE(p_diet_tags, '{}')  END,
        allergens_avoid = CASE WHEN p_allergens  IS NULL THEN users.allergens_avoid ELSE COALESCE(p_allergens, '{}')  END,
        diet_notes      = COALESCE(NULLIF(TRIM(COALESCE(p_diet_notes, '')), ''), users.diet_notes);
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_crm_customer(
    TEXT, TEXT, TEXT, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, BOOLEAN, TEXT[], TEXT[], TEXT
) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- Recording someone's diet against their e-mail address. Called from the
-- checkout and from Minha Conta. SECURITY DEFINER so a visitor can describe
-- themselves without being able to read anybody else's row.
-- Only ever writes the diet columns; never creates or undoes an unsubscribe.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_contact_set_diet(
    p_email     text,
    p_diet_tags text[] DEFAULT '{}',
    p_allergens text[] DEFAULT '{}',
    p_notes     text   DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text := lower(trim(coalesce(p_email, '')));
BEGIN
    IF v_email = '' OR position('@' in v_email) = 0 THEN
        RETURN;  -- nothing usable; never fail the form the visitor was filling in
    END IF;

    UPDATE public.email_contacts
       SET diet_tags       = COALESCE(p_diet_tags, '{}'),
           allergens_avoid = COALESCE(p_allergens, '{}'),
           diet_notes      = NULLIF(trim(coalesce(p_notes, '')), ''),
           updated_at      = now()
     WHERE email = v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.email_contact_set_diet(text, text[], text[], text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- The preferences page reads and writes the diet too, so someone who only ever
-- gave us an e-mail address can still be looked after properly.
-- (Return type changes, so the old function has to go first.)
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.email_prefs_get(uuid);

CREATE OR REPLACE FUNCTION public.email_prefs_get(p_token uuid)
RETURNS TABLE (
    email            text,
    full_name        text,
    opted_out        text[],
    unsubscribed_all boolean,
    tags             text[],
    diet_tags        text[],
    allergens_avoid  text[],
    diet_notes       text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT email, full_name, opted_out, unsubscribed_all, tags,
           diet_tags, allergens_avoid, diet_notes
    FROM public.email_contacts
    WHERE token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.email_prefs_get(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.email_prefs_set_diet(
    p_token     uuid,
    p_diet_tags text[],
    p_allergens text[],
    p_notes     text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_found boolean;
BEGIN
    UPDATE public.email_contacts
       SET diet_tags       = COALESCE(p_diet_tags, '{}'),
           allergens_avoid = COALESCE(p_allergens, '{}'),
           diet_notes      = NULLIF(trim(coalesce(p_notes, '')), ''),
           updated_at      = now()
     WHERE token = p_token
    RETURNING true INTO v_found;

    RETURN COALESCE(v_found, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.email_prefs_set_diet(uuid, text[], text[], text) TO anon, authenticated;

COMMIT;
