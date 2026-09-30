/**
 * Sugar and caffeine: what a treat has, for people who avoid them for their health, not for an allergy.
 *
 * Deliberately NOT allergens (allergens.ts). Allergens are yes/no plus "may contain traces", which
 * is meaningless here: nobody is harmed by a trace of sugar. What people need is a scale they can
 * answer their own question with:
 *   - Someone off refined sugar asks "is there cane sugar?"
 *   - Someone with diabetes asks "is anything added at all?", and should be told that fruit is sugar too.
 *   - Someone off caffeine (pregnancy, sleep, anxiety, reflux) asks "any at all?", and someone who just
 *     avoids coffee asks "is it only a bit of cacao?". Cacao has roughly a tenth of a coffee's caffeine
 *     (plus theobromine, a milder stimulant); cocoa butter and white chocolate have practically none.
 *
 * Stored on public.treats as `sugar` / `caffeine` (migration_32) and copied into box items like the
 * allergens (treatSync.ts). Unset means "not declared yet" and is never shown as "free of".
 */

export type SugarLevel = 'fruta' | 'nao-refinado' | 'cana';
export type CaffeineLevel = 'sem' | 'pouca' | 'com';

export interface Level<Id extends string> {
  id: Id;
  label: string;
  emoji: string;
  /** Plain words for the customer: where it comes from. */
  hint: string;
}

export const SUGAR_LEVELS: Level<SugarLevel>[] = [
  { id: 'fruta', label: 'Sem açúcar adicionado', emoji: '🍌', hint: 'adoçado só com frutas, como tâmara, banana ou uva-passa (fruta também tem açúcar)' },
  { id: 'nao-refinado', label: 'Açúcar não refinado', emoji: '🥥', hint: 'açúcar de coco, mascavo, rapadura, melado ou xarope de agave ou de bordo' },
  { id: 'cana', label: 'Contém açúcar de cana', emoji: '🍬', hint: 'açúcar cristal, demerara ou orgânico, por exemplo o que vem no chocolate' },
];

export const CAFFEINE_LEVELS: Level<CaffeineLevel>[] = [
  { id: 'sem', label: 'Sem cafeína', emoji: '🌙', hint: 'não leva cacau, café, chá nem guaraná (manteiga de cacau e chocolate branco quase não têm)' },
  { id: 'pouca', label: 'Pouca cafeína', emoji: '🍫', hint: 'vem do cacau ou do chocolate: bem menos que um cafezinho' },
  { id: 'com', label: 'Com cafeína', emoji: '☕', hint: 'leva café, matcha, chá, guaraná ou erva-mate' },
];

export const sugarById = (id: string | null | undefined) => SUGAR_LEVELS.find(l => l.id === id);
export const caffeineById = (id: string | null | undefined) => CAFFEINE_LEVELS.find(l => l.id === id);

/** The bit of a treat (menu row or box item) this file looks at. */
export interface SweetTreat {
  ingredients?: string[] | null;
  sugar?: string | null;
  caffeine?: string | null;
}

// ---------------------------------------------------------------- reading the ingredients

const lower = (list: string[] | null | undefined) =>
  (list || []).map(i => i.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));

// Accents are stripped first, so these are written without them.
const STRONG_CAFFEINE = /\bcafe\b|espresso|expresso|matcha|\bcha (verde|preto|branco|mate)\b|\bchai\b|guarana|erva[- ]?mate|yerba|\bmate\b|\bcola\b/;
const COCOA = /cacau|cacao|chocolate|\bnibs?\b|\bcocoa\b/;
const NO_COCOA_SOLIDS = /manteiga de cacau|cocoa butter|chocolate branco|white chocolate/g;
const CANE_SUGAR = /acucar( cristal| refinado| demerara| organico| de cana| branco)?\b(?! de coco| mascavo| de tamara)|demerara|melaco/;
const UNREFINED_SUGAR = /acucar de coco|mascavo|rapadura|melado|xarope|agave|bordo|maple|yacon/;

export interface Suggestion<Id extends string> {
  id: Id;
  /** Which ingredient made us think so, in the admin's own words. */
  because: string;
}

function firstHit(ingredients: string[] | null | undefined, re: RegExp, strip?: RegExp) {
  const plain = lower(ingredients);
  const i = plain.findIndex(x => re.test(strip ? x.replace(strip, '') : x));
  return i >= 0 ? (ingredients || [])[i] : null;
}

/**
 * What the ingredient list suggests, for the admin to confirm with one tap. Never stored on its own:
 * "chocolate" usually means sugar, but only the label on the bar can say which.
 */
export function suggestFromIngredients(ingredients: string[] | null | undefined): {
  sugar?: Suggestion<SugarLevel>; caffeine?: Suggestion<CaffeineLevel>; chocolate?: string;
} {
  if (!(ingredients || []).length) return {};
  const strong = firstHit(ingredients, STRONG_CAFFEINE);
  const cocoa = firstHit(ingredients, COCOA, NO_COCOA_SOLIDS);
  const cane = firstHit(ingredients, CANE_SUGAR);
  const unrefined = firstHit(ingredients, UNREFINED_SUGAR);
  const chocolate = firstHit(ingredients, /chocolate/);
  return {
    caffeine: strong ? { id: 'com', because: strong }
      : cocoa ? { id: 'pouca', because: cocoa }
      : { id: 'sem', because: '' },
    sugar: cane ? { id: 'cana', because: cane }
      : unrefined ? { id: 'nao-refinado', because: unrefined }
      : chocolate ? undefined // chocolate almost always carries some sugar: ask, don't guess
      : { id: 'fruta', because: '' },
    chocolate: chocolate || undefined,
  };
}

/** The declared sugar level, or null when nobody has said yet. */
export const sugarOf = (t: SweetTreat): SugarLevel | null => sugarById(t.sugar)?.id ?? null;

/**
 * The declared caffeine level. When nothing is declared, an ingredient that clearly HAS caffeine
 * (cacao, coffee…) still counts, because that can only make us more careful. The opposite
 * ("no cacao listed, so none") is never assumed.
 */
export function caffeineOf(t: SweetTreat): CaffeineLevel | null {
  const declared = caffeineById(t.caffeine)?.id;
  if (declared) return declared;
  const s = suggestFromIngredients(t.ingredients).caffeine;
  return s && s.id !== 'sem' ? s.id : null;
}

// ---------------------------------------------------------------- "sem …" filters

/**
 * The customer-facing filters. Always phrased and applied as "I avoid…", whatever the allergen
 * panel's Com/Sem/Pode conter mode is, because that's the only question anyone asks about these.
 * A treat with nothing declared is left out as soon as one of these is on: unknown is not "free".
 */
export const AVOID_FILTERS: { id: string; label: string; emoji: string; hint: string; ok: (t: SweetTreat) => boolean }[] = [
  { id: 'sem-acucar-cana', label: 'Sem açúcar de cana', emoji: '🍬', hint: 'Só adoçados com fruta ou açúcar não refinado (coco, mascavo…).',
    ok: t => { const s = sugarOf(t); return s === 'fruta' || s === 'nao-refinado'; } },
  { id: 'so-fruta', label: 'Sem açúcar adicionado', emoji: '🍌', hint: 'Só adoçados com fruta. Para diabetes: fruta também tem açúcar, então veja a quantidade com seu médico.',
    ok: t => sugarOf(t) === 'fruta' },
  { id: 'sem-cafeina', label: 'Sem cafeína', emoji: '🌙', hint: 'Nada de cacau, café, chá ou guaraná. Para gestantes, sono, ansiedade ou refluxo.',
    ok: t => caffeineOf(t) === 'sem' },
  { id: 'sem-cafe', label: 'Sem café, chá ou guaraná', emoji: '☕', hint: 'Pode ter um pouco de cacau, mas nada de café, matcha, chá ou guaraná.',
    ok: t => { const c = caffeineOf(t); return c === 'sem' || c === 'pouca'; } },
];

export const avoidFilterById = (id: string) => AVOID_FILTERS.find(f => f.id === id);

/** True when the treat passes every "sem …" filter that is on. */
export const passesAvoid = (t: SweetTreat, ids: string[] | null | undefined) =>
  (ids || []).every(id => avoidFilterById(id)?.ok(t) ?? true);

/** Treats a "sem …" filter leaves out only because nothing is declared yet (so the page can say so). */
export const undeclaredFor = (treats: SweetTreat[], ids: string[] | null | undefined) => {
  if (!(ids || []).length) return 0;
  const needsSugar = ids!.some(id => id.includes('acucar') || id === 'so-fruta');
  const needsCaffeine = ids!.some(id => id.includes('caf'));
  return treats.filter(t => (needsSugar && !sugarOf(t)) || (needsCaffeine && !caffeineOf(t))).length;
};
