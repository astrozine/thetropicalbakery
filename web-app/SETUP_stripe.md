# Turning on Stripe (cards from anywhere, in US dollars)

**For Andrew and Dolly.** The code is already on the site. Until the two keys below are in Vercel, nothing changes: the
English, Spanish and Dutch pages keep offering Card (Mercado Pago) and Pix. The moment the keys are in, those three
pages offer **Card · Apple Pay · Google Pay** through Stripe and charge **US$ 9**. The Portuguese page is not
affected: it keeps Mercado Pago and Pix in reais.

> 🔐 **Golden rule:** the keys go ONLY into Vercel. Never into WhatsApp, e-mail, a chat or a file. If one leaks,
> roll it in Stripe (Developers → API keys → ⋯ → Roll key) and update Vercel.

Dolly's Stripe account is the one that receives the money, so **Dolly logs into Stripe**, or you do with her permission.

## Step 0: Is the account ready?
Stripe dashboard (dashboard.stripe.com): there must be no banner asking to "Complete your profile" or "Activate payments".
Identity verified and the bank account added. Payouts arrive in the account's own currency (reais for a Brazilian
account), so Stripe converts each dollar sale at its own rate. Look at Settings → Business → Payouts to see where it goes.

## Step 1: Test mode first (fake money)
1. In the dashboard turn on **Test mode** (switch at the top, or "Sandbox", depending on the screen).
2. **Developers → API keys**. Copy the **Secret key** (starts with `sk_test_`). Do NOT copy the "Publishable key".

## Step 2: Tell Stripe where to report payments (webhook)
1. **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL**, exactly: `https://thetropicalbakery.com/api/webhooks/stripe`
3. **Events**: tick `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
4. Save. Open the new endpoint and click **Reveal** on the **Signing secret** (starts with `whsec_`). Copy it.
5. Sanity check: open the URL in a browser. You should see `{"ok":true,"service":"stripe-webhook"}`.

## Step 3: Put the keys in Vercel
Vercel → the project → **Settings → Environment Variables** → Production → tick **Sensitive**:

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | the `sk_test_…` key from step 1 |
| `STRIPE_WEBHOOK_SECRET` | the `whsec_…` secret from step 2 |

Then **Deployments → latest → ⋯ → Redeploy** (Vercel only reads new variables on a fresh deploy).

## Step 4: Test it
1. Open **thetropicalbakery.com/sweet-escape**: the form should now show **Card · Visa · Mastercard · Apple Pay · Google Pay** (pre-selected) and the button says **US$ 9**.
2. Order with your own e-mail, Card. On Stripe's page use the test card **4242 4242 4242 4242**, any future date, any 3 digits.
3. You land on the thank-you page and the **Download** button appears by itself. The order shows as paid in Admin → Caixa de Entrada (its line says "US$ 9 (Stripe)").
4. In Stripe (test mode) → Payments you'll see the fake payment.

## Step 5: Go live (real money)
1. Turn **Test mode OFF** in Stripe. Repeat step 1 (Live `sk_live_…` key) and step 2 (a **new** webhook endpoint in live mode: same URL and events, it has its **own** `whsec_…`).
2. In Vercel replace both values with the live ones. Redeploy.
3. Buy it once with a real card, then refund yourself in Stripe (Payments → the payment → Refund).

## Good to know
- **Fees:** Stripe takes a percentage plus a small fixed fee per sale (more for international cards and currency conversion). See the current rates in the dashboard; it's roughly 6% of a US$ 9 sale.
- **Refunds** (the 7-day promise) are done in Stripe. The site doesn't lock the download afterwards.
- **Nothing is charged until Stripe confirms.** The site never trusts the browser: it asks Stripe whether the payment is paid, in dollars, for US$ 9, before unlocking.
- **Boxes and events are unaffected.** Stripe is only wired into the e-book for now.

| Symptom | Likely cause |
|---|---|
| No Card · Apple Pay option on the English page | A key is missing, or you didn't redeploy |
| "The card page did not open" | Wrong or expired secret key, or the account isn't activated |
| Paid at Stripe but the book stays locked | Webhook URL or secret wrong (step 2); Vercel → Logs → `webhooks/stripe` |
| "bad signature" in the logs | Test secret used with live keys (or the reverse) |
