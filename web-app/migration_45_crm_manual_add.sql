-- ============================================================================
-- MIGRATION 45: Adding people to the CRM by hand (/admin/crm → + Adicionar pessoa)
-- ============================================================================
-- Until now someone only reached the CRM by ordering or making an account. Dolly meets people at the
-- feira, on WhatsApp, at a brunch; now she can write them in herself: name, WhatsApp and/or e-mail,
-- where they live, how they eat, and a note on how they met.
--
-- Admins could already read / edit / delete public.users but not insert, and the public
-- upsert_crm_customer() would stamp the admin's own login onto the customer, so this adds an admin-only
-- function instead. If the WhatsApp (last 8 digits) or e-mail is already in the CRM, it fills in what was
-- missing on that row instead of making a duplicate. Safe to run twice.
-- ============================================================================

BEGIN;

-- Where the row came from: NULL = the website (an order), 'manual' = added in the admin.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS source      text;
-- Dolly's own note: how they met, what they like. Only admins ever read public.users.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_notes text;
-- Someone met in person may only give an e-mail. (UNIQUE still holds; Postgres allows many NULLs.)
ALTER TABLE public.users ALTER COLUMN whatsapp_number DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.admin_add_customer(
    p_full_name       TEXT,
    p_whatsapp_number TEXT    DEFAULT NULL,
    p_email           TEXT    DEFAULT NULL,
    p_location        TEXT    DEFAULT NULL,
    p_diet_tags       TEXT[]  DEFAULT '{}',
    p_allergens       TEXT[]  DEFAULT '{}',
    p_diet_notes      TEXT    DEFAULT NULL,
    p_admin_notes     TEXT    DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_name   TEXT := NULLIF(TRIM(COALESCE(p_full_name, '')), '');
    v_phone  TEXT := NULLIF(TRIM(COALESCE(p_whatsapp_number, '')), '');
    v_email  TEXT := NULLIF(LOWER(TRIM(COALESCE(p_email, ''))), '');
    v_place  TEXT := NULLIF(TRIM(COALESCE(p_location, '')), '');
    v_dnotes TEXT := NULLIF(TRIM(COALESCE(p_diet_notes, '')), '');
    v_note   TEXT := NULLIF(TRIM(COALESCE(p_admin_notes, '')), '');
    v_tags   TEXT[] := COALESCE(p_diet_tags, '{}');
    v_allerg TEXT[] := COALESCE(p_allergens, '{}');
    v_key    TEXT;
    v_id     uuid;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'only admins can add people to the CRM';
    END IF;
    IF v_name IS NULL THEN
        RAISE EXCEPTION 'full_name is required';
    END IF;
    IF v_phone IS NULL AND v_email IS NULL THEN
        RAISE EXCEPTION 'a WhatsApp number or an e-mail is required';
    END IF;

    -- Same person already here? Phones are stored a few ways, so compare the last 8 digits.
    v_key := right(regexp_replace(COALESCE(v_phone, ''), '\D', '', 'g'), 8);
    IF length(v_key) = 8 THEN
        SELECT id INTO v_id FROM public.users
        WHERE right(regexp_replace(COALESCE(whatsapp_number, ''), '\D', '', 'g'), 8) = v_key
        LIMIT 1;
    END IF;
    IF v_id IS NULL AND v_email IS NOT NULL THEN
        SELECT id INTO v_id FROM public.users WHERE lower(email) = v_email LIMIT 1;
    END IF;

    IF v_id IS NOT NULL THEN
        -- Fill in what we didn't know; never wipe what the customer told us themselves.
        UPDATE public.users SET
            full_name       = COALESCE(NULLIF(full_name, ''), v_name),
            whatsapp_number = COALESCE(NULLIF(whatsapp_number, ''), v_phone),
            email           = COALESCE(NULLIF(email, ''), v_email),
            location        = COALESCE(NULLIF(location, ''), v_place),
            diet_tags       = ARRAY(SELECT DISTINCT unnest(COALESCE(diet_tags, '{}') || v_tags)),
            allergens_avoid = ARRAY(SELECT DISTINCT unnest(COALESCE(allergens_avoid, '{}') || v_allerg)),
            is_vegan        = is_vegan       OR 'vegano'     = ANY(v_tags),
            is_gluten_free  = is_gluten_free OR 'sem-gluten' = ANY(v_tags),
            is_sugar_free   = is_sugar_free  OR 'sem-acucar' = ANY(v_tags),
            is_salt_free    = is_salt_free   OR 'sem-sal'    = ANY(v_tags),
            is_oil_free     = is_oil_free    OR 'sem-oleo'   = ANY(v_tags),
            diet_notes      = COALESCE(NULLIF(diet_notes, ''), v_dnotes),
            admin_notes     = CASE
                                WHEN v_note IS NULL THEN admin_notes
                                WHEN COALESCE(admin_notes, '') = '' THEN v_note
                                ELSE admin_notes || E'\n' || v_note
                              END
        WHERE id = v_id;
        RETURN jsonb_build_object('id', v_id, 'status', 'updated');
    END IF;

    INSERT INTO public.users (
        full_name, whatsapp_number, email, location, password_hash,
        is_vegan, is_gluten_free, is_sugar_free, is_salt_free, is_oil_free,
        diet_tags, allergens_avoid, diet_notes, source, admin_notes
    )
    VALUES (
        v_name, v_phone, v_email, v_place, md5(gen_random_uuid()::text),
        'vegano' = ANY(v_tags), 'sem-gluten' = ANY(v_tags), 'sem-acucar' = ANY(v_tags),
        'sem-sal' = ANY(v_tags), 'sem-oleo' = ANY(v_tags),
        v_tags, v_allerg, v_dnotes, 'manual', v_note
    )
    RETURNING id INTO v_id;

    RETURN jsonb_build_object('id', v_id, 'status', 'added');
END;
$$;

REVOKE ALL ON FUNCTION public.admin_add_customer(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_add_customer(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT[], TEXT, TEXT) TO authenticated;

COMMIT;

-- Check: the two new columns and the function are there.
SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('source', 'admin_notes');
SELECT proname FROM pg_proc WHERE proname = 'admin_add_customer';
