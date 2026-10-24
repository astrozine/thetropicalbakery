/**
 * "Bateu Vontade?": the craving-rescue app at /vontade. ANY craving hits (sweet, salt, umami, cheese, fried, soda,
 * bread) → three taps (what you crave, how long you have, what's in the kitchen) → the same pleasure found inside
 * whole plant food, ready in a few minutes.
 *
 * The idea behind it: find the SAME thing, inside the fiber. Salt → the acid of lime (or cupuaçu, which turns peanuts
 * into paçoca); umami → mushrooms; cheese → cashew + nutritional yeast; fried → oven crunch + avocado. And cravings
 * shrink as the day gets more nutrient-dense (Fuhrman's G-BOMBS), which the app tracks next to the cravings.
 *
 * Each craving has a GUIDE (free: what you're really after, the swaps, an honest "what it takes") and a PLAN
 * (Tropical+: week by week, traps, the daily anchor). The plans live server-side in lib/vontadePlans.ts and are
 * sent by /api/vontade/plan only to members, apart from the outline and the first phase.
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

export type Craving =
  | 'chocolate' | 'cremoso' | 'fresquinho' | 'crocante'
  | 'salgadinho' | 'umami' | 'queijo' | 'frito' | 'refri' | 'paoemassa';
export type CravingGroup = 'doce' | 'salgado';
export type TimeBudget = 'agora' | 'cinco' | 'espera';

export const CRAVING_GROUPS: { id: CravingGroup; label: string }[] = [
  { id: 'doce', label: 'Doce' },
  { id: 'salgado', label: 'Salgado, gorduroso e o resto' },
];

export const CRAVINGS: { id: Craving; group: CravingGroup; emoji: string; label: string; hint: string; hex: string; ink: string }[] = [
  { id: 'chocolate', group: 'doce', emoji: '🍫', label: 'Chocolate', hint: 'aquele cacau que acalma', hex: '#5a3421', ink: '#fff' },
  { id: 'cremoso', group: 'doce', emoji: '🍮', label: 'Docinho cremoso', hint: 'brigadeiro, mousse, colher', hex: '#c9853c', ink: '#2e1800' },
  { id: 'fresquinho', group: 'doce', emoji: '🥭', label: 'Fresquinho', hint: 'fruta, gelado, tropical', hex: '#f7c600', ink: '#3b2a00' },
  { id: 'crocante', group: 'doce', emoji: '🥜', label: 'Crocante', hint: 'algo para morder', hex: '#27b35a', ink: '#fff' },
  { id: 'salgadinho', group: 'salgado', emoji: '🧂', label: 'Salgadinho', hint: 'sal, pacote, petisco', hex: '#ff7a1a', ink: '#3d1a00' },
  { id: 'umami', group: 'salgado', emoji: '🍄', label: 'Comida com sustância', hint: 'umami, caldo, "carne"', hex: '#5a3421', ink: '#fff' },
  { id: 'queijo', group: 'salgado', emoji: '🧀', label: 'Queijo', hint: 'cremoso, gratinado, pizza', hex: '#f7c600', ink: '#3b2a00' },
  { id: 'frito', group: 'salgado', emoji: '🍟', label: 'Fritura', hint: 'batata frita, pastel, lanche', hex: '#e8364f', ink: '#fff' },
  { id: 'refri', group: 'salgado', emoji: '🥤', label: 'Refri', hint: 'gelado, gás, aquele docinho', hex: '#a33fc4', ink: '#fff' },
  { id: 'paoemassa', group: 'salgado', emoji: '🍞', label: 'Pão e massa', hint: 'pãozinho, macarrão, bolo', hex: '#c9853c', ink: '#2e1800' },
];
export const cravingOf = (id: string) => CRAVINGS.find(c => c.id === id);

export const TIMES: { id: TimeBudget; emoji: string; label: string; hint: string; maxMinutes: number }[] = [
  { id: 'agora', emoji: '⚡', label: 'Agora!', hint: 'até 3 minutos', maxMinutes: 3 },
  { id: 'cinco', emoji: '⏱️', label: 'Tenho 5 minutinhos', hint: 'sem forno', maxMinutes: 5 },
  { id: 'espera', emoji: '🧊', label: 'Posso esperar', hint: 'vale forno ou geladeira', maxMinutes: Infinity },
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
  { key: 'limao', emoji: '🍋', label: 'Limão' },
  { key: 'cupuacu', emoji: '🤎', label: 'Polpa de cupuaçu sem açúcar' },
  { key: 'cacau', emoji: '🍫', label: 'Cacau em pó puro' },
  { key: 'castanhas', emoji: '🌰', label: 'Castanhas' },
  { key: 'amendoim', emoji: '🥜', label: 'Amendoim torrado sem sal' },
  { key: 'pasta-amendoim', emoji: '🫙', label: 'Pasta de amendoim pura' },
  { key: 'sementes', emoji: '🌻', label: 'Sementes (girassol, abóbora)' },
  { key: 'chia', emoji: '⚫', label: 'Chia ou linhaça' },
  { key: 'coco', emoji: '🥥', label: 'Coco ralado sem açúcar' },
  { key: 'leite-vegetal', emoji: '🥛', label: 'Leite vegetal sem açúcar' },
  { key: 'cogumelo', emoji: '🍄', label: 'Cogumelos' },
  { key: 'alho-cebola', emoji: '🧅', label: 'Alho e cebola' },
  { key: 'tomate', emoji: '🍅', label: 'Tomate' },
  { key: 'pepino', emoji: '🥒', label: 'Pepino' },
  { key: 'cenoura', emoji: '🥕', label: 'Cenoura' },
  { key: 'batata', emoji: '🍠', label: 'Batata ou batata-doce' },
  { key: 'grao-de-bico', emoji: '🫘', label: 'Grão-de-bico cozido' },
  { key: 'feijao', emoji: '🫘', label: 'Feijão cozido' },
  { key: 'aveia', emoji: '🌾', label: 'Aveia em flocos' },
  { key: 'milho-pipoca', emoji: '🍿', label: 'Milho de pipoca' },
  { key: 'levedura', emoji: '✨', label: 'Levedura nutricional' },
  { key: 'agua-gas', emoji: '🫧', label: 'Água com gás' },
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
    { emoji: '🍋', text: 'O salgado vem da acidez e do aroma: limão, cupuaçu, alho, cebola, ervas, pimenta e cogumelo no lugar do sal.' },
    { emoji: '🌱', text: 'Tudo vegano e sem glúten, sem farinha branca e sem chocolate industrializado.' },
  ],
  credit: 'Inspirado no jeito nutritarian do Dr. Joel Fuhrman e no SOS-free (sem sal, óleo e açúcar) do Dr. Alan Goldhamer. Não temos ligação com eles.',
} as const;

/**
 * Fuhrman's G-BOMBS: the six foods that make a day nutrient-dense. The app's daily tracker, because the denser the
 * day, the weaker the craving ("toxic hunger" fades). Letters stay in English so the acronym holds.
 */
export const GBOMBS: { id: string; letter: string; emoji: string; label: string }[] = [
  { id: 'greens', letter: 'G', emoji: '🥬', label: 'Folhas verdes' },
  { id: 'beans', letter: 'B', emoji: '🫘', label: 'Feijões' },
  { id: 'onions', letter: 'O', emoji: '🧅', label: 'Cebola e alho' },
  { id: 'mushrooms', letter: 'M', emoji: '🍄', label: 'Cogumelos' },
  { id: 'berries', letter: 'B', emoji: '🫐', label: 'Frutas vermelhas' },
  { id: 'seeds', letter: 'S', emoji: '🌻', label: 'Sementes' },
];
export const DENSITY = {
  title: 'Por que o prato denso derruba a vontade',
  text: [
    'Caloria não é o que sacia: nutriente e fibra são. Um dia de comida pobre em nutrientes deixa aquele desconforto que parece fome (tremedeira, irritação, vontade de beliscar). O Dr. Joel Fuhrman chama isso de fome tóxica.',
    'Quando o dia é denso em nutrientes, com folhas, feijão, cebola, cogumelo, frutas vermelhas e sementes (o G-BOMBS dele), esse desconforto diminui e a vontade perde força. Não é força de vontade: é o prato.',
    'Marque aqui o que entrou no seu dia. O app cruza com as suas vontades e mostra a diferença no seu próprio corpo.',
  ],
  note: 'Não substitui orientação médica ou de nutricionista. Se você toma remédio para pressão ou diabetes, fale com seu médico antes de mudar muito o sal, o açúcar ou o carboidrato.',
} as const;

/** The free half of every craving: what you're really after, the swaps, and the honest truth about what it takes. */
export interface CravingGuide {
  /** What the craving is really looking for. */
  behind: string;
  /** The rule that finds the same thing inside the fiber. */
  principle: string;
  swaps: { from: string; to: string; why: string }[];
  /** 1 (easy) to 5 (the hardest one). Honest, not encouraging. */
  effort: 1 | 2 | 3 | 4 | 5;
  /** How long the palate usually takes to adjust. */
  reset: string;
  honest: string;
  /** The G-BOMBS food that helps this craving most. */
  gbomb: string;
}

export const EFFORT_LABEL = ['', 'Fácil', 'Tranquila', 'Pede atenção', 'Difícil', 'A mais difícil'] as const;

export const GUIDES: Record<Craving, CravingGuide> = {
  chocolate: {
    behind: 'O cacau tem amargor, aroma tostado e um pouco de magnésio. O chocolate de pacote junta isso com açúcar e gordura, a combinação de que o cérebro mais gosta.',
    principle: 'O cacau puro dá o sabor; tâmara e banana dão o doce, com a fibra junto.',
    swaps: [
      { from: 'Chocolate ao leite', to: 'Cacau puro com tâmara', why: 'mesmo sabor, o doce vem da fruta' },
      { from: 'Bombom', to: 'Tâmara recheada com amendoim', why: 'macio, doce e com recheio' },
      { from: 'Sorvete de chocolate', to: 'Banana congelada batida com cacau', why: 'cremoso de verdade em 3 minutos' },
    ],
    effort: 3, reset: '2 a 4 semanas',
    honest: 'Nos primeiros dias, fruta parece sem graça perto do chocolate. Isso muda: depois de 2 a 4 semanas sem açúcar, a maioria das pessoas sente a fruta bem mais doce. O que mais atrapalha é ter chocolate em casa, então tire de vista.',
    gbomb: 'berries',
  },
  cremoso: {
    behind: 'Textura macia e doce é conforto. Muitas vezes a vontade chega no fim do dia, junto com o cansaço.',
    principle: 'A cremosidade vem da fruta madura, do abacate e da castanha batida.',
    swaps: [
      { from: 'Brigadeiro', to: 'Brigadeiro de tâmara', why: 'enrola, brilha e é só fruta e cacau' },
      { from: 'Pudim ou mousse', to: 'Mousse de abacate e cacau', why: 'ninguém adivinha o abacate' },
      { from: 'Doce de leite', to: 'Banana quentinha com canela', why: 'caramelizada sem açúcar nenhum' },
    ],
    effort: 3, reset: '2 a 4 semanas',
    honest: 'Se a vontade vem à noite, muitas vezes é cansaço ou um jantar fraco. Um jantar com feijão e verdura costuma diminuir a vontade mais do que qualquer força de vontade.',
    gbomb: 'beans',
  },
  fresquinho: {
    behind: 'Doce, gelado e azedinho: refresca, hidrata e acorda.',
    principle: 'Fruta congelada vira sorvete; a acidez do limão e do maracujá realça o doce.',
    swaps: [
      { from: 'Sorvete', to: 'Sorvete de manga e maracujá', why: 'só fruta batida, cremoso igual' },
      { from: 'Picolé', to: 'Fruta congelada no palito', why: 'uva, manga, banana com cacau' },
      { from: 'Suco de caixinha', to: 'Fruta inteira com limão e hortelã', why: 'o doce com a fibra junto' },
    ],
    effort: 1, reset: 'alguns dias',
    honest: 'É a vontade mais fácil: a fruta já resolve. O segredo é ter fruta congelada sempre pronta no freezer.',
    gbomb: 'berries',
  },
  crocante: {
    behind: 'Morder e fazer barulho: a crocância descarrega tensão.',
    principle: 'Castanhas e sementes tostadas, maçã gelada e crocante de frigideira seca.',
    swaps: [
      { from: 'Biscoito recheado', to: 'Rodelas de maçã com pasta de amendoim', why: 'crocante, doce e recheado' },
      { from: 'Granola de pacote', to: 'Crocante de castanhas e sementes', why: 'sem o açúcar e o óleo escondidos' },
      { from: 'Paçoca industrial', to: 'Paçoca de cupuaçu', why: 'o azedinho faz o papel do sal' },
    ],
    effort: 2, reset: '1 a 3 semanas',
    honest: 'Castanha é densa em caloria: um punhado (30 g) é a medida. Se for comer na frente da TV, sirva num potinho em vez de levar o pacote.',
    gbomb: 'seeds',
  },
  salgadinho: {
    behind: 'O sal acende o paladar. O salgadinho de pacote junta sal, óleo e crocância, feito para você não conseguir parar.',
    principle: 'O limão faz o papel do sal: a acidez acende o sabor do mesmo jeito. A crocância vem do forno, não do óleo.',
    swaps: [
      { from: 'Sal', to: 'Limão, raspas e suco', why: 'a acidez acende o sabor como o sal' },
      { from: 'Salgadinho de pacote', to: 'Grão-de-bico crocante com páprica', why: 'crocante de forno, com fibra e proteína' },
      { from: 'Amendoim salgado', to: 'Amendoim com cupuaçu', why: 'o azedo do cupuaçu vira gosto de paçoca' },
    ],
    effort: 4, reset: '3 a 8 semanas',
    honest: 'O sal é das vontades que mais demoram a passar, e é melhor saber disso logo. Nas primeiras semanas, comida sem sal parece sem graça. O paladar se ajusta aos poucos: depois de algumas semanas, a comida de antes começa a parecer salgada demais. Ervas, alho, cebola, limão e pimenta seguram você nesse período.',
    gbomb: 'onions',
  },
  umami: {
    behind: 'Umami é o gosto de "comida com sustância": caldo, carne, shoyu. O corpo lê como sinal de proteína.',
    principle: 'Cogumelo é umami puro. Tomate maduro, cebola dourada e alho completam.',
    swaps: [
      { from: 'Carne ou hambúrguer', to: 'Cogumelos tostados na frigideira seca', why: 'dourados, intensos, mastigáveis' },
      { from: 'Caldo em cubo ou shoyu', to: 'Caldo de cogumelo, tomate e cebola', why: 'o mesmo fundo de sabor, sem o sal' },
      { from: 'Queijo ralado', to: 'Levedura nutricional', why: 'o gosto tostado que falta no prato' },
    ],
    effort: 2, reset: '1 a 3 semanas',
    honest: 'É das mais fáceis de resolver com comida de verdade: cogumelo tostado sem óleo fica dourado e intenso. O que pega é o shoyu e o caldo em cubo, que são quase só sal. Troque aos poucos.',
    gbomb: 'mushrooms',
  },
  queijo: {
    behind: 'Queijo junta gordura e sal concentrados, e o sabor fermentado prende. Por isso é das vontades mais teimosas.',
    principle: 'Castanha-de-caju dá a cremosidade, levedura nutricional dá o gosto de queijo, limão dá o azedinho.',
    swaps: [
      { from: 'Queijo cremoso', to: 'Queijinho de caju com limão', why: 'cremoso e azedinho, sem leite' },
      { from: 'Molho de queijo', to: 'Molho de batata, cenoura e caju', why: 'laranja, liso, gratina igual' },
      { from: 'Parmesão na pipoca', to: 'Levedura nutricional', why: 'gosto de queijo, só que é planta' },
    ],
    effort: 4, reset: '3 a 6 semanas',
    honest: 'Muita gente diz que largar o queijo foi a parte mais difícil. Não tente achar o gosto exato logo de cara: o queijinho de caju é outra coisa, gostosa do jeito dela. A vontade costuma diminuir bem depois de algumas semanas totalmente sem.',
    gbomb: 'beans',
  },
  frito: {
    behind: 'Fritura junta gordura, sal, crocância e aroma tostado: a combinação mais forte que existe.',
    principle: 'Forno e frigideira antiaderente dão o dourado sem óleo; abacate e castanha dão a gordura de verdade, com fibra.',
    swaps: [
      { from: 'Batata frita', to: 'Batata-doce rústica de forno', why: 'pontas tostadas, sem uma gota de óleo' },
      { from: 'Pastel ou salgado', to: 'Grão-de-bico crocante', why: 'crocante de forno que dá para levar' },
      { from: 'Maionese', to: 'Guacamole com limão', why: 'a gordura que a vontade procura, com fibra' },
    ],
    effort: 5, reset: '4 a 12 semanas',
    honest: 'É a vontade mais forte e a que mais demora. Estudos com dietas de pouca gordura mostram que o gosto por gordura diminui, mas leva semanas, às vezes meses. Não espere vencer em dias: o plano é trocar refeição por refeição.',
    gbomb: 'greens',
  },
  refri: {
    behind: 'Gelado, gás, doce e muitas vezes cafeína: o refri acorda e refresca. A cafeína também cria hábito.',
    principle: 'O gás você mantém: água com gás, fruta e limão. O doce vem da fruta.',
    swaps: [
      { from: 'Refri', to: 'Soda de maracujá e limão', why: 'gás, gelo e azedinho doce' },
      { from: 'Suco de pacote', to: 'Chá gelado de hibisco', why: 'cor, sabor e zero açúcar' },
      { from: 'Refri para acordar à tarde', to: 'Água gelada e 5 minutos de caminhada', why: 'o sono da tarde pede movimento' },
    ],
    effort: 3, reset: '1 a 2 semanas',
    honest: 'Se o seu refri tem cafeína (cola, guaraná), os primeiros dias sem ele podem trazer dor de cabeça e cansaço. Costuma passar em uma ou duas semanas. Água com gás gelada resolve boa parte da vontade, porque o gás é metade do prazer.',
    gbomb: 'berries',
  },
  paoemassa: {
    behind: 'Pão e massa branca viram açúcar rápido: conforto na hora, e logo a fome volta.',
    principle: 'Não precisa cortar o carboidrato: troque o refinado pelo inteiro. Batata-doce, aveia, feijão e mandioca dão a mesma sustância, com fibra.',
    swaps: [
      { from: 'Pão francês', to: 'Batata-doce assada', why: 'quente, macia e segura até o almoço' },
      { from: 'Bolo ou pão doce', to: 'Panqueca de aveia e banana', why: 'fofinha, sem farinha nem açúcar' },
      { from: 'Macarrão com queijo', to: 'Batata-doce com feijão e cogumelo', why: 'o mesmo conforto, a fome espaça' },
    ],
    effort: 2, reset: '1 a 3 semanas',
    honest: 'A fome que volta logo depois do pão branco é real: ele digere rápido. Com carboidrato inteiro, a fome espaça. A parte difícil é o hábito do café da manhã, então comece por ele.',
    gbomb: 'beans',
  },
};

/** What /api/vontade/plan sends: the whole plan to members, the outline and the first phase to everyone else. */
export interface CravingPlan {
  phases: { when: string; title: string; text?: string }[];
  traps: { trap: string; move?: string }[];
  daily?: string;
  careful?: string;
  /** False: only the outline came (not Tropical+). */
  full: boolean;
}

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
    const bare = t.replace(/\b(sem|nem|zero)\s+(acucar|acucares|sal|oleo|azeite|adocante)(\s*(,|e|ou)\s*(acucar|sal|oleo|azeite))*\b/g, '')
      // Talking ABOUT salt ("o limão faz o papel do sal") and baking paper ("papel-manteiga") are not ingredients.
      .replace(/\b(papel|lugar) do sal\b|\btirando o sal\b|\bpapel[- ]manteiga\b/g, '');
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

  // ---- Beyond sweet: the same pleasure, found inside whole plants.
  r({
    id: 'grao-de-bico-crocante', name: 'Grão-de-bico crocante com limão e páprica', emoji: '🫘', cravings: ['salgadinho', 'frito', 'crocante'], minutes: 5, waitMinutes: 25,
    needs: ['grao-de-bico', 'limao'],
    ingredients: ['1 xícara de grão-de-bico cozido sem sal, bem escorrido', '1 colher (chá) de páprica defumada', '½ colher (chá) de alho em pó', 'raspas e suco de 1 limão'],
    steps: [
      'Seque bem o grão-de-bico num pano: quanto mais seco, mais crocante.',
      'Espalhe numa assadeira com papel-manteiga, sem nada, e asse a 200 °C por 25 minutos (ou 15 na air fryer), sacudindo na metade.',
      'Ainda quente, regue com o suco do limão e jogue as raspas, a páprica e o alho.',
      'Espere 2 minutos: ele termina de ficar crocante fora do forno.',
    ],
    tip: 'O limão faz o papel do sal. Prove antes de achar que falta alguma coisa.',
    contains: [], free: true, hex: '#ff7a1a',
  }),
  r({
    id: 'pepino-limao', name: 'Pepino com limão, pimenta e gergelim', emoji: '🥒', cravings: ['salgadinho', 'fresquinho'], minutes: 2,
    needs: ['pepino', 'limao'],
    ingredients: ['1 pepino em rodelas ou palitos', 'suco de 1 limão', 'pimenta-do-reino ou calabresa em flocos', '1 colher (chá) de gergelim torrado', 'coentro ou cebolinha (opcional)'],
    steps: [
      'Corte o pepino e coloque numa tigela.',
      'Esprema o limão, junte a pimenta e o gergelim e misture.',
      'Deixe 1 minuto pegando gosto e coma gelado.',
    ],
    tip: 'É o petisco de quem está tirando o sal: azedo, picante e crocante.',
    contains: ['gergelim'], free: true, hex: '#27b35a',
  }),
  r({
    id: 'pacoca-cupuacu', name: 'Paçoca de cupuaçu e amendoim', emoji: '🥜', cravings: ['salgadinho', 'crocante'], minutes: 5,
    needs: ['amendoim', 'cupuacu'],
    ingredients: ['1 xícara de amendoim torrado sem sal e sem pele', '2 colheres (sopa) de polpa de cupuaçu sem açúcar', '2 tâmaras sem caroço', 'uma pitada de canela'],
    steps: [
      'Triture o amendoim no processador até virar farofa fina, sem deixar virar pasta.',
      'Junte a polpa de cupuaçu e as tâmaras e pulse até a massa grudar quando apertada.',
      'Prove: o azedinho do cupuaçu faz o papel do sal, e é ele que traz o gosto de paçoca.',
      'Aperte num copinho ou forminha e desenforme.',
    ],
    tip: 'Sem cupuaçu? Raspas e um pouco de suco de limão também acordam o amendoim.',
    contains: ['amendoim'], free: false, hex: '#c9853c',
  }),
  r({
    id: 'cogumelo-tostado', name: 'Cogumelos tostados com alho e limão', emoji: '🍄', cravings: ['umami', 'salgadinho'], minutes: 5,
    needs: ['cogumelo', 'alho-cebola', 'limao'],
    ingredients: ['200 g de cogumelos (paris, shimeji ou shiitake) fatiados', '2 dentes de alho picados', 'suco de ½ limão', 'pimenta-do-reino e salsinha'],
    steps: [
      'Aqueça bem uma frigideira antiaderente, sem nada.',
      'Espalhe os cogumelos e não mexa por 2 minutos: é assim que douram.',
      'Mexa, junte o alho e deixe mais 1 minuto. Se grudar, uma colher de água.',
      'Desligue, regue com o limão e finalize com pimenta e salsinha.',
    ],
    tip: 'Sobre arroz integral ou dentro de uma folha de alface, vira "carne" de verdade.',
    contains: [], free: true, hex: '#5a3421',
  }),
  r({
    id: 'caldo-umami', name: 'Caldo rápido de cogumelo e tomate', emoji: '🍲', cravings: ['umami'], minutes: 5, waitMinutes: 10,
    needs: ['cogumelo', 'tomate', 'alho-cebola'],
    ingredients: ['1 cebola picada', '2 dentes de alho', '150 g de cogumelos picados', '2 tomates maduros picados', '2 xícaras de água', 'tomilho, louro e pimenta', '1 colher (sopa) de levedura nutricional (opcional)'],
    steps: [
      'Doure a cebola na panela, sem nada, pingando água quando grudar.',
      'Junte o alho, os cogumelos e os tomates e mexa por 2 minutos.',
      'Coloque a água e as ervas e cozinhe por 10 minutos.',
      'Desligue, misture a levedura e tome numa caneca.',
    ],
    tip: 'Uma caneca disso no fim da tarde segura a vontade de beliscar até o jantar.',
    contains: [], free: false, hex: '#e8364f',
  }),
  r({
    id: 'pate-cogumelo', name: 'Patê de cogumelo e nozes', emoji: '🫙', cravings: ['umami', 'queijo'], minutes: 5,
    needs: ['cogumelo', 'castanhas', 'alho-cebola'],
    ingredients: ['200 g de cogumelos', '½ xícara de nozes ou castanhas', '1 dente de alho', 'suco de ½ limão', 'tomilho', 'palitos de cenoura e pepino para servir'],
    steps: [
      'Toste os cogumelos e o alho na frigideira seca até dourar.',
      'Bata no processador com as nozes, o limão e o tomilho até ficar cremoso.',
      'Sirva com palitos de legumes para mergulhar.',
    ],
    contains: ['castanhas'], free: false, hex: '#a33fc4',
  }),
  r({
    id: 'pipoca-levedura', name: 'Pipoca de panela seca com levedura', emoji: '🍿', cravings: ['queijo', 'salgadinho', 'frito'], minutes: 5,
    needs: ['milho-pipoca', 'levedura'],
    ingredients: ['¼ xícara de milho de pipoca', '2 colheres (sopa) de levedura nutricional', '½ colher (chá) de páprica', 'gotas de limão'],
    steps: [
      'Coloque o milho numa panela grande, seca e tampada, em fogo médio.',
      'Quando começar a estourar, sacuda a panela de vez em quando até os estouros ficarem espaçados.',
      'Passe para uma tigela, borrife umas gotas de limão (ajuda a grudar) e jogue a levedura e a páprica.',
    ],
    tip: 'A levedura nutricional tem gosto de queijo: é ela que faz a mágica.',
    contains: [], free: true, hex: '#f7c600',
  }),
  r({
    id: 'queijinho-caju', name: 'Queijinho de caju com limão', emoji: '🧀', cravings: ['queijo', 'cremoso'], minutes: 5,
    needs: ['castanhas', 'levedura', 'limao'],
    ingredients: ['1 xícara de castanha-de-caju crua, de molho por 2 horas (ou 10 minutos em água fervente)', '2 colheres (sopa) de levedura nutricional', 'suco de 1 limão', '½ dente de alho', '3 a 4 colheres (sopa) de água'],
    steps: [
      'Escorra a castanha.',
      'Bata tudo no processador, raspando as laterais, até ficar liso e cremoso.',
      'Prove e ajuste o limão: o azedinho é o que lembra queijo.',
      'Sirva com palitos de legumes ou sobre batata-doce.',
    ],
    tip: 'Na geladeira dura 4 dias e fica mais firme a cada dia.',
    contains: ['castanhas'], free: false, hex: '#ff7a1a',
  }),
  r({
    id: 'molho-queijo-batata', name: 'Molho "de queijo" de batata e cenoura', emoji: '🥕', cravings: ['queijo', 'paoemassa'], minutes: 5, waitMinutes: 15,
    needs: ['batata', 'cenoura', 'castanhas', 'levedura'],
    ingredients: ['1 batata média em cubos', '1 cenoura em rodelas', '¼ xícara de castanha-de-caju', '2 colheres (sopa) de levedura nutricional', 'suco de ½ limão', '½ colher (chá) de alho em pó', 'água do cozimento'],
    steps: [
      'Cozinhe a batata e a cenoura em água por 15 minutos.',
      'Bata no liquidificador com a castanha, a levedura, o limão, o alho e ½ xícara da água do cozimento.',
      'Use sobre brócolis, batata ou macarrão integral, e leve ao forno para gratinar se quiser.',
    ],
    contains: ['castanhas'], free: false, hex: '#f7c600',
  }),
  r({
    id: 'batata-doce-forno', name: 'Batata-doce rústica de forno', emoji: '🍠', cravings: ['frito', 'paoemassa', 'salgadinho'], minutes: 5, waitMinutes: 30,
    needs: ['batata'],
    ingredients: ['1 batata-doce grande com casca, em palitos grossos', '1 colher (chá) de páprica defumada', 'alecrim e alho em pó', 'limão para servir'],
    steps: [
      'Lave bem e corte em palitos, sem descascar.',
      'Espalhe numa assadeira com papel-manteiga, sem nada, e tempere com páprica, alho e alecrim.',
      'Asse a 220 °C por 30 minutos, virando na metade, até as pontas tostarem (ou 18 na air fryer).',
      'Esprema limão por cima na hora de comer.',
    ],
    tip: 'Com o guacamole vira o combo da batata frita com maionese.',
    contains: [], free: true, hex: '#ff7a1a',
  }),
  r({
    id: 'guacamole', name: 'Guacamole com palitos crocantes', emoji: '🥑', cravings: ['frito', 'salgadinho'], minutes: 5,
    needs: ['abacate', 'limao', 'tomate'],
    ingredients: ['1 abacate maduro pequeno (ou ½ grande)', 'suco de 1 limão', '½ tomate picado', '¼ de cebola roxa picadinha', 'coentro e pimenta', 'palitos de cenoura, pepino e salsão'],
    steps: [
      'Amasse o abacate com o limão.',
      'Junte o tomate, a cebola, o coentro e a pimenta.',
      'Sirva com os palitos para mergulhar.',
    ],
    tip: 'A gordura do abacate é o que a vontade de fritura procura, só que vem com fibra.',
    contains: [], free: false, hex: '#27b35a',
  }),
  r({
    id: 'soda-maracuja', name: 'Soda de maracujá e limão', emoji: '🥤', cravings: ['refri', 'fresquinho'], minutes: 2,
    needs: ['agua-gas', 'maracuja', 'limao'],
    ingredients: ['polpa de 1 maracujá', 'suco de ½ limão', '1 copo de água com gás bem gelada', 'gelo e folhas de hortelã'],
    steps: [
      'No copo, amasse a hortelã com o limão.',
      'Junte a polpa do maracujá e o gelo.',
      'Complete com a água com gás e mexa devagar.',
    ],
    tip: 'Quer mais doce? Bata antes a polpa com 1 tâmara e um pouco de água.',
    contains: [], free: true, hex: '#a33fc4',
  }),
  r({
    id: 'cha-hibisco', name: 'Chá gelado de hibisco com frutas vermelhas', emoji: '🌺', cravings: ['refri', 'fresquinho'], minutes: 5, waitMinutes: 30,
    needs: ['frutas-vermelhas'],
    ingredients: ['2 colheres (sopa) de flor de hibisco seca', '1 litro de água', '1 xícara de frutas vermelhas', '1 pau de canela', 'limão e gelo'],
    steps: [
      'Ferva a água, desligue e coloque o hibisco e a canela. Tampe por 10 minutos.',
      'Coe, junte as frutas vermelhas amassadas e leve à geladeira.',
      'Sirva com muito gelo e rodelas de limão. Meio a meio com água com gás, vira refri.',
    ],
    contains: [], free: false, hex: '#e8364f',
  }),
  r({
    id: 'panqueca-aveia', name: 'Panqueca de aveia e banana', emoji: '🥞', cravings: ['paoemassa', 'cremoso'], minutes: 5,
    needs: ['aveia', 'banana'],
    ingredients: ['1 banana madura', '½ xícara de aveia em flocos (sem glúten, se precisar)', '1 colher (sopa) de linhaça moída', '¼ xícara de leite vegetal sem açúcar', 'canela', 'frutas vermelhas para servir'],
    steps: [
      'Amasse a banana e misture com o resto até virar uma massa grossa.',
      'Numa frigideira antiaderente bem quente, sem nada, coloque colheradas da massa.',
      'Doure 2 minutos de cada lado, sem pressa para virar.',
      'Sirva com frutas vermelhas por cima.',
    ],
    contains: ['aveia'], free: true, hex: '#c9853c',
  }),
  r({
    id: 'batata-recheada', name: 'Batata-doce recheada com feijão e cogumelo', emoji: '🍠', cravings: ['paoemassa', 'umami'], minutes: 5, waitMinutes: 8,
    needs: ['batata', 'feijao', 'cogumelo'],
    ingredients: ['1 batata-doce média', '½ xícara de feijão cozido sem sal (preto ou carioca)', '100 g de cogumelos picados', 'cebolinha, limão e pimenta'],
    steps: [
      'Fure a batata com um garfo e leve ao micro-ondas por 7 a 8 minutos, virando na metade (ou asse por 45 minutos).',
      'Enquanto isso, toste os cogumelos na frigideira seca e junte o feijão para esquentar.',
      'Abra a batata, recheie, esprema limão e finalize com cebolinha.',
    ],
    tip: 'Feijão, cogumelo e batata-doce juntos: é o prato que mais acalma vontade.',
    contains: [], free: false, hex: '#a33fc4',
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
  /** Every craving that hit (the SOS button), newest last. */
  log: { d: string; c: Craving }[];
  /** G-BOMBS ticked per day: { '2026-10-23': ['greens', 'beans'] }. */
  gb: Record<string, string[]>;
}
export const emptyStore = (): VontadeStore => ({ wins: [], pantry: [], log: [], gb: {} });

/** Pantry keys any recipe for this craving needs: the kitchen question only asks about those. */
export const pantryFor = (list: Rescue[], craving: Craving) => {
  const keys = new Set(list.filter(r => r.cravings.includes(craving)).flatMap(r => r.needs));
  return PANTRY.filter(p => keys.has(p.key));
};

/**
 * The person's own evidence for the G-BOMBS idea: cravings per day on dense days (4+ of the 6) vs the others.
 * Needs at least 2 days of each before it says anything.
 */
export function densityInsight(s: VontadeStore, now = new Date()) {
  const days = Array.from({ length: 30 }, (_, i) => { const d = new Date(now); d.setDate(now.getDate() - i); return todayISO(d); })
    .filter(iso => (s.gb[iso]?.length ?? 0) > 0 || s.log.some(l => l.d === iso));
  const per = (iso: string) => s.log.filter(l => l.d === iso).length;
  const dense = days.filter(iso => (s.gb[iso]?.length ?? 0) >= 4);
  const light = days.filter(iso => (s.gb[iso]?.length ?? 0) < 4);
  if (dense.length < 2 || light.length < 2) return null;
  const avg = (a: string[]) => a.reduce((n, iso) => n + per(iso), 0) / a.length;
  return { dense: avg(dense), light: avg(light), denseDays: dense.length, lightDays: light.length };
}

/** The craving that hit most in the last 30 days. */
export function topCraving(s: VontadeStore, now = new Date()): Craving | null {
  const since = new Date(now); since.setDate(now.getDate() - 30);
  const from = todayISO(since);
  const n = new Map<Craving, number>();
  for (const l of s.log) if (l.d >= from) n.set(l.c, (n.get(l.c) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

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
