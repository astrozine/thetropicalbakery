/**
 * Which treats go into a Degustation Box of each size, as Dolly sells it:
 *
 *   - the box whose size fits the whole weekly list (usually 4) is "a completa": one of each, nothing to choose;
 *   - a smaller box (2) is all picks: the customer chooses their favourites from the weekly list;
 *   - a bigger box (6) is the complete one plus extra picks from the same list.
 *
 * A pick is a BoxItem id from tasting_boxes.items, and the same treat may be picked more than once
 * ("two brownies, please"). Shared by the order form (BoxOrder / BoxTreatPicker) and the server
 * (createOrder), which checks the picks against the box and writes the names into the order line.
 * Pure: no React, no server imports.
 */

export interface BoxPlan {
  /** Treats that are always in this box: the whole weekly list, one of each. */
  fixed: number;
  /** Treats the customer chooses on top (or instead). */
  picks: number;
}

/** A box with no treat list yet has nothing to choose, like before the picker existed. */
export function boxPlan(itemCount: number, size: number): BoxPlan {
  if (itemCount <= 0) return { fixed: 0, picks: 0 };
  const fixed = size >= itemCount ? itemCount : 0;
  return { fixed, picks: size - fixed };
}

/** How many treats a weekly box usually lists. Only for places that talk about sizes before a box exists (signup, homepage). */
export const USUAL_TREATS = 4;

/** "você escolhe 2" / "a completa" / "completa + 2" for a usual week. */
export const usualCaption = (size: number) => planCaption(boxPlan(USUAL_TREATS, size));
export const usualPicks = (size: number) => boxPlan(USUAL_TREATS, size).picks;

/** The short caption under each size card: "você escolhe 2", "a completa", "completa + 2". */
export function planCaption(plan: BoxPlan): string {
  if (plan.picks === 0) return 'a completa';
  if (plan.fixed === 0) return `você escolhe ${plan.picks}`;
  return `completa + ${plan.picks}`;
}

/**
 * "Brownie", "Brownie + Tartelete", "2× Brownie + Cookie". Keeps the order they were picked in.
 * Never a comma: an order's items_summary is split on commas into lines (the paid receipt does it).
 */
export function namesText(names: string[]): string {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n.replace(/,/g, ''), (counts.get(n.replace(/,/g, '')) ?? 0) + 1);
  return [...counts].map(([n, c]) => (c > 1 ? `${c}× ${n}` : n)).join(' + ');
}

/** What an order stores in orders.items for its boxes, so the kitchen can count treats (see admin ProductionTally). */
export interface BoxOrderItems {
  kind: 'caixa';
  boxes: { box_id: string; size: number; picks: string[]; qty: number }[];
}

/** The dice: "completa + 2 à escolha da Dolly". */
export function surpriseText(plan: BoxPlan): string {
  return `${plan.fixed > 0 ? 'completa + ' : ''}${plan.picks} à escolha da Dolly 🎲`;
}

/**
 * What follows the size in an order line: ": Brownie e Tartelete" or ": completa + 2× Brownie".
 * Nothing picked means the dice (or a cart from before the picker): ": 2 à escolha da Dolly 🎲". Empty for the complete box.
 */
export function picksSuffix(plan: BoxPlan, pickedNames: string[]): string {
  if (plan.picks === 0) return '';
  if (pickedNames.length === 0) return `: ${surpriseText(plan)}`;
  return `: ${plan.fixed > 0 ? 'completa + ' : ''}${namesText(pickedNames)}`;
}
