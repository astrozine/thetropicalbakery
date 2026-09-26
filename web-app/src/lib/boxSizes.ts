import type { SupabaseClient } from '@supabase/supabase-js';

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

/*
 * The same three sizes are sold on /caixas, at checkout and in every subscription plan. There the
 * prices come from site_settings (box_price_2 / _4 / _6, see migration_24_box_sizes_and_names.sql), so
 * Dolly changes them in /admin/caixas without a deploy. BOX_SIZES above is only the fallback for when
 * the migration has not run yet.
 */
export const TREAT_COUNTS = [2, 4, 6] as const;
export type TreatCount = typeof TREAT_COUNTS[number];
export type BoxSizePrices = Record<TreatCount, number>;

export const DEFAULT_TREAT_COUNT: TreatCount = 4;
export const DEFAULT_BOX_PRICES: BoxSizePrices = Object.fromEntries(BOX_SIZES.map(s => [s.pieces, s.price])) as BoxSizePrices;

export const SIZE_KEYS: Record<TreatCount, string> = { 2: 'box_price_2', 4: 'box_price_4', 6: 'box_price_6' };

export const isTreatCount = (n: unknown): n is TreatCount => TREAT_COUNTS.includes(Number(n) as TreatCount);
export const toTreatCount = (n: unknown): TreatCount => (isTreatCount(n) ? (Number(n) as TreatCount) : DEFAULT_TREAT_COUNT);

/** "4 doces" */
export const sizeText = (size: number) => `${size} ${size === 1 ? 'doce' : 'doces'}`;

/** Reads the three prices (works with the public client and with the server's service-role client). */
export async function fetchBoxSizePrices(db: SupabaseClient): Promise<{ prices: BoxSizePrices; fromDb: boolean }> {
  const prices = { ...DEFAULT_BOX_PRICES };
  const { data, error } = await db.from('site_settings').select('key, value').in('key', Object.values(SIZE_KEYS));
  if (error || !data || data.length === 0) return { prices, fromDb: false };
  for (const size of TREAT_COUNTS) {
    const v = Number(data.find(r => r.key === SIZE_KEYS[size])?.value);
    if (v > 0) prices[size] = v;
  }
  return { prices, fromDb: data.length === TREAT_COUNTS.length };
}

/**
 * What one box of this size costs in a plan. The plan's discount is the same for every size: a plan
 * that sells the R$99 box for R$89 takes the same ~10% off the small and the big box. The undiscounted
 * base is the most expensive plan's per-box price (the monthly plan). Rounded to whole reais.
 * create_subscription (migration 24) does the same sum in SQL; keep the two in step.
 */
export function planBoxPrice(planPricePerBox: number, basePricePerBox: number, sizePrice: number): number {
  if (!(basePricePerBox > 0)) return Math.round(sizePrice);
  return Math.round((sizePrice * planPricePerBox) / basePricePerBox);
}
