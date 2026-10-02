'use client';

import { useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase';
import { TREAT_TYPES, type TreatType } from '@/lib/treatTypes';

/**
 * The treat categories Dolly edits in /admin/treats (table treat_types, migration 37).
 *
 * Every helper in treatTypes.ts reads the one TREAT_TYPES list, so loading puts the database's categories into
 * that same list (in place) and tells the pages to re-render. Until it loads, or if the table is not there yet,
 * the built-in eight stay in use, so nothing on the site ever goes blank.
 */

export interface TreatTypeRow extends TreatType { sort_order: number }

let version = 0;
let loaded: Promise<boolean> | null = null;
/** False until migration 37 has run (the admin then explains why editing is not possible yet). */
let tableReady = false;
const listeners = new Set<() => void>();
const notify = () => { version++; listeners.forEach(l => l()); };

async function fetchTypes(): Promise<boolean> {
  const { data, error } = await supabase.from('treat_types').select('id, label, emoji, accent, hint, sort_order').order('sort_order').order('label');
  if (error) { tableReady = false; return false; }
  tableReady = true;
  const rows = (data || []) as TreatTypeRow[];
  TREAT_TYPES.splice(0, TREAT_TYPES.length, ...rows.map(r => ({ id: r.id, label: r.label, emoji: r.emoji || '🍫', accent: r.accent || '#8a7a6b', hint: r.hint || undefined })));
  notify();
  return true;
}

/** Load once per visit (call again with force after an edit). */
export function loadTreatTypes(force = false): Promise<boolean> {
  if (!loaded || force) loaded = fetchTypes().catch(() => false);
  return loaded;
}

export const treatTypesTableReady = () => tableReady;

/**
 * Use at the top of a page that groups or labels treats by category: it starts the load and re-renders the page
 * when the categories arrive or change. Returns a number that changes with them (handy as a key or effect dep).
 */
export function useTreatTypes(): number {
  return useSyncExternalStore(
    cb => { listeners.add(cb); void loadTreatTypes(); return () => listeners.delete(cb); },
    () => version,
    () => 0,
  );
}
