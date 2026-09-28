-- ============================================================================
-- MIGRATION 26: The e-mail scheduler — "Klaviyo, but ours"
-- ============================================================================
-- Until now every e-mail needed a human clicking "Enviar" in /admin/emails.
-- Everything was already there (templates, opt-outs, the "never twice" index);
-- what was missing was a clock. This adds three small tables:
--
--   1. email_schedule   — "send THIS campaign at THIS moment". One row per
--                         planned send. Optionally repeats weekly/monthly.
--   2. email_automations— always-on rules tied to something happening: a new
--                         box goes on sale, stock runs low, new delivery days
--                         open, a subscriber's delivery is coming up. One row
--                         per rule, switched on and off in the admin.
--   3. email_cron_runs  — a short log of every time the scheduler woke up, so
--                         the admin can SEE that it is alive and not guess.
--
-- Nothing here sends anything by itself. /api/email/cron reads these tables and
-- goes through the same send engine as the admin button, which is what keeps
-- opt-outs, tags and the one-copy-per-person guarantee true for scheduled mail.
--
-- The automations are seeded DISABLED on purpose: switching one on is a
-- decision about mailing real customers, not a side effect of a migration.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Planned one-off (or repeating) sends
-- ----------------------------------------------------------------------------
-- `field_values` and not `values`: VALUES is a reserved word in SQL and every
-- query touching it would need quoting forever after.
CREATE TABLE IF NOT EXISTS public.email_schedule (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    -- A campaign id from src/lib/email/campaigns.ts. Deliberately NOT a foreign
    -- key: the campaign list lives in code, not in the database.
    campaign_id   text NOT NULL,
    field_values  jsonb NOT NULL DEFAULT '{}'::jsonb,
    -- Diet/allergen targeting, same shape the admin page sends today.
    diet          jsonb,

    -- When it should go out. Stored as an instant; the admin picks a local time.
    run_at        timestamptz NOT NULL,

    -- pending  : waiting for its moment
    -- sending  : a run picked it up (guards against two runs overlapping)
    -- done     : everybody eligible has it
    -- error    : the last attempt failed; last_error says why
    -- canceled : the admin called it off
    status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'sending', 'done', 'error', 'canceled')),

    -- There is deliberately no "repeat" here. Re-sending the same campaign with
    -- the same values produces the same message_key, so the one-copy-per-person
    -- index would correctly deliver it to nobody — a repeat would look like it
    -- worked and reach zero people. Anything that genuinely recurs (a new box, a
    -- new delivery day, a subscriber's reminder) is an automation instead, because
    -- it works out fresh values every time it runs.

    -- What the admin called it, so a list of rows reads like a plan.
    label         text,

    sent          integer NOT NULL DEFAULT 0,
    failed        integer NOT NULL DEFAULT 0,
    skipped       integer NOT NULL DEFAULT 0,
    last_error    text,
    last_run_at   timestamptz,

    created_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at    timestamptz NOT NULL DEFAULT now(),
    updated_at    timestamptz NOT NULL DEFAULT now()
);

-- The scheduler's only hot query: "what is due?"
CREATE INDEX IF NOT EXISTS email_schedule_due_idx
    ON public.email_schedule (run_at)
    WHERE status IN ('pending', 'sending');

ALTER TABLE public.email_schedule ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage the e-mail schedule" ON public.email_schedule;
CREATE POLICY "Admins manage the e-mail schedule"
    ON public.email_schedule FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_schedule TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_schedule TO service_role;


-- ----------------------------------------------------------------------------
-- 2. Always-on rules
-- ----------------------------------------------------------------------------
-- The id is the rule's name in code (src/lib/email/automations.ts), so a rule
-- that is renamed or removed simply stops matching instead of breaking a join.
CREATE TABLE IF NOT EXISTS public.email_automations (
    id            text PRIMARY KEY,
    enabled       boolean NOT NULL DEFAULT false,

    -- Knobs. Which ones matter depends on the rule; the admin only shows the
    -- relevant ones (see AutomationDef.knobs in the code).
    --   threshold   — box-last-chance: how few boxes left before it nudges.
    --   offset_days — subscriber-delivery: how many days BEFORE the delivery.
    threshold     integer,
    offset_days   integer,

    -- Brasília hour (0–23) this rule is allowed to send in. Keeps a 3am cron
    -- tick from waking customers up, without needing a cron per rule.
    send_hour     smallint NOT NULL DEFAULT 9 CHECK (send_hour BETWEEN 0 AND 23),

    last_run_at   timestamptz,
    -- Plain-words outcome of the last check, shown in the admin.
    last_result   text,
    updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage e-mail automations" ON public.email_automations;
CREATE POLICY "Admins manage e-mail automations"
    ON public.email_automations FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_automations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_automations TO service_role;

-- Seeded off. ON CONFLICT DO NOTHING so re-running never re-arms a rule the
-- admin has since switched on, or resets a threshold they tuned.
INSERT INTO public.email_automations (id, enabled, threshold, offset_days, send_hour) VALUES
    ('box-live',            false, NULL, NULL, 9),
    ('box-last-chance',     false, 5,    NULL, 10),
    ('delivery-dates',      false, NULL, NULL, 9),
    ('subscriber-delivery', false, NULL, 2,    9)
ON CONFLICT (id) DO NOTHING;


-- ----------------------------------------------------------------------------
-- 3. Proof of life
-- ----------------------------------------------------------------------------
-- Without this, "is the scheduler running?" can only be answered by reading
-- Vercel logs. With it, the admin page can say "last checked 4 minutes ago".
CREATE TABLE IF NOT EXISTS public.email_cron_runs (
    id            bigserial PRIMARY KEY,
    ran_at        timestamptz NOT NULL DEFAULT now(),
    -- How many scheduled rows were due, and what the whole tick achieved.
    due           integer NOT NULL DEFAULT 0,
    sent          integer NOT NULL DEFAULT 0,
    failed        integer NOT NULL DEFAULT 0,
    ok            boolean NOT NULL DEFAULT true,
    -- One line per thing the tick did, for the admin's "últimas verificações".
    detail        jsonb NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS email_cron_runs_ran_at_idx ON public.email_cron_runs (ran_at DESC);

ALTER TABLE public.email_cron_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read the cron log" ON public.email_cron_runs;
CREATE POLICY "Admins read the cron log"
    ON public.email_cron_runs FOR SELECT TO authenticated
    USING (public.is_admin());

GRANT SELECT ON public.email_cron_runs TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.email_cron_runs TO service_role;

-- Keep the log short: it is proof of life, not an archive.
CREATE OR REPLACE FUNCTION public.email_cron_runs_trim()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.email_cron_runs
    WHERE ran_at < now() - interval '30 days';
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS email_cron_runs_trim_trg ON public.email_cron_runs;
CREATE TRIGGER email_cron_runs_trim_trg
    AFTER INSERT ON public.email_cron_runs
    -- Once per statement, not per row: the trim is a cheap housekeeping sweep.
    FOR EACH STATEMENT EXECUTE FUNCTION public.email_cron_runs_trim();


-- ----------------------------------------------------------------------------
-- updated_at, so the admin list can be honest about "changed just now"
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_schedule_touch ON public.email_schedule;
CREATE TRIGGER email_schedule_touch BEFORE UPDATE ON public.email_schedule
    FOR EACH ROW EXECUTE FUNCTION public.email_touch_updated_at();

DROP TRIGGER IF EXISTS email_automations_touch ON public.email_automations;
CREATE TRIGGER email_automations_touch BEFORE UPDATE ON public.email_automations
    FOR EACH ROW EXECUTE FUNCTION public.email_touch_updated_at();

COMMIT;

-- ----------------------------------------------------------------------------
-- Verification
-- ----------------------------------------------------------------------------
SELECT 'agendamentos'      AS o_que, count(*)::text AS quantos FROM public.email_schedule
UNION ALL
SELECT 'automações',        count(*)::text FROM public.email_automations
UNION ALL
SELECT 'automações ligadas', count(*)::text FROM public.email_automations WHERE enabled
UNION ALL
SELECT 'verificações do cron', count(*)::text FROM public.email_cron_runs;
