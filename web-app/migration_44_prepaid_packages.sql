-- ============================================================================
-- MIGRATION 44: Proposals can also sell a paid-up-front package
-- ============================================================================
-- Besides a course or a retreat, Dolly can now send a proposal (/admin/propostas → 📦 Pacote) for anything
-- paid in advance: 3 months of the subscription at a founding-member price, a partner's first order, an
-- events deposit. Same page, same payment methods, same order in the inbox (reference PRP…).
-- Only widens the allowed kinds. Safe to run twice.
-- ============================================================================

BEGIN;

ALTER TABLE public.payment_offers DROP CONSTRAINT IF EXISTS payment_offers_kind_check;
ALTER TABLE public.payment_offers ADD CONSTRAINT payment_offers_kind_check CHECK (kind IN ('retiro', 'curso', 'pacote'));

COMMIT;
