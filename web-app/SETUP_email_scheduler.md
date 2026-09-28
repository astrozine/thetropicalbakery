# Setting up the e-mail scheduler (the free Klaviyo)

You only need to do this once. Three steps, about 15 minutes.

Until step 3 is done, **nothing sends by itself** — the site still works exactly as
before, with the Enviar button in Admin › E-mails.

---

## What this actually is

The site already had everything needed to send e-mail well: the templates, the
opt-outs, the "nobody gets the same message twice" rule. What it did not have was
a **clock**. Somebody had to be sitting at the computer clicking Enviar.

This adds the clock. Two kinds of automatic e-mail:

| | What it is | Where you set it up |
|---|---|---|
| **Agendamento** | "Send this exact e-mail on Friday at 9am." | Admin › E-mails › ⏰ Agendar este e-mail |
| **Automação** | "Whenever a new box goes on sale, announce it." Never needs a date. | Admin › E-mails › 🤖 Automações |

Plus two receipts that now go out on their own, with nothing to switch on:
**"Recebemos seu pedido"** (with the Pix copy-and-paste code, so closing the
checkout tab no longer loses the payment) and **"Pagamento confirmado"**.

---

## Step 1 — Run the migration

Supabase → **SQL Editor** → paste all of **`migration_26_email_scheduler.sql`** →
Run.

At the bottom you should see four rows: `agendamentos 0`, `automações 4`,
`automações ligadas 0`, `verificações do cron 0`.

`automações ligadas 0` is correct. Every automation starts **switched off** — that
is deliberate. Turning one on means mailing real customers, so it should be your
decision, on a day you are watching, not something a migration did quietly.

---

## Step 2 — Make up a password for the robot

The scheduler has its own web address (`/api/email/cron`). Anything that can reach
that address can e-mail the whole list, so it needs a password.

Make up a long random one. On your machine, in Git Bash:

```
openssl rand -hex 24
```

Copy what it prints. Then add it to Vercel:

```
cd web-app
npx vercel env add EMAIL_CRON_SECRET production
```

It will ask for the value — paste it. Then **redeploy** (any push does it, or
Vercel → Deployments → ⋯ → Redeploy), because a new environment variable does not
reach the running site until then.

Keep that password somewhere safe. You need it again in step 3, and nowhere else.

---

## Step 3 — Give it a clock

Something outside the site has to knock on the door every few minutes. Use
**Supabase's own scheduler** — it is in the database you already pay nothing for,
so there is no extra account and nothing else to keep alive.

### 3a. Switch on the two extensions

Supabase → **Database → Extensions** → search for and enable:

- **`pg_cron`** — the scheduler itself
- **`pg_net`** — lets the database call a web address

### 3b. Schedule it

Supabase → **SQL Editor** → paste this, **with your password from step 2 in place
of `SEU_SEGREDO`** → Run:

```sql
select cron.schedule(
  'tropical-email-scheduler',
  '*/5 * * * *',                       -- every 5 minutes
  $$
  select net.http_post(
    url     := 'https://thetropicalbakery.com/api/email/cron',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer SEU_SEGREDO"}'::jsonb
  );
  $$
);
```

Check it is there:

```sql
select jobname, schedule, active from cron.job;
```

To see whether the calls are going out (and what the site answered):

```sql
select status, status_code, created
from net._http_response
order by created desc
limit 10;
```

`status_code 200` is good. `401` means the password does not match what is in
Vercel. `404` means you have not redeployed since the code went up.

**If you ever want to stop it:**

```sql
select cron.unschedule('tropical-email-scheduler');
```

### Why every 5 minutes and not every hour

Each automation has its own "manda às" hour and runs **once per day** at most, so
a five-minute tick does not mean five-minute e-mails. The frequent tick is so that
a *scheduled* send goes out near the minute you asked for, instead of up to an hour
late.

### If you would rather not use the database

**cron-job.org** (free) does the same thing from outside: create a job, URL
`https://thetropicalbakery.com/api/email/cron?key=SEU_SEGREDO`, every 5 minutes.
Slightly worse, because the password then sits in the URL (and so in their logs)
rather than in a header. Vercel's own Cron is the other option, but on the cheaper
plans it only runs **once a day**, which is too coarse for "announce the box the
moment it goes live". Free-tier limits change — check before you rely on one.

---

## Checking it works, without mailing anyone

Two safe ways.

**A rehearsal.** Add `?dry=1` and nothing is sent — it only reports what it *would*
do, and it does not touch the log:

```
https://thetropicalbakery.com/api/email/cron?key=SEU_SEGREDO&dry=1
```

Open that in a browser. You get a line per automation explaining why each one is
quiet or what it would send — including how many people would get it.

**The green light.** Admin › E-mails now has a line at the top of the scheduler
section: 🟢 *"O robô conferiu há 4 minutos"*, with what it did. If that says
⚪ *"ainda não conferiu nada"* an hour after step 3, step 3 did not take.

---

## Turning on your first automation

Do them one at a time, and look at the result before the next.

Recommended order:

1. **📅 Novas datas de entrega** — the safest. It only speaks when genuinely new
   delivery days open, and it is the same message the Calendário button already
   sends by hand.
2. **🔁 Lembrete de entrega (assinantes)** — goes only to subscribers, and only
   2 days (your choice) before a delivery day.
3. **📦 Caixa nova entrou no ar** — the big one: it goes to everybody who wants to
   hear about boxes, including the waiting list. Announce a box by hand once first
   so you know the text reads the way you want.
4. **⏳ Últimas caixas** — set the number first (default: 5 left).

### One thing to know before you switch on "Caixa nova"

It announces **every box that is on sale and has not been announced yet**. If you
have older boxes sitting active in Admin › Caixas, it will announce those too, the
first time it runs. Before switching it on, go to Admin › Caixas and switch off
anything that should not be shouted about — or announce the current box by hand
first, which uses up its one-and-only message.

---

## What can and cannot go wrong

- **Nobody can get the same message twice.** Every send writes a row keyed on
  (address, message) *before* Resend is called. The scheduler uses that same
  engine, so it inherits the guarantee. Running the cron twice a minute changes
  nothing.
- **Unsubscribes are obeyed.** Same `canReceive()` check as the manual button.
  Scheduled mail is not a loophole.
- **A half-finished send resumes.** If a send is bigger than one wake-up, the rest
  goes on the next tick. Nobody is skipped and nobody is doubled.
- **A receipt can never break an order.** Both receipts are wrapped so that a
  Resend outage is logged and ignored — the order is already saved and already
  paid, and must not be rolled back over an e-mail.
- **The 3,000/month Resend free limit is the real ceiling.** Automations make it
  much easier to reach. Resend's dashboard is where you watch it.
