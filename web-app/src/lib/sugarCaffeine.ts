/**
 * Sugar and caffeine: what a treat has, for people who avoid them for their health, not for an allergy.
 *
 * Deliberately NOT allergens (allergens.ts). Allergens are yes/no plus "may contain traces", which
 * is meaningless here: nobody is harmed by a trace of sugar. What people need is:
 *   - WHICH sugars a treat has. One treat can have dates and a chocolate that comes with crystal
 *     sugar, so this is a list (`treats.sugars`, migration_33), ticked by Dolly.
 *   - Whether it is INTEGRAL (whole food). That follows from the list: crystal sugar, which arrives
 *     inside industrial vegan chocolate (milk, white, caramel, most dark), is the one refined thing
 *     in the kitchen. Such a treat is still vegan, and the site says so plainly: "Vegano, mas não
 *     integral". Never ticked separately, so the two can't disagree.
 *   - Caffeine as a scale: none / a little from cacao (a tenth of a coffee, plus theobromine) / real
 *     caffeine (coffee, matcha, tea, guaraná, mate). Cocoa butter and white chocolate have practically none.
 *
 * Unset means "not declared yet" and is never shown as "free of" anything.
 */

// ---------------------------------------------------------------- vocabulary

export interface SugarSource {
  id: string;
  label: string;
  emoji: string;
  /** Plain words for the customer: what it is. */
  hint: string;
  /** Refined: a treat with this is vegan but not integral. */
  refined?: boolean;
}

/** 'nenhum' is exclusive: it means the list is complete and empty. */
export const SUGARS: SugarSource[] = [
  { id: 'nenhum', label: 'Sem açúcar adicionado', emoji: '🚫', hint: 'nada foi adicionado para adoçar' },
  { id: 'fruta', label: 'Tâmaras e frutas', emoji: '🌴', hint: 'adoçado com tâmara, uva-passa ou outra fruta: o açúcar da própria fruta, com a fibra junto' },
  { id: 'coco', label: 'Açúcar de coco', emoji: '🥥', hint: 'da seiva da flor do coqueiro, não refinado' },
  { id: 'rapadura', label: 'Rapadura', emoji: '🟫', hint: 'caldo de cana só fervido e seco, não refinado (vale também para melado e mascavo)' },
  { id: 'cristal', label: 'Açúcar cristal', emoji: '🍫', refined: true, hint: 'açúcar refinado, que vem dentro do chocolate vegano industrializado (ao leite, branco, caramelado)' },
];

export const sugarById = (id: string) => SUGARS.find(s => s.id === id);

/** How the site names the two sides of "integral". */
export const WHOLE_FOOD = {
  yes: { label: 'Integral', emoji: '🌾', accent: '#6b7f3a', hint: 'whole food: nada refinado, adoçado só com frutas, açúcar de coco ou rapadura' },
  no: { label: 'Vegano, não integral', emoji: '🍫', accent: '#a0612b', hint: 'continua 100% vegetal, mas leva chocolate vegano industrializado, que vem com açúcar cristal (refinado)' },
};

export type CaffeineLevel = 'sem' | 'pouca' | 'com';

export interface Level<Id extends string> {
  id: Id;
  label: string;
  emoji: string;
  hint: string;
}

export const CAFFEINE_LEVELS: Level<CaffeineLevel>[] = [
  { id: 'sem', label: 'Sem cafeína', emoji: '🌙', hint: 'não leva cacau, café, chá nem guaraná (manteiga de cacau e chocolate branco quase não têm)' },
  { id: 'pouca', label: 'Pouca cafeína', emoji: '🍫', hint: 'vem do cacau ou do chocolate: bem menos que um cafezinho' },
  { id: 'com', label: 'Com cafeína', emoji: '☕', hint: 'leva café, matcha, chá, guaraná ou erva-mate' },
];

export const caffeineById = (id: string | null | undefined) => CAFFEINE_LEVELS.find(l => l.id === id);

/** The bit of a treat (menu row or box item) this file looks at. */
export interface SweetTreat {
  ingredients?: string[] | null;
  sugars?: string[] | null;
  /** migration_32's single value, read only until migration_33 moves it into `sugars`. */
  sugar?: string | null;
  caffeine?: string | null;
}

// ---------------------------------------------------------------- reading the ingredients

const plain = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Accents are stripped first, so these are written without them.
const STRONG_CAFFEINE = /\bcafe\b|espresso|expresso|matcha|\bcha (verde|preto|branco|mate)\b|\bchai\b|guarana|erva[- ]?mate|yerba|\bmate\b|\bcola\b/;
const COCOA = /cacau|cacao|chocolate|\bnibs?\b|\bcocoa\b/;
const NO_COCOA_SOLIDS = /manteiga de cacau|cocoa butter|chocolate branco|white chocolate/g;
/** Chocolates that always come with crystal sugar. */
const SWEET_CHOCOLATE = /chocolate (branco|ao leite|caramelado)|white chocolate|milk chocolate/;
const SUGAR_PATTERNS: [string, RegExp][] = [
  ['fruta', /tamara|uva[- ]?passa|\bpassas?\b|damasco seco|figo seco|ameixa seca/],
  ['coco', /acucar de coco/],
  ['rapadura', /rapadura|\bmelado|mascavo/], // \b: "chocolate caramelado" is not melado
  // "(?<!sem )": "leite de coco sem açúcar" is the absence of sugar, not a sugar.
  ['cristal', /(?<!sem )acucar( cristal| cristalizado| refinado| branco| demerara| organico)?\b(?! de coco| mascavo| de tamara)|demerara|chocolate (branco|ao leite|caramelado)|white chocolate|milk chocolate/],
];

const REFINED = SUGAR_PATTERNS.find(([id]) => id === 'cristal')![1];

function firstHit(ingredients: string[] | null | undefined, re: RegExp, strip?: RegExp) {
  const list = ingredients || [];
  return list.find(x => { const p = plain(x); return re.test(strip ? p.replace(strip, '') : p); }) ?? null;
}

export interface SugarSuggestion {
  /** Sugar ids the ingredients point to, each with the ingredient that made us think so. */
  found: { id: string; because: string }[];
  /** A chocolate that doesn't say whether it's sweetened (e.g. "chocolate amargo"): ask, don't guess. */
  askChocolate?: string;
}

/** What the ingredient list suggests, for Dolly to confirm with one tap. Never stored on its own. */
export function suggestSugars(ingredients: string[] | null | undefined): SugarSuggestion {
  const found = SUGAR_PATTERNS
    .map(([id, re]) => ({ id, because: firstHit(ingredients, re) }))
    .filter((f): f is { id: string; because: string } => !!f.because);
  const chocolates = (ingredients || []).filter(i => /chocolate/.test(plain(i)) && !SWEET_CHOCOLATE.test(plain(i)));
  return { found, askChocolate: chocolates[0] };
}

export function suggestCaffeine(ingredients: string[] | null | undefined): { id: CaffeineLevel; because: string } | undefined {
  if (!(ingredients || []).length) return undefined;
  const strong = firstHit(ingredients, STRONG_CAFFEINE);
  if (strong) return { id: 'com', because: strong };
  const cocoa = firstHit(ingredients, COCOA, NO_COCOA_SOLIDS);
  if (cocoa) return { id: 'pouca', because: cocoa };
  return { id: 'sem', because: '' };
}

// ---------------------------------------------------------------- what a treat is

/** The declared sugar list in our order, or null when nobody has said yet. */
export function sugarsOf(t: SweetTreat): string[] | null {
  const ids = Array.isArray(t.sugars) ? t.sugars : t.sugar === 'fruta' ? ['fruta'] : t.sugar === 'cana' ? ['cristal'] : null;
  if (!ids || ids.length === 0) return null;
  return SUGARS.filter(s => ids.includes(s.id)).map(s => s.id);
}

/**
 * Integral (whole food) or not. Declared sugars decide. Undeclared, a white / milk / caramel chocolate in
 * the ingredients still marks it "not integral" (that can only make us more honest); the opposite is
 * never assumed, so an undeclared treat without one is unknown (null).
 */
export function isWholeFood(t: SweetTreat): boolean | null {
  const s = sugarsOf(t);
  if (s) return !s.some(id => sugarById(id)?.refined);
  return firstHit(t.ingredients, REFINED) ? false : null;
}

/** Declared caffeine; undeclared, caffeine clearly in the ingredients still counts. "None" is never assumed. */
export function caffeineOf(t: SweetTreat): CaffeineLevel | null {
  const declared = caffeineById(t.caffeine)?.id;
  if (declared) return declared;
  const s = suggestCaffeine(t.ingredients);
  return s && s.id !== 'sem' ? s.id : null;
}

// ---------------------------------------------------------------- "sem …" filters

/**
 * The customer-facing filters in the "Açúcar e cafeína" folder, always applied as "I avoid…". Integral
 * isn't here: it's the 🌾 pill at the top of the treats, next to 🌿 Raw. An undeclared treat never passes.
 */
export const AVOID_FILTERS: { id: string; label: string; emoji: string; hint: string; needs: 'sugar' | 'caffeine'; ok: (t: SweetTreat) => boolean }[] = [
  { id: 'sem-acucar', label: 'Sem açúcar adicionado', emoji: '🚫', needs: 'sugar',
    hint: 'Nada adicionado para adoçar. Para diabetes, veja também os doces com tâmara: é açúcar da fruta, mas é açúcar.',
    ok: t => sugarsOf(t)?.join() === 'nenhum' },
  { id: 'sem-cafeina', label: 'Sem cafeína', emoji: '🌙', needs: 'caffeine',
    hint: 'Nada de cacau, café, chá ou guaraná. Para gestantes, sono, ansiedade ou refluxo.',
    ok: t => caffeineOf(t) === 'sem' },
  { id: 'sem-cafe', label: 'Sem café, chá ou guaraná', emoji: '☕', needs: 'caffeine',
    hint: 'Pode ter um pouco de cacau, mas nada de café, matcha, chá ou guaraná.',
    ok: t => { const c = caffeineOf(t); return c === 'sem' || c === 'pouca'; } },
];

export const avoidFilterById = (id: string) => AVOID_FILTERS.find(f => f.id === id);

/** True when the treat passes every "sem …" filter that is on (old ids no longer offered are ignored). */
export const passesAvoid = (t: SweetTreat, ids: string[] | null | undefined) =>
  (ids || []).every(id => avoidFilterById(id)?.ok(t) ?? true);

/** Treats a "sem …" filter leaves out only because nothing is declared yet (so the page can say so). */
export const undeclaredFor = (treats: SweetTreat[], ids: string[] | null | undefined) => {
  const on = (ids || []).map(avoidFilterById).filter(Boolean);
  if (!on.length) return 0;
  const needsSugar = on.some(f => f!.needs === 'sugar');
  const needsCaffeine = on.some(f => f!.needs === 'caffeine');
  return treats.filter(t => (needsSugar && !sugarsOf(t)) || (needsCaffeine && !caffeineOf(t))).length;
};
