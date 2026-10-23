/**
 * "Bateu Vontade?": the craving-rescue app at /vontade. A sugar craving hits → three taps (what you crave, how long
 * you have, what's in the kitchen) → a treat you can make in a few minutes, with no refined sugar.
 *
 * Freemium on purpose: the free recipes are real help, so people come back and pass the link on; the rest are
 * Tropical+, which comes with the Clube Tropical (any paid box) or the subscription. So the app is the first rung of
 * the value ladder and also a reason to buy a box.
 *
 * Pure data and pure functions (no browser or server imports), so the recipes are one edit away for Dolly.
 * Allergen ids are the kitchen's own (lib/allergens.ts), never a second list.
 */

export type Craving = 'chocolate' | 'cremoso' | 'fresquinho' | 'crocante';
export type TimeBudget = 'agora' | 'cinco' | 'espera';

export const CRAVINGS: { id: Craving; emoji: string; label: string; hint: string; hex: string; ink: string }[] = [
  { id: 'chocolate', emoji: '🍫', label: 'Chocolate', hint: 'aquele cacau que acalma', hex: '#5a3421', ink: '#fff' },
  { id: 'cremoso', emoji: '🍮', label: 'Docinho cremoso', hint: 'brigadeiro, mousse, colher', hex: '#c9853c', ink: '#2e1800' },
  { id: 'fresquinho', emoji: '🥭', label: 'Fresquinho', hint: 'fruta, gelado, tropical', hex: '#f7c600', ink: '#3b2a00' },
  { id: 'crocante', emoji: '🥜', label: 'Crocante', hint: 'algo para morder', hex: '#27b35a', ink: '#fff' },
];

export const TIMES: { id: TimeBudget; emoji: string; label: string; hint: string; maxMinutes: number }[] = [
  { id: 'agora', emoji: '⚡', label: 'Agora!', hint: 'até 3 minutos', maxMinutes: 3 },
  { id: 'cinco', emoji: '⏱️', label: 'Tenho 5 minutinhos', hint: 'sem forno', maxMinutes: 5 },
  { id: 'espera', emoji: '🧊', label: 'Posso esperar', hint: 'vale até gelar', maxMinutes: Infinity },
];

/** What might be in the kitchen. `key` is what the recipes ask for. */
export const PANTRY: { key: string; emoji: string; label: string }[] = [
  { key: 'banana', emoji: '🍌', label: 'Banana' },
  { key: 'banana-congelada', emoji: '🧊', label: 'Banana congelada' },
  { key: 'tamara', emoji: '🌴', label: 'Tâmara' },
  { key: 'cacau', emoji: '🍫', label: 'Cacau em pó' },
  { key: 'coco', emoji: '🥥', label: 'Coco ralado' },
  { key: 'pasta-amendoim', emoji: '🥜', label: 'Pasta de amendoim' },
  { key: 'castanhas', emoji: '🌰', label: 'Castanhas' },
  { key: 'manga', emoji: '🥭', label: 'Manga' },
  { key: 'manga-congelada', emoji: '❄️', label: 'Manga congelada' },
  { key: 'maracuja', emoji: '💛', label: 'Maracujá' },
  { key: 'abacate', emoji: '🥑', label: 'Abacate' },
  { key: 'maca', emoji: '🍎', label: 'Maçã' },
  { key: 'iogurte-coco', emoji: '🥣', label: 'Iogurte de coco' },
  { key: 'leite-vegetal', emoji: '🥛', label: 'Leite vegetal' },
  { key: 'chia', emoji: '⚫', label: 'Chia' },
  { key: 'acucar-coco', emoji: '🟤', label: 'Açúcar de coco' },
];
export const pantryLabel = (key: string) => PANTRY.find(p => p.key === key)?.label ?? key;

export interface Rescue {
  id: string;
  name: string;
  emoji: string;
  cravings: Craving[];
  /** Hands-on minutes. `waitMinutes` is fridge/freezer time on top. */
  minutes: number;
  waitMinutes?: number;
  /** Pantry keys the recipe can't do without. Optional extras go in `ingredients` only. */
  needs: string[];
  ingredients: string[];
  steps: string[];
  tip?: string;
  /** Ids from lib/allergens.ts. */
  contains: string[];
  /** Free for everyone; the rest is Tropical+. */
  free: boolean;
  /** Card color, from the Sweet Escape palette. */
  hex: string;
  ink: string;
}

// Written for the app's launch; Dolly reviews and rewrites them in her own words.
export const RESCUES: Rescue[] = [
  {
    id: 'brigadeiro-tamara', name: 'Brigadeiro de tâmara', emoji: '🍫', cravings: ['chocolate', 'cremoso'], minutes: 5,
    needs: ['tamara', 'cacau'],
    ingredients: ['6 tâmaras sem caroço', '1 colher (sopa) de cacau em pó', 'cacau ou coco ralado para enrolar (opcional)'],
    steps: [
      'Se as tâmaras estiverem duras, deixe 2 minutos em água quente e escorra.',
      'Amasse com um garfo até virar uma pasta.',
      'Misture o cacau até a massa ficar escura e brilhante.',
      'Enrole 4 bolinhas e passe no cacau ou no coco.',
    ],
    tip: 'Guarde 2 na geladeira: amanhã, quando a vontade voltar, já está resolvido.',
    contains: [], free: true, hex: '#5a3421', ink: '#fff',
  },
  {
    id: 'nice-cream-cacau', name: 'Sorvete de banana com cacau', emoji: '🍨', cravings: ['chocolate', 'cremoso', 'fresquinho'], minutes: 3,
    needs: ['banana-congelada', 'cacau'],
    ingredients: ['2 bananas congeladas em rodelas', '1 colher (sopa) de cacau em pó', '2 colheres (sopa) de leite vegetal'],
    steps: [
      'Bata tudo no processador ou liquidificador, parando para raspar as laterais.',
      'Quando ficar liso como sorvete, pare. Não precisa de mais nada.',
      'Coma na hora, de colher.',
    ],
    tip: 'Sempre que uma banana ficar madura demais, descasque, corte e congele. É o seu seguro anti-vontade.',
    contains: [], free: true, hex: '#a33fc4', ink: '#fff',
  },
  {
    id: 'manga-coco-limao', name: 'Manga com coco e limão', emoji: '🥭', cravings: ['fresquinho'], minutes: 2,
    needs: ['manga'],
    ingredients: ['1 manga madura em cubos', 'raspas de ½ limão', '1 colher (sopa) de coco ralado sem açúcar', 'folhinhas de hortelã (opcional)'],
    steps: [
      'Corte a manga em cubos numa tigela.',
      'Rale a casca do limão por cima e esprema umas gotas.',
      'Finalize com o coco e a hortelã.',
    ],
    contains: ['coco'], free: true, hex: '#f7c600', ink: '#3b2a00',
  },
  {
    id: 'tamara-recheada', name: 'Tâmara recheada', emoji: '🌴', cravings: ['crocante', 'chocolate'], minutes: 2,
    needs: ['tamara', 'pasta-amendoim'],
    ingredients: ['4 tâmaras', '1 colher (sopa) de pasta de amendoim', 'castanhas picadas ou uma pitada de cacau'],
    steps: [
      'Abra as tâmaras de um lado e tire o caroço.',
      'Recheie com a pasta de amendoim.',
      'Aperte por cima as castanhas picadas, ou polvilhe cacau.',
    ],
    tip: 'Gelada fica com gosto de bombom. Dá para deixar 10 minutos no congelador.',
    contains: ['amendoim'], free: true, hex: '#c9853c', ink: '#2e1800',
  },
  {
    id: 'banana-canela', name: 'Banana quentinha com canela', emoji: '🍌', cravings: ['cremoso'], minutes: 5,
    needs: ['banana'],
    ingredients: ['1 banana madura', 'canela em pó', '2 colheres (sopa) de iogurte de coco (opcional)'],
    steps: [
      'Corte a banana ao meio, no comprido.',
      'Doure numa frigideira antiaderente, sem óleo, 2 minutos de cada lado.',
      'Polvilhe canela. Se tiver, sirva com iogurte de coco gelado por cima.',
    ],
    contains: [], free: true, hex: '#ff7a1a', ink: '#3d1a00',
  },
  {
    id: 'mousse-abacate', name: 'Mousse de abacate e cacau', emoji: '🥑', cravings: ['chocolate', 'cremoso'], minutes: 5,
    needs: ['abacate', 'cacau', 'tamara'],
    ingredients: ['½ abacate bem maduro', '2 colheres (sopa) de cacau em pó', '4 tâmaras sem caroço', '3 colheres (sopa) de leite vegetal'],
    steps: [
      'Bata tudo no processador até ficar liso, sem nenhum pedacinho verde.',
      'Prove: se quiser mais doce, mais uma tâmara.',
      'Sirva num copinho. Gelada por 10 minutos fica ainda melhor.',
    ],
    tip: 'Ninguém adivinha o abacate. Faça o teste com quem jura que não gosta.',
    contains: [], free: false, hex: '#27b35a', ink: '#fff',
  },
  {
    id: 'beijinho-tamara', name: 'Beijinho de tâmara', emoji: '🥥', cravings: ['cremoso'], minutes: 5,
    needs: ['tamara', 'coco'],
    ingredients: ['5 tâmaras sem caroço', '3 colheres (sopa) de coco ralado sem açúcar, mais um pouco para enrolar', '1 cravo por bolinha (opcional)'],
    steps: [
      'Amasse as tâmaras até virar pasta (2 minutos em água quente, se estiverem duras).',
      'Misture o coco.',
      'Enrole, passe no coco e espete um cravo, como na festa.',
    ],
    contains: ['coco'], free: false, hex: '#e8364f', ink: '#fff',
  },
  {
    id: 'sorvete-manga-maracuja', name: 'Sorvete de manga e maracujá', emoji: '🍧', cravings: ['fresquinho', 'cremoso'], minutes: 3,
    needs: ['manga-congelada', 'maracuja'],
    ingredients: ['1 xícara de manga congelada', 'polpa de 1 maracujá', '2 colheres (sopa) de leite de coco ou vegetal'],
    steps: [
      'Bata a manga com o leite até ficar cremosa.',
      'Coloque na tigela e regue com a polpa do maracujá, com as sementes.',
    ],
    contains: ['coco'], free: false, hex: '#f7c600', ink: '#3b2a00',
  },
  {
    id: 'maca-crocante', name: 'Rodelas de maçã crocantes', emoji: '🍎', cravings: ['crocante', 'fresquinho'], minutes: 3,
    needs: ['maca', 'pasta-amendoim'],
    ingredients: ['1 maçã', '1 colher (sopa) de pasta de amendoim', 'castanhas picadas', 'canela'],
    steps: [
      'Corte a maçã em rodelas grossas e tire o miolo com uma faquinha.',
      'Espalhe a pasta de amendoim em cada rodela.',
      'Cubra com castanhas picadas e canela. Coma como biscoito.',
    ],
    contains: ['amendoim', 'castanhas'], free: false, hex: '#e8364f', ink: '#fff',
  },
  {
    id: 'castanhas-caramelizadas', name: 'Castanhas caramelizadas', emoji: '🌰', cravings: ['crocante'], minutes: 5,
    needs: ['castanhas', 'acucar-coco'],
    ingredients: ['½ xícara de castanhas de caju', '1 colher (sopa) de açúcar de coco', '1 colher (sopa) de água', 'canela'],
    steps: [
      'Aqueça as castanhas numa frigideira seca, mexendo, por 2 minutos.',
      'Junte o açúcar de coco, a água e a canela e mexa sem parar até secar e grudar.',
      'Espalhe num prato para esfriar: em 1 minuto ficam crocantes.',
    ],
    contains: ['castanhas', 'coco'], free: false, hex: '#c9853c', ink: '#2e1800',
  },
  {
    id: 'pudim-chia-cacau', name: 'Pudim de chia com cacau', emoji: '🥄', cravings: ['chocolate', 'cremoso'], minutes: 5, waitMinutes: 120,
    needs: ['chia', 'cacau', 'tamara', 'leite-vegetal'],
    ingredients: ['3 colheres (sopa) de chia', '1 xícara de leite vegetal', '1 colher (sopa) de cacau em pó', '2 tâmaras amassadas'],
    steps: [
      'Bata o leite, o cacau e as tâmaras no liquidificador.',
      'Misture a chia num pote e mexa de novo depois de 5 minutos.',
      'Leve à geladeira por 2 horas (ou a noite toda) e coma gelado.',
    ],
    tip: 'Faça 3 potes no domingo: a semana inteira fica resolvida.',
    contains: [], free: false, hex: '#5a3421', ink: '#fff',
  },
  {
    id: 'iogurte-maracuja', name: 'Iogurte de coco com maracujá', emoji: '💛', cravings: ['fresquinho', 'cremoso'], minutes: 2,
    needs: ['iogurte-coco', 'maracuja'],
    ingredients: ['1 pote de iogurte de coco sem açúcar', 'polpa de 1 maracujá', 'lascas de coco ou castanhas picadas'],
    steps: [
      'Coloque o iogurte num copo.',
      'Regue com o maracujá e finalize com as lascas por cima.',
    ],
    contains: ['coco'], free: false, hex: '#ff7a1a', ink: '#3d1a00',
  },
  {
    id: 'trufa-caju', name: 'Trufa de caju e cacau', emoji: '🟫', cravings: ['chocolate', 'crocante'], minutes: 5,
    needs: ['castanhas', 'tamara', 'cacau'],
    ingredients: ['½ xícara de castanhas de caju', '5 tâmaras sem caroço', '2 colheres (sopa) de cacau em pó'],
    steps: [
      'Triture as castanhas no processador até virar farofa.',
      'Junte as tâmaras e o cacau e bata até a massa grudar.',
      'Enrole bolinhas. Se quiser crocante, deixe pedacinhos de castanha.',
    ],
    contains: ['castanhas'], free: false, hex: '#a33fc4', ink: '#fff',
  },
];

export const rescueById = (id: string) => RESCUES.find(r => r.id === id);
export const FREE_COUNT = RESCUES.filter(r => r.free).length;

/** What's missing from the kitchen for this recipe (only meaningful when the person said what they have). */
export const missingFor = (r: Rescue, pantry: string[]) => r.needs.filter(k => !pantry.includes(k));

/**
 * Best first. A recipe must match the craving and fit the time; the kitchen breaks ties (fewest things missing),
 * and when the person skipped the kitchen question, the shortest recipe wins.
 */
export function rankRescues(craving: Craving, time: TimeBudget, pantry: string[]): Rescue[] {
  const max = TIMES.find(t => t.id === time)?.maxMinutes ?? Infinity;
  const fits = (r: Rescue) => r.minutes + (r.waitMinutes ?? 0) <= max;
  const matching = RESCUES.filter(r => r.cravings.includes(craving));
  // Nothing fits the time? Show the quickest ones rather than nothing.
  const pool = matching.some(fits) ? matching.filter(fits) : matching;
  const score = (r: Rescue) => {
    let s = r.cravings[0] === craving ? 2 : 0;
    if (pantry.length) s -= missingFor(r, pantry).length * 3;
    else s -= r.needs.length * 0.5;
    return s - (r.minutes + (r.waitMinutes ?? 0)) / 100;
  };
  return [...pool].sort((a, b) => score(b) - score(a));
}

/** Tropical+ is not sold on its own: it comes with the Clube Tropical (a paid box) or the subscription. */
export const isTropicalPlus = (paidBoxes: number, subscriber: boolean) => subscriber || paidBoxes >= 1;

/** The app's own memory on the phone (localStorage): wins and the last answers. Never personal data. */
export const STORE_KEY = 'tb-vontade-v1';
export interface VontadeStore {
  /** ISO dates (yyyy-mm-dd) of every craving beaten, newest last. */
  wins: string[];
  pantry: string[];
}
export const emptyStore = (): VontadeStore => ({ wins: [], pantry: [] });

/** The phone's own calendar day (not Brasília time): that is what a streak means to the person. */
export const todayISO = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** The last 7 days, oldest first, with how many cravings were beaten on each. */
export function lastSevenDays(wins: string[], now = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const iso = todayISO(d);
    return { iso, label: d.toLocaleDateString('pt-BR', { weekday: 'narrow' }), count: wins.filter(w => w === iso).length };
  });
}

/** Days in a row (ending today or yesterday) with at least one craving beaten. */
export function streak(wins: string[], now = new Date()) {
  const days = new Set(wins);
  const d = new Date(now);
  if (!days.has(todayISO(d))) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(todayISO(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
