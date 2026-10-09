/**
 * Sweet Escape, Dolly's e-book: every fact the sales page, the server and the e-mails share.
 *
 * Pure data (no server imports) so the landing page can read it too. The PRICE is read by the
 * server from here when it creates the order, never from the browser. Change it here and nowhere else.
 */

export const EBOOK = {
  id: 'sweet-escape',
  title: 'Sweet Escape',
  /** What the order line, the inbox and the receipts call it. No commas (items_summary is split on them). */
  lineName: 'E-book Sweet Escape (PDF)',
  author: 'Dolly',
  priceBRL: 47,
  /** What English readers see. We still CHARGE priceBRL (card and PayPal convert for them), so keep this near priceBRL / BRL_PER_USD. */
  priceUSD: 9,
  pages: 80,
  /** Private Supabase Storage bucket and file (migration_34). Uploaded by hand, see SETUP_ebook.md. */
  bucket: 'ebooks',
  pagePath: '/sweet-escape',
  thanksPath: '/sweet-escape/thank-you',
} as const;

/**
 * The prices the book can be sold at. `full` everywhere (sales page, the order bump and the offer on the free-recipes
 * thank-you page); `welcome` only with a signed, expiring link from the free-recipes e-mails (the downsell,
 * lib/payments/ebook.ts offerToken). The server picks the row; the browser only shows it.
 */
export const BOOK_OFFERS = {
  full: { brl: EBOOK.priceBRL, usd: EBOOK.priceUSD },
  welcome: { brl: 27, usd: 5 },
} as const;
export type BookOffer = keyof typeof BOOK_OFFERS;

/** What Stripe should have charged in dollars for an order stored at this BRL total (every offer has its own pair). */
export const usdForBRL = (totalBRL: number): number =>
  Object.values(BOOK_OFFERS).find(o => Math.abs(o.brl - totalBRL) < 0.01)?.usd ?? EBOOK.priceUSD;

/**
 * One PDF per language in the private bucket. The book a buyer gets is the language they chose; any other language
 * gets the English one. Upload each by hand (SETUP_ebook.md); a missing file falls back to English.
 */
export const BOOK_FILES = {
  en: 'sweet-escape-en.pdf',
  pt: 'sweet-escape-pt-br.pdf',
  es: 'sweet-escape-es.pdf',
  nl: 'sweet-escape-nl.pdf',
} as const;
export type BookLang = keyof typeof BOOK_FILES;
export const isBookLang = (v: unknown): v is BookLang => typeof v === 'string' && v in BOOK_FILES;
export const downloadName = (lang: BookLang) => `Sweet Escape - The Tropical Bakery (${lang}).pdf`;

/** Rough exchange rate, only for showing dollar amounts to English readers (never used to charge anything). */
export const BRL_PER_USD = 5.2;

/** One store price for a treat, used only to show what a batch would cost if bought ready-made. */
export const BAKERY_TREAT_PRICE_BRL = 25;

export interface EbookRecipe {
  day: number;
  hex: string;
  /** Text color that reads on `hex`. */
  ink: string;
  makesCount: number;
  img: string;
}

const IMG = '/ebook/sweet-escape';

export const RECIPES: EbookRecipe[] = [
  { day: 1, hex: '#f7c600', ink: '#3b2a00', makesCount: 8, img: `${IMG}/yellow.webp` },
  { day: 2, hex: '#ff7a1a', ink: '#3d1a00', makesCount: 9, img: `${IMG}/orange.webp` },
  { day: 3, hex: '#e8364f', ink: '#fff', makesCount: 13, img: `${IMG}/red.webp` },
  { day: 4, hex: '#a33fc4', ink: '#fff', makesCount: 9, img: `${IMG}/purple.webp` },
  { day: 5, hex: '#27b35a', ink: '#fff', makesCount: 7, img: `${IMG}/green.webp` },
  { day: 6, hex: '#c9853c', ink: '#2e1800', makesCount: 9, img: `${IMG}/caramel.webp` },
  { day: 7, hex: '#5a3421', ink: '#fff', makesCount: 7, img: `${IMG}/chocolate.webp` },
];

/** Everything a single run through the book makes. */
export const TOTAL_TREATS = RECIPES.reduce((n, r) => n + r.makesCount, 0);
