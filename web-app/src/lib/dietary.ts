/**
 * Everything a customer can tell us about how they eat.
 *
 * Three layers, on purpose:
 *   1. DIET_TAGS group 'jeito'  — how they choose to eat (vegano, crudívoro…).
 *   2. DIET_TAGS group 'saude'  — what they avoid for their health, and why
 *                                 (diabetes, pressão alta…). The "why" matters:
 *                                 it's what lets an e-mail speak to the person
 *                                 instead of to a list.
 *   3. ALLERGENS (src/lib/allergens.ts) — what actually makes them ill.
 *
 * Layer 3 deliberately reuses the SAME ids the treats declare in `contains` /
 * `may_contain`. That is what makes the matching automatic: we can tell someone
 * "esta caixa é segura para você" without anyone typing it twice.
 *
 * The five original booleans on user_profiles / users (is_vegan, is_gluten_free,
 * is_sugar_free, is_salt_free, is_oil_free) are kept in step through `legacy`,
 * so nothing that already reads them breaks.
 */

import { ALLERGENS, Allergen, allergenById } from './allergens';
import type { DietaryKey } from './subscriptions';

export type DietGroupId = 'jeito' | 'saude';

export interface DietTag {
  id: string;
  label: string;
  emoji: string;
  group: DietGroupId;
  /** Shown under the label, in plain words. */
  hint?: string;
  /** The old boolean column this mirrors, if any. */
  legacy?: DietaryKey;
  /** Part of the short row shown before anything is expanded. */
  quick?: boolean;
}

export const DIET_GROUPS: { id: DietGroupId; label: string; hint: string }[] = [
  { id: 'jeito', label: 'Como você come', hint: 'Seu estilo de alimentação' },
  { id: 'saude', label: 'Evito por saúde', hint: 'O que você precisa evitar, e por quê' },
];

export const DIET_TAGS: DietTag[] = [
  // ---- how they eat
  { id: 'vegano', label: 'Vegano', emoji: '🌱', group: 'jeito', legacy: 'is_vegan', quick: true, hint: 'nada de origem animal' },
  { id: 'vegetariano', label: 'Vegetariano', emoji: '🥗', group: 'jeito' },
  { id: 'plant-based', label: 'Plant-based integral', emoji: '🌿', group: 'jeito', hint: 'comida de verdade, sem ultraprocessados' },
  { id: 'sos-free', label: 'SOS-free', emoji: '✨', group: 'jeito', hint: 'sem sal, óleo nem açúcar — o nosso jeito de fazer tudo' },
  { id: 'crudivoro', label: 'Crudívoro / raw', emoji: '🥥', group: 'jeito', hint: 'nada assado acima de 42°C' },
  { id: 'low-carb', label: 'Low carb / keto', emoji: '🥑', group: 'jeito' },

  // ---- health
  { id: 'sem-gluten', label: 'Sem Glúten', emoji: '🌾', group: 'saude', legacy: 'is_gluten_free', quick: true },
  { id: 'sem-acucar', label: 'Sem Açúcar', emoji: '🍬', group: 'saude', legacy: 'is_sugar_free', quick: true },
  { id: 'sem-sal', label: 'Sem Sal', emoji: '🧂', group: 'saude', legacy: 'is_salt_free', quick: true },
  { id: 'sem-oleo', label: 'Sem Óleo', emoji: '💧', group: 'saude', legacy: 'is_oil_free', quick: true },
  { id: 'sem-lactose', label: 'Sem lactose', emoji: '🥛', group: 'saude', hint: 'tudo aqui já é sem leite, mas é bom a gente saber' },
  { id: 'diabetes', label: 'Diabetes', emoji: '🩸', group: 'saude', hint: 'controle de glicemia — evitamos até as frutas mais doces' },
  { id: 'pressao-alta', label: 'Pressão alta', emoji: '💓', group: 'saude', hint: 'pouco ou nenhum sódio' },
  { id: 'colesterol', label: 'Colesterol / coração', emoji: '🫀', group: 'saude', hint: 'sem óleo e sem gordura adicionada' },
  { id: 'fodmap', label: 'Intestino sensível (FODMAP)', emoji: '🌀', group: 'saude' },
  { id: 'gestante', label: 'Gestante ou amamentando', emoji: '🤰', group: 'saude' },
];

export const dietTagById = (id: string) => DIET_TAGS.find(t => t.id === id);
export const QUICK_TAGS = DIET_TAGS.filter(t => t.quick);

/** Turns stored ids back into the tags we know about, in our own order. */
export const dietTagsFrom = (ids: string[] | null | undefined) =>
  DIET_TAGS.filter(t => (ids || []).includes(t.id));

export const allergensFrom = (ids: string[] | null | undefined) =>
  ALLERGENS.filter(a => (ids || []).includes(a.id));

/** The five old booleans, derived from the tag list — so both stay true at once. */
export function legacyFlags(tagIds: string[]): Record<DietaryKey, boolean> {
  const has = (id: string) => tagIds.includes(id);
  return {
    is_vegan: has('vegano'),
    is_gluten_free: has('sem-gluten'),
    is_sugar_free: has('sem-acucar'),
    is_salt_free: has('sem-sal'),
    is_oil_free: has('sem-oleo'),
  };
}

/** The other direction: an old account with only booleans starts with those tags ticked. */
export function tagsFromLegacy(flags: Partial<Record<DietaryKey, boolean>>): string[] {
  return DIET_TAGS.filter(t => t.legacy && flags[t.legacy]).map(t => t.id);
}

/** One readable line for the kitchen, the order and the admin list. */
export function dietSummary(tagIds: string[], allergenIds: string[], notes?: string | null): string {
  const parts: string[] = [];
  const tags = dietTagsFrom(tagIds);
  if (tags.length) parts.push(tags.map(t => t.label).join(', '));
  const allergens = allergensFrom(allergenIds);
  if (allergens.length) parts.push(`Alergias: ${allergens.map(a => a.label).join(', ')}`);
  const extra = (notes || '').trim();
  if (extra) parts.push(extra);
  return parts.join(' · ');
}

// ---------------------------------------------------------------- matching

export type MatchStatus = 'safe' | 'may' | 'unsafe';

export interface DietMatch {
  status: MatchStatus;
  /** Allergens the person avoids that the treat/box really contains. */
  conflicts: Allergen[];
  /** Ones it only might contain (shared kitchen, traces). */
  traces: Allergen[];
}

/**
 * Does this box/treat work for this person? `contains` and `mayContain` are the
 * allergen ids already stored on each treat.
 */
export function matchDiet(
  avoid: string[] | null | undefined,
  contains: string[] | null | undefined,
  mayContain: string[] | null | undefined,
): DietMatch {
  const avoidSet = new Set(avoid || []);
  const conflicts = (contains || []).filter(id => avoidSet.has(id)).map(allergenById).filter(Boolean) as Allergen[];
  const traces = (mayContain || []).filter(id => avoidSet.has(id) && !(contains || []).includes(id))
    .map(allergenById).filter(Boolean) as Allergen[];
  return {
    status: conflicts.length ? 'unsafe' : traces.length ? 'may' : 'safe',
    conflicts,
    traces,
  };
}

/**
 * The sentence we put in that person's copy of an e-mail. Honest first: a
 * warning if it isn't for them, a clear "yes" only when we're sure.
 * Returns '' when we know nothing about them (most people).
 */
export function dietLine(match: DietMatch, avoidCount: number): string {
  if (!avoidCount) return '';
  if (match.conflicts.length) {
    const names = match.conflicts.map(a => a.label.toLowerCase()).join(', ');
    return `⚠️ Atenção, esta leva ${names} — você nos disse que evita. Nos chame no WhatsApp que a gente combina uma alternativa para você.`;
  }
  if (match.traces.length) {
    const names = match.traces.map(a => a.label.toLowerCase()).join(', ');
    return `Atenção: pode conter traços de ${names}. Tudo é feito na mesma cozinha, então preferimos te avisar.`;
  }
  return '✅ Conferimos para você: não leva nada do que você pediu para evitar.';
}
