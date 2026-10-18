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
  /** What Stripe charges in dollars (everyone abroad but Europe). Card and PayPal still charge priceBRL and convert. */
  priceUSD: 9,
  /** What Stripe charges in euros (Dutch, Italian, French and German readers; Spanish readers pay in dollars). */
  priceEUR: 9,
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
  full: { brl: EBOOK.priceBRL, usd: EBOOK.priceUSD, eur: EBOOK.priceEUR },
  welcome: { brl: 27, usd: 5, eur: 5 },
} as const;

/** The two currencies Stripe charges the book in. */
export type StripeCurrency = 'usd' | 'eur';
/** The payMethod the browser sends for Stripe in euros ('stripe' alone is dollars). */
export const STRIPE_EUR = 'stripe-eur';
export type BookOffer = keyof typeof BOOK_OFFERS;

/** What Stripe should have charged in dollars for an order stored at this BRL total (every offer has its own pair). */
export const usdForBRL = (totalBRL: number): number => stripeAmountFor(totalBRL, 'usd');

/** What Stripe should have charged, in dollars or euros, for an order stored at this BRL total. */
export const stripeAmountFor = (totalBRL: number, currency: StripeCurrency): number => {
  const offer = Object.values(BOOK_OFFERS).find(o => Math.abs(o.brl - totalBRL) < 0.01) ?? BOOK_OFFERS.full;
  return offer[currency];
};

/** How a Stripe charge reads to a person: US$ 9, € 9. */
export const stripeMoney = (amount: number | string, currency: StripeCurrency) => (currency === 'eur' ? `€ ${amount}` : `US$ ${amount}`);

/**
 * One PDF per language in the private bucket. The book a buyer gets is the language they chose; any other language
 * gets the English one. Upload each by hand (SETUP_ebook.md); a missing file falls back to English.
 */
export const BOOK_FILES = {
  en: 'sweet-escape-en.pdf',
  pt: 'sweet-escape-pt-br.pdf',
  es: 'sweet-escape-es.pdf',
  nl: 'sweet-escape-nl.pdf',
  de: 'sweet-escape-de.pdf',
} as const;
export type BookLang = keyof typeof BOOK_FILES;
export const isBookLang = (v: unknown): v is BookLang => typeof v === 'string' && v in BOOK_FILES;
export const downloadName = (lang: BookLang) => `Sweet Escape - The Tropical Bakery (${lang}).pdf`;

/** Rough exchange rates, only for showing what the bakery's treats cost abroad (never used to charge anything). */
export const BRL_PER_USD = 5.2;
export const BRL_PER_EUR = 6.1;

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

/**
 * The Amazon editions (KDP): Kindle, paperback and hardcover. The PDF from the site stays the main offer; the sales
 * page shows these as a quiet "also on Amazon" row under the order card.
 *
 * Two editions are live (published 12-14 Oct 2026): English and Portuguese, each with its own product IDs (ASINs).
 * An ASIN is the same on every Amazon store, so each page sends its readers to the store that ships to them:
 * Germany and the Netherlands to their own Amazon (KDP prints there), Spanish readers (mostly Argentina) to
 * amazon.com, Brazil to amazon.com.br for Kindle and amazon.com for print (KDP doesn't print in Brazil).
 * `edition` is the language of the Amazon book; when it isn't the page's language, the row says so and shows that
 * cover. When a Spanish, Dutch or German KDP edition goes live, add its ASINs and point that page at it.
 */
export type AmazonFormat = 'kindle' | 'paperback' | 'hardcover';
export const AMAZON_FORMATS: AmazonFormat[] = ['kindle', 'paperback', 'hardcover'];

const AMAZON_ASINS: Partial<Record<BookLang, Record<AmazonFormat, string>>> = {
  en: { kindle: 'B0HMZ9ZQT8', paperback: 'B0HMZSHMFB', hardcover: 'B0HMZRBBCM' },
  pt: { kindle: 'B0HMZ7TC25', paperback: 'B0HN2KQZNS', hardcover: 'B0HN2GZFF7' },
};

type AmazonEdition = { edition: BookLang; store: string; storeFor?: Partial<Record<AmazonFormat, string>> };
export const AMAZON_EDITIONS: Partial<Record<BookLang, AmazonEdition>> = {
  en: { edition: 'en', store: 'amazon.com' },
  pt: { edition: 'pt', store: 'amazon.com.br', storeFor: { paperback: 'amazon.com', hardcover: 'amazon.com' } },
  es: { edition: 'en', store: 'amazon.com' },
  nl: { edition: 'en', store: 'amazon.nl' },
  de: { edition: 'en', store: 'amazon.de' },
};

/** List prices on amazon.com (USD), as seen 18 Oct 2026. Shown only where the button goes to amazon.com; other stores
 * price in their own currency, so their cards just say "on Amazon". Update when the KDP prices change. */
const AMAZON_USD: Partial<Record<BookLang, Record<AmazonFormat, number>>> = {
  en: { kindle: 8.99, paperback: 22.99, hardcover: 32.99 },
  pt: { kindle: 8.00, paperback: 22.99, hardcover: 32.99 },
};

export const amazonPrice = (lang: BookLang, format: AmazonFormat): string | null => {
  const ed = AMAZON_EDITIONS[lang];
  const usd = ed && AMAZON_USD[ed.edition]?.[format];
  return usd && (ed.storeFor?.[format] ?? ed.store) === 'amazon.com' ? `US$ ${usd.toFixed(2)}` : null;
};

/** The product page of a format, on the store that ships to that page's readers. */
export const amazonLink = (lang: BookLang, format: AmazonFormat): string | null => {
  const ed = AMAZON_EDITIONS[lang];
  const asin = ed && AMAZON_ASINS[ed.edition]?.[format];
  return asin ? `https://www.${ed.storeFor?.[format] ?? ed.store}/dp/${asin}` : null;
};
