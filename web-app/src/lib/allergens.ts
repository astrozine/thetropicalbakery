/**
 * The allergens a treat can declare, scoped to OUR kitchen.
 *
 * Everything we make is plant-based and made without gluten, so the long legal
 * lists (ANVISA RDC 26/2015, EU 1169/2011) are mostly things we never touch:
 * milk, eggs, fish, crustaceans, molluscs, mustard, celery, lupin, sulphites…
 * Those aren't ticked per treat; they are covered once, for the whole kitchen,
 * by KITCHEN_FACTS below. What's left is what a plant-based whole-food kitchen
 * really handles.
 *
 * Tree nuts are ONE chip on purpose: which nut it is shows in the ingredients,
 * and in a kitchen that works with nuts every day, anyone allergic to one
 * should be warned about all of them.
 *
 * Old ids (the nine separate nuts, gluten, milk…) may still be stored on older
 * rows; normalizeAllergens() translates them, and migration 25 rewrites them.
 */

export interface Allergen {
  id: string;
  label: string;
  emoji: string;
  hint?: string;
}

export const ALLERGENS: Allergen[] = [
  { id: 'castanhas', label: 'Castanhas', emoji: '🌰', hint: 'caju, pará, amêndoa, nozes, macadâmia, avelã, pistache… qual delas está nos ingredientes' },
  { id: 'amendoim', label: 'Amendoim', emoji: '🥜' },
  { id: 'coco', label: 'Coco', emoji: '🥥', hint: 'polpa, leite, óleo ou açúcar de coco' },
  { id: 'gergelim', label: 'Gergelim', emoji: '⚪', hint: 'sementes e tahine' },
  { id: 'soja', label: 'Soja', emoji: '🫘', hint: 'inclui lecitina de soja, comum em chocolate vegano' },
  { id: 'aveia', label: 'Aveia', emoji: '🥣', hint: 'muitos celíacos evitam também' },
];

/** "castanhas, amendoim, coco, gergelim, soja nem aveia": the whole list in one phrase, for "não leva …". */
export const ALLERGEN_LIST_NEM = ALLERGENS.map(a => a.label.toLowerCase()).join(', ').replace(/, ([^,]+)$/, ' nem $1');

/** The ids we used before the list was trimmed that still mean something now. Anything else old is dropped. */
const LEGACY_IDS: Record<string, string> = {
  'castanha-caju': 'castanhas', 'castanha-brasil': 'castanhas', amendoa: 'castanhas', avela: 'castanhas',
  noz: 'castanhas', 'noz-peca': 'castanhas', pistache: 'castanhas', macadamia: 'castanhas', pinoli: 'castanhas',
};

/** Stored ids -> current ids: old nut ids become 'castanhas', ids we no longer use are dropped, no repeats. */
export function normalizeAllergens(ids: string[] | null | undefined): string[] {
  const known = new Set(ALLERGENS.map(a => a.id));
  return [...new Set((ids || []).map(id => LEGACY_IDS[id] || id))].filter(id => known.has(id));
}

/**
 * True of every treat, so said once instead of ticked on each one. Keep these
 * in step with the claims on the site (PhilosophyShowcase, /menu, /caixas).
 */
export const KITCHEN_FACTS = [
  { emoji: '🌱', text: '100% vegetal: nenhum doce leva leite, ovos, mel ou qualquer ingrediente de origem animal.' },
  // Dolly, 2026-10-05: no wheat in any recipe, but bought-in flours (almond etc.) may come from places that process wheat.
  { emoji: '🌾', text: 'Não usamos trigo nem nenhum ingrediente com glúten nas receitas. Mas alguns ingredientes que compramos prontos, como farinha de amêndoa e outras farinhas, podem ter sido processados em lugares que também processam trigo: por isso não garantimos ausência de traços de glúten. Se você é celíaco, fale com a gente antes.' },
  // Andrew, 2026-09-30: the ONE refined ingredient is the industrial vegan chocolate (sugar and oil); the
  // rest is SOS-free. Those treats are marked "Com chocolate vegano" (src/lib/sugarCaffeine.ts).
  { emoji: '🍯', text: 'SOS-free: nossas receitas não levam sal, óleo nem açúcar refinado; a doçura vem de tâmaras e frutas, açúcar de coco ou rapadura. A única exceção é o chocolate vegano que alguns doces levam, que já vem com açúcar e óleo: esses aparecem marcados com “🍫 Com chocolate vegano”.' },
  // Dolly, 2026-10-05: all six are in the kitchen, so traces are possible in every treat, not only the ones ticked.
  { emoji: '⚠️', text: `Na nossa cozinha passam ${ALLERGENS.map(a => a.label.toLowerCase()).join(', ').replace(/, ([^,]+)$/, ' e $1')}: qualquer doce pode ter traços deles, mesmo quando a receita não leva.` },
  { emoji: '✨', text: 'Sem conservantes e sem nenhum ingrediente artificial.' },
];

export const allergenById = (id: string) => ALLERGENS.find(a => a.id === (LEGACY_IDS[id] || id));

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
  /** Sugar ids and CaffeineLevel from sugarCaffeine.ts; absent = not declared yet. */
  sugars?: string[] | null;
  caffeine?: string | null;
  /** Link to the same treat in the Menu de Eventos (public.treats). */
  treat_id?: string | null;
  /** Editor-only: create this treat in the Menu de Eventos when the box is saved. Never stored. */
  add_to_menu?: boolean;
  menu_price?: number;
  menu_min_batch?: number;
  menu_batch_multiplier?: number;
}

/** The detail fields a treat has in both places (box item and Menu de Eventos row). */
export interface TreatDetails {
  name: string;
  description: string;
  image_url: string;
  emoji: string;
  ingredients: string[];
  contains: string[];
  may_contain: string[];
  sugars?: string[] | null;
  caffeine?: string | null;
}

/** A row of public.treats as the admin reads it. */
export interface TreatRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  min_batch_size: number;
  batch_multiplier: number;
  emoji?: string | null;
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
  sugars?: string[] | null;
  caffeine?: string | null;
}

/** Copies a Menu de Eventos treat into a box, keeping the link so both stay in step. */
export const treatToBoxItem = (t: TreatRow): BoxItem => ({
  ...newBoxItem(),
  name: t.name,
  emoji: t.emoji || '🍫',
  description: t.description || '',
  image_url: t.image_url || '',
  ingredients: t.ingredients || [],
  contains: normalizeAllergens(t.contains),
  may_contain: normalizeAllergens(t.may_contain),
  sugars: t.sugars ?? null,
  caffeine: t.caffeine ?? null,
  treat_id: t.id,
});

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
    normalizeAllergens(i.contains).forEach(a => contains.add(a));
    normalizeAllergens(i.may_contain).forEach(a => may.add(a));
  });
  contains.forEach(a => may.delete(a));
  const order = (ids: Set<string>) => ALLERGENS.filter(a => ids.has(a.id));
  return { contains: order(contains), mayContain: order(may) };
}
