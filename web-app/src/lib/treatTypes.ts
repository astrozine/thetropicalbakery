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
  // "Entremets" is French and stays French (it is the pâtisserie name); the Portuguese in brackets is
  // there so a Brazilian visitor knows what it means. Keep both halves in the label: it is what every
  // pill, heading and card tag shows.
  { id: 'entremets', label: 'Entremets (sobremesa em camadas)', emoji: '🍮', accent: '#c2504a', hint: 'sobremesa em camadas, moldada, ao estilo da pâtisserie francesa' },
  { id: 'raw', label: 'Raw', emoji: '🌿', accent: '#7a9b57', hint: 'sem forno, à base de castanhas, frutas secas e cacau cru' },
  { id: 'bolos', label: 'Bolos', emoji: '🎂', accent: '#e8a33d', hint: 'bolos, mini bundt cakes, cheesecakes, rocamboles' },
  { id: 'tarteletes', label: 'Tarteletes', emoji: '🥧', accent: '#b8743a', hint: 'tarteletes e tortas com base crocante' },
  { id: 'cupcakes', label: 'Cupcakes', emoji: '🧁', accent: '#d77a9a', hint: 'bolinhos individuais com cobertura' },
  { id: 'assados', label: 'Assados', emoji: '🥐', accent: '#c98a4b', hint: 'vai ao forno: barrinhas, folhados, pães doces' },
  { id: 'cookies', label: 'Cookies', emoji: '🍪', accent: '#8a5a3b' },
  { id: 'chocolates', label: 'Chocolates', emoji: '🍫', accent: '#4a332a', hint: 'bombons, trufas e docinhos de chocolate' },
];

/**
 * Ids we used to have, and what they mean now. 'bolos-tarteletes' was one group until cakes and
 * tartelettes were split (migration_29 rewrites the stored rows); a row still carrying it reads as a cake
 * until Dolly re-files it.
 */
const LEGACY_TYPES: Record<string, string> = { 'bolos-tarteletes': 'bolos' };

/** The current id for whatever is stored in treats.treat_type. Read stored ids through this. */
export const normalizeTreatType = (id: string | null | undefined) => (id ? LEGACY_TYPES[id] ?? id : id);

/** The catch-all "Outros" bucket's colour — a neutral that doesn't compete with any real type. */
export const OUTROS_ACCENT = '#8a7a6b';

/** The key the "Outros" bucket answers to, in grouping and in the type filter. Never a real type id. */
export const OUTROS_KEY = 'outros';

export const treatTypeById = (id: string | null | undefined) => {
  const key = normalizeTreatType(id);
  return TREAT_TYPES.find(t => t.id === key);
};

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
    .map(t => ({ type: t, label: t.label, emoji: t.emoji, accent: t.accent, items: treats.filter(x => normalizeTreatType(x.treat_type) === t.id) }))
    .filter(g => g.items.length > 0);
  const known = new Set(TREAT_TYPES.map(t => t.id));
  const rest = treats.filter(x => !known.has(normalizeTreatType(x.treat_type) || ''));
  if (rest.length > 0) groups.push({ type: null, label: 'Outros', emoji: '✨', accent: OUTROS_ACCENT, items: rest });
  return groups;
}

/** True once at least one treat has a real type — the signal to start showing grouped sections. */
export const anyTyped = (treats: TypeableTreat[]) => treats.some(t => !!treatTypeById(t.treat_type));

/**
 * Which bucket a treat belongs to — its own type, or OUTROS_KEY when it has none
 * (or one we no longer use). The grouping and the type filter both go through
 * this, so "Outros" always means the same set of treats in both.
 */
export function typeKeyOf(t: TypeableTreat): string {
  return treatTypeById(t.treat_type)?.id ?? OUTROS_KEY;
}

/** Label + colour for any bucket key, including OUTROS_KEY. */
export function typeChipFor(key: string) {
  const t = treatTypeById(key);
  return t ? { emoji: t.emoji, label: t.label, accent: t.accent } : { emoji: '✨', label: 'Outros', accent: OUTROS_ACCENT };
}

/** White text on dark accents, dark text on light ones — the rule the admin's Atalhos grid uses. */
export function textOn(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum > 0.62 ? '#2c3e50' : '#ffffff';
}
