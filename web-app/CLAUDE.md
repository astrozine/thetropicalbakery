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
