/**
 * What KIND of treat something is — cookie, cake, chocolate… — as opposed to
 * the DIET_TAGS / ALLERGENS in dietary.ts / allergens.ts, which say how it's
 * made and what's in it. This is menu-only: it groups the Menu de Eventos
 * catalogue into sections and gives each card a small tag, purely for
 * browsing. It is NOT synced into Degustation Boxes the way ingredients and
 * allergens are (see treatSync.ts) — a box doesn't need this classification.
 *
 * One treat has at most one type. A treat with none set is simply ungrouped
 * ("Outros") — filling this in is optional, never blocking.
 */

export interface TreatType {
  id: string;
  label: string;
  emoji: string;
  hint?: string;
}

export const TREAT_TYPES: TreatType[] = [
  { id: 'entremets', label: 'Entremets', emoji: '🍮', hint: 'sobremesa em camadas, moldada, ao estilo da pâtisserie francesa' },
  { id: 'raw', label: 'Raw', emoji: '🌿', hint: 'sem forno, à base de castanhas, frutas secas e cacau cru' },
  { id: 'bolos-tarteletes', label: 'Bolos & Tarteletes', emoji: '🎂', hint: 'bolos, mini bundt cakes, tortas e tarteletes' },
  { id: 'assados', label: 'Assados', emoji: '🥐', hint: 'vai ao forno: barrinhas, folhados, pães doces' },
  { id: 'cookies', label: 'Cookies', emoji: '🍪' },
  { id: 'chocolates', label: 'Chocolates', emoji: '🍫', hint: 'bombons, trufas e docinhos de chocolate' },
];

export const treatTypeById = (id: string | null | undefined) => TREAT_TYPES.find(t => t.id === id);

/** The bit of a treat that groupByType looks at. */
export interface TypeableTreat {
  treat_type?: string | null;
}

export interface TreatTypeGroup<T> {
  type: TreatType | null; // null = the "Outros" catch-all
  label: string;
  emoji: string;
  items: T[];
}

/**
 * Buckets treats by type, in TREAT_TYPES order, then an "Outros" bucket for
 * anything with no type (or an id we no longer use). Empty buckets are
 * dropped. When EVERY treat is untyped, this collapses to a single "Outros"
 * group — callers should treat that case as "not grouped yet" and fall back
 * to one flat list, so the feature stays invisible until someone starts
 * using it.
 */
export function groupByType<T extends TypeableTreat>(treats: T[]): TreatTypeGroup<T>[] {
  const groups: TreatTypeGroup<T>[] = TREAT_TYPES
    .map(t => ({ type: t, label: t.label, emoji: t.emoji, items: treats.filter(x => x.treat_type === t.id) }))
    .filter(g => g.items.length > 0);
  const known = new Set(TREAT_TYPES.map(t => t.id));
  const rest = treats.filter(x => !x.treat_type || !known.has(x.treat_type));
  if (rest.length > 0) groups.push({ type: null, label: 'Outros', emoji: '✨', items: rest });
  return groups;
}

/** True once at least one treat has a real type — the signal to start showing grouped sections. */
export const anyTyped = (treats: TypeableTreat[]) => treats.some(t => !!t.treat_type && TREAT_TYPES.some(ty => ty.id === t.treat_type));
