# Setting up e-mail sending (Resend) and SMS text

Two separate things live in here:

1. **Resend** — so e-mail login actually works for real customers.
2. **Portuguese templates** — so the e-mails and texts customers receive are in
   Portuguese and look like The Tropical Bakery, not like a default English test
   message.

You only need to do this once.

---

## Part 1 — Resend (e-mail sending)

### Why

Supabase's built-in e-mail sender is capped at a couple of messages **per hour**
and is explicitly not meant for real customers. E-mail login works today, but it
would quietly start failing as soon as a few people used it at once. Resend is
free for 3,000 e-mails a month, which is far more than this site will send.

### Step A — Add the domain to Resend

1. Go to **resend.com** and sign up (the free plan is fine).
2. **Domains → Add Domain** → enter `thetropicalbakery.com`.
3. Resend shows you **3 DNS records** to add.

### Step B — Add those records in GoDaddy

GoDaddy → your domain → **DNS → Manage Zones → Add Record**.

⚠️ **The one thing that trips everybody up:** GoDaddy automatically adds
`.thetropicalbakery.com` to the end of whatever you type in the Name field. So
if Resend tells you the name is:

```
resend._domainkey.thetropicalbakery.com
```

you type **only** this into GoDaddy:

```
resend._domainkey
```

If you paste the full thing you'll end up with
`resend._domainkey.thetropicalbakery.com.thetropicalbakery.com`, Resend will
never verify, and nothing will explain why.

Copy the **Value** field exactly as Resend gives it — it's long, don't retype it.

### Step C — Verify

Back in Resend, click **Verify**. It's usually a few minutes; it can take up to
an hour. Green ticks mean done.

### Step D — Create an API key

Resend → **API Keys → Create API Key**.

- Name: `Supabase`
- Permission: **Sending access**

It starts with `re_`. **Copy it now — Resend only shows it once.**

### Step E — Point Supabase at Resend

Supabase → **Project Settings → Authentication → SMTP Settings** →
turn on **Enable Custom SMTP**:

| Field | Value |
|---|---|
| Sender email | `nao-responda@thetropicalbakery.com` |
| Sender name | `The Tropical Bakery` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the `re_...` key from Step D |

Then **Save**.

> **Why `nao-responda@` and not `ola@`:** you don't have a mailbox on this
> domain, so if a customer hit Reply it would bounce into nowhere. The templates
> below point people to WhatsApp instead, which is how you actually talk to
> customers anyway.

### Step F — Raise the sending limit

Supabase → **Authentication → Rate Limits** → find
**"Rate limit for sending emails"** and raise it from `2` per hour to something
like `100`. This stays at the old limit even after you connect Resend, so it's
easy to miss.

### Step G — Test it

Open the site, go to checkout, choose **E-mail**, enter your own address. The
e-mail should arrive within seconds, from The Tropical Bakery, in Portuguese.

---

## Part 2 — Portuguese e-mail templates

Supabase → **Authentication → Emails → Templates**.

You need to change **two** of them, and the reason is subtle: Supabase sends
**"Confirm signup"** to someone logging in for the very first time, and
**"Magic Link"** to everyone after that. If you only translate one, half your
customers get an English e-mail.

### Template: "Magic Link"

**Subject:**

```
Seu acesso à The Tropical Bakery
```

**Body (switch the editor to HTML and paste this):**

```html
<div style="background:#fdfaf3;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e8e1d7;border-radius:16px;padding:32px 28px;text-align:center;">
    <img src="https://thetropicalbakery.com/logo-gold.webp" alt="The Tropical Bakery" width="110" style="display:block;margin:0 auto 20px;">
    <h1 style="color:#3c2a21;font-size:22px;margin:0 0 12px;">Bem-vindo de volta!</h1>
    <p style="color:#594a42;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Clique no botão abaixo para entrar na sua conta. Seus dados de entrega já
      estarão preenchidos.
    </p>
    <a href="{{ .ConfirmationURL }}"
       style="display:inline-block;background:#d4af37;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:8px;">
      Entrar na minha conta
    </a>
    <p style="color:#a89a90;font-size:12px;line-height:1.6;margin:24px 0 0;">
      Este link funciona uma única vez e expira em 1 hora.<br>
      Se você não pediu este acesso, pode ignorar este e-mail.
    </p>
    <p style="color:#a89a90;font-size:12px;margin:16px 0 0;">
      Dúvidas? Fale com a gente no
      <a href="https://wa.me/5511932119196" style="color:#d4af37;">WhatsApp</a>.
    </p>
  </div>
</div>
```

### Template: "Confirm signup"

**Subject:**

```
Confirme seu e-mail — The Tropical Bakery
```

**Body:** the same HTML as above, with two changes:

- `Bem-vindo de volta!` → `Bem-vindo à The Tropical Bakery!`
- `Entrar na minha conta` → `Confirmar meu e-mail`

---

## Part 3 — The SMS text (for phone login)

This one applies once you switch on phone login.

Supabase → **Authentication → Providers → Phone** → **SMS Message template**:

```
The Tropical Bakery: seu codigo de acesso e {{ .Code }}
```

Keep it short and without accents. Messages with accented characters get sent as
unicode, which halves how much fits in one text and can cost you double per
message.
