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
  Use the next free number (currently **24**) and check `ls web-app/migration_*.sql` first.
- New tables need explicit `GRANT`s (see `web-app/CLAUDE.md`).
- Code that needs a new column must still work when the migration has not run yet (fall back, and show a plain hint).
- The `orders` table was first made for lead forms and has a `NOT NULL` column `order_type`
  (`CAIXA_DEGUSTACAO` | `EVENTO`). Every order insert must set it. This once silently dropped every checkout order.

## 6. Where things stand (keep this list honest; edit it when it changes)

Verified live, 2026-09-26:
- Card payments via Mercado Pago are on (`/api/pay/methods` says `card: true`). PayPal is off (no keys yet).
- Orders are created on the server. **Migration 22 (lock down orders, content tables, uploads, safe stock) must be run by Andrew
  after this code is deployed.** Until it runs, the public can still read `orders`.
- Migration 21 (box delivery / ordering windows) is not confirmed run. The admin box form warns when it is missing.
- Box sale rules live in `src/lib/boxWindow.ts` (a box is on sale until it sells out or is switched off; an ended window rolls over
  to the next deliverable days). When nothing can be ordered the site shows the "no box yet + waiting list" notice
  (`NoBoxNotice.tsx`) on `/caixas` and the home page.
- Admin **Ver como** (`/admin/ver-como`) previews customer, partner and staff areas read-only (`?preview=<id>`, admins only).
- The events strip (`GlobalMenuTeaser`) shows only on home, retreats, courses and partnership pages.

Not built yet (ask Andrew before starting): an automatic message to the waiting list when a new box opens; the cookie
consent banner and privacy-policy update that must come **before** installing any ad pixel (LGPD); the Google / Meta pixel itself.

## 7. When you stop

Leave the tree in a state the next agent can read: commit what is finished, and if something is half done, say so in
your last message to Andrew (file names, what is missing). Do not leave a half-finished edit in a shared file.
