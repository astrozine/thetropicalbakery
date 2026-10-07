# The free-recipes funnel: switching it on, and the ads that feed it

**For Andrew and Dolly.** The pages are live as soon as this is deployed. People can already sign up and get the
recipes. Three short steps make the rest work.

## 1. Switch it on (10 minutes, once)

1. **Supabase → SQL Editor** → paste all of `web-app/migration_43_free_recipes_funnel.sql` → **Run**.
   This adds the table that counts sign-ups (Admin › Funil de Receitas) and the e-mail rule (switched **off**).
   Order: any time after the deploy. Until you run it, people still get their recipes; we just can't count them.
2. **Test it yourself**: open `thetropicalbakery.com/receitas`, sign up with your own e-mail, choose "Ubatuba / Paraty".
   You should get the PDF e-mail, see the thank-you page with the book offer and the "what would you love most?" cards,
   and see yourself in **Admin › Divulgação › Funil de Receitas**.
3. **Admin › E-mails** → automations → turn on **"Receitas grátis: sequência de e-mails"** (sends at 10h, Brasília).
   That is the decision to start mailing people who download the recipes.

## 2. How it works (the map)

```
 Ad / post / bio link
        │
        ▼
 /receitas (PT) · /free-recipes (EN) · /free-recipes/es · /free-recipes/nl
   name + e-mail + "Where are you?"  (Ubatuba/Paraty · visiting soon · somewhere else)
   ☐ ORDER BUMP: add the full Sweet Escape, R$ 47 / US$ 9
        │  (PDF e-mailed at once)
        ▼
 Thank-you page /free-recipes/obrigado
   1. Download the 2 recipes
   2. Bought the bump? → book payment status + download
      Didn't?          → ONE-TIME OFFER: the full book, one tap, nothing to retype
   3. Around Ubatuba/Paraty → "What would you love most?"
        📦 taste the treats → Tasting Box (and the subscription under it)
        🥂 brunch with friends → Brunch Tropical
        👩‍🍳 learn with Dolly → courses
        🎉 treats for my event → Events Menu
      Everyone else → a line about Itamambuca (retreats)
   4. "Send these recipes to a friend" (WhatsApp share: free reach)
        │
        ▼
 E-mails (only people who haven't bought the book get the selling ones)
   day 1  3 tricks so the recipes work (no selling: builds trust)
   day 3  "The 5 colors you haven't tried": the book at R$ 47 / US$ 9
   day 5  DOWNSELL: welcome price R$ 27 / US$ 5, signed link, ends in 2 days
   day 7  last day of the welcome price
   day 9  locals only: box, subscription, brunch, courses, events menu
```

- **Prices** are in `src/lib/ebook.ts` (`BOOK_OFFERS`: `full` 47 / 9, `welcome` 27 / 5). Change them there, nowhere else.
- **The welcome price can't be faked**: the link carries a signed expiry date that the server checks before pricing.
  Passing the link to a friend is fine (it runs out).
- **Payments** are the same as the book's own page: Pix (confirm by hand in the inbox, like always), card, PayPal.
- **E-mails** are in English and Portuguese. Spanish and Dutch sign-ups get the page, the PDF and the first e-mail in
  their language, then the English sequence.
- **The PDFs** are in `public/free-recipes/` (public on purpose: it's a gift, sharing it is marketing).

## 3. The ads

**Always use a link with UTM tags** (Admin › Funil de Receitas has copy buttons). That's how the dashboard knows which ad
brings people who buy, not just people who click.

### Campaign A: local (Portuguese)
- **Where:** 40 km around Ubatuba + Paraty (add São Paulo city later for "visiting" people, i.e. weekenders).
- **Objective:** Leads / Conversions, optimised for the **Lead** event (the site sends it on every sign-up).
- **Budget to start:** R$ 20–30/day for 7 days, then keep the ad with the lowest cost per lead.
- **Link:** `thetropicalbakery.com/receitas?utm_source=meta&utm_campaign=receitas-pt&utm_content=<ad name>`

### Campaign B: international (English)
- **Where:** US, UK, Canada, Australia, Ireland (and Netherlands/Belgium with the Dutch page).
- **Audience:** broad, or interests: vegan baking, healthy desserts, plant-based recipes, sugar-free.
- **Link:** `thetropicalbakery.com/free-recipes?utm_source=meta&utm_campaign=recipes-en&utm_content=<ad name>`

### What to film (best first)
1. **Reel, 15–20 s:** Dolly's hands rolling the pink Bliss Balls in raspberry crumbs → close-up bite → text "2 recipes, free 👇".
2. **Reel:** a knife cutting the Banoffee Bars, showing the three layers. Text: "No oven. No refined sugar. Recipe free."
3. **Carousel:** cover of the free mini-book → the two recipes → a page of the recipe → "Get it free".
4. **Dolly to camera, 20 s:** "I'm Dolly, a Belgian chef on a beach in Brazil. I'll give you two of my favourite recipes…"

### Ad copy: Portuguese
> **1.** Doce sem forno, sem açúcar refinado e sem farinha, e todo mundo pede mais. 🍓
> Separei 2 receitas do meu livro Sweet Escape para você: Bliss Balls de Frutas Vermelhas e Barrinhas Banoffee de Amendoim.
> Grátis, em PDF, na hora. 👉 Toque em "Saiba mais".
> *Título:* 2 receitas grátis da Chef Dolly · *Botão:* Saiba mais / Baixar

> **2.** Paçoca + banoffee = a barrinha mais pedida da minha cozinha em Itamambuca. 🥜🍌
> Três camadas, zero forno, zero açúcar refinado. A receita é sua, de presente.
> *Título:* Receita grátis: Barrinhas Banoffee

> **3.** As crianças podem ajudar? Podem! 💕 As Bliss Balls de frutas vermelhas são a receita que os pequenos enrolam.
> Cereja, morango e tâmara. Baixe grátis.
> *Título:* Doce saudável que criança ama

### Ad copy: English
> **1.** Treats with no oven, no refined sugar and no flour, and everyone asks for seconds. 🍓
> I'm giving you 2 recipes from my book Sweet Escape: Red Berry Bliss Balls and Peanutty Banoffee Bars. Free PDF, instantly.
> *Headline:* 2 free recipes from Chef Dolly · *Button:* Download

> **2.** Brazilian paçoca meets British banoffee. 🥜🍌 Three layers, no oven, just peanuts, banana, cashew and dates.
> The recipe is yours, free.
> *Headline:* Free recipe: Peanutty Banoffee Bars

> **3.** From a jungle kitchen on a Brazilian beach to yours: two plant-based treats that taste like a holiday. 🌴
> *Headline:* Your sweet escape, free

### Organic posts (free reach)
- **Instagram bio:** "🍓 2 receitas grátis ↓" + `thetropicalbakery.com/receitas?utm_source=instagram&utm_campaign=bio`
- **Story:** poll "Você faria doce sem forno?" → next story: link sticker "Receitas grátis".
- **Caption trick:** "Comenta RECEITA que eu te mando o link". Reply to each comment with the link.
  Comments push the post, and every reply is a conversation.
- **Ask for photos:** the PDF and the day-1 e-mail ask people to tag @_thetropicalbakery_. Repost them; that's your
  best social proof for the next ads.

## 4. Benchmarks: what "working" looks like

| Step | Healthy | If it's lower |
|---|---|---|
| Visitors who sign up | 30–50% | The ad promises something the page doesn't show: match the photo and words |
| Order bump ticked | 5–15% | Try the bump at a lower price, or a stronger title |
| Thank-you offer bought | 3–8% of the rest | Fine: the e-mails catch the others |
| Book bought by day 7 (all doors) | 5–10% of sign-ups | Look at the day-3 and day-5 e-mail open rates in Resend |
| Locals who pick an interest | 40%+ | |

If the cost per sign-up is under ~R$ 3 and about 1 in 15 buys the book, the ads pay for themselves before counting a
single box, brunch or course from the locals.

## 5. Ideas that need your yes (not built, on purpose)

These are promises the kitchen has to keep, so they need you to decide:
- **"Taste-test" bonus for locals:** first Tasting Box ordered within 7 days of the download comes with an extra Red Berry
  Bliss Ball, the recipe they just got. Turns "I'll bake it someday" into "I'll taste it this Friday".
- **A short "make the 2 recipes with Dolly" class** (1 hour, small group, R$ 60–90): the obvious next step for people who
  picked 👩‍🍳 courses but aren't ready for a full course.
- **Banoffee Bar tray on the Events Menu**, named after the free recipe ("the one from the free recipes").
- **Retargeting ads:** a Meta custom audience of sign-ups who didn't buy, shown the welcome price or the box. Ask and
  we'll set it up.
