# GEMINI.md — handoff for working on The Tropical Bakery

This file is for Gemini (CLI or Code Assist) picking the project up when Claude isn't available.
Read all of it before changing anything. `web-app/CLAUDE.md` and `web-app/AGENTS.md` are the same
kind of file for Claude; their rules apply to you too, and if you change a convention, update
**this file and `web-app/CLAUDE.md`** so the two never drift apart.

---

## 1. Who you're working for

- **Andrew Strasser** (astrozine@gmail.com) owns the project. He is **not a programmer**. His wife
  **Dolly** (elisabeth.vandam@gmail.com) is the baker and the main admin of the site.
- They live in Itamambuca, Ubatuba (São Paulo state, Brazil). **The website copy is Brazilian
  Portuguese.** Talk to Andrew in plain English: say what changed and what he must click or run,
  not how the code works.
- He works by sending **screenshots with red circles and short comments** and expects you to
  understand what's wrong from the picture. Often he says "you decide the order". Do that, pick the
  order that causes the fewest problems, and don't stop to ask unless the decision is really his.
- He has strong taste: he wants the site to **pop**, feel luxurious and unmistakably Brazilian
  (think Oakberry, Havaianas, Granado), never generic or "AI looking".
- **Say honestly what you verified and what you didn't.** You can't view the live site. Never claim
  something "looks great" that you haven't seen; say "pushed, please check it".

## 2. The business (so the copy and features make sense)

The Tropical Bakery makes **vegan, gluten-free, refined-sugar-free ("SOS-free": no salt, oil,
sugar) treats**, handmade by Dolly. Revenue lines on the site:

1. **Caixa de Degustação** (weekly tasting box, R$99 single). `/caixas`. Limited editions with a
   sold-out counter. Delivered on days Dolly opens in a calendar.
2. **Assinatura** (weekly subscription, plans from R$79/box). `/assinatura`, `/minha-conta`.
3. **Menu de Eventos** (`/menu`): wholesale/event treats with minimum batch sizes.
4. **Cursos** (courses), **Retiros** (retreats at the Salt n' Paradise house, real photos, four
   accommodations, focus tracks, "inspiration" section quoting Joel Fuhrman and Alan Goldhamer with
   a clear no-affiliation disclaimer).
5. **B2B partnerships** (`/b2b/*`: hotels, pousadas, Airbnbs, restaurants, bakeries, affiliates,
   travel managers), and a **careers** page (`/trabalhe-conosco`) with a CLT pay estimator.

Delivery is only for Itamambuca, nearby beaches, Ubatuba, plus events in Paraty. **Itamambuca** is a
special "backyard" market with its own logos (`public/itamambuca-lockup.png`, `itamambuca-ribbon.png`).

## 3. Stack, commands, deploy

- **Next.js 16.3.5 (App Router, Turbopack)**, React 19, TypeScript, Tailwind 4, supabase-js 2,
  framer-motion, `qrcode-pix`. **Read `web-app/node_modules/next/dist/docs/` before using any Next
  API**; this version differs from what you remember.
- Styling is mostly **inline styles** plus utilities and shared CSS in `web-app/src/app/globals.css`.
  Fonts: Outfit (body) and **Unbounded** (headings, keep it: Andrew likes it big and bold).
- Run everything from `web-app/`:
  - `npx tsc --noEmit` (must be clean) then `npm run build` (must compile).
  - **Pushing to `main` auto-deploys on Vercel.** Andrew expects finished work to be committed and
    pushed after the checks pass. Do not push broken builds. Never force-push.
- GitHub: `astrozine/thetropicalbakery`. The git root is the repo root (this folder); the app lives
  in `web-app/`. The many photo/asset folders at the root are Andrew's working files, leave them.
- Windows + Dropbox: `next build` sometimes fails once with `EBUSY` on `.next`; just retry. "LF will
  be replaced by CRLF" warnings are harmless. Shell heredocs that contain quotes or backslashes
  break easily on Windows; prefer editing files with your file tools.
- Env vars (set in Vercel, never commit): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `RESEND_API_KEY`. There is **no service-role key** in the app on purpose.

## 4. Backend: Supabase

- Everything is protected by **Row Level Security**. Admins are the emails in `public.admins`;
  `public.is_admin()` (SECURITY DEFINER) is used in policies and checked by `/admin/layout.tsx`.
  Admin pages talk to Supabase **as the logged-in admin** (browser client). The one API route,
  `src/app/api/notify-delivery-dates/route.ts`, forwards the caller's `Authorization` header to a
  fresh client, checks `is_admin`, then emails opted-in customers through Resend
  (from `nao-responda@thetropicalbakery.com`). Follow that pattern for any new route.
- Public storage bucket **`uploads`** holds admin-uploaded images. Use `src/lib/imageUpload.ts`
  (`uploadPublicImage`, resizes phone photos) and the `ImagePicker` component, never a bare
  `<input type=file>`.
- **Migrations are SQL files in `web-app/`** (`migration_02` … `migration_14`). Andrew runs each one
  by pasting it into the Supabase SQL Editor. When you add a schema change: write a new numbered
  file, keep it idempotent (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`), end with a verification
  `SELECT`, and tell Andrew exactly which file to run. Code that depends on a new column/table should
  fail helpfully (see the orange "falta uma etapa no banco de dados" box on `/admin/calendario` and
  the hints in `admin/caixas`).
- **New tables must include explicit `GRANT`s in the migration** (Supabase stops auto-granting Data
  API access to new tables on 2026-10-30). See `web-app/CLAUDE.md` for the exact snippet. Give
  `anon` only what visitors need.
- Migration status: 02–05 were run earlier, as far as we know. **06–14 were being run by Andrew as they were written;
  do not assume any of them ran.** 12 (delivery schedule + order columns), 13 (box items) and 14
  (treat ingredients/allergens) 15 (e-mail preferences) and 16 (partner/worker portals) are the newest. Ask, or look for the in-app warnings.

## 5. Feature map (where things live)

**Ordering and payment**
- One checkout for everything: `src/app/checkout/page.tsx`, two steps (details, then **Pix QR +
  copia-e-cola**). Pix key is the CPF in `src/utils/pix.ts` (a wrong key gave "chave não
  encontrada" once; it works now). Card (Mercado Pago) and PayPal are built as optional extra
  methods (see `web-app/CLAUDE.md` "Card and PayPal payments" and `web-app/SETUP_payments.md`); they
  only appear once Andrew has put the keys in Vercel. Cart lives in `src/context/CartContext.tsx`; items have `kind: 'box' |
  'events'`. Box orders come from `BoxOrder.tsx` on `/caixas`; events items from `MenuCard.tsx`.
- Box orders use the **box delivery calendar**; Menu de Eventos orders use a plain date field
  (min 3 days). They are deliberately separate.
- Delivery schedule: `src/lib/deliverySchedule.ts` (rules like "every Friday", "every other
  Thursday", "1st Saturday of the month" + per-day overrides + minimum lead days), admin UI
  `admin/calendario`, customer UI `DeliveryCalendar.tsx` (bright, celebratory). Tables:
  `delivery_schedule_rules`, `delivery_dates` (overrides), `delivery_notifications`.
- Delivery zones and fees: `src/lib/deliveryZones.ts`. Subscriptions: `src/lib/subscriptions.ts`,
  `SubscriptionSignup.tsx`, `MySubscription.tsx`.

**Treats, boxes and allergens**
- `tasting_boxes.items` (jsonb) = the treats in each box. `treats` (Menu de Eventos) has the same
  detail fields (emoji, ingredients, contains, may_contain). A box item may carry `treat_id` to link
  to the same treat in the menu; `src/lib/treatSync.ts` keeps ingredients/allergens identical in
  both places (an allergen fix must reach everywhere).
- Allergen list and helper types: `src/lib/allergens.ts` (ANVISA RDC 26/2015 + EU 14, plus coconut).
  Admin editors: `BoxItemsEditor.tsx`, `TreatDetailsFields.tsx`. Public display: `BoxContents.tsx`
  (accordion on `/caixas`), `TreatInfo.tsx` (also used by `MenuCard.tsx`).
- Do **not** add an "allergen-free" filter: an unfilled treat would look falsely safe.

**Admin (`/admin`)**: inbox (red ❓ to green ✅ multi-step statuses per item type), delivery
calendar, subscriptions, boxes, waitlist, course sign-ups, treat catalog, courses, retreat photos
and prices, maintenance-contacts catalogue, special announcement banner, CRM and campaigns,
job applications, **Administradores** (add/remove admins). The account menu shows an
"Administração" link only to admins. Use `ToggleSwitch` for on/off settings and `ImagePicker` for photos.

**E-mail**: topics/lists in `src/lib/emailTopics.ts`, templates in `src/lib/email/campaigns.ts`,
shell in `src/lib/email/layout.ts`, sending in `POST /api/email/send` (writes an `email_sends` row
first; the unique `(email, message_key)` index is what stops a second copy), public preference page
`/preferencias?token=…` backed by SECURITY DEFINER functions, contacts collected through the
`email_contact_upsert` RPC in every form. Transactional topics ignore unsubscribes; marketing never
may. Admin UI: `/admin/emails`. Schema: `migration_15_email_preferences.sql`. See `web-app/CLAUDE.md`
for the rules.

**Private areas**: `/parceiro` (B2B partners: their deal, restock requests, monthly goal, affiliate
totals) and `/equipe` (staff: shifts, hours, pay). Both are gated by an e-mail match against
`partners` / `workers`, managed in `/admin/parceiros` and `/admin/equipe`. Partners apply through
`PartnerApply` on the B2B pages. Schema: `migration_16_portals.sql`. Types/labels: `src/lib/portals.ts`.

**Public pages**: `/` home, `/assinatura`, `/caixas`, `/menu`, `/retreats` (+ `/en/retreats`,
`/es/retiros`, but the newest retreat sections are Portuguese only), `/cursos`, `/b2b/*`,
`/trabalhe-conosco`, `/minha-conta`, `/checkout`. Language switcher uses the Google Translate
widget cookie (`googtrans`); choosing Português clears it and reloads.

## 6. Design rules Andrew has given (don't break these)

- **Pop, luxury, real photography.** He rejected AI-generated retreat imagery; the retreat pages use
  his real photos. The B2B heroes intentionally mix a scene photo with two treat "prints"
  (`SplitHero.tsx`). Keep images sharp and uncropped where he complained (portrait photos: use
  `contain` or portrait frames, never stretch small images).
- The `/retreats` mobile layout is his favourite reference for how a page should feel on a phone.
  Floating-photo full-bleed heroes are praised. Reuse that spirit.
- **Never add flat SVG "Burle Marx" blobs/bands.** Three attempts were rejected as "a sad excuse" and
  "hideous". If he wants Brazilian botanical art, use real vector assets from his folders
  (`Sunbaked Letters`, `Graphic Design Elements for 3D`), and ask first.
- Text must be readable on photos (put the scrim gradient and `backgroundBlendMode` properly).
- Admin controls must state the **action**, not a confusing state ("Ativar / Desativar" switches,
  "Clique aqui para escolher uma foto").
- Admin forms should not be full-width walls: use two columns that stack on small screens.
- Highlight cards on the `/assinatura` hero only (Andrew was explicit that `/caixas` must not have them).
- Check phones: much of his audience is mobile.

## 7. Known gotchas (each cost real time)

- The global `.container` class once set `padding: 0 2rem` and silently zeroed Tailwind vertical
  padding; it's fixed to left/right only. Don't reintroduce shorthand padding there.
- CSS `background: url(photo), linear-gradient(...)` paints the photo **over** the scrim unless you
  set `backgroundBlendMode`.
- SVG with `preserveAspectRatio="none"` stretches circles into ovals.
- Airbnb CDN photo widths that work: 720/960/1200/1440/1920 (1600 gives 404).
- Use local-time date strings (`toISODate` in `deliverySchedule.ts`), never `toISOString().slice(0,10)`,
  for calendar days (timezone shifts).
- Errors must be visible next to the thing the user clicked; silent failures were a real bug.
- Keep WhatsApp number `5511932119196` as the store contact (already used across the site).

## 8. Open items / backlog (none started unless noted)

- Andrew must confirm Resend domain verification ("Pending" DNS at GoDaddy) and that the Vercel
  redeploy with `RESEND_API_KEY` finished, or the "send e-mail to customers" button won't work.
- **Twilio/WhatsApp automation is blocked** (company registration). WhatsApp messages are copy-paste
  for now.
- Card + PayPal code is done; Andrew still has to create the accounts and add the keys (`SETUP_payments.md`).
- Yearly: update `minimum_wage` in `site_settings` (no admin UI yet; `/admin/configuracoes` offered).
- English/Spanish versions of the new retreat sections; more video placements for the inspiration section.
- A full mobile audit needs Andrew's phone screenshots (you can't test mobile).
- Physical QR display card for hotel mini-fridges and a gold-foil paint-swash graphic.

## 9. How to work well here

1. Look at the existing component/lib before writing a new one; match the surrounding style and
   comment density. Most of what you need already exists (see section 5).
2. Make the change, run `npx tsc --noEmit` and `npm run build` from `web-app/`.
3. Commit with a clear message and push to `main` (auto-deploy), unless Andrew said not to.
4. Reply to Andrew with: what changed, anything he must run in Supabase (name the file), and what
   you couldn't verify. Keep it short and non-technical.
