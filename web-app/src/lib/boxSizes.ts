/** Degustation box sizes and prices as Dolly quotes them, shared by the homepage and the WhatsApp order flow. */

export interface BoxSize {
  pieces: number;
  price: number;
}

export const BOX_SIZES: BoxSize[] = [
  { pieces: 2, price: 59 },
  { pieces: 4, price: 99 },
  { pieces: 6, price: 129 },
];

/** Individual pieces (peças avulsas), per unit. */
export const SINGLE_PIECE_FROM = 25;
