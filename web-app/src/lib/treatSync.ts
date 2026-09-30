import { supabase } from '@/lib/supabase';
import { BoxItem, TreatDetails } from '@/lib/allergens';

/**
 * A treat can live in the Menu de Eventos AND inside Degustation Boxes. The
 * details that matter for safety (ingredients, allergens) must never disagree
 * between the two, so any edit is pushed to every place the treat appears.
 *
 * Price and batch sizes are menu-only and are never touched here.
 */
export async function pushTreatDetails(treatId: string, d: TreatDetails): Promise<{ error?: string }> {
  const base = {
    name: d.name, description: d.description, image_url: d.image_url,
    emoji: d.emoji, ingredients: d.ingredients, contains: d.contains, may_contain: d.may_contain,
  };
  let row: Record<string, unknown> = { ...base, sugars: d.sugars ?? null, caffeine: d.caffeine ?? null };
  let { error: treatError } = await supabase.from('treats').update(row).eq('id', treatId);
  // A column a migration hasn't added yet (sugars: 33): save the rest (the boxes keep it in their JSON).
  for (let tries = 0; treatError && tries < 2; tries++) {
    const next = withoutMissingColumn(row, treatError.message, ['sugars', 'caffeine']);
    if (!next) break;
    row = next;
    ({ error: treatError } = await supabase.from('treats').update(row).eq('id', treatId));
  }
  if (treatError) return { error: treatError.message };

  return syncTreatIntoBoxes(treatId, d);
}

/**
 * When Supabase says one of `optional` isn't a column yet (a migration not run), the same row without it;
 * otherwise null. It names one missing column per error, so callers try again until it stops.
 */
export function withoutMissingColumn(row: Record<string, unknown>, msg: string, optional: string[]) {
  const col = optional.find(c => c in row && new RegExp(`\\b${c}\\b`).test(msg));
  if (!col) return null;
  const rest = { ...row };
  delete rest[col];
  return rest;
}

/** Rewrites the copy of this treat inside every box that includes it. */
export async function syncTreatIntoBoxes(treatId: string, d: TreatDetails): Promise<{ error?: string }> {
  const { data: boxes, error } = await supabase.from('tasting_boxes').select('id, items');
  if (error) return { error: error.message };

  for (const box of boxes || []) {
    const items = (box.items || []) as BoxItem[];
    if (!items.some(i => i.treat_id === treatId)) continue;
    const next = items.map(i => (i.treat_id === treatId ? { ...i, ...d } : i));
    await supabase.from('tasting_boxes').update({ items: next }).eq('id', box.id);
  }
  return {};
}
