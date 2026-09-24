-- ============================================================================
-- MIGRATION 15: E-mail contacts, per-topic preferences, and a send log
-- ============================================================================
-- Three things, the way Klaviyo/Mailchimp do them:
--
--  1. email_contacts — one row per e-mail address, with the lists ("tags") the
--     person belongs to, which topics they've opted OUT of, a global
--     unsubscribe flag, and a random token that lets them manage all of this
--     from /preferencias without logging in.
--
--  2. email_sends — every e-mail we send, with a `message_key` unique per
--     address. The same announcement can therefore never be sent twice: the
--     second attempt hits the unique index and is skipped.
--
--  3. Two SECURITY DEFINER functions so the token holder (a logged-out person
--     clicking "descadastrar" in an e-mail) can read and change only their own
--     row, while the table itself stays unreadable to the public.
--
-- Topic ids and tag names live in src/lib/emailTopics.ts — keep the two in step.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.email_contacts (
    email             text PRIMARY KEY,
    full_name         text,
    token             uuid NOT NULL DEFAULT gen_random_uuid(),
    -- Lists the person belongs to: cliente, assinante, eventos, cursos, parceiro, candidato…
    tags              text[] NOT NULL DEFAULT '{}',
    -- Topic ids they don't want (see src/lib/emailTopics.ts)
    opted_out         text[] NOT NULL DEFAULT '{}',
    unsubscribed_all  boolean NOT NULL DEFAULT false,
    unsubscribed_at   timestamptz,
    locale            text NOT NULL DEFAULT 'pt',
    -- Where we first met them, for our own reference
    source            text,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_contacts_token_idx ON public.email_contacts (token);

ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage email contacts" ON public.email_contacts;
CREATE POLICY "Admins manage email contacts"
    ON public.email_contacts FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Signed-in people can see their own row (used by /minha-conta).
DROP POLICY IF EXISTS "People read their own email contact" ON public.email_contacts;
CREATE POLICY "People read their own email contact"
    ON public.email_contacts FOR SELECT TO authenticated
    USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));


-- ----------------------------------------------------------------------------
-- The send log. UNIQUE (email, message_key) is what stops a second copy.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_sends (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email       text NOT NULL,
    message_key text NOT NULL,   -- e.g. 'delivery-dates:2026-09-26', 'box-live:<uuid>'
    topic       text NOT NULL,
    subject     text,
    template    text,
    status      text NOT NULL DEFAULT 'sent',  -- sent | failed
    error       text,
    provider_id text,                          -- Resend message id
    sent_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS email_sends_once_idx ON public.email_sends (lower(email), message_key);
CREATE INDEX IF NOT EXISTS email_sends_recent_idx ON public.email_sends (sent_at DESC);

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage email sends" ON public.email_sends;
CREATE POLICY "Admins manage email sends"
    ON public.email_sends FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());


-- ----------------------------------------------------------------------------
-- Adding / updating a contact. Called by the site's own forms (checkout,
-- waitlist, subscription, course sign-up…) and by the admin. SECURITY DEFINER
-- so a visitor can add themselves without being able to read anyone else.
-- Tags are merged, never replaced, and an existing unsubscribe is never undone.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_contact_upsert(
    p_email     text,
    p_full_name text DEFAULT NULL,
    p_tags      text[] DEFAULT '{}',
    p_source    text DEFAULT NULL,
    p_locale    text DEFAULT 'pt'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_email text := lower(trim(p_email));
BEGIN
    IF v_email = '' OR v_email IS NULL OR position('@' in v_email) = 0 THEN
        RETURN; -- nothing usable; never fail the form the visitor was filling in
    END IF;

    INSERT INTO public.email_contacts (email, full_name, tags, source, locale)
    VALUES (v_email, NULLIF(trim(coalesce(p_full_name, '')), ''), coalesce(p_tags, '{}'), p_source, coalesce(p_locale, 'pt'))
    ON CONFLICT (email) DO UPDATE SET
        full_name  = COALESCE(email_contacts.full_name, EXCLUDED.full_name),
        tags       = ARRAY(SELECT DISTINCT unnest(email_contacts.tags || EXCLUDED.tags)),
        source     = COALESCE(email_contacts.source, EXCLUDED.source),
        updated_at = now();
END;
$$;

GRANT EXECUTE ON FUNCTION public.email_contact_upsert(text, text, text[], text, text) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- The preferences page (/preferencias?token=…). The token identifies the
-- person; it is not a login and gives access to nothing else.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_prefs_get(p_token uuid)
RETURNS TABLE (email text, full_name text, opted_out text[], unsubscribed_all boolean, tags text[])
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT email, full_name, opted_out, unsubscribed_all, tags
    FROM public.email_contacts
    WHERE token = p_token;
$$;

GRANT EXECUTE ON FUNCTION public.email_prefs_get(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.email_prefs_set(
    p_token            uuid,
    p_opted_out        text[],
    p_unsubscribed_all boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_found boolean;
BEGIN
    UPDATE public.email_contacts SET
        opted_out        = coalesce(p_opted_out, '{}'),
        unsubscribed_all = coalesce(p_unsubscribed_all, false),
        unsubscribed_at  = CASE WHEN coalesce(p_unsubscribed_all, false) THEN now() ELSE NULL END,
        updated_at       = now()
    WHERE token = p_token
    RETURNING true INTO v_found;

    RETURN coalesce(v_found, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.email_prefs_set(uuid, text[], boolean) TO anon, authenticated;

-- One-click unsubscribe (the "Unsubscribe" button Gmail shows at the top).
CREATE OR REPLACE FUNCTION public.email_unsubscribe_all(p_token uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.email_prefs_set(p_token, '{}'::text[], true);
$$;

GRANT EXECUTE ON FUNCTION public.email_unsubscribe_all(uuid) TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- Seed from people we already know, so nobody has to be collected twice.
-- Only addresses that already agreed to marketing become contacts.
-- ----------------------------------------------------------------------------
INSERT INTO public.email_contacts (email, full_name, tags, source)
SELECT lower(p.email), max(p.full_name), ARRAY['cliente'], 'user_profiles'
FROM public.user_profiles p
WHERE p.email IS NOT NULL AND p.email <> '' AND coalesce(p.marketing_opt_in, false)
GROUP BY lower(p.email)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.email_contacts (email, full_name, tags, source)
SELECT lower(u.email), max(u.full_name), ARRAY['cliente'], 'crm'
FROM public.users u
WHERE u.email IS NOT NULL AND u.email <> ''
GROUP BY lower(u.email)
ON CONFLICT (email) DO NOTHING;

-- Data API access for the new tables (Supabase no longer grants it automatically
-- from 2026-10-30). Only admins ever touch these rows directly; the public uses
-- the functions above.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_contacts TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sends    TO authenticated, service_role;

COMMIT;

SELECT 'contacts' AS what, count(*)::text AS n FROM public.email_contacts
UNION ALL
SELECT 'unsubscribed', count(*)::text FROM public.email_contacts WHERE unsubscribed_all
UNION ALL
SELECT 'sends logged', count(*)::text FROM public.email_sends;
