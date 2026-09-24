# Turning on card and PayPal payments — step by step

**For Andrew.** The code is already on the site. Until you finish these steps, customers only see **Pix**, exactly as today. Each method switches itself on the moment its keys are in Vercel — you can do Mercado Pago first, PayPal later, or the other way round.

**What customers will see:** a "Como você quer pagar?" choice — ⚡ Pix, 💳 Cartão de crédito (up to 6x), 🅿️ PayPal. Card and PayPal orders confirm **by themselves** (the order moves to "Pagamento Confirmado" in your Caixa de Entrada). Pix is still confirmed by hand by Dolly.

> 🔐 **Golden rule:** keys and secrets go ONLY into Vercel and Supabase settings screens. Never paste them into WhatsApp, e-mail, a chat with me or Gemini, or a file. If one leaks, generate a new one (every step below says where).

Fees change, so look at the current rates in each account. Roughly: Mercado Pago cards are around 4–5% per sale, PayPal about 4–5% plus a small fixed fee (more for foreign cards). Pix has no fee.

---

## Step 0 — One-time setup in Supabase (5 minutes)

1. Supabase → **SQL Editor** → paste the whole of `web-app/migration_18_card_payments.sql` → **Run**. (It adds three small columns to orders: how it was paid, the payment number, and when.)
2. Supabase → **Project Settings → API Keys**. Find the key called **`service_role`** (newer screens call it the **secret** key — NOT the `anon`/`publishable` one). Click reveal → copy it. You'll paste it into Vercel in the next steps as `SUPABASE_SERVICE_ROLE_KEY`.
   - This key is powerful. It is used only by the payment confirmation code on the server, to mark an order paid. It never reaches the visitor's browser.

---

## PART A — Mercado Pago (cards, up to 6x)

### A1. Create and verify the account
1. Go to **mercadopago.com.br** → **Criar conta**. Use the CPF/CNPJ of the person or company that should *receive the money*.
2. Finish the identity check (photo of the ID + a selfie) and add your business details (what you sell: bakery / food, website `thetropicalbakery.com`). Payments to you stay blocked until this is approved — it can take a day or two.
3. In the Mercado Pago app/website, set where the money goes: **Seu negócio → Custos / Receber dinheiro** (names move around). Choose how fast you receive the money (instantly for a bigger fee, or later for a smaller fee) and add your bank account so you can withdraw.

### A2. Create the "application" (this is what gives you the keys)
1. Go to **mercadopago.com.br/developers** and log in with the same account.
2. **Suas integrações → Criar aplicação**.
   - Name: `Tropical Bakery Site`
   - Product to integrate: **Checkout Pro**
   - Online store? **Yes** · Using an e-commerce platform? **No** (we built our own site)
3. Open the new application → **Credenciais**.
   - There are **Test credentials** and **Production credentials**. Production only unlocks after Mercado Pago approves your account (A1) and you fill in the business info it asks for. You can do steps A3–A5 with the test set first.
   - Copy the **Access Token** (it starts with `TEST-` for test, `APP_USR-` for production). Do **not** copy the "Public Key" — we don't need it.

### A3. Tell Mercado Pago where to report payments (webhook)
1. In the same application → **Webhooks** (or **Notificações**) → **Configurar notificações**.
2. Set **Production** mode URL to exactly:
   `https://thetropicalbakery.com/api/webhooks/mercadopago`
3. Under events, tick **Pagamentos** (Payments). Save.
4. Mercado Pago now shows a **Chave secreta / Secret signature**. Copy it.
   - (Sanity check: open that URL in your browser. You should see `{"ok":true,"service":"mercadopago-webhook"}`.)

### A4. Put the keys in Vercel
1. **vercel.com** → your project → **Settings → Environment Variables**.
2. Add these (Environment: **Production**, and tick **Sensitive** if offered):

| Name | Value |
|---|---|
| `MERCADOPAGO_ACCESS_TOKEN` | the Access Token from A2 |
| `MERCADOPAGO_WEBHOOK_SECRET` | the secret signature from A3 |
| `SUPABASE_SERVICE_ROLE_KEY` | the key from Step 0 |

3. **Deployments → the latest one → ⋯ → Redeploy.** (Vercel only reads new variables on a fresh deploy.)
4. Open the site, add something to the cart, go to checkout: the **Cartão de crédito** choice should now appear. If it doesn't, one of the three variables is missing or you haven't redeployed.

### A5. Test it
**Easiest, most honest test:** make a real purchase of your cheapest item with your own card, watch it flip to "Pagamento Confirmado" in the Caixa de Entrada, then **refund it** in the Mercado Pago app (Atividades → the sale → Devolver dinheiro). Refunds of your own test are free.

**Fake-money test (optional):** use the *Test credentials* in A4 instead, then follow Mercado Pago's own pages: developers → **Contas de teste** (a fake seller and fake buyer) and **Cartões de teste** (fake card numbers). When you're done, swap in the Production token and redeploy.

---

## PART B — PayPal

### B1. Create the account
1. **paypal.com/br** → **Abrir conta → Conta Profissional** (Business). Use CNPJ or your CPF as an individual professional.
2. Confirm your e-mail, link your bank account, and finish the identity check. Keep the account able to **receive in Brazilian reais (BRL)** — that is the default for a Brazilian account. Customers with a foreign card or PayPal balance can still pay; PayPal converts for them.

### B2. Get the keys
1. Go to **developer.paypal.com** → log in with the business account → **Apps & Credentials**.
2. At the top there is a switch: **Sandbox** (fake money) and **Live** (real money). Start on **Sandbox**.
3. **Create App** → name `Tropical Bakery Site` → type **Merchant** → Create.
4. Copy the **Client ID**, and click **Show** to copy the **Secret**.

### B3. Put them in Vercel
Same place as A4 (Settings → Environment Variables):

| Name | Value |
|---|---|
| `PAYPAL_CLIENT_ID` | the Client ID |
| `PAYPAL_CLIENT_SECRET` | the Secret |
| `PAYPAL_ENV` | `sandbox` for now (later: `live`) |
| `SUPABASE_SERVICE_ROLE_KEY` | (already added if you did Part A) |

Then **Redeploy** again. The **PayPal** choice appears at checkout.

### B4. Test in Sandbox
1. On developer.paypal.com → **Sandbox → Accounts** you'll see a fake **Personal** (buyer) account. Click ⋯ → **View/Edit** to see its e-mail and password.
2. Check out on the site choosing PayPal; when PayPal opens, log in with that fake buyer. The order should come back as "Pagamento confirmado" and show in the Caixa de Entrada.

### B5. Go live
1. developer.paypal.com → switch the toggle to **Live** → create the app the same way → copy the **Live** Client ID and Secret.
2. In Vercel replace `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` with the Live ones and set `PAYPAL_ENV` = `live`. Redeploy.
3. Do a real small purchase and refund it from PayPal (Atividade → the payment → Reembolsar).

PayPal needs no webhook: the site takes the money when the customer returns from PayPal.

---

## How you (and Dolly) will know an order was paid
- **Card / PayPal:** the order jumps to **Pagamento Confirmado 💰** in the Caixa de Entrada by itself. Pickup customers get their address unlocked in Minha Conta at that moment.
- **Pix:** unchanged — Dolly checks the bank and taps the status badge.
- In Supabase, the `orders` table now shows `payment_provider`, `payment_id` and `paid_at`.

## Good to know
- **Refunds** are done inside Mercado Pago / PayPal. They do not (yet) change the order on the site — move the status by hand if needed.
- **If a customer's payment is still pending** (some banks take minutes), their return page says so, and the order confirms itself when the bank approves.
- **If a customer closes the window mid-payment**, the order stays "Novo Pedido" and nothing is charged. You can WhatsApp them.
- **Order amounts** are calculated in the shopper's browser, the same as with Pix. The payment page charges exactly what the order says, so glance at the total before preparing an order. (Hardening this is a good future task.)
- **No receipt e-mail yet** for card/PayPal orders — the payment companies send their own.

## Something's wrong?
| Symptom | Likely cause |
|---|---|
| No "Cartão"/"PayPal" choice at checkout | A variable is missing (also `SUPABASE_SERVICE_ROLE_KEY`) or you didn't redeploy |
| "O Mercado Pago não aceitou o pedido" | Wrong or expired Access Token, or your MP account isn't approved yet |
| Paid, but the order stays "Novo Pedido" | Webhook URL or secret wrong (A3). Vercel → Logs → look for `webhook/mercadopago` |
| Return page says "Não encontramos este pedido" | The order didn't save — check migration 17/18 ran |
| PayPal "não aceitou o pedido" | `PAYPAL_ENV` doesn't match the keys (sandbox keys need `sandbox`, live keys need `live`) |

If a key leaked: Mercado Pago → application → Credenciais → renew; PayPal → app → Secret → Generate new; Supabase → API Keys → roll the secret key. Then update Vercel and redeploy.
