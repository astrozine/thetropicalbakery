@AGENTS.md

# Supabase migrations: explicit grants for new tables

Supabase stopped auto-granting Data API access to **new** tables in the `public` schema on
**2026-10-30** (existing tables are untouched). Any migration that creates a table must grant
access in the same file, or supabase-js / PostgREST returns "permission denied" for it, including
on new projects, preview branches and a local `supabase db reset`.

Add this to the migration next to the `CREATE TABLE`, keeping it as narrow as the table needs
(RLS policies still decide which rows anyone can touch):

```sql
grant select on public.your_table to anon;                                  -- only if the public reads it
grant select, insert, update, delete on public.your_table to authenticated;
grant select, insert, update, delete on public.your_table to service_role;
```

Only grant `anon` what visitors really need (e.g. `select` for public catalogs, `insert` for
sign-up/inquiry forms). Admin-only tables get `authenticated` and `service_role` only. Migrations
that only add columns or policies to existing tables need nothing extra.

# E-mail: topics, unsubscribe, and never sending twice

- **Topics** live in `src/lib/emailTopics.ts` (`caixa`, `assinatura`, `eventos`, `cursos`,
  `parcerias`, `equipe`, `novidades`, plus the transactional `pedido` and `conta`). A contact
  belongs to lists via `tags` (`cliente`, `assinante`, `eventos`, `cursos`, `retiros`, `parceiro`,
  `candidato`). `canReceive(topic, contact)` is the only place that decides whether a marketing
  e-mail may go out — use it, never hand-roll the check.
- **Transactional** topics (`transactional: true`) ignore unsubscribes and carry no unsubscribe
  footer, because they answer something the person just did. Never mark a promotion transactional.
- **Templates** are in `src/lib/email/campaigns.ts` (one `Campaign` each: audience, fields, subject,
  `messageKey`, body) and the shell is `src/lib/email/layout.ts`. Both are pure string builders so
  the admin can preview them; no server-only imports there.
- **Sending** goes through `POST /api/email/send` (admin token, `dryRun` for counts, `testEmail` for
  a single test). It writes an `email_sends` row *before* calling Resend: the unique index on
  `(lower(email), message_key)` is what makes a second send skip people who already have it. On a
  provider failure the row is deleted so the address can be retried. Add `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers to every marketing send.
- **Preferences page** `/preferencias?token=…` uses the SECURITY DEFINER functions
  `email_prefs_get` / `email_prefs_set` / `email_unsubscribe_all`, so a logged-out person can manage
  their own row without the table being readable. `?sair=1` unsubscribes immediately (one click).
- **Collecting contacts**: call the `email_contact_upsert` RPC after any form that captures an
  e-mail, with the right tags (checkout, waitlist, subscription, course sign-up, job application all
  do this). It merges tags and never resurrects an unsubscribe.
- Schema: `migration_15_email_preferences.sql`.

# Private areas: partner portal and team area

- **Partners** (`/parceiro`) and **workers** (`/equipe`) are gated exactly like `/admin`: a row in
  `partners` / `workers` whose `email` matches the logged-in address. Every policy is "your own row,
  or admin" — never widen that.
- A partner applies from any B2B page (`PartnerApply` → `partner_apply` RPC), lands as `pendente`,
  and Dolly approves in `/admin/parceiros`. Restock requests from the portal appear there too.
- Affiliates: `partners.affiliate_code` is typed by customers at checkout and stored on
  `orders.affiliate_code`; `affiliate_summary()` (SECURITY DEFINER) gives that affiliate their own
  totals without exposing the orders table. The site never moves money — payouts are arranged manually.
- Workers: `work_shifts` rows drive the schedule, the hours and the pay shown in `/equipe`. Pay is the
  agreed gross (hourly × hours, or a fixed monthly wage) — CLT charges are not modelled there; the
  estimator on `/trabalhe-conosco` is the separate tool for that.
- `my_portals()` tells the account menu which private links to show. Schema: `migration_16_portals.sql`.


# Card and PayPal payments

- Pix is still the default and is confirmed by hand. Card (Mercado Pago **Checkout Pro**, redirect, cards
  only, up to 6x) and PayPal (Orders v2, redirect, BRL) are extra methods that switch on when their
  env vars exist: `/api/pay/methods` tells the checkout what to show. Setup guide for Andrew:
  `SETUP_payments.md`. Schema: `migration_18_card_payments.sql`.
- Env vars (Vercel only, never `NEXT_PUBLIC_`, never committed): `MERCADOPAGO_ACCESS_TOKEN`,
  `MERCADOPAGO_WEBHOOK_SECRET`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_ENV` (`sandbox`|`live`),
  `SUPABASE_SERVICE_ROLE_KEY`.
- The service-role key is the ONE exception to "never use it": payment webhooks have no logged-in
  user. It is used only in `src/lib/payments/server.ts` (find an order by reference, mark it paid).
  Do not import that file from client code or use the key anywhere else.
- Flow: checkout inserts the order (reference = `orders.pix_transaction_id`) -> `/api/pay/<provider>`
  builds the payment page from the amount **stored in the order** -> customer returns to
  `/checkout/retorno`. Mercado Pago also calls `/api/webhooks/mercadopago`; PayPal is captured in
  `/api/pay/paypal/capture` on return.
- Never mark an order paid from anything the visitor sends. `confirmMercadoPagoPayment` and
  `capturePayPalOrder` re-fetch the payment from the provider and check reference **and amount**.
  `markOrderPaid` is idempotent and also moves `inbox_status` to `confirmed`.
- Known limit: `total_price` is computed in the browser (same as Pix). Server-side price recomputation
  would need item ids in the order; not done.


# Dietary profiles: one vocabulary, from the treat to the e-mail

- Three layers, defined in `src/lib/dietary.ts` (`DIET_TAGS`) and `src/lib/allergens.ts` (`ALLERGENS`):
  how someone eats ('jeito'), what they avoid for their health ('saude'), and what makes them ill.
- **The allergy layer reuses the treat ids.** A customer's `allergens_avoid` holds the same ids each
  treat declares in `contains` / `may_contain`, so `matchDiet()` compares them directly. Never invent a
  second list of allergen names — add to `ALLERGENS` and both sides move together.
- The five old booleans (`is_vegan`…`is_oil_free`) are still written, derived from the tags by
  `legacyFlags()`; `tagsFromLegacy()` reads an old row. Keep both in step on every write.
- Stored in four places on purpose: `user_profiles` (the person edits it), `users` (the CRM Dolly works
  from), `email_contacts` (what the campaign filters read), `orders` (what the kitchen sees for that
  order). Schema: `migration_19_dietary_profiles.sql`.
- Anonymous visitors write their own diet through SECURITY DEFINER RPCs — `email_contact_set_diet`
  (checkout) and `email_prefs_set_diet` (the token on /preferencias). Neither can read anyone back.
- `DietaryPicker` is the one UI for all of it (checkout, Minha Conta, /preferencias). `compact` folds
  everything past the five familiar chips away, so the checkout doesn't grow a wall of boxes.
- Campaigns: `/admin/emails` -> `DietTargeting` narrows the audience and describes what the box
  contains (pulled from `tasting_boxes.items` so nothing is typed twice). The send route then puts a
  **per-person** line at the top of each copy via `dietLine()` — a warning when it clashes, a plain
  "conferimos" when it doesn't. Default is to warn, not to exclude; excluding is an explicit tick.
- Every read of the new columns must survive migration 19 being absent (fall back to the old
  columns/booleans) — the same rule the rest of the admin follows.
