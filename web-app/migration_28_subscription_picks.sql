-- ============================================================================
-- MIGRATION 28: Subscribers choose their treats every week
-- ============================================================================
-- The box sizes work the same for subscribers as for one-off orders
-- (src/lib/boxPicks.ts): the 4-box is the complete one, the 2-box is two
-- favourites, the 6-box is the complete one plus two favourites. Each week a
-- subscriber chooses in Minha Conta, or taps the dice and Dolly chooses.
--
-- subscription_picks: one row per subscription per weekly box.
--   picks    = BoxItem ids from tasting_boxes.items (repeats allowed)
--   surprise = true when they tapped the dice ("a Dolly escolhe")
-- No row means they have not chosen yet: Dolly chooses, and the admin shows it.
--
-- Subscribers read their own rows; admins read all. Writing goes only through
-- set_subscription_picks(), which checks that the subscription is theirs, that
-- the box is the active one and that the picks fit their box size.
-- New table, so it carries explicit GRANTs (see CLAUDE.md). Safe to run twice.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.subscription_picks (
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    tasting_box_id  UUID NOT NULL REFERENCES public.tasting_boxes(id) ON DELETE CASCADE,
    picks           JSONB NOT NULL DEFAULT '[]'::jsonb,
    surprise        BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (subscription_id, tasting_box_id)
);

ALTER TABLE public.subscription_picks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Subscribers read their own picks" ON public.subscription_picks;
CREATE POLICY "Subscribers read their own picks"
    ON public.subscription_picks FOR SELECT TO authenticated
    USING (
        public.is_admin()
        OR EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.id = subscription_id AND s.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins manage picks" ON public.subscription_picks;
CREATE POLICY "Admins manage picks"
    ON public.subscription_picks FOR ALL TO authenticated
    USING (public.is_admin()) WITH CHECK (public.is_admin());

-- No anon access at all. Subscribers write through the function below.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_picks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_picks TO service_role;

CREATE OR REPLACE FUNCTION public.set_subscription_picks(
    p_subscription_id UUID,
    p_box_id          UUID,
    p_picks           JSONB,
    p_surprise        BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_size   INTEGER;
    v_items  JSONB;
    v_count  INTEGER;
    v_want   INTEGER;
    v_picks  JSONB := CASE WHEN p_surprise THEN '[]'::jsonb ELSE COALESCE(p_picks, '[]'::jsonb) END;
    v_pick   TEXT;
BEGIN
    SELECT COALESCE(box_size, 4) INTO v_size
    FROM public.subscriptions
    WHERE id = p_subscription_id AND user_id = auth.uid() AND status <> 'cancelled';
    IF v_size IS NULL THEN
        RAISE EXCEPTION 'Assinatura não encontrada';
    END IF;

    SELECT items INTO v_items FROM public.tasting_boxes WHERE id = p_box_id AND is_active;
    IF v_items IS NULL THEN
        RAISE EXCEPTION 'Esta caixa não está mais aberta para escolha';
    END IF;

    -- Same rule as boxPlan() in src/lib/boxPicks.ts: the size that fits the whole list is the complete
    -- box; smaller is all picks; bigger is the complete box plus picks.
    v_count := (SELECT count(*) FROM jsonb_array_elements(v_items) e WHERE COALESCE(e->>'id', '') <> '' AND COALESCE(e->>'name', '') <> '');
    v_want  := CASE WHEN v_count = 0 THEN 0 WHEN v_size >= v_count THEN v_size - v_count ELSE v_size END;

    IF jsonb_typeof(v_picks) <> 'array' THEN
        RAISE EXCEPTION 'Escolha inválida';
    END IF;
    IF NOT p_surprise THEN
        IF jsonb_array_length(v_picks) <> v_want THEN
            RAISE EXCEPTION 'Escolha % doce(s)', v_want;
        END IF;
        FOR v_pick IN SELECT jsonb_array_elements_text(v_picks) LOOP
            IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(v_items) e WHERE e->>'id' = v_pick) THEN
                RAISE EXCEPTION 'Um dos doces escolhidos não está nesta caixa';
            END IF;
        END LOOP;
    END IF;

    INSERT INTO public.subscription_picks (subscription_id, tasting_box_id, picks, surprise, updated_at)
    VALUES (p_subscription_id, p_box_id, v_picks, COALESCE(p_surprise, FALSE), now())
    ON CONFLICT (subscription_id, tasting_box_id)
    DO UPDATE SET picks = EXCLUDED.picks, surprise = EXCLUDED.surprise, updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.set_subscription_picks(UUID, UUID, JSONB, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_subscription_picks(UUID, UUID, JSONB, BOOLEAN) TO authenticated;

COMMIT;

-- Check: the table, its two policies, and the function.
SELECT
    (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_picks') AS picks_table,
    (SELECT count(*) FROM pg_policies WHERE tablename = 'subscription_picks') AS policies,
    (SELECT count(*) FROM pg_proc WHERE proname = 'set_subscription_picks') AS set_function;
