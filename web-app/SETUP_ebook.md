# Selling Sweet Escape: switching it on

**For Andrew.** The page is live at **/sweet-escape** and people can already order. Buyers only get the
book once you've done steps 1 and 2 (10 minutes, once).

## 1. Make the private shelf for the PDF (Supabase, 2 min)
Supabase → **SQL Editor** → paste all of `web-app/migration_34_ebook_storage.sql` → **Run**.
The result shows a bucket called `ebooks` with `public = false`.

## 2. Upload the four books (5 min)
Supabase → **Storage** → `ebooks` → **Upload file** → pick all four from `The Tropical Bakery/e-books/`:

| File | Language | Who gets it |
|---|---|---|
| `sweet-escape-en.pdf` | English | English readers, and everyone whose language has no edition |
| `sweet-escape-pt-br.pdf` | Português (Brasil) | buyers who pick Português |
| `sweet-escape-es.pdf` | Español | buyers who pick Español |
| `sweet-escape-nl.pdf` | Nederlands | buyers who pick Nederlands |

The names must match exactly. Each is about 41 MB (Supabase refuses files over 50 MB). If a language's file is
missing, its buyers get the English book instead of an error. To change a book later, upload the new PDF with the
same name (tick "overwrite"). Don't use `EBOOK SWEET ESCAPE.pdf` (151 MB) or the old `sweet-escape.pdf`.

## 3. Test it (5 min)
Buy it yourself with Pix, then in **Admin → Caixa de Entrada** move the order to "Pagamento Confirmado".
Open the link in the e-mail: the **Download** button should give you the PDF. (With a card, it unlocks by
itself as soon as Mercado Pago approves.)

## How it works
- Languages: the sales page and the book exist in English, Português, Español and Nederlands (`src/lib/ebookCopy.ts`, `BOOK_FILES` in `src/lib/ebook.ts`). The buyer picks the book language on the form (their own is pre-selected); the order remembers it, and the download and e-mails use it.
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
