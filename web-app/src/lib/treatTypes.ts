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
  /** The group's colour on /menu and in the admin catalogue — same retro-tab idea as the admin's own Atalhos grid. */
  accent: string;
}

export const TREAT_TYPES: TreatType[] = [
  { id: 'entremets', label: 'Entremets', emoji: '🍮', accent: '#c2504a', hint: 'sobremesa em camadas, moldada, ao estilo da pâtisserie francesa' },
  { id: 'raw', label: 'Raw', emoji: '🌿', accent: '#7a9b57', hint: 'sem forno, à base de castanhas, frutas secas e cacau cru' },
  { id: 'bolos-tarteletes', label: 'Bolos & Tarteletes', emoji: '🎂', accent: '#e8a33d', hint: 'bolos, mini bundt cakes, tortas e tarteletes' },
  { id: 'assados', label: 'Assados', emoji: '🥐', accent: '#c98a4b', hint: 'vai ao forno: barrinhas, folhados, pães doces' },
  { id: 'cookies', label: 'Cookies', emoji: '🍪', accent: '#8a5a3b' },
  { id: 'chocolates', label: 'Chocolates', emoji: '🍫', accent: '#4a332a', hint: 'bombons, trufas e docinhos de chocolate' },
];

/** The catch-all "Outros" bucket's colour — a neutral that doesn't compete with any real type. */
export const OUTROS_ACCENT = '#8a7a6b';

export const treatTypeById = (id: string | null | undefined) => TREAT_TYPES.find(t => t.id === id);

/** The bit of a treat that groupByType looks at. */
export interface TypeableTreat {
  treat_type?: string | null;
}

export interface TreatTypeGroup<T> {
  type: TreatType | null; // null = the "Outros" catch-all
  label: string;
  emoji: string;
  accent: string;
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
    .map(t => ({ type: t, label: t.label, emoji: t.emoji, accent: t.accent, items: treats.filter(x => x.treat_type === t.id) }))
    .filter(g => g.items.length > 0);
  const known = new Set(TREAT_TYPES.map(t => t.id));
  const rest = treats.filter(x => !x.treat_type || !known.has(x.treat_type));
  if (rest.length > 0) groups.push({ type: null, label: 'Outros', emoji: '✨', accent: OUTROS_ACCENT, items: rest });
  return groups;
}

/** True once at least one treat has a real type — the signal to start showing grouped sections. */
export const anyTyped = (treats: TypeableTreat[]) => treats.some(t => !!t.treat_type && TREAT_TYPES.some(ty => ty.id === t.treat_type));
