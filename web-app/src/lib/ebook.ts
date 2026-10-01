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
  /** Rough, for visitors who think in dollars. Card and PayPal charge in reais and convert for them. */
  priceUSDApprox: 9,
  pages: 72,
  language: 'English',
  /** Private Supabase Storage bucket and file (migration_34). Uploaded by hand, see SETUP_ebook.md. */
  bucket: 'ebooks',
  file: 'sweet-escape.pdf',
  downloadName: 'Sweet Escape - The Tropical Bakery.pdf',
  pagePath: '/sweet-escape',
  thanksPath: '/sweet-escape/thank-you',
} as const;

/** One store price for a treat, used only to show what a batch would cost if bought ready-made. */
export const BAKERY_TREAT_PRICE_BRL = 25;

export interface EbookRecipe {
  day: number;
  hex: string;
  /** Text color that reads on `hex`. */
  ink: string;
  /** The book's own title, in English in every language. Descriptions live in ebookCopy.ts. */
  name: string;
  makesCount: number;
  img: string;
}

const IMG = '/ebook/sweet-escape';

export const RECIPES: EbookRecipe[] = [
  { day: 1, hex: '#f7c600', ink: '#3b2a00', name: 'Sun-Kissed Coco-Pineapple Paradise Squares', makesCount: 8, img: `${IMG}/yellow.webp` },
  { day: 2, hex: '#ff7a1a', ink: '#3d1a00', name: 'Chai-Spiced Mango Muffins', makesCount: 9, img: `${IMG}/orange.webp` },
  { day: 3, hex: '#e8364f', ink: '#fff', name: 'Tangy Red Berry Bliss Balls', makesCount: 13, img: `${IMG}/red.webp` },
  { day: 4, hex: '#a33fc4', ink: '#fff', name: 'Purple Sweet Potato Longevity Cheesecake', makesCount: 9, img: `${IMG}/purple.webp` },
  { day: 5, hex: '#27b35a', ink: '#fff', name: 'Supergreen Laguna Nicecream Pistachio Tacos', makesCount: 7, img: `${IMG}/green.webp` },
  { day: 6, hex: '#c9853c', ink: '#2e1800', name: 'Peanutty Banoffee Bars', makesCount: 9, img: `${IMG}/caramel.webp` },
  { day: 7, hex: '#5a3421', ink: '#fff', name: 'Dark Cocoa Mousse Turtles', makesCount: 7, img: `${IMG}/chocolate.webp` },
];

/** Everything a single run through the book makes. */
export const TOTAL_TREATS = RECIPES.reduce((n, r) => n + r.makesCount, 0);
