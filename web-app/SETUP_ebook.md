# Selling Sweet Escape: switching it on

**For Andrew.** The page is live at **/sweet-escape** and people can already order. Buyers only get the
book once you've done steps 1 and 2 (10 minutes, once).

## 1. Make the private shelf for the PDF (Supabase, 2 min)
Supabase → **SQL Editor** → paste all of `web-app/migration_34_ebook_storage.sql` → **Run**.
The result shows a bucket called `ebooks` with `public = false`.

## 2. Upload the book (3 min)
Supabase → **Storage** → `ebooks` → **Upload file** → pick
`The Tropical Bakery/e-books/sweet-escape.pdf` (the **38 MB** copy, not the 151 MB original).
The name must be exactly `sweet-escape.pdf`.

The small copy looks the same on screen (photos saved at print-for-screen quality). It was made because
Supabase refuses files over 50 MB and a 151 MB download fails on phones. If Dolly changes the book in Canva,
send me the new PDF and I'll make a new small copy, then upload it with the same name (tick "overwrite").

## 3. Test it (5 min)
Buy it yourself with Pix, then in **Admin → Caixa de Entrada** move the order to "Pagamento Confirmado".
Open the link in the e-mail: the **Download** button should give you the PDF. (With a card, it unlocks by
itself as soon as Mercado Pago approves.)

## How it works
- Price: **R$ 47**, set in `web-app/src/lib/ebook.ts` (`priceBRL`). The server reads it from there.
- Card (Mercado Pago) and PayPal unlock the download by themselves. **Pix is confirmed by hand**, like boxes:
  when Dolly moves the order past "Novo" in the inbox, the buyer's link starts working. The buyer already has
  the link by e-mail, so it's worth a WhatsApp nudge ("your book is ready!") if they gave a number.
- Each buyer gets a personal link (`/sweet-escape/thank-you?ref=…&k=…`). The `k` is a signature, so no one
  can guess someone else's link. The PDF itself is only ever handed out as a 10-minute signed link.
- **PayPal** is off until its keys are in Vercel (see `SETUP_payments.md`). Worth doing for this book: it's in
  English, so a lot of buyers will be outside Brazil.
- Refunds (the 7-day promise, which Brazilian law requires for online purchases anyway): refund in Mercado
  Pago / PayPal, or send the Pix back. The site doesn't lock the link afterwards; they already have the PDF.
