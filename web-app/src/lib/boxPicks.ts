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

/** The short caption under each size card: "você escolhe 2", "a completa", "completa + 2". */
export function planCaption(plan: BoxPlan): string {
  if (plan.picks === 0) return 'a completa';
  if (plan.fixed === 0) return `você escolhe ${plan.picks}`;
  return `completa + ${plan.picks}`;
}

/** "Brownie", "Brownie e Tartelete", "2× Brownie, Tartelete e Cookie". Keeps the order they were picked in. */
export function namesText(names: string[]): string {
  const counts = new Map<string, number>();
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1);
  const parts = [...counts].map(([n, c]) => (c > 1 ? `${c}× ${n}` : n));
  return parts.length <= 1 ? parts.join('') : `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
}

/** What follows the size in an order line: ": Brownie e Tartelete" or ": completa + 2× Brownie". Empty for the complete box. */
export function picksSuffix(plan: BoxPlan, pickedNames: string[]): string {
  if (plan.picks === 0 || pickedNames.length === 0) return '';
  return `: ${plan.fixed > 0 ? 'completa + ' : ''}${namesText(pickedNames)}`;
}
