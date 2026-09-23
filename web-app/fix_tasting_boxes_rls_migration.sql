-- Fixes the "Restam apenas X caixas" scarcity counter never decreasing.
--
-- Diagnosis: tested directly against the live Supabase project (REST API,
-- anon key) while investigating the /caixas checkout error. The `users`
-- insert/update guest checkout relies on already succeeds — RLS on that
-- table already allows it. But the sold_quantity increment that
-- WhatsAppCheckout.tsx does after a successful order:
--
--   supabase.from('tasting_boxes').update({ sold_quantity: ... }).eq('id', ...)
--
-- silently no-ops for anonymous visitors (PostgREST returns 200 with an
-- empty array — 0 rows matched the RLS policy) because `tasting_boxes` has
-- no public UPDATE policy. It fails silently rather than throwing, so it
-- doesn't trigger the on-screen error, but it does mean every order leaves
-- the "sold_quantity" counter at 0 and the box never appears to sell out.
--
-- Run this in the Supabase SQL editor (or `supabase db push`) to fix it.

ALTER TABLE tasting_boxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can increment sold_quantity on tasting boxes"
    ON tasting_boxes FOR UPDATE
    TO public
    USING (true)
    WITH CHECK (true);
