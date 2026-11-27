/**
 * The Recipe Journal (Diário de Receitas): every fact the pages, the admin and the server share. Pure, no server-only
 * imports, so the admin and the client components can use it too. Schema: migration_55_recipe_journal.sql.
 *
 * Words rule (Andrew): NEVER "gluten-free" or "sugar-free" anywhere. The diet filter says "Sem trigo / Wheat-free" and
 * "SOS-free". Andrew's brief asked for a "Gluten-Free" category; it is "Sem trigo" on purpose.
 */

export type JournalLang = 'pt' | 'en';
export const JOURNAL_LANGS: JournalLang[] = ['pt', 'en'];

/** Where the journal lives in each language. Dutch later: add 'nl' here, a page folder and a text block per recipe. */
export const JOURNAL_PATH: Record<JournalLang, string> = { pt: '/diario', en: '/en/journal' };
export const journalHome = (lang: JournalLang) => JOURNAL_PATH[lang];
export const recipeHref = (lang: JournalLang, r: Pick<JournalRecipe, 'slug' | 'slug_en'>) =>
  `${JOURNAL_PATH[lang]}/${lang === 'en' ? (r.slug_en || r.slug) : r.slug}`;
export const collectionHref = (lang: JournalLang, slug: string) => `${JOURNAL_PATH[lang]}/${lang === 'en' ? 'collections' : 'colecoes'}/${slug}`;
export const libraryHref = (lang: JournalLang) => `${JOURNAL_PATH[lang]}/${lang === 'en' ? 'my-recipes' : 'minhas-receitas'}`;

export type Difficulty = 'facil' | 'media' | 'avancada';

/** The public part of a recipe, in one language. */
export interface RecipeText {
  title: string;
  subtitle?: string;
  /** One or two sentences for the cards and the featured block. */
  summary?: string;
  /** The editorial introduction / story behind the recipe (public, also on premium recipes). */
  story?: string;
  /** "What makes it special": short lines, public. */
  benefits?: string[];
  /** "8 porções", "Makes 12 balls". */
  yield?: string;
  /** The first few ingredient lines, shown on a locked recipe. Written by the admin on save. */
  preview?: string[];
  /** Every ingredient line, lower-case, so the library search finds premium recipes by ingredient. Written on save. */
  search?: string;
  seo_title?: string;
  seo_description?: string;
}

export interface RecipeSection { name: string; ingredients: string[]; steps: string[] }

/** The protected part of a recipe, in one language (journal_recipe_bodies, readable only with access). */
export interface RecipeBody {
  sections: RecipeSection[];
  notes?: string;
  storage?: string;
}

export interface JournalRecipe {
  id: string;
  slug: string;
  slug_en?: string | null;
  status: 'draft' | 'published';
  publish_at: string;
  is_free: boolean;
  price_brl: number;
  promo_price_brl?: number | null;
  is_featured: boolean;
  sort: number;
  hero_url?: string | null;
  gallery: string[];
  video_url?: string | null;
  prep_minutes: number;
  cook_minutes: number;
  chill_minutes: number;
  difficulty: Difficulty;
  categories: string[];
  tags: string[];
  contains: string[];
  text: Partial<Record<JournalLang, RecipeText>>;
  views: number;
  created_at: string;
}

export interface JournalCategory {
  slug: string;
  /** 'tema' = what it is or when (Christmas, Cheesecakes); 'dieta' = how it is made (Raw, SOS-free). */
  kind: 'tema' | 'dieta';
  name: Record<JournalLang, string>;
  sort: number;
}

export interface CollectionText { title: string; summary?: string; description?: string }

export interface JournalCollection {
  id: string;
  slug: string;
  published: boolean;
  price_brl: number;
  promo_price_brl?: number | null;
  cover_url?: string | null;
  sort: number;
  text: Partial<Record<JournalLang, CollectionText>>;
  recipe_ids: string[];
}

/** The launch categories (also seeded by migration 55; Dolly edits them in the admin). */
export const DEFAULT_CATEGORIES: JournalCategory[] = [
  { slug: 'frutas-tropicais', kind: 'tema', name: { pt: 'Frutas & Tropicais', en: 'Fruit & Tropical' }, sort: 10 },
  { slug: 'chocolate', kind: 'tema', name: { pt: 'Chocolate', en: 'Chocolate' }, sort: 20 },
  { slug: 'natal', kind: 'tema', name: { pt: 'Natal', en: 'Christmas' }, sort: 30 },
  { slug: 'pascoa', kind: 'tema', name: { pt: 'Páscoa', en: 'Easter' }, sort: 40 },
  { slug: 'verao', kind: 'tema', name: { pt: 'Verão', en: 'Summer' }, sort: 50 },
  { slug: 'primavera', kind: 'tema', name: { pt: 'Primavera', en: 'Spring' }, sort: 60 },
  { slug: 'outono', kind: 'tema', name: { pt: 'Outono', en: 'Autumn' }, sort: 70 },
  { slug: 'festas', kind: 'tema', name: { pt: 'Festas & Celebrações', en: 'Festive & Celebrations' }, sort: 80 },
  { slug: 'bolos', kind: 'tema', name: { pt: 'Bolos & Aniversário', en: 'Cakes & Birthday Cakes' }, sort: 90 },
  { slug: 'cookies', kind: 'tema', name: { pt: 'Cookies & Biscoitos', en: 'Cookies & Biscuits' }, sort: 100 },
  { slug: 'brownies-barrinhas', kind: 'tema', name: { pt: 'Brownies & Barrinhas', en: 'Brownies & Bars' }, sort: 110 },
  { slug: 'cheesecakes', kind: 'tema', name: { pt: 'Cheesecakes', en: 'Cheesecakes' }, sort: 120 },
  { slug: 'patisserie', kind: 'tema', name: { pt: 'Entremets & Pâtisserie', en: 'Entremets & Pâtisserie' }, sort: 130 },
  { slug: 'lanche-infantil', kind: 'tema', name: { pt: 'Lanchinhos das Crianças', en: 'Toddler & Kids Snacks' }, sort: 140 },
  { slug: 'cafe-da-manha', kind: 'tema', name: { pt: 'Café da Manhã & Brunch', en: 'Breakfast & Brunch' }, sort: 150 },
  { slug: 'energy-bites', kind: 'tema', name: { pt: 'Bolinhas de Energia', en: 'Energy Bites' }, sort: 160 },
  { slug: 'cru', kind: 'dieta', name: { pt: 'Cru (raw)', en: 'Raw Treats' }, sort: 200 },
  { slug: 'sem-forno', kind: 'dieta', name: { pt: 'Sem forno', en: 'No-Bake' }, sort: 210 },
  { slug: 'sem-trigo', kind: 'dieta', name: { pt: 'Sem trigo', en: 'Wheat-free' }, sort: 220 },
  { slug: 'sos-free', kind: 'dieta', name: { pt: 'SOS-free', en: 'SOS-free' }, sort: 230 },
];

/** Words the journal must never print about our food (Andrew's rule). The admin warns when a recipe contains one. */
export const BANNED_CLAIMS = [/sem\s+gl[uú]ten/i, /gluten[\s-]*free/i, /sem\s+a[cç][uú]car/i, /sugar[\s-]*free/i, /glutenvrij/i, /suikervrij/i];
export const bannedClaimsIn = (s: string) => BANNED_CLAIMS.filter(re => re.test(s)).map(re => (s.match(re) || [''])[0]);

export const DIFFICULTY: Record<Difficulty, Record<JournalLang, string>> = {
  facil: { pt: 'Fácil', en: 'Easy' },
  media: { pt: 'Média', en: 'Medium' },
  avancada: { pt: 'Desafio', en: 'Advanced' },
};

/** The price someone pays today (the promo price when there is one). */
export const priceOf = (r: { price_brl: number; promo_price_brl?: number | null }) =>
  r.promo_price_brl != null && Number(r.promo_price_brl) > 0 && Number(r.promo_price_brl) < Number(r.price_brl) ? Number(r.promo_price_brl) : Number(r.price_brl);

export const fmtBRL = (n: number) => `R$ ${n.toFixed(2).replace('.', ',')}`;

export function fmtMinutes(min: number, lang: JournalLang): string {
  if (!min) return '';
  const h = Math.floor(min / 60), m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** The recipe's text in this language, falling back to Portuguese (the language every recipe is written in). */
export function textOf(r: { text: Partial<Record<JournalLang, RecipeText>> }, lang: JournalLang): RecipeText {
  return { ...(r.text.pt || { title: '' }), ...(r.text[lang] || {}) } as RecipeText;
}
export function collectionTextOf(c: JournalCollection, lang: JournalLang): CollectionText {
  return { ...(c.text.pt || { title: '' }), ...(c.text[lang] || {}) } as CollectionText;
}

export const isLive = (r: Pick<JournalRecipe, 'status' | 'publish_at'>, now = Date.now()) =>
  r.status === 'published' && new Date(r.publish_at).getTime() <= now;

/** The first lines of a body, for the teaser on a locked recipe. */
export const previewFrom = (b: RecipeBody | undefined, n = 4) => (b?.sections?.[0]?.ingredients || []).slice(0, n);
/** The search text of a body: every ingredient line, lower-case, without quantities' fuss. */
export const searchFrom = (b: RecipeBody | undefined) =>
  (b?.sections || []).flatMap(s => s.ingredients).join(' · ').toLowerCase().slice(0, 2000);
/** Lower-case, without accents: "Cúrcuma" and "curcuma" find the same recipe. */
export const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/** Every word of the page copy, in both languages. */
export const JOURNAL_COPY = {
  pt: {
    name: 'Diário de Receitas',
    kicker: 'The Tropical Bakery',
    tagline: 'Receitas plant-based da Chef Dolly: confeitaria belga com frutas do Brasil, sem trigo e o mais perto possível do alimento inteiro.',
    metaDescription: 'Receitas veganas e saudáveis da Chef Dolly, de Itamambuca: doces sem trigo, sem forno e SOS-free. Algumas grátis, outras para desbloquear.',
    featured: 'Receita da semana',
    discover: 'Descobrir a receita',
    explore: 'Explore a biblioteca',
    search: 'Buscar por nome ou ingrediente',
    allThemes: 'Todos os temas',
    diet: 'Como é feita',
    access: 'Acesso',
    all: 'Todas',
    free: 'Grátis',
    premium: 'Premium',
    sort: 'Ordenar',
    newest: 'Mais novas',
    popular: 'Mais vistas',
    az: 'A–Z',
    latest: 'Receitas mais recentes',
    none: 'Nenhuma receita com esses filtros. Tente tirar um.',
    clear: 'Limpar filtros',
    view: 'Ver receita',
    prep: 'Preparo',
    cook: 'Forno',
    chill: 'Geladeira/freezer',
    difficulty: 'Dificuldade',
    yield: 'Rende',
    ingredients: 'Ingredientes',
    method: 'Modo de preparo',
    notes: 'Dicas e variações',
    storage: 'Como guardar',
    dietInfo: 'Informação alimentar',
    contains: 'Contém',
    kitchenNote: 'Vegano, sem trigo e sem leite. Feito numa cozinha que usa castanhas todo dia.',
    special: 'O que ela tem de especial',
    story: 'A história',
    related: 'Você também vai gostar',
    collections: 'Coleções',
    collectionsSoon: 'Coleções de receitas com preço especial chegam em breve.',
    lockTitle: 'Amou esta receita?',
    lockBody: 'Desbloqueie a receita completa: todos os ingredientes, as quantidades e o passo a passo.',
    lockPreview: 'Um gostinho dos ingredientes',
    lockMore: (n: number) => `+ ${n} ingredientes e o passo a passo`,
    unlock: (p: string) => `Desbloquear por ${p}`,
    payPix: 'Pix',
    payCard: 'Cartão',
    payIntl: 'Cartão internacional',
    payHint: 'Pagamento único. A receita fica na sua conta para sempre.',
    payHintMp: 'Pagamento único pelo Mercado Pago (Pix ou cartão). Libera na hora e fica na sua conta para sempre.',
    code: 'Tem um cupom?',
    codeApply: 'Aplicar',
    codeOk: (p: string) => `Cupom aplicado: ${p}`,
    signIn: 'Entre para a receita ficar na sua conta',
    signInSub: 'Com Google ou Facebook é um toque. Ou receba um link no e-mail.',
    checking: 'Conferindo o pagamento…',
    paid: 'Pronto! A receita é sua.',
    waiting: 'Ainda não recebemos a confirmação. Se pagou por Pix, ela libera assim que cair (você recebe um e-mail).',
    cancelled: 'O pagamento não foi concluído. Pode tentar de novo quando quiser.',
    pixTitle: 'Pague com o Pix abaixo',
    pixBody: 'Assim que o pagamento for confirmado, a receita abre aqui e você recebe um e-mail.',
    copy: 'Copiar código Pix',
    copied: 'Copiado!',
    owned: 'Você já tem esta receita.',
    free_badge: 'Grátis',
    premium_badge: 'Premium',
    myRecipes: 'Minhas receitas',
    myEmpty: 'Você ainda não desbloqueou nenhuma receita.',
    myOrders: 'Compras',
    pending: 'aguardando pagamento',
    back: 'Voltar ao Diário',
    other: 'English',
    printBtn: 'Imprimir',
    video: 'Vídeo',
    sweetEscape: 'Do livro Sweet Escape',
    heroKicker: 'The Tropical Bakery · com a Chef Dolly',
    jumpFeatured: 'Receita da semana',
    jumpLibrary: 'Buscar receitas',
    jumpCollections: 'Coleções',
    howKicker: 'Como funciona',
    how: [
      { sign: '🎁', title: 'Grátis', text: 'Abra e cozinhe. Sem cadastro, sem pagar nada.' },
      { sign: '🔓', title: 'Premium', text: 'Pague uma vez e a receita é sua para sempre, com Pix ou cartão.' },
      { sign: '📖', title: 'Minhas receitas', text: 'Tudo o que você desbloqueia fica guardado na sua conta.' },
    ],
    featuredKicker: 'Esta semana',
    featuredIntro: 'A receita que a Dolly escolheu para a semana.',
    exploreKicker: 'A biblioteca',
    exploreIntro: 'Busque por fruta, ocasião ou jeito de fazer: cru, sem forno, sem trigo.',
    collKicker: 'Para levar tudo',
    dollyKicker: 'Quem escreve',
    dollyTitle: 'A cozinha da Dolly, no seu ritmo',
    dollyText: 'Confeiteira belga em Itamambuca, a Dolly troca farinha branca e açúcar refinado por frutas, castanhas e tâmaras sempre que pode. Quer ajuda com a alimentação inteira, não só com os doces?',
    dollyCta: 'Conversa grátis de 30 min com a Dolly',
    dollyMore: 'Conheça a Dolly',
    storyKicker: 'A história',
    specialKicker: 'Por que é boa',
    recipeKicker: 'Mãos na massa',
    relatedKicker: 'Continue cozinhando',
    jumpRecipe: 'Ir para a receita',
  },
  en: {
    name: 'Recipe Journal',
    kicker: 'The Tropical Bakery',
    tagline: 'Plant-based recipes by Chef Dolly: Belgian pâtisserie with Brazilian fruit, wheat-free and as close to whole food as we can get.',
    metaDescription: 'Healthy vegan recipes by Chef Dolly from Itamambuca, Brazil: wheat-free, no-bake and SOS-free treats. Some free, some to unlock.',
    featured: 'Recipe of the week',
    discover: 'Discover the recipe',
    explore: 'Explore the recipe library',
    search: 'Search by name or ingredient',
    allThemes: 'All themes',
    diet: 'How it is made',
    access: 'Access',
    all: 'All',
    free: 'Free',
    premium: 'Premium',
    sort: 'Sort',
    newest: 'Newest',
    popular: 'Most viewed',
    az: 'A–Z',
    latest: 'Latest recipes',
    none: 'No recipes with these filters. Try removing one.',
    clear: 'Clear filters',
    view: 'View recipe',
    prep: 'Prep',
    cook: 'Bake',
    chill: 'Chill/freeze',
    difficulty: 'Difficulty',
    yield: 'Yield',
    ingredients: 'Ingredients',
    method: 'Method',
    notes: 'Notes and variations',
    storage: 'Storage',
    dietInfo: 'Dietary information',
    contains: 'Contains',
    kitchenNote: 'Vegan, wheat-free and dairy-free. Made in a kitchen that uses nuts every day.',
    special: 'What makes it special',
    story: 'The story',
    related: 'You will also love',
    collections: 'Collections',
    collectionsSoon: 'Recipe collections at a special price are coming soon.',
    lockTitle: 'Love this recipe?',
    lockBody: 'Unlock the complete recipe, ingredients and step-by-step instructions.',
    lockPreview: 'A taste of the ingredients',
    lockMore: (n: number) => `+ ${n} more ingredients and every step`,
    unlock: (p: string) => `Unlock for ${p}`,
    payPix: 'Pix',
    payCard: 'Card',
    payIntl: 'Card',
    payHint: 'One-time payment. The recipe stays in your account forever.',
    payHintMp: 'One-time payment. Unlocks right away and stays in your account forever.',
    code: 'Have a code?',
    codeApply: 'Apply',
    codeOk: (p: string) => `Code applied: ${p}`,
    signIn: 'Sign in so the recipe stays in your account',
    signInSub: 'One tap with Google or Facebook, or get a link by e-mail.',
    checking: 'Checking your payment…',
    paid: 'Done! The recipe is yours.',
    waiting: 'We have not received the confirmation yet. It unlocks as soon as it arrives (you will get an e-mail).',
    cancelled: 'The payment was not completed. You can try again any time.',
    pixTitle: 'Pay with the Pix below',
    pixBody: 'As soon as the payment is confirmed the recipe opens here and you get an e-mail.',
    copy: 'Copy Pix code',
    copied: 'Copied!',
    owned: 'You already own this recipe.',
    free_badge: 'Free',
    premium_badge: 'Premium',
    myRecipes: 'My recipes',
    myEmpty: 'You have not unlocked any recipes yet.',
    myOrders: 'Purchases',
    pending: 'waiting for payment',
    back: 'Back to the Journal',
    other: 'Português',
    printBtn: 'Print',
    video: 'Video',
    sweetEscape: 'From the Sweet Escape book',
    heroKicker: 'The Tropical Bakery · with Chef Dolly',
    jumpFeatured: 'Recipe of the week',
    jumpLibrary: 'Find a recipe',
    jumpCollections: 'Collections',
    howKicker: 'How it works',
    how: [
      { sign: '🎁', title: 'Free', text: 'Open it and cook. No sign-up, nothing to pay.' },
      { sign: '🔓', title: 'Premium', text: 'Pay once and the recipe is yours to keep, by card or Pix.' },
      { sign: '📖', title: 'My recipes', text: 'Everything you unlock stays saved in your account.' },
    ],
    featuredKicker: 'This week',
    featuredIntro: 'The recipe Dolly picked for this week.',
    exploreKicker: 'The library',
    exploreIntro: 'Search by fruit, occasion or how it is made: raw, no-bake, wheat-free.',
    collKicker: 'Take them all',
    dollyKicker: 'Who writes them',
    dollyTitle: "Dolly's kitchen, at your pace",
    dollyText: 'A Belgian pastry chef in Itamambuca, Brazil, Dolly swaps white flour and refined sugar for fruit, nuts and dates wherever she can. Want help with everything you eat, not just dessert?',
    dollyCta: 'Free 30-minute call with Dolly',
    dollyMore: 'Meet Dolly',
    storyKicker: 'The story',
    specialKicker: 'Why it is good',
    recipeKicker: 'Let’s bake',
    relatedKicker: 'Keep cooking',
    jumpRecipe: 'Jump to recipe',
  },
};
export type JournalCopy = typeof JOURNAL_COPY.pt;
