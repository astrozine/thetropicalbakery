# COORDINATION.md — several agents, one repo

Read this **before your first edit**, whichever tool you are (Claude Code, Gemini in Antigravity, Gemini CLI,
anything else). Andrew often runs two or three agents at the same time, and they stop and restart without
warning (session limits, free-tier quotas). `GEMINI.md` and `web-app/CLAUDE.md` describe the project;
this file describes how not to break each other's work. If a rule here changes, change it here first.

## 1. Git rules (these prevent almost every accident we have had)

1. **Look before you touch.** Run `git fetch`, `git status -sb`, `git log --oneline -8`. Files marked `M`
   that you did not edit belong to another agent's unfinished work. Leave them alone.
2. **Stage by name, never by sweep.** `git add path/one path/two`. Never `git add -A`, `git add .`
   or `git commit -a`. A sweep commit has already published one agent's half-finished work under another's name.
   **Naming the file is not enough when two agents are in the same file:** `git add` takes the whole file as it is on
   disk, including the other agent's half-written lines (this once published an import of a file that was not in
   the repo, so HEAD would not build). Run `git diff <file>` right before staging; if any hunk is not yours, do not
   commit that file: wait, or commit only your hunks with `git add -p`.
3. **Never `git stash`, `git reset --hard`, `git checkout -- file`, `git clean`, or force-push.**
   Stash briefly removes every other agent's uncommitted files from disk. If you need to compare with the last
   commit, use `git diff` or `git show HEAD:path`, or make a scratch worktree (`git worktree add <dir> HEAD`).
4. **Re-check right before you commit.** `git status --short <your files>` again, then commit, then
   `git pull --rebase` if the push is refused. Never touch a rebase or merge that is already in progress.
5. **One file, one agent, at a time.** Before editing a shared file (`globals.css`, `layout.tsx`, `checkout/page.tsx`,
   the admin pages, `RetreatsLayout.tsx`), check `git diff --stat <file>`. If it is already modified and it is not you, edit
   a *different* file instead (add a component, a small CSS block inside the component) or wait.
6. **Pushing to `main` deploys to the live site (Vercel).** Run `npx tsc --noEmit` in `web-app/` first. Commit messages
   say what changed for a person, and end with your `Co-Authored-By` line.
7. Andrew's standing instruction: **commit and push finished work without asking** so he can see it live.

## 2. Running the site locally

- `cd web-app && npm run dev`. **First check the port** (`netstat -ano | grep :3111`). Next refuses to start a second dev
  server in the same folder and tells you where the first one is (e.g. `http://localhost:3120`): use that one.
- One `.next` folder per project folder. Do not run `next build` while a dev server is running on the same folder.
- If a dev page looks unstyled or does not show your change, wait a few seconds and reload before assuming a bug.
- Windows + Dropbox: `EBUSY` on `.next` means retry. "LF will be replaced by CRLF" warnings are harmless.
- Shell heredocs with quotes or backslashes break on Windows Git Bash. Write the file with your file tool, or a small
  script file, then run it.

## 3. Checking a page on a real phone size (do this for every visual change)

Andrew's phone is the truth, and a desktop window dragged narrow is **not** a phone: it is usually 700px or more wide and
much shorter or taller than a phone, so layouts that overlap on a real 412x915 screen look fine there. Use
`web-app/tools/phone-check.mjs`:

```
cd web-app
npm i --no-save puppeteer-core          # once; do NOT commit package.json changes for it
node tools/phone-check.mjs shot  http://localhost:3120/retreats out.png 412 915     # screenshot, phone-emulated
node tools/phone-check.mjs audit http://localhost:3120                              # every main page at 360/390/412
```

`audit` reports pages that scroll sideways (`sw > iw`) and tiny text. Sideways scroll on a phone is always a bug.
Read the screenshot yourself. Do not report that something "looks good" unless you looked. If you could not verify, say
"pushed, please check it".

## 4. Security rules (learned the hard way, do not undo)

- **The browser never decides a price.** Orders are created by `POST /api/checkout/order`
  (`src/lib/payments/order.ts`), which reads prices, stock, fees and delivery days from the database. Any new way to
  buy something must go through the same server function. Card and PayPal charge the amount stored in the order.
- **The `orders` table is private** (names, WhatsApp, addresses). Only admins read it. The public can only leave a
  *lead* (no status, no price). Anything a customer needs to see about their own order goes through a SECURITY DEFINER
  function (see `my_pickup_orders`), never through a table read.
- **Content tables are read by everyone and written only by admins** (`is_admin()`): courses, treats, tasting_boxes,
  site_content, highlights, retreat_rooms, and the `uploads` storage bucket. Customers can sign in, so
  "signed in" (`auth.role() = 'authenticated'`) must never be the write rule. Use `public.is_admin()`.
- The **service-role key** is used only in `src/lib/payments/server.ts` and `order.ts` (server code). Never in client
  code, never `NEXT_PUBLIC_`, never committed, never pasted in a chat. Secrets go only into Vercel and Supabase screens.
- The box "sold" counter is changed only by the server through `reserve_box_stock` / `release_box_stock`
  (granted to `service_role` only).
- After any change to who can read or write a table, check it with the public key, counting rows only, never printing
  customer data: `GET /rest/v1/<table>?select=id&limit=1` with `Prefer: count=exact`.

## 5. Database changes

- Numbered SQL files in `web-app/` (`migration_NN_*.sql`), idempotent, ending with a verification `SELECT`. Andrew runs them by
  pasting into the Supabase SQL editor. **Tell him the file name and the order relative to the deploy.**
- Two migrations share a number: 18 (card payments and inquiry message) and 19 (dietary profiles and treat photo paths).
  Use the next free number (currently **48**) and check `ls web-app/migration_*.sql` first.
- New tables need explicit `GRANT`s (see `web-app/CLAUDE.md`).
- Code that needs a new column must still work when the migration has not run yet (fall back, and show a plain hint).
- The `orders` table was first made for lead forms and has a `NOT NULL` column `order_type`
  (`CAIXA_DEGUSTACAO` | `EVENTO`). Every order insert must set it. This once silently dropped every checkout order.

## 6. Where things stand (keep this list honest; edit it when it changes)

Verified live, 2026-09-26:
- Card payments via Mercado Pago are on (`/api/pay/methods` says `card: true`). PayPal is off (no keys yet).
- Orders are created on the server. **Migration 22 is RUN** (checked with the public key, 2026-09-26): `orders` gives the public
  nothing back, `reserve_box_stock` / `release_box_stock` exist and answer "permission denied" to anyone but the server, and the
  content tables read publicly but refuse an anonymous write. `orders.status` and `orders.total_price` both default to NULL, so a
  lead that sets neither is accepted — a lead that sets either one is rejected outright.
- **Treat picks (written 2026-09-28).** The 4-box is the complete one, the 2-box is two favourites, the 6-box is complete + 2
  (`src/lib/boxPicks.ts`, one rule for page, server and SQL). One-off orders carry the picks as BoxItem ids and the server writes
  the names into the order line; the dice ("a Dolly escolhe") sends none. Subscribers choose weekly in Minha Conta
  (`SubscriberPicks.tsx`) through `set_subscription_picks`: **migration 28 is NOT run yet**; until then that card and the admin's
  per-subscriber choice line stay hidden. The picker only appears when the active box has a treat list in /admin/caixas.
- **Migration 24 (box sizes, box gallery, subscription size) is NOT run yet** (written 2026-09-26). Until it runs the site uses the
  built-in prices 59 / 99 / 129 from `src/lib/boxSizes.ts`, the admin cannot change them, box gallery photos are not saved, and a new
  subscription's size goes into its customer message. Boxes come in 2, 4 or 6 treats everywhere; the server prices every box line
  by `box_size` from `site_settings` (box_price_2/4/6), never from `tasting_boxes.price` any more.
- **Hide what isn't ready (2026-09-29).** Every card in /admin/treats and /admin/courses has a one-tap "Aparecendo no site /
  Escondido · em preparo" switch (`ShowOnSiteSwitch.tsx`), flipping the flags the public pages already read (`treats.is_available`,
  `courses.is_active`). Hidden courses also leave the nav dropdown and "Outros Cursos" (`useShownCourses.ts`). Treat types: Bolos,
  Tarteletes and Cupcakes are separate now; old `bolos-tarteletes` reads as `bolos` (`normalizeTreatType`) and
  `migration_29_split_cakes_tartelettes.sql` (NOT run yet, safe either way) rewrites it. "Entremets" stays French, with the Portuguese in brackets.
- **Raw is a checkbox, not a type (2026-09-30, Dolly's call).** Any treat can be raw: `treats.is_raw`, read only through
  `isRaw()` in `treatTypes.ts` (an old `treat_type = 'raw'` still counts). New type `cake-pops`. Migration 31 is run.
- **One control row on /menu and /admin/treats:** 🌿 Raw and 🌾 Integral are on/off pills at the start of `TreatTypeBar`
  (`styleToggles`, `RefineState.raw` / `.wholeFood`), then the kinds. `/menu?raw=1`, `/menu?integral=1`. The old
  "Todos / Raw / Do forno" switch (`RawSwitch.tsx`) is gone: please don't add another row of controls to that page.
- **Sugar and caffeine per treat (2026-09-30).** Not allergens. `treats.sugars` is a LIST (migration_33): nenhum | fruta | coco | rapadura |
  cristal. **SOS-free is derived, never stored** (code still calls it `isWholeFood` / `wholeFood`): no 'cristal' = SOS-free. 'cristal'
  comes with the industrial vegan chocolate (milk, white, caramel, most dark), and those treats say "🍫 Com chocolate vegano" (tag on the
  photo, `TreatTags`; explanation in `TreatInfo`). The menu pill is "🌾 SOS-free", `/menu?sos=1` (`?integral=1` still works).
  `caffeine` = sem | pouca | com (migration 32, run). All in `src/lib/sugarCaffeine.ts`; the "Açúcar e cafeína" folder keeps only
  Sem açúcar adicionado / Sem cafeína / Sem café. Unknown never counts as integral or "sem". Edited with `SugarCaffeineFields` (suggests
  from ingredients, asks about unlabelled chocolate). **Migration 33 is RUN** (`treats.sugars` answers, 2026-09-30; the old
  `treats.sugar` column stays, unused).
- **How we talk about sugar and SOS-free (Andrew, 2026-09-30).** The ONE refined ingredient is the industrial vegan chocolate Dolly buys
  ready (it has sugar and oil); every other recipe is SOS-free: no salt, no oil, no refined sugar, sweetened with dates/fruit, coconut sugar
  or rapadura. So:
  - Never "SOS-free", "sem açúcar refinado" or "sem processados" about ALL treats or a whole box without naming the chocolate exception.
    Short lines (taglines, e-mails, share texts) say only what's true of everything: vegan, gluten-free recipes, handmade.
  - Never use "SOS-free" without `<SosFreeExplainer />` nearby: most people don't know the term. Its words live in `SOS_EXPLAINER`
    (sugarCaffeine.ts): credit Alan Goldhamer (TrueNorth Health Center), say ours is a softer version (coconut sugar and rapadura are in),
    name the chocolate exception, and the stance: treats are for special occasions, celebrating without wrecking your health.
  - Never imply any link with Goldhamer or TrueNorth.
  - Still fine: teaching claims (courses/retreats teach cooking without refined sugar), customer diet labels.
- **Prospecção (written 2026-10-07).** `/admin/prospeccao` is the outreach pipeline for businesses we contacted by e-mail/WhatsApp
  (table `partner_leads`, `migration_42_partner_leads.sql`, **NOT run yet**; the page shows a hint until it runs). Kept apart from
  `partners` on purpose: a `partners` row can sign in to the portal. The contact list is loaded by `seed_partner_leads.sql`, kept
  in the project files, never in git.
- **Sweet Escape e-book (written 2026-09-30).** English sales page `/sweet-escape` (`src/components/ebook/`), price and
  recipes in `src/lib/ebook.ts`. Orders go through `createEbookOrder` (`src/lib/payments/ebook.ts`): server price, saved in
  `orders` with `order_kind = 'ebook'`, reference `EBK…`. Buyers get `/sweet-escape/thank-you?ref=…&k=…` (`k` = HMAC of the
  reference); "paid" = status PAID or moved past `new` in the inbox (Pix by hand), and `/api/ebook/download` redirects to a
  10-minute signed URL from the PRIVATE `ebooks` bucket. **`migration_34_ebook_storage.sql` is NOT run and the 38 MB PDF
  (`e-books/sweet-escape.pdf`) is NOT uploaded yet** (`web-app/SETUP_ebook.md`); until then downloads fail with a friendly
  message. `createMercadoPagoCheckout` / `createPayPalCheckout` take an optional `{ returnUrl, title }`; box orders unchanged.
  Never commit the PDF to git (it would be free to download).
  **Stripe (written 2026-10-01, e-book only):** `src/lib/payments/stripe.ts` (hosted Checkout in USD, no SDK), `POST /api/pay/stripe/confirm`,
  signed `/api/webhooks/stripe`. Needs `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (`web-app/SETUP_stripe.md`); until set, `/api/pay/methods` says
  `stripe: false` and nothing changes. When on, the en/es/nl pages offer it and show US$ 9 (the pt page stays on Mercado Pago/Pix in R$).
  Two accounts supported: A = `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` (Dolly), B = `…_B` (Andrew), `STRIPE_ACTIVE_ACCOUNT=A|B` picks who takes new
  payments; payments/webhooks are recognised on either.
  The order's `total_price` stays the BRL list price (47); the dollars are verified against Stripe (`EBOOK.priceUSD`) and noted in `items_summary`.
  **Languages:** the BOOK exists in four languages (PDFs `sweet-escape-en|pt-br|es|nl.pdf` in the `ebooks` bucket, `BOOK_FILES` in
  `src/lib/ebook.ts`; missing file = English). The sales page is hand-written in the same four: English (`/sweet-escape`),
  Portuguese (`/sweet-escape/pt`, what the site menu links to), Spanish (`/sweet-escape/es`) and Dutch (`/sweet-escape/nl`); every word is in
  `src/lib/ebookCopy.ts`. The buyer's page language and book language ride on `orders.delivery_address` (`… · pt · nl`). Google Translate CANNOT make Portuguese from these pages (the site declares itself Portuguese),
  so the nav's 🌐 picker sends people to the hand-written page on `/sweet-escape*`, and FR/DE/IT go to
  `/sweet-escape?tl=fr` (Google; FR/DE/IT get the English edition). Choosing the English edition while reading in another
  language (or through Google) shows "this edition is in English" and requires a tick before paying. The buyer's language rides on `orders.delivery_address` (`… · pt`) for the e-mails.
- **Brunch Tropical (written 2026-10-07, `migration_41_brunch.sql` NOT run yet).** Ticketed brunches with a private group per
  brunch, networking cards, a live vote on treats/topics and the Círculo perks; see the section in `web-app/CLAUDE.md`.
  Until migration 41 runs, `/brunch` shows "a próxima data sai em breve" with an e-mail capture and `/admin/brunch` shows a
  "rode a migration 41" hint. Small edits to shared files: `server.ts` (brunch branch in the paid receipt), `send.ts`
  (`groupOnly` guard, `exceptEmails`), `ebook-paid` route (also sends the brunch welcome), retorno page, Navigation, adminNav,
  Minha Conta (tickets at the top of Início, a brunch step in the trail).
- **Several boxes on sale at once (written 2026-10-06, `migration_40_special_boxes.sql` NOT run yet).** Besides the weekly ready box and
  the pre-sale, Dolly can publish any number of **special editions** (`tasting_boxes.edition = 'special'`, e.g. Dia das Crianças), optionally
  sold closed at their own price (`fixed_price`, charged by `createOrder`; null = the usual 2/4/6 sizes). A special never takes another box off
  the site, never rolls over past its delivery days, and is ignored by `splitActive` / `nextBakeBox` (subscribers, kitchen tally). Every live
  box shows in the home hero (`HeroLiveBoxes`), as its own card in the home box section, in the box switch at the top of `/caixas`
  (`?caixa=<id>`; `?edicao=pre|pronta` still work), under "Também à venda" there, and as "Quer levar também?" at checkout (`BoxCards.tsx`).
  Sort order in `sortLive()` (boxWindow.ts). Until migration 40 runs everything behaves as before and saving a special says to run it.
- **Migration 21 is RUN**: `tasting_boxes.delivery_from` / `orders_open_from` answer.
- **The delivery calendar runs out.** `delivery_schedule_rules` is EMPTY and `delivery_dates` only holds one-off days, so once the
  last one passes `selectableDates()` returns nothing, every box goes to `closed`, and the home page and `/caixas` show the
  "no box yet" notice however much stock is left. Check it before assuming the box pages are broken.
- **Stock is reserved when the order is created and only given back if saving fails.** Pix is confirmed by hand, so an abandoned
  Pix checkout keeps its boxes until someone gives them back. `/admin/caixas` lists Pix orders still unconfirmed after 24 h
  (`HeldBoxes.tsx`) with a "Liberar N caixas" button per order. It marks the order `cancelled` in `inbox_status` first, then
  lowers `sold_quantity` only if the counter has not moved meanwhile. It never offers card/PayPal orders (they can still be paid).
  `cancelled` is set only there; the inbox must not offer a way to reopen it (that would bring back an order whose boxes were
  already returned).
- The admin overview warns when a box is on sale but fewer than 3 delivery days are open (`deliveryDaysLeft` in `adminStats.ts`).
  A recurring weekly rule in `/admin/calendario` is the real fix.
- **Type is never under 12px (0.75rem) on the public site**, and tap targets are 44px. The phone audit reports anything smaller.
  `npm run lint` has 0 errors; React's compiler-style rules and `any` are warnings on purpose (see `eslint.config.mjs`).
- Box sale rules live in `src/lib/boxWindow.ts` (a box is on sale until it sells out or is switched off; an ended window rolls over
  to the next deliverable days). When nothing can be ordered the site shows the "no box yet + waiting list" notice
  (`NoBoxNotice.tsx`) on `/caixas` and the home page.
- Admin **Ver como** (`/admin/ver-como`) previews customer, partner and staff areas read-only (`?preview=<id>`, admins only).
- The events strip (`GlobalMenuTeaser`) shows only on home, retreats, courses and partnership pages.

- **E-mail can now send itself (written 2026-09-28, migration 26 NOT run yet).** Sending was extracted into
  `src/lib/email/send.ts`; `/api/email/send` (the admin button) and `/api/email/cron` (the scheduler) both go through it, so
  scheduled mail obeys the same opt-outs and the same "nobody twice". Until Andrew runs
  `migration_26_email_scheduler.sql`, adds `EMAIL_CRON_SECRET` to Vercel and schedules pg_cron
  (`web-app/SETUP_email_scheduler.md`), **nothing sends by itself** and Admin › E-mails shows a "run migration 26" hint
  instead of the scheduler. The four automations are seeded **off**; do not enable one for him.
  Order receipts (`src/lib/email/receipts.ts`) need none of that setup and go out as soon as the code deploys — the first
  transactional mail the site has ever sent. If you touch `createOrder` or `markOrderPaid`, keep the receipt call inside its
  try/catch: an e-mail failure must never fail a saved or paid order.

Not built yet (ask Andrew before starting): the cookie
consent banner and privacy-policy update that must come **before** installing any ad pixel (LGPD); the Google / Meta pixel itself.

## 7. When you stop

Leave the tree in a state the next agent can read: commit what is finished, and if something is half done, say so in
your last message to Andrew (file names, what is missing). Do not leave a half-finished edit in a shared file.
