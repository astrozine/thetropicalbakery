/**
 * "Bateu Vontade?": the craving-rescue app at /vontade. A sugar craving hits → three taps (what you crave, how long
 * you have, what's in the kitchen) → a treat you can make in a few minutes.
 *
 * Freemium on purpose: the free recipes are real help, so people come back and pass the link on; the rest are
 * Tropical+, which comes with the Clube Tropical (any paid box) or the subscription. So the app is the first rung of
 * the value ladder and also a reason to buy a box.
 *
 * The recipes live in `app_recipes` (migration 48), edited by Dolly in /admin/app-receitas. RESCUES below is the
 * launch set: migration 48 seeds the table from it (tools/vontade-seed.mjs) and the app falls back to it until the
 * migration runs. Every recipe follows GUIDELINES (Fuhrman + Goldhamer), stricter than the bakery's own treats.
 *
 * Pure data and pure functions (no browser or server imports). Allergen ids are the kitchen's own (lib/allergens.ts).
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

/** What might be in the kitchen. `key` is what a recipe's `needs` lists. */
export const PANTRY: { key: string; emoji: string; label: string }[] = [
  { key: 'banana', emoji: '🍌', label: 'Banana' },
  { key: 'banana-congelada', emoji: '🧊', label: 'Banana congelada' },
  { key: 'frutas-vermelhas', emoji: '🫐', label: 'Frutas vermelhas' },
  { key: 'manga', emoji: '🥭', label: 'Manga' },
  { key: 'manga-congelada', emoji: '❄️', label: 'Manga congelada' },
  { key: 'maracuja', emoji: '💛', label: 'Maracujá' },
  { key: 'maca', emoji: '🍎', label: 'Maçã' },
  { key: 'abacate', emoji: '🥑', label: 'Abacate' },
  { key: 'tamara', emoji: '🌴', label: 'Tâmara' },
  { key: 'cacau', emoji: '🍫', label: 'Cacau em pó puro' },
  { key: 'castanhas', emoji: '🌰', label: 'Castanhas' },
  { key: 'pasta-amendoim', emoji: '🥜', label: 'Pasta de amendoim pura' },
  { key: 'sementes', emoji: '🌻', label: 'Sementes (girassol, abóbora)' },
  { key: 'chia', emoji: '⚫', label: 'Chia ou linhaça' },
  { key: 'coco', emoji: '🥥', label: 'Coco ralado sem açúcar' },
  { key: 'leite-vegetal', emoji: '🥛', label: 'Leite vegetal sem açúcar' },
];
export const pantryLabel = (key: string) => PANTRY.find(p => p.key === key)?.label ?? key;

/** Card colors: the seven colors of Sweet Escape, each with the text color that reads on it. */
export const COLORS: { hex: string; ink: string; name: string }[] = [
  { hex: '#f7c600', ink: '#3b2a00', name: 'Amarelo' },
  { hex: '#ff7a1a', ink: '#3d1a00', name: 'Laranja' },
  { hex: '#e8364f', ink: '#fff', name: 'Vermelho' },
  { hex: '#a33fc4', ink: '#fff', name: 'Roxo' },
  { hex: '#27b35a', ink: '#fff', name: 'Verde' },
  { hex: '#c9853c', ink: '#2e1800', name: 'Caramelo' },
  { hex: '#5a3421', ink: '#fff', name: 'Chocolate' },
];
export const inkFor = (hex: string) => COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase())?.ink ?? '#fff';

export interface Rescue {
  /** The slug: stable, used in the app's memory and as the table's unique key. */
  id: string;
  name: string;
  emoji: string;
  /** Dolly's photo (optional): the card shows it over the color. */
  photo?: string | null;
  cravings: Craving[];
  /** Hands-on minutes. `waitMinutes` is fridge/freezer time on top. */
  minutes: number;
  waitMinutes?: number;
  /** Pantry keys the recipe can't do without. Optional extras go in `ingredients` only. */
  needs: string[];
  ingredients: string[];
  steps: string[];
  tip?: string | null;
  /** Ids from lib/allergens.ts. */
  contains: string[];
  /** Free for everyone; the rest is Tropical+. */
  free: boolean;
  hex: string;
  ink: string;
  /** A Tropical+ recipe seen by someone without it: name and card only, no ingredients or steps. */
  locked?: boolean;
}

/**
 * How every recipe in the app is made: Dr. Joel Fuhrman's nutritarian eating and Dr. Alan Goldhamer's SOS-free
 * (no salt, oil or sugar), strictly. No link with either of them, and never imply one. Shown in the app and the admin.
 */
export const GUIDELINES = {
  title: 'Como são as receitas do app',
  rules: [
    { emoji: '🧂', text: 'Sem sal, sem óleo e sem açúcar de nenhum tipo: nem de coco, mascavo, mel, melado, rapadura, agave ou adoçante.' },
    { emoji: '🍓', text: 'O doce vem da fruta inteira. Fruta fresca e frutas vermelhas primeiro; tâmara e fruta seca com moderação.' },
    { emoji: '🌰', text: 'A gordura vem do alimento inteiro (castanhas, sementes, abacate), nunca de óleo. Coco, só um pouquinho.' },
    { emoji: '🌻', text: 'Sementes sempre que der: chia, linhaça, girassol, abóbora.' },
    { emoji: '🏷️', text: 'Cacau, pasta de amendoim e leite vegetal só na versão pura, sem açúcar, sal ou óleo no rótulo.' },
    { emoji: '🌱', text: 'Tudo vegano e sem glúten, sem farinha branca e sem chocolate industrializado.' },
  ],
  credit: 'Inspirado no jeito nutritarian do Dr. Joel Fuhrman e no SOS-free (sem sal, óleo e açúcar) do Dr. Alan Goldhamer. Não temos ligação com eles.',
} as const;

/** Words that break the guidelines, with what to use instead. Matched on whole words, accents ignored. */
const BANNED: { re: RegExp; label: string; instead: string }[] = [
  { re: /\bsal\b|\bsalgad/, label: 'sal', instead: 'tire o sal; limão, canela ou baunilha dão o sabor' },
  { re: /\boleo\b|\bazeite\b|\bmanteiga\b|\bmargarina\b|\bgordura vegetal\b/, label: 'óleo ou gordura', instead: 'use castanha, semente ou abacate; frigideira antiaderente sem nada' },
  { re: /\bacucar\b|\bacucares\b/, label: 'açúcar', instead: 'adoce com fruta: tâmara, banana madura, manga' },
  { re: /\bmel\b|\bmelado\b|\brapadura\b|\bxarope\b|\bagave\b|\bmaple\b|\bmelaco\b/, label: 'adoçante concentrado', instead: 'adoce com fruta inteira (tâmara amassada, banana)' },
  { re: /\badocante\b|\bstevia\b|\bxilitol\b|\beritritol\b|\bsucralose\b/, label: 'adoçante', instead: 'adoce com fruta inteira' },
  { re: /\bfarinha (branca|de trigo)\b|\btrigo\b/, label: 'farinha refinada', instead: 'castanha ou semente moída' },
  { re: /\bchocolate\b(?! em po puro)/, label: 'chocolate industrializado', instead: 'cacau em pó puro (ou alfarroba)' },
  { re: /\bleite condensado\b|\bcreme de leite\b|\bleite de vaca\b|\bovo\b|\bovos\b|\bmanteiga\b/, label: 'ingrediente animal', instead: 'leite vegetal puro, banana ou castanha' },
];
/** Fine when it's the pure version: a reminder, not an error. */
const CHECK_LABEL: { re: RegExp; label: string }[] = [
  { re: /\bleite vegetal\b|\bleite de (coco|castanha|amendoa|aveia)\b/, label: 'leite vegetal: só o sem açúcar, óleo e sal' },
  { re: /\bpasta de amendoim\b|\bpasta de castanha\b|\btahine\b/, label: 'pasta: só 100% do grão, sem sal nem açúcar' },
  { re: /\biogurte\b|\bgranola\b/, label: 'iogurte e granola prontos quase sempre têm açúcar: confira ou faça em casa' },
  { re: /\bcoco\b/, label: 'coco: pouquinho, e sem açúcar' },
];

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export interface GuidelineIssue { line: string; label: string; instead?: string; level: 'erro' | 'conferir' }

/** Reads ingredient and step lines and lists what breaks GUIDELINES (erro) or needs the label checked (conferir). */
export function checkGuidelines(lines: string[]): GuidelineIssue[] {
  const out: GuidelineIssue[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const t = fold(line);
    // "sem açúcar", "sem sal", "sem óleo" say the opposite: read the line without them.
    const bare = t.replace(/\b(sem|nem|zero)\s+(acucar|acucares|sal|oleo|azeite|adocante)(\s*(,|e|ou)\s*(acucar|sal|oleo|azeite))*\b/g, '');
    for (const b of BANNED) {
      if (b.re.test(bare) && !seen.has(b.label + line)) { seen.add(b.label + line); out.push({ line, label: b.label, instead: b.instead, level: 'erro' }); }
    }
    for (const c of CHECK_LABEL) {
      if (c.re.test(bare) && !seen.has(c.label)) { seen.add(c.label); out.push({ line, label: c.label, level: 'conferir' }); }
    }
  }
  return out;
}

/** Allergens the ingredient lines mention, for the editor to tick by itself. */
export function suggestAllergens(lines: string[]): string[] {
  const t = fold(lines.join(' '));
  const ids: string[] = [];
  if (/castanha|caju|amendoa|nozes|\bnoz\b|macadamia|avela|pistache/.test(t)) ids.push('castanhas');
  if (/amendoim/.test(t)) ids.push('amendoim');
  if (/\bcoco\b/.test(t)) ids.push('coco');
  if (/gergelim|tahine/.test(t)) ids.push('gergelim');
  if (/\bsoja\b|tofu/.test(t)) ids.push('soja');
  if (/aveia/.test(t)) ids.push('aveia');
  return ids;
}

const r = (x: Omit<Rescue, 'ink'>): Rescue => ({ ...x, ink: inkFor(x.hex) });

// The launch set, written to GUIDELINES. Dolly reviews and rewrites them in her own words in the admin.
export const RESCUES: Rescue[] = [
  r({
    id: 'brigadeiro-tamara', name: 'Brigadeiro de tâmara', emoji: '🍫', cravings: ['chocolate', 'cremoso'], minutes: 5,
    needs: ['tamara', 'cacau'],
    ingredients: ['5 tâmaras sem caroço', '1 colher (sopa) de cacau em pó puro', '1 colher (chá) de linhaça ou chia moída', 'cacau ou castanha moída para enrolar'],
    steps: [
      'Se as tâmaras estiverem duras, deixe 2 minutos em água quente e escorra.',
      'Amasse com um garfo até virar uma pasta.',
      'Misture o cacau e a linhaça até a massa ficar escura e brilhante.',
      'Enrole 4 bolinhas e passe no cacau ou na castanha moída.',
    ],
    tip: 'Guarde 2 na geladeira: amanhã, quando a vontade voltar, já está resolvido.',
    contains: ['castanhas'], free: true, hex: '#5a3421',
  }),
  r({
    id: 'nice-cream-cacau', name: 'Sorvete de banana com cacau', emoji: '🍨', cravings: ['chocolate', 'cremoso', 'fresquinho'], minutes: 3,
    needs: ['banana-congelada', 'cacau'],
    ingredients: ['2 bananas maduras congeladas em rodelas', '1 colher (sopa) de cacau em pó puro', '2 colheres (sopa) de leite vegetal sem açúcar (ou água)', 'frutas vermelhas por cima (opcional)'],
    steps: [
      'Bata tudo no processador ou liquidificador, parando para raspar as laterais.',
      'Quando ficar liso como sorvete, pare. A banana já adoça tudo.',
      'Coma na hora, com frutas vermelhas por cima se tiver.',
    ],
    tip: 'Banana madura demais? Descasque, corte e congele. É o seu seguro anti-vontade.',
    contains: [], free: true, hex: '#a33fc4',
  }),
  r({
    id: 'manga-limao-chia', name: 'Manga com limão, hortelã e chia', emoji: '🥭', cravings: ['fresquinho'], minutes: 2,
    needs: ['manga'],
    ingredients: ['1 manga madura em cubos', 'raspas e umas gotas de ½ limão', '1 colher (chá) de chia', 'folhinhas de hortelã'],
    steps: [
      'Corte a manga em cubos numa tigela.',
      'Rale a casca do limão por cima e esprema umas gotas.',
      'Polvilhe a chia e finalize com a hortelã.',
    ],
    contains: [], free: true, hex: '#f7c600',
  }),
  r({
    id: 'tamara-recheada', name: 'Tâmara recheada', emoji: '🌴', cravings: ['crocante', 'chocolate'], minutes: 2,
    needs: ['tamara', 'pasta-amendoim'],
    ingredients: ['3 tâmaras', '1 colher (sopa) de pasta de amendoim 100% amendoim', 'castanhas picadas ou uma pitada de cacau puro'],
    steps: [
      'Abra as tâmaras de um lado e tire o caroço.',
      'Recheie com a pasta de amendoim.',
      'Aperte por cima as castanhas picadas, ou polvilhe cacau.',
    ],
    tip: 'Gelada fica com gosto de bombom: 10 minutos no congelador.',
    contains: ['amendoim', 'castanhas'], free: true, hex: '#c9853c',
  }),
  r({
    id: 'banana-canela', name: 'Banana quentinha com canela', emoji: '🍌', cravings: ['cremoso'], minutes: 5,
    needs: ['banana'],
    ingredients: ['1 banana madura', 'canela em pó', '1 colher (sopa) de castanhas picadas ou sementes'],
    steps: [
      'Corte a banana ao meio, no comprido.',
      'Doure numa frigideira antiaderente, sem nada, 2 minutos de cada lado.',
      'Polvilhe canela e as castanhas ou sementes por cima.',
    ],
    contains: ['castanhas'], free: true, hex: '#ff7a1a',
  }),
  r({
    id: 'mousse-abacate', name: 'Mousse de abacate e cacau', emoji: '🥑', cravings: ['chocolate', 'cremoso'], minutes: 5,
    needs: ['abacate', 'cacau', 'tamara'],
    ingredients: ['½ abacate bem maduro', '2 colheres (sopa) de cacau em pó puro', '3 tâmaras sem caroço', '3 colheres (sopa) de leite vegetal sem açúcar', 'frutas vermelhas para servir'],
    steps: [
      'Bata tudo no processador até ficar liso, sem nenhum pedacinho verde.',
      'Prove: se quiser mais doce, mais uma tâmara.',
      'Sirva num copinho com frutas vermelhas por cima.',
    ],
    tip: 'Ninguém adivinha o abacate. Faça o teste com quem jura que não gosta.',
    contains: [], free: false, hex: '#27b35a',
  }),
  r({
    id: 'beijinho-tamara', name: 'Beijinho de tâmara', emoji: '🥥', cravings: ['cremoso'], minutes: 5,
    needs: ['tamara', 'coco'],
    ingredients: ['5 tâmaras sem caroço', '1 colher (sopa) de castanha-de-caju moída', '1 colher (sopa) de coco ralado sem açúcar, para enrolar', '1 cravo por bolinha (opcional)'],
    steps: [
      'Amasse as tâmaras até virar pasta (2 minutos em água quente, se estiverem duras).',
      'Misture a castanha moída.',
      'Enrole, passe de leve no coco e espete um cravo, como na festa.',
    ],
    contains: ['castanhas', 'coco'], free: false, hex: '#e8364f',
  }),
  r({
    id: 'sorvete-manga-maracuja', name: 'Sorvete de manga e maracujá', emoji: '🍧', cravings: ['fresquinho', 'cremoso'], minutes: 3,
    needs: ['manga-congelada', 'maracuja'],
    ingredients: ['1 xícara de manga congelada', 'polpa de 1 maracujá', '2 colheres (sopa) de água ou leite vegetal sem açúcar'],
    steps: [
      'Bata a manga com a água até ficar cremosa.',
      'Coloque na tigela e regue com a polpa do maracujá, com as sementes.',
    ],
    contains: [], free: false, hex: '#f7c600',
  }),
  r({
    id: 'maca-crocante', name: 'Rodelas de maçã crocantes', emoji: '🍎', cravings: ['crocante', 'fresquinho'], minutes: 3,
    needs: ['maca', 'pasta-amendoim'],
    ingredients: ['1 maçã', '1 colher (sopa) de pasta de amendoim 100% amendoim', 'castanhas picadas', '1 colher (chá) de linhaça', 'canela'],
    steps: [
      'Corte a maçã em rodelas grossas e tire o miolo com uma faquinha.',
      'Espalhe a pasta de amendoim em cada rodela.',
      'Cubra com castanhas, linhaça e canela. Coma como biscoito.',
    ],
    contains: ['amendoim', 'castanhas'], free: false, hex: '#e8364f',
  }),
  r({
    id: 'crocante-frigideira', name: 'Crocante de castanhas e sementes', emoji: '🌻', cravings: ['crocante'], minutes: 5,
    needs: ['castanhas', 'sementes', 'tamara'],
    ingredients: ['½ xícara de castanhas picadas', '2 colheres (sopa) de sementes de girassol ou abóbora', '2 tâmaras picadinhas', 'canela'],
    steps: [
      'Toste as castanhas e as sementes numa frigideira seca, mexendo, por 3 a 4 minutos.',
      'Desligue o fogo e misture as tâmaras e a canela: o calor gruda tudo.',
      'Espalhe num prato: em 1 minuto fica crocante. Coma de colher ou por cima de uma fruta.',
    ],
    contains: ['castanhas'], free: false, hex: '#c9853c',
  }),
  r({
    id: 'pudim-chia-cacau', name: 'Pudim de chia com cacau', emoji: '🥄', cravings: ['chocolate', 'cremoso'], minutes: 5, waitMinutes: 120,
    needs: ['chia', 'cacau', 'tamara', 'leite-vegetal'],
    ingredients: ['3 colheres (sopa) de chia', '1 xícara de leite vegetal sem açúcar', '1 colher (sopa) de cacau em pó puro', '2 tâmaras', 'frutas vermelhas para servir'],
    steps: [
      'Bata o leite, o cacau e as tâmaras no liquidificador.',
      'Misture a chia num pote e mexa de novo depois de 5 minutos.',
      'Leve à geladeira por 2 horas (ou a noite toda) e sirva com frutas vermelhas.',
    ],
    tip: 'Faça 3 potes no domingo: a semana inteira fica resolvida.',
    contains: [], free: false, hex: '#5a3421',
  }),
  r({
    id: 'geleia-frutas-vermelhas', name: 'Geleia rápida de frutas vermelhas', emoji: '🫐', cravings: ['fresquinho', 'cremoso'], minutes: 5,
    needs: ['frutas-vermelhas', 'chia'],
    ingredients: ['1 xícara de frutas vermelhas (congeladas servem)', '1 colher (sopa) de chia', '1 banana em rodelas para servir'],
    steps: [
      'Aqueça as frutas numa panelinha por 3 minutos, amassando com o garfo.',
      'Desligue e misture a chia: em 2 minutos engrossa.',
      'Sirva morna sobre a banana. Não precisa de nada para adoçar.',
    ],
    contains: [], free: false, hex: '#a33fc4',
  }),
  r({
    id: 'trufa-caju', name: 'Trufa de caju e cacau', emoji: '🟫', cravings: ['chocolate', 'crocante'], minutes: 5,
    needs: ['castanhas', 'tamara', 'cacau'],
    ingredients: ['½ xícara de castanhas-de-caju', '5 tâmaras sem caroço', '2 colheres (sopa) de cacau em pó puro'],
    steps: [
      'Triture as castanhas no processador até virar farofa.',
      'Junte as tâmaras e o cacau e bata até a massa grudar.',
      'Enrole bolinhas. Se quiser crocante, deixe pedacinhos de castanha.',
    ],
    contains: ['castanhas'], free: false, hex: '#a33fc4',
  }),
];

/** One `app_recipes` row (migration 48). */
export interface RecipeRow {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  photo_url: string | null;
  color: string;
  cravings: string[];
  minutes: number;
  wait_minutes: number;
  needs: string[];
  ingredients: string[];
  steps: string[];
  tip: string | null;
  contains: string[];
  is_free: boolean;
  published: boolean;
  sort: number;
  updated_at?: string;
}

/** What app_recipe_cards() gives everyone: enough to rank and tease a locked recipe, never its method. */
export type RecipeCard = Pick<RecipeRow, 'slug' | 'name' | 'emoji' | 'photo_url' | 'color' | 'cravings' | 'minutes' | 'wait_minutes' | 'needs' | 'is_free' | 'sort'>;

const isCraving = (c: string): c is Craving => CRAVINGS.some(x => x.id === c);

export function rescueFromRow(row: RecipeCard & Partial<RecipeRow>, locked = false): Rescue {
  return {
    id: row.slug, name: row.name, emoji: row.emoji || '🍓', photo: row.photo_url,
    cravings: (row.cravings || []).filter(isCraving), minutes: row.minutes, waitMinutes: row.wait_minutes || undefined,
    needs: row.needs || [], ingredients: locked ? [] : row.ingredients || [], steps: locked ? [] : row.steps || [],
    tip: locked ? null : row.tip ?? null, contains: row.contains || [], free: row.is_free,
    hex: row.color, ink: inkFor(row.color), locked,
  };
}

export const freeCount = (list: Rescue[]) => list.filter(x => x.free).length;

/** What's missing from the kitchen for this recipe (only meaningful when the person said what they have). */
export const missingFor = (x: Rescue, pantry: string[]) => x.needs.filter(k => !pantry.includes(k));

/**
 * Best first. A recipe must match the craving and fit the time; the kitchen breaks ties (fewest things missing),
 * and when the person skipped the kitchen question, the shortest recipe wins.
 */
export function rankRescues(list: Rescue[], craving: Craving, time: TimeBudget, pantry: string[]): Rescue[] {
  const max = TIMES.find(t => t.id === time)?.maxMinutes ?? Infinity;
  const fits = (x: Rescue) => x.minutes + (x.waitMinutes ?? 0) <= max;
  const matching = list.filter(x => x.cravings.includes(craving));
  // Nothing fits the time? Show the quickest ones rather than nothing.
  const pool = matching.some(fits) ? matching.filter(fits) : matching;
  const score = (x: Rescue) => {
    let s = x.cravings[0] === craving ? 2 : 0;
    if (pantry.length) s -= missingFor(x, pantry).length * 3;
    else s -= x.needs.length * 0.5;
    return s - (x.minutes + (x.waitMinutes ?? 0)) / 100;
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
