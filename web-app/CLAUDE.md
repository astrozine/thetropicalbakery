@AGENTS.md

**Read `../COORDINATION.md` first**: other agents (Claude, Gemini in Antigravity) work in this same repo at the same time.
Stage files by name, never `git add -A`, never `git stash`, check `git status` before you commit, and test layouts at a real phone
size with `tools/phone-check.mjs`.

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
- **Sending** happens in exactly one place: `sendCampaign()` in `src/lib/email/send.ts` (server-only).
  It writes an `email_sends` row *before* calling Resend: the unique index on
  `(lower(email), message_key)` is what makes a second send skip people who already have it. On a
  provider failure the row is deleted so the address can be retried. Add `List-Unsubscribe` and
  `List-Unsubscribe-Post` headers to every marketing send. The caller passes the Supabase client,
  which decides what the send may touch — the admin's own session, or the service-role client for the
  scheduler. **Never add a second way to send**; route it through `sendCampaign` or opt-outs stop meaning anything.
- Two doors into it: `POST /api/email/send` (the admin's button — admin token, `dryRun` for counts,
  `testEmail` for one test) and `GET|POST /api/email/cron` (the scheduler).
- **The scheduler** (`migration_26_email_scheduler.sql`, guide in `SETUP_email_scheduler.md`):
  - `email_schedule` — one row per planned send ("this campaign, at this moment"). There is no
    "repeat": the same campaign with the same values makes the same `message_key`, so a repeat would
    reach nobody and look like it worked. Anything genuinely recurring is an automation.
  - `email_automations` — always-on rules (`box-live`, `box-last-chance`, `delivery-dates`,
    `subscriber-delivery`), defined in `src/lib/email/automationDefs.ts` (pure, shared with the admin
    UI) and evaluated in `src/lib/email/automations.ts` (server-only). A rule never sends: `planFor()`
    returns the `SendRequest`s it *wants* plus an `after()` for bookkeeping, and the cron route runs
    them through `sendCampaign`. Each rule fires at most once per Brasília day, inside its `send_hour`.
    **All seeded off** — turning one on is a decision to mail real customers.
  - `email_cron_runs` — proof of life, so the admin can show "conferiu há 4 minutos" instead of
    anybody reading a deploy log.
  - Guarded by `EMAIL_CRON_SECRET`. `?dry=1` reports what it would do and sends nothing.
  - Admin UI: `src/app/admin/emails/Agenda.tsx`, which degrades to a "run migration 26" hint.
- **Receipts** (`src/lib/email/receipts.ts`, topic `pedido`) go out with nothing to switch on:
  `sendOrderReceived` from `createOrder` (carries the Pix copia-e-cola, so closing the checkout tab no
  longer loses the payment) and `sendOrderPaid` from `markOrderPaid`. Both are wrapped in try/catch at
  the call site on purpose: **an e-mail failure must never fail a saved or paid order.** They are
  deliberately not in `CAMPAIGNS` — the admin never hand-sends a receipt.
- **Preferences page** `/preferencias?token=…` uses the SECURITY DEFINER functions
  `email_prefs_get` / `email_prefs_set` / `email_unsubscribe_all`, so a logged-out person can manage
  their own row without the table being readable. `?sair=1` unsubscribes immediately (one click).
- **Collecting contacts**: call the `email_contact_upsert` RPC after any form that captures an
  e-mail, with the right tags (checkout, waitlist, subscription, course sign-up, job application all
  do this). It merges tags and never resurrects an unsubscribe.
- Schema: `migration_15_email_preferences.sql` and `migration_26_email_scheduler.sql`.

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
- **Prices are computed on the server.** The checkout posts item ids, quantities, zone, day and diet to
  `POST /api/checkout/order` (`src/lib/payments/order.ts`), which reads prices, stock, the delivery calendar and fees from the
  database, reserves box stock with `reserve_box_stock` (service role only), saves the order with the service key and returns
  the reference and the true total. The Pix code and the card/PayPal pages use that total. If you add another way to buy,
  route it through `createOrder`; never trust an amount from the browser.
- The `orders` table is private (admins only) and the public may only leave a lead (no status, no price): `migration_22`.
  It has a `NOT NULL` column `order_type`; every insert must set it.


# Dietary profiles: one vocabulary, from the treat to the e-mail

- Three layers, defined in `src/lib/dietary.ts` (`DIET_TAGS`) and `src/lib/allergens.ts` (`ALLERGENS`):
  how someone eats ('jeito'), what they avoid for their health ('saude'), and what makes them ill.
- **The allergen list is scoped to our kitchen: 6 ids** (castanhas, amendoim, coco, gergelim, soja, aveia).
  Vegan, no gluten in any recipe (traces possible) and no refined sugar are true of every treat, so they
  live once in `KITCHEN_FACTS` (shown by `<KitchenFacts />`), never as per-treat checkboxes. All tree nuts
  are one id on purpose; which nut it is goes in the ingredients. Don't grow the list back toward the
  legal 14/23: an unusual allergy goes in the free-text notes. Old ids are translated by
  `normalizeAllergens()` / `normalizeDiet()` (a customer's old 'gluten' allergy becomes the 'sem-gluten'
  tag); read stored ids through them. Data rewritten by `migration_25_trim_allergens.sql`.
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


# WhatsApp buttons never go straight to the chat

- Any "Falar no WhatsApp / com o Comercial" button that starts a conversation with a visitor must use
  `src/components/WhatsAppGate.tsx`, never a bare `<a href="https://wa.me/...">`. The gate first asks for a
  one-tap Google / Facebook sign-in (which also gives them an account for future orders) or a name +
  WhatsApp, saves the lead in `contact_leads` (`migration_23_contact_leads.sql`; shows in Admin > Caixa de
  Entrada as "Contato pelo site"), then opens WhatsApp with the original message.
- Pass `topic` (what they are asking about), `tags` (e-mail list, see `emailTopics.ts`) and `locale` on pages
  that speak English/Spanish. Signed-in people with a phone on their account go straight through.
- Left as plain links on purpose: footer, privacy page, admin, logged-in areas (partner, team, my account,
  my subscription), the order-return page and e-mail templates.

# Brunch Tropical and the Círculo Tropical (ticketed brunches)

Dolly's paid brunches (tea, healthy treats, a talk about working in health and wellness), aimed mostly at women
in the field, one rung above the subscription on the value ladder. Schema: `migration_41_brunch.sql`. Every
promise (perks, credit days, hold hours, vote budget, venue kinds) lives in **`src/lib/brunch.ts`**, like
`loyalty.ts` for the club; the SQL repeats only the numbers it must enforce (30 credit days, 3 votes,
3 suggestions, 2 days before) and says so.

- **Pages:** `/brunch` (landing + agenda), `/brunch/<slug>` (one brunch + buy panel), `/brunch/sala/<slug>` (the private
  room: group chat, the guests' networking cards, the vote, address and countdown). Components in `src/components/brunch/`,
  styles `brunchStyles.ts` (`bn-` prefix). Admin `/admin/brunch` (bx- styles): create in steps, guests, Pix, check-in,
  waiting list, credits, pop-up requests, e-mails, the chat and vote as host, and "O Círculo" (everyone who came).
- **Buying = the same rules as a box.** `POST /api/brunch/order` -> `createBrunchOrder` (`src/lib/payments/brunch.ts`):
  signed-in only (the seat comes with the group), price read from `brunch_events`, the seat taken by `brunch_reserve()`
  (service role only, locks the row: two people never get the last seat), then an `orders` row (`order_kind = 'brunch'`,
  reference `BRU…`). Unpaid holds expire (Pix 24 h, card 2 h) and stop counting. Full = waiting list (`status = 'espera'`).
  Paid: `markOrderPaid` -> `onBrunchOrderPaid`; a Pix confirmed in the inbox flips the ticket by trigger
  (`brunch_follow_inbox`) and the inbox's existing call to `/api/admin/ebook-paid` sends the welcome e-mail.
- **The address is private** (`brunch_event_private`, admins only); guests get it through `my_brunches()` /
  `brunch_room()` once paid. Never add a SELECT policy on tickets or private for customers.
- **Chat:** `brunch_messages`, readable and writable only by paid guests of that brunch and admins (`brunch_is_member`).
  The host flag is set by a trigger from `is_admin()`; an admin without a brunch profile shows as Dolly with
  `/dolly/dolly-face.jpg`. Realtime-enabled.
- **The vote ("Monte o brunch"):** `brunch_poll_options` + `brunch_votes`. 3 votes per kind (doces / temas) per guest,
  3 own suggestions, treats can be picked from the menu (name and photo filled from `treats` by the trigger), closes
  `votes_close_at` or 2 days before. Dolly marks winners (`chosen`) — closing the loop is the point, keep it visible.
- **E-mails:** transactional `src/lib/email/brunchMail.ts` (seat held + Pix, you're in, waiting list). Everything to a
  group is a campaign with `groupOnly: true` (hidden from /admin/emails, refused by `sendCampaign` without `onlyEmails`).
  Topics `brunch` (announcements, whole list) and `circulo` (reminders, chat digest, follow-up; tag `brunch`).
  Automations `brunch-reminder`, `brunch-chat-digest`, `brunch-followup`, `brunch-last-seats`, **seeded off**.
- **Credit:** a paid ticket can become credit on the Anual subscription within 30 days of the brunch. The guest taps
  "Usar meu crédito" (`brunch_claim_credit`), Dolly takes it off the first payment by hand and marks it applied.
  The Círculo perks (credit, 10% on the events menu, members-first pre-sale) were proposed by Claude on 2026-10-07:
  confirm with Andrew before making them bigger. Nothing applies the 10% automatically; Dolly honours it on the quote.

# Minha Conta: the Clube Tropical home (a design that worked)

Andrew asked for an account page that "keeps people buying and gets them up the value ladder" and called the
result a **great job** (2026-09-29). Treat it as the reference for customer-facing dashboards. What made it work:

- **One next step, not a menu.** The hero (`src/components/account/AccountHero.tsx`) has exactly one gold button,
  and it changes with the customer's situation: box ready → see it; Pix waiting → see the order; subscriber →
  pick this week's treats; everyone else → the next rung of the ladder. A second, quieter button nudges an
  incomplete profile. Keep it to one primary action.
- **Tabs instead of a long stack.** Início / Pedidos / Perfil (`#pedidos`, `#perfil` open a tab directly). The
  old page showed every form fold, the subscription and three promo cards at once, which is what felt cluttered.
- **Live things always come first.** Pickup and subscription e-mails link here, so `MyPickups` and
  `MySubscription` sit at the top of Início. Never move them behind a tab.
- **Status and progress, not forms.** Club level (Semente → Broto → Palmeira → Sol Tropical), a kraft-paper
  stamp card, a "Sua trilha tropical" path (caixa → assinatura → eventos → curso → retiro, with the next step
  spotlighted by a photo and a button), and a profile checklist that jumps to the right fold.
- **Floating-photo hero** in the /retreats style, with a gold progress ring around the customer's own photo.

Where things live:
- Every promise (stamps per reward, the reward text, level thresholds, the trail steps and their pitches) is in
  **`src/lib/loyalty.ts`**. Change a reward there and nowhere else. The current reward, "6 stamps = um mimo
  surpresa da Dolly na próxima caixa", was proposed by Claude; confirm with Andrew before making it bigger, and
  note that nothing yet tells the kitchen who has earned it.
- Data comes from one SECURITY DEFINER function, `my_journey()` (`migration_30_my_journey.sql`), which returns
  only the caller's own orders, stamp count, event quotes and course/retreat enquiries. Customers still cannot
  read `orders` directly; do not add a SELECT policy for them. "Paid" means `status = 'PAID'` or moved past
  `new` in `inbox_status` (how a Pix payment is confirmed by hand). Stamps = paid box orders + delivered
  subscription boxes.
- If the function is missing, the page must keep working: `journey` stays `null` and the stamps, level and order
  history hide themselves. Keep that fallback.
- Styles are in `src/app/minha-conta/accountStyles.ts` (phone first, desktop at 1024px). On phones the two home
  columns use `display: contents` and `order` so the stamp card comes right after the live boxes.
- Gotcha found on the way: a grid of `AccountSection`s needs `grid-template-columns: minmax(0, 1fr)`, or the
  one-line summaries (`white-space: nowrap`) stretch the grid past a 412px screen and the page clip hides it.

# The free-recipes funnel (/receitas, /free-recipes)

Ads and posts land on a page that gives away 2 recipes from Sweet Escape (Red Berry Bliss Balls, Peanutty Banoffee
Bars) for an e-mail. Built 2026-10-07; guide for Andrew with the ad copy: `SETUP_free_recipes.md`. Schema:
`migration_43_free_recipes_funnel.sql` (`funnel_leads`, admin-only; the site writes it with the service key).

- **Every fact in `src/lib/funnel.ts`** (paths, segments, interests → local offers, the e-mail SEQUENCE, page copy in
  en/pt/es/nl). **Prices only in `src/lib/ebook.ts` `BOOK_OFFERS`** (`full` 47/9, `welcome` 27/5). Stripe's charge and its
  verification both read the dollars from the order's BRL total (`usdForBRL`), so a new offer needs a distinct BRL price.
- **Steps:** opt-in with "where are you?" (local / visiting / away) and an order bump (the book at full price) →
  `/free-recipes/obrigado` (PDF download, the book's payment status or a one-time offer, the local "what would you love?"
  picker for nearby people, WhatsApp share) → automation `receitas-sequencia` (days 1, 3, 5, 7, 9; **seeded off**).
- **The downsell** is a signed, expiring link (`offerToken` / `offerExpiry` in `lib/payments/ebook.ts`) on
  `/free-recipes/oferta`; `createEbookOrder` checks it again and prices it. Never accept a price from the browser.
- **Book orders still go through `createEbookOrder`** (bump: `createLead`, one-time offer: `buyBookFromLead`, welcome:
  `/api/ebook/order` with `offer`). `ebookCheckoutUrl` opens card/PayPal/Stripe for all of them.
- **E-mails:** the PDF e-mail is transactional (`funnelMail.ts`, 4 languages, once per address); the sequence is
  `FUNNEL_CAMPAIGNS` (`groupOnly`, topic `receitas`, tag `receitas`) in en/pt via the layout's new `lang: 'en'` frame
  (`Campaign.lang` / `reasonEn`). Buyers of the book are left out of the selling steps (`paidBookEmails`).
- Nothing may lose a sign-up: without migration 43 the recipes are still e-mailed and the thank-you page still works
  (language and segment ride in its address).
- Admin: `/admin/receitas` (Divulgação › Funil de Receitas): sign-ups, bump rate, book sales per door, which UTM converts.

# The reader's gift: 15% off after buying Sweet Escape

Anyone with a PAID e-book order gets 15% off their first paid purchase of anything else after it. Asked for by Andrew
2026-10-07. Everything (the percent, the order line, the words in 4 languages, and the rule `hasBookPerk(db, email)`)
lives in **`src/lib/bookPerk.ts`**.

- **Applied by the server, by e-mail, while pricing:** `createOrder` (/checkout: boxes and Events Menu; products only,
  never the delivery fee; checks the order's e-mail and the signed-in account's), `createBrunchOrder` (ticket price),
  and proposals (`priceFor` in `lib/payments/offer.ts`: courses and retreats). It shows as its own order line
  `Presente de leitor Sweet Escape (-15%)`, so the inbox, receipts and Dolly see it.
- **Used up** by the first paid non-book order after the first paid book; unpaid (abandoned) orders don't use it up.
- **Subscription** has no order to discount: Admin › Assinaturas flags pending subscribers who have it, and Dolly takes
  15% off the first payment by hand.
- **Previews:** `/api/perk` answers only for the signed-in visitor's own address (never for a typed e-mail: that would
  reveal who bought the book); `useBookPerk` shows the lower price in the checkout and the brunch panel.
- Told to buyers in the "book is ready" e-mail, both download pages, and as a bonus line on the funnel's one-time offer.
- Known gap, accepted: someone typing a book buyer's e-mail at checkout gets the 15% (the receipts go to that buyer).
