/**
 * Allergens a treat can declare. Built from:
 *  - ANVISA RDC 26/2015 (Brazil): wheat/rye/barley/oats and hybrids, crustaceans,
 *    eggs, fish, peanut, soy, milk, and the tree nuts (almond, hazelnut, cashew,
 *    Brazil nut, macadamia, walnut, pecan, pistachio, pine nut), plus natural latex.
 *    Cross-contact is declared as "Alérgicos: pode conter …".
 *  - Lei 10.674/2003: gluten must always be declared ("contém" / "não contém").
 *  - EU Regulation 1169/2011, Annex II — the extra items it names that RDC 26 does
 *    not: sesame, celery, mustard, lupin, molluscs, sulphites (> 10 mg/kg).
 *    Sesame matters here: our treats often use sesame seeds.
 *
 * Coconut is not a legally required allergen, but plenty of people ask about it.
 */

export type AllergenGroup = 'gluten' | 'nuts' | 'common' | 'other';

export interface Allergen {
  id: string;
  label: string;
  emoji: string;
  group: AllergenGroup;
  hint?: string;
}

export const ALLERGEN_GROUPS: { id: AllergenGroup; label: string }[] = [
  { id: 'gluten', label: 'Glúten e cereais' },
  { id: 'nuts', label: 'Castanhas e oleaginosas' },
  { id: 'common', label: 'Mais comuns' },
  { id: 'other', label: 'Menos comuns' },
];

export const ALLERGENS: Allergen[] = [
  // Gluten and cereals
  { id: 'gluten', label: 'Glúten', emoji: '🌾', group: 'gluten', hint: 'trigo, centeio, cevada e híbridos — inclui contaminação cruzada' },
  { id: 'aveia', label: 'Aveia', emoji: '🥣', group: 'gluten', hint: 'costuma ter traços de glúten' },

  // Tree nuts and seeds
  { id: 'amendoim', label: 'Amendoim', emoji: '🥜', group: 'nuts', hint: 'leguminosa, mas declarado junto das castanhas' },
  { id: 'castanha-caju', label: 'Castanha-de-caju', emoji: '🌰', group: 'nuts' },
  { id: 'castanha-brasil', label: 'Castanha-do-Brasil (Pará)', emoji: '🌰', group: 'nuts' },
  { id: 'amendoa', label: 'Amêndoa', emoji: '🌰', group: 'nuts' },
  { id: 'avela', label: 'Avelã', emoji: '🌰', group: 'nuts' },
  { id: 'noz', label: 'Nozes', emoji: '🌰', group: 'nuts' },
  { id: 'noz-peca', label: 'Noz-pecã', emoji: '🌰', group: 'nuts' },
  { id: 'pistache', label: 'Pistache', emoji: '🌰', group: 'nuts' },
  { id: 'macadamia', label: 'Macadâmia', emoji: '🌰', group: 'nuts' },
  { id: 'pinoli', label: 'Pinoli (pine nuts)', emoji: '🌰', group: 'nuts', hint: 'não é o pinhão' },
  { id: 'gergelim', label: 'Gergelim', emoji: '⚪', group: 'nuts', hint: 'sementes e tahine' },

  // Most common
  { id: 'soja', label: 'Soja', emoji: '🫘', group: 'common', hint: 'inclui lecitina de soja' },
  { id: 'leite', label: 'Leite e derivados', emoji: '🥛', group: 'common', hint: 'inclui lactose' },
  { id: 'ovos', label: 'Ovos', emoji: '🥚', group: 'common' },

  // Less common
  { id: 'coco', label: 'Coco', emoji: '🥥', group: 'other', hint: 'não é obrigatório por lei, mas muita gente pergunta' },
  { id: 'sulfitos', label: 'Sulfitos', emoji: '🍷', group: 'other', hint: 'frutas secas, vinagres' },
  { id: 'aipo', label: 'Aipo', emoji: '🥬', group: 'other' },
  { id: 'mostarda', label: 'Mostarda', emoji: '🟡', group: 'other' },
  { id: 'tremoço', label: 'Tremoço', emoji: '🌼', group: 'other' },
  { id: 'peixes', label: 'Peixes', emoji: '🐟', group: 'other' },
  { id: 'crustaceos', label: 'Crustáceos', emoji: '🦐', group: 'other' },
  { id: 'moluscos', label: 'Moluscos', emoji: '🐚', group: 'other' },
  { id: 'latex', label: 'Látex natural', emoji: '🧤', group: 'other', hint: 'frutas como banana e abacate têm proteínas parecidas' },
];

export const allergenById = (id: string) => ALLERGENS.find(a => a.id === id);

/** One treat in a box. */
export interface BoxItem {
  id: string;
  name: string;
  emoji: string;
  description: string;
  image_url: string;
  ingredients: string[];
  contains: string[];
  may_contain: string[];
}

export const TREAT_EMOJIS = ['🍫', '🥥', '🍓', '🍌', '🍍', '🥭', '🌰', '🍪', '🧁', '🍰', '🍯', '🌺', '🍋', '🥜', '✨'];

export const newBoxItem = (): BoxItem => ({
  id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
  name: '',
  emoji: '🍫',
  description: '',
  image_url: '',
  ingredients: [],
  contains: [],
  may_contain: [],
});

/** Everything a box contains / may contain, across all treats (a "may contain" that is also a "contains" is dropped). */
export function summarizeAllergens(items: BoxItem[]) {
  const contains = new Set<string>();
  const may = new Set<string>();
  items.forEach(i => {
    (i.contains || []).forEach(a => contains.add(a));
    (i.may_contain || []).forEach(a => may.add(a));
  });
  contains.forEach(a => may.delete(a));
  const order = (ids: Set<string>) => ALLERGENS.filter(a => ids.has(a.id));
  return { contains: order(contains), mayContain: order(may) };
}
