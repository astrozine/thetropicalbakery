/**
 * The free-recipes funnel: ads and posts → /free-recipes (or /receitas) → two free recipes for an e-mail, with the
 * full Sweet Escape book as an order bump → a thank-you page with a one-time offer for the book and, for people
 * around Ubatuba / Paraty, the local ladder (box, subscription, course, brunch, events menu) → an e-mail sequence
 * that ends in a 48-hour welcome price (the downsell).
 *
 * Every fact the pages, the server and the e-mails share, plus the page words in the four languages the PDFs come
 * in. Pure data, no imports beyond types and the book's own facts, so client pages and the server read it alike.
 * Prices live in lib/ebook.ts (BOOK_OFFERS); never write one here.
 */

import type { EbookLang } from './ebookCopy';
import type { ContactTag } from './emailTopics';

export const FUNNEL = {
  /** The landing page per language. /receitas is the Portuguese one (the short address for Brazilian ads). */
  pagePath: { en: '/free-recipes', pt: '/receitas', es: '/free-recipes/es', nl: '/free-recipes/nl' } as Record<EbookLang, string>,
  thanksPath: '/free-recipes/obrigado',
  /** The welcome-price page the downsell e-mail links to (?t=<offer token>). */
  offerPath: '/free-recipes/oferta',
  /** email_contacts.source and the list tag every sign-up gets. */
  source: 'receitas-gratis',
  tag: 'receitas' as ContactTag,
  /** The two recipes inside: day and color in the book, and the photo on the page. */
  recipeDays: [3, 6],
} as const;

/** The free PDF, public on purpose: it is a gift, and passing it on is marketing. */
export const freePdf = (lang: EbookLang) => `/free-recipes/free-recipes-${lang}.pdf`;
export const freeCover = (lang: EbookLang) => `/free-recipes/cover-${lang}.webp`;

/** Where the person is: decides whether the local offers appear. */
export type Segment = 'local' | 'visiting' | 'away';
export const SEGMENTS: Segment[] = ['local', 'visiting', 'away'];
export const isSegment = (v: unknown): v is Segment => v === 'local' || v === 'visiting' || v === 'away';
export const isNearby = (s: Segment | null | undefined) => s === 'local' || s === 'visiting';

/** What a nearby person would love most: one rung of the local ladder each. */
export type Interest = 'box' | 'course' | 'brunch' | 'events';
export const isInterest = (v: unknown): v is Interest => v === 'box' || v === 'course' || v === 'brunch' || v === 'events';

export const INTERESTS: { id: Interest; emoji: string; path: string; img: string; tags: ContactTag[]; second?: { path: string } }[] = [
  // The box is the cheapest local yes; the subscription is the next rung, shown under it.
  { id: 'box', emoji: '📦', path: '/caixas', img: '/box1.jpg', tags: ['cliente'], second: { path: '/assinatura' } },
  { id: 'brunch', emoji: '🥂', path: '/brunch', img: '/brunch/brunch-mesa.webp', tags: [] },
  { id: 'course', emoji: '👩‍🍳', path: '/cursos', img: '/dolly-course1.jpg', tags: ['cursos'] },
  { id: 'events', emoji: '🎉', path: '/menu', img: '/event_hero.jpg', tags: ['eventos'] },
];

/** The e-mail sequence after the sign-up (automation 'receitas-sequencia'): day after sign-up → campaign. */
export const SEQUENCE = [
  { day: 1, campaignId: 'receitas-d1', sells: false, nearbyOnly: false },
  { day: 3, campaignId: 'receitas-d3', sells: true, nearbyOnly: false },
  { day: 5, campaignId: 'receitas-d5', sells: true, nearbyOnly: false },
  { day: 7, campaignId: 'receitas-d7', sells: true, nearbyOnly: false },
  { day: 9, campaignId: 'receitas-local', sells: false, nearbyOnly: true },
] as const;
/** How long the welcome price in the day-5 e-mail stays open, in days after that e-mail. */
export const WELCOME_DAYS = 2;

// ------------------------------------------------------------------ page words

export interface FunnelCopy {
  meta: { title: string; description: string; ogLocale: string };
  hero: { eyebrow: string; title: string; em: string; lead: string; ticks: string[]; badge: string; badgeOf: string; paidTag: string };
  /** The "2 of the 7" strip in the hero: the whole book as seven photos, the two free ones lit up. */
  strip: { label: string; worth: string; free: string };
  form: {
    title: string; name: string; email: string; where: string; segments: Record<Segment, string>;
    submit: string; submitBump: string; busy: string; fine: string; errName: string; errEmail: string; errWhere: string; errGeneric: string;
  };
  bump: { tag: string; title: string; text: string; pay: string };
  recipes: { kicker: string; title: string; items: { name: string; note: string; line: string }[] };
  /** The five recipes that stay in the paid book, as a tease that ticks the order bump. */
  rest: { kicker: string; title: string; text: string; cta: string };
  dolly: { kicker: string; title: string; text: string; sign: string };
  final: { title: string; cta: string };
  thanks: {
    checking: string; title: string; text: string; download: string; spam: string;
    unknownTitle: string; unknownText: string; back: string;
    bookTitle: string; bookWait: string; bookPaid: string; bookDownload: string;
    otoKicker: string; otoTitle: string; otoText: string; otoMissing: string; otoPromise: string; otoPerk: string; otoCta: string; otoNo: string; otoDeclined: string;
    nearKicker: string; nearTitle: Record<'local' | 'visiting', string>; nearQuestion: string;
    interests: Record<Interest, { label: string; title: string; text: string; cta: string; second?: string }>;
    another: string;
    awayKicker: string; awayTitle: string; awayText: string;
    shareTitle: string; shareText: string; shareButton: string; shareMessage: string;
  };
  offer: { kicker: string; title: string; text: string; until: string; was: string; expiredTitle: string; expiredText: string; expiredCta: string };
}

const EN: FunnelCopy = {
  meta: {
    title: '2 free plant-based recipes from Dolly | The Tropical Bakery',
    description: 'Red Berry Bliss Balls and Peanutty Banoffee Bars: two no-oven treats with no refined sugar, free from Dolly’s Sweet Escape. Instant PDF.',
    ogLocale: 'en_US',
  },
  hero: {
    eyebrow: 'Free · 2 recipes from my book Sweet Escape',
    title: '2 treats that taste like',
    em: 'a beach holiday',
    lead: 'Two of the seven recipes from my paid book **Sweet Escape**, yours free: tangy **Red Berry Bliss Balls** and three-layer **Peanutty Banoffee Bars**. No oven, no refined sugar, no wheat flour. Just fruit, nuts and dates.',
    ticks: ['No oven, 20 minutes of work', 'Vegan, no refined sugar, no gluten', 'Instant PDF in your language'],
    badge: 'FREE', badgeOf: 'of 7 recipes', paidTag: '7 recipes · {price}',
  },
  strip: { label: '**2 of the 7** recipes from Sweet Escape', worth: 'The book sells for **{price}**. These two are on me.', free: 'Free',
  },
  form: {
    title: 'Where should I send them?',
    name: 'First name',
    email: 'E-mail',
    where: 'Where are you?',
    segments: { local: 'Ubatuba / Paraty area', visiting: 'Visiting soon', away: 'Somewhere else' },
    submit: 'Send me the 2 recipes',
    submitBump: 'Send my recipes + the full book · {price}',
    busy: 'Sending…',
    fine: 'Free. One e-mail with your recipes, then a few notes from my kitchen. Leave whenever you like.',
    errName: 'Tell me your first name, so I know who I’m baking for.',
    errEmail: 'That e-mail doesn’t look right: it is where your recipes go.',
    errWhere: 'Pick where you are (it helps me send you the right things).',
    errGeneric: 'Something went wrong. Please try again in a moment.',
  },
  bump: {
    tag: 'One-time add-on',
    title: 'Yes! Add the other 5 recipes too',
    text: 'Get the **complete Sweet Escape** (7 colors, 7 recipes, {pages} pages) together with your free ones, for **{price}**. Instant PDF, 7-day money-back promise.',
    pay: 'How to pay for the book',
  },
  recipes: {
    kicker: 'Free in your PDF',
    title: 'Your 2 free recipes',
    items: [
      { name: 'Tangy Red Berry Bliss Balls', note: 'Day 3 · Red · makes 12–14', line: 'Cherries, strawberries and dates, rolled in crunchy raspberry. Kids love rolling them.' },
      { name: 'Peanutty Banoffee Bars', note: 'Day 6 · Caramel · makes 8–10', line: 'Peanut base, banana-cashew cream, date caramel on top. Brazil’s paçoca meets Britain’s banoffee.' },
    ],
  },
  rest: { kicker: 'Hooked already?', title: '5 more treats are waiting in the book', text: 'Sweet Escape has a treat for every day of the week, each one a different color. Get all 7 with your free ones for **{price}**: just tick the box in the form.', cta: 'Yes, I want all 7' },
  dolly: {
    kicker: 'Hi, I’m Dolly',
    title: 'Treats that love you back',
    text: 'I’m a Belgian chef who swapped the city for Itamambuca beach in Brazil. In my jungle kitchen I make desserts from whole fruit, nuts and dates, nothing refined, and I promise you won’t miss a thing.',
    sign: 'With love,',
  },
  final: { title: 'Your two recipes are one tap away', cta: 'Get my free recipes' },
  thanks: {
    checking: 'One moment…',
    title: 'They’re yours{name}! 🎉',
    text: 'I also sent them to **{email}**. No need to wait, download them right here:',
    download: 'Download my 2 recipes (PDF)',
    spam: 'No e-mail? Look in Promotions or Spam and move it to your inbox, so my next notes reach you.',
    unknownTitle: 'We couldn’t find your sign-up',
    unknownText: 'The link may be incomplete. Sign up again: it takes ten seconds.',
    back: 'Get the free recipes',
    bookTitle: 'Your full Sweet Escape',
    bookWait: 'Waiting for the payment… this page updates by itself (a Pix is confirmed by hand, usually within a few hours).',
    bookPaid: 'Paid! All 7 recipes are yours.',
    bookDownload: 'Download Sweet Escape',
    otoKicker: 'Wait! One thing before you bake',
    otoTitle: 'Make it all 7 colors',
    otoText: 'You have Red and Caramel. The full book adds the other five, one for every day of the week, plus the why behind every ingredient so you can invent your own.',
    otoMissing: 'Still waiting for you:',
    otoPromise: 'Instant PDF · 7-day money-back promise',
    otoPerk: '🎁 Bonus for you: buying the book also gives you 15% off your first Tasting Box, brunch, course or events order.',
    otoCta: 'Add the full book · {price}',
    otoNo: 'No thanks, the 2 recipes are enough for now',
    otoDeclined: 'No problem! The book is always at thetropicalbakery.com/sweet-escape.',
    nearKicker: 'You’re close to my kitchen!',
    nearTitle: { local: 'Taste them made by me, before you bake', visiting: 'Coming to Ubatuba or Paraty? Taste the real thing' },
    nearQuestion: 'What would you love most?',
    interests: {
      box: { label: 'Taste Dolly’s treats', title: 'The Tasting Box', text: 'A kraft box of this week’s treats, made by hand and delivered around Ubatuba. Find your favorite, then bake it.', cta: 'See this week’s box', second: 'Want it every week? See the subscription' },
      brunch: { label: 'A brunch with friends', title: 'Brunch Tropical', text: 'Tea, healthy treats and real conversation, hosted by me. Small group, beautiful places.', cta: 'See the next brunch' },
      course: { label: 'Learn with Dolly', title: 'Hands-on courses', text: 'Make these and many more at my table, in a small group, and take the know-how home.', cta: 'See the courses' },
      events: { label: 'Treats for my event', title: 'The Events Menu', text: 'Bliss balls, banoffee bars and more by the tray, for parties, weddings, retreats and hotels.', cta: 'See the events menu' },
    },
    another: 'Something else',
    awayKicker: 'If you ever come to Brazil',
    awayTitle: 'My kitchen is on Itamambuca beach',
    awayText: 'Between São Paulo and Rio. Retreats, courses and brunches happen right here, by the sea.',
    shareTitle: 'Know someone who’d love these?',
    shareText: 'Send them the free recipes. It costs nothing and makes their week sweeter.',
    shareButton: 'Share on WhatsApp',
    shareMessage: 'Dolly from The Tropical Bakery is giving away 2 recipes: no oven, no refined sugar 🍓 {url}',
  },
  offer: {
    kicker: 'Only for my readers',
    title: 'The full Sweet Escape for {price}',
    text: 'Thank you for baking with me. As a welcome, the complete book (all 7 colors) is **{price}** instead of {full}.',
    until: 'This price ends {date}.',
    was: 'instead of {full}',
    expiredTitle: 'This welcome price has ended',
    expiredText: 'The book is still here, at its normal price, with the same 7-day promise.',
    expiredCta: 'See Sweet Escape',
  },
};

const PT: FunnelCopy = {
  meta: {
    title: '2 receitas grátis da Dolly | The Tropical Bakery',
    description: 'Bliss Balls de Frutas Vermelhas e Barrinhas Banoffee de Amendoim: dois doces sem forno e sem açúcar refinado, grátis, do livro Sweet Escape. PDF na hora.',
    ogLocale: 'pt_BR',
  },
  hero: {
    eyebrow: 'Grátis · 2 receitas do meu livro Sweet Escape',
    title: '2 doces com gosto de',
    em: 'férias na praia',
    lead: 'Duas das sete receitas do meu livro **Sweet Escape**, de presente: **Bliss Balls Azedinhas de Frutas Vermelhas** e **Barrinhas Banoffee de Amendoim** em três camadas. Sem forno, sem açúcar refinado, sem farinha de trigo. Só fruta, castanhas e tâmaras.',
    ticks: ['Sem forno, 20 minutos de trabalho', 'Vegano, sem açúcar refinado, sem glúten', 'PDF na hora, em português'],
    badge: 'GRÁTIS', badgeOf: 'de 7 receitas', paidTag: '7 receitas · {price}',
  },
  strip: { label: '**2 das 7** receitas do Sweet Escape', worth: 'O livro custa **{price}**. Estas duas são presente meu.', free: 'Grátis',
  },
  form: {
    title: 'Para onde eu mando?',
    name: 'Seu nome',
    email: 'E-mail',
    where: 'Onde você está?',
    segments: { local: 'Ubatuba / Paraty e região', visiting: 'Vou visitar em breve', away: 'Em outro lugar' },
    submit: 'Quero as 2 receitas',
    submitBump: 'Quero as receitas + o livro completo · {price}',
    busy: 'Enviando…',
    fine: 'Grátis. Um e-mail com as receitas e depois algumas cartas da minha cozinha. Saia quando quiser.',
    errName: 'Me conta seu nome, para eu saber para quem estou cozinhando.',
    errEmail: 'Esse e-mail não parece certo: é para lá que vão as receitas.',
    errWhere: 'Escolha onde você está (assim eu mando as coisas certas).',
    errGeneric: 'Algo deu errado. Tente de novo em um instante.',
  },
  bump: {
    tag: 'Oferta única',
    title: 'Sim! Quero também as outras 5 receitas',
    text: 'Leve o **Sweet Escape completo** (7 cores, 7 receitas, {pages} páginas) junto com as grátis, por **{price}**. PDF na hora, garantia de 7 dias.',
    pay: 'Como pagar o livro',
  },
  recipes: {
    kicker: 'Grátis no seu PDF',
    title: 'Suas 2 receitas grátis',
    items: [
      { name: 'Bliss Balls Azedinhas de Frutas Vermelhas', note: 'Dia 3 · Vermelho · rende 12–14', line: 'Cereja, morango e tâmara, passadas na framboesa crocante. As crianças adoram enrolar.' },
      { name: 'Barrinhas Banoffee de Amendoim', note: 'Dia 6 · Caramelo · rende 8–10', line: 'Base de amendoim, creme de banana e caju, caramelo de tâmaras por cima. A paçoca encontra o banoffee.' },
    ],
  },
  rest: { kicker: 'Já se apaixonou?', title: 'Mais 5 doces esperam por você no livro', text: 'O Sweet Escape tem um doce para cada dia da semana, cada um de uma cor. Leve as 7 junto com as grátis por **{price}**: é só marcar a caixinha no formulário.', cta: 'Sim, quero as 7' },
  dolly: {
    kicker: 'Oi, eu sou a Dolly',
    title: 'Doces que cuidam de você',
    text: 'Sou uma chef belga que trocou a cidade pela Praia de Itamambuca. Na minha cozinha no meio da mata faço doces com fruta inteira, castanhas e tâmaras, nada refinado, e prometo: você não vai sentir falta de nada.',
    sign: 'Com carinho,',
  },
  final: { title: 'Suas duas receitas estão a um toque', cta: 'Quero minhas receitas grátis' },
  thanks: {
    checking: 'Um instante…',
    title: 'São suas{name}! 🎉',
    text: 'Também mandei para **{email}**. Não precisa esperar, baixe aqui mesmo:',
    download: 'Baixar minhas 2 receitas (PDF)',
    spam: 'Não chegou? Olhe em Promoções ou Spam e mova para a caixa de entrada, assim minhas próximas cartas chegam.',
    unknownTitle: 'Não encontramos seu cadastro',
    unknownText: 'O link pode estar incompleto. Cadastre-se de novo: leva dez segundos.',
    back: 'Quero as receitas grátis',
    bookTitle: 'Seu Sweet Escape completo',
    bookWait: 'Esperando o pagamento… esta página se atualiza sozinha (o Pix é confirmado à mão, em geral em poucas horas).',
    bookPaid: 'Pago! As 7 receitas são suas.',
    bookDownload: 'Baixar o Sweet Escape',
    otoKicker: 'Espere! Uma coisa antes de ir para a cozinha',
    otoTitle: 'Complete as 7 cores',
    otoText: 'Você já tem o Vermelho e o Caramelo. O livro completo traz as outras cinco, uma para cada dia da semana, e o porquê de cada ingrediente para você inventar as suas.',
    otoMissing: 'Ainda esperando por você:',
    otoPromise: 'PDF na hora · garantia de 7 dias',
    otoPerk: '🎁 Bônus para você: com o livro, você ganha 15% de desconto na primeira Caixa de Degustação, brunch, curso ou pedido de eventos.',
    otoCta: 'Quero o livro completo · {price}',
    otoNo: 'Não, obrigada, as 2 receitas bastam por agora',
    otoDeclined: 'Tudo bem! O livro está sempre em thetropicalbakery.com/sweet-escape/pt.',
    nearKicker: 'Você está pertinho da minha cozinha!',
    nearTitle: { local: 'Prove feitos por mim antes de fazer', visiting: 'Vem para Ubatuba ou Paraty? Prove os de verdade' },
    nearQuestion: 'O que você mais ia amar?',
    interests: {
      box: { label: 'Provar os doces da Dolly', title: 'A Caixa de Degustação', text: 'Uma caixa kraft com os doces da semana, feitos à mão e entregues em Ubatuba e região. Descubra seu favorito e depois faça em casa.', cta: 'Ver a caixa da semana', second: 'Quer toda semana? Conheça a assinatura' },
      brunch: { label: 'Um brunch com amigas', title: 'Brunch Tropical', text: 'Chá, doces saudáveis e conversa de verdade, comigo de anfitriã. Grupo pequeno, lugares lindos.', cta: 'Ver o próximo brunch' },
      course: { label: 'Aprender com a Dolly', title: 'Cursos práticos', text: 'Faça estes e muitos outros na minha mesa, em grupo pequeno, e leve o saber para casa.', cta: 'Ver os cursos' },
      events: { label: 'Doces para o meu evento', title: 'Menu de Eventos', text: 'Bliss balls, barrinhas banoffee e muito mais por bandeja, para festas, casamentos, retiros e hotéis.', cta: 'Ver o Menu de Eventos' },
    },
    another: 'Outra coisa',
    awayKicker: 'Se um dia vier ao litoral norte',
    awayTitle: 'Minha cozinha fica na Praia de Itamambuca',
    awayText: 'Em Ubatuba, entre São Paulo e o Rio. Retiros, cursos e brunches acontecem aqui, pertinho do mar.',
    shareTitle: 'Conhece alguém que ia amar?',
    shareText: 'Mande as receitas grátis. Não custa nada e adoça a semana de alguém.',
    shareButton: 'Enviar no WhatsApp',
    shareMessage: 'A Dolly da The Tropical Bakery está dando 2 receitas: sem forno, sem açúcar refinado 🍓 {url}',
  },
  offer: {
    kicker: 'Só para quem cozinha comigo',
    title: 'O Sweet Escape completo por {price}',
    text: 'Obrigada por cozinhar comigo. De boas-vindas, o livro completo (as 7 cores) sai por **{price}** em vez de {full}.',
    until: 'Este preço termina {date}.',
    was: 'em vez de {full}',
    expiredTitle: 'Este preço de boas-vindas terminou',
    expiredText: 'O livro continua aqui, no preço normal, com a mesma garantia de 7 dias.',
    expiredCta: 'Ver o Sweet Escape',
  },
};

const ES: FunnelCopy = {
  meta: {
    title: '2 recetas gratis de Dolly | The Tropical Bakery',
    description: 'Bliss Balls de Frutos Rojos y Barritas Banoffee de Maní: dos postres sin horno y sin azúcar refinada, gratis, del libro Sweet Escape. PDF al instante.',
    ogLocale: 'es_ES',
  },
  hero: {
    eyebrow: 'Gratis · 2 recetas de mi libro Sweet Escape',
    title: '2 postres que saben a',
    em: 'vacaciones en la playa',
    lead: 'Dos de las siete recetas de mi libro **Sweet Escape**, de regalo: **Bliss Balls Aciditas de Frutos Rojos** y **Barritas Banoffee de Maní** en tres capas. Sin horno, sin azúcar refinada, sin harina de trigo. Solo fruta, frutos secos y dátiles.',
    ticks: ['Sin horno, 20 minutos de trabajo', 'Vegano, sin azúcar refinada, sin gluten', 'PDF al instante, en español'],
    badge: 'GRATIS', badgeOf: 'de 7 recetas', paidTag: '7 recetas · {price}',
  },
  strip: { label: '**2 de las 7** recetas de Sweet Escape', worth: 'El libro cuesta **{price}**. Estas dos te las regalo.', free: 'Gratis',
  },
  form: {
    title: '¿Adónde te las envío?',
    name: 'Tu nombre',
    email: 'E-mail',
    where: '¿Dónde estás?',
    segments: { local: 'Ubatuba / Paraty y alrededores', visiting: 'Voy a visitar pronto', away: 'En otro lugar' },
    submit: 'Quiero las 2 recetas',
    submitBump: 'Quiero las recetas + el libro completo · {price}',
    busy: 'Enviando…',
    fine: 'Gratis. Un e-mail con tus recetas y luego algunas cartas de mi cocina. Puedes salir cuando quieras.',
    errName: 'Dime tu nombre, para saber para quién cocino.',
    errEmail: 'Ese e-mail no parece correcto: es adonde van tus recetas.',
    errWhere: 'Elige dónde estás (así te envío lo que te sirve).',
    errGeneric: 'Algo salió mal. Inténtalo de nuevo en un momento.',
  },
  bump: {
    tag: 'Oferta única',
    title: '¡Sí! Quiero también las otras 5 recetas',
    text: 'Llévate el **Sweet Escape completo** (7 colores, 7 recetas, {pages} páginas) junto con las gratis, por **{price}**. PDF al instante, garantía de 7 días.',
    pay: 'Cómo pagar el libro',
  },
  recipes: {
    kicker: 'Gratis en tu PDF',
    title: 'Tus 2 recetas gratis',
    items: [
      { name: 'Bliss Balls Aciditas de Frutos Rojos', note: 'Día 3 · Rojo · salen 12–14', line: 'Cereza, fresa y dátil, rebozadas en frambuesa crujiente. A los niños les encanta hacerlas.' },
      { name: 'Barritas Banoffee de Maní', note: 'Día 6 · Caramelo · salen 8–10', line: 'Base de maní, crema de plátano y anacardo, caramelo de dátiles encima. La paçoca brasileña se encuentra con el banoffee.' },
    ],
  },
  rest: { kicker: '¿Ya te enamoraste?', title: 'Otros 5 postres te esperan en el libro', text: 'Sweet Escape tiene un postre para cada día de la semana, cada uno de un color. Llévate las 7 junto con las gratis por **{price}**: solo marca la casilla del formulario.', cta: 'Sí, quiero las 7' },
  dolly: {
    kicker: 'Hola, soy Dolly',
    title: 'Postres que te cuidan',
    text: 'Soy una chef belga que cambió la ciudad por la playa de Itamambuca, en Brasil. En mi cocina en la selva hago postres con fruta entera, frutos secos y dátiles, nada refinado, y te prometo que no echarás nada de menos.',
    sign: 'Con cariño,',
  },
  final: { title: 'Tus dos recetas están a un toque', cta: 'Quiero mis recetas gratis' },
  thanks: {
    checking: 'Un momento…',
    title: '¡Son tuyas{name}! 🎉',
    text: 'También te las envié a **{email}**. No hace falta esperar, descárgalas aquí mismo:',
    download: 'Descargar mis 2 recetas (PDF)',
    spam: '¿No llegó? Mira en Promociones o Spam y muévelo a tu bandeja de entrada, para que te lleguen mis próximas cartas.',
    unknownTitle: 'No encontramos tu registro',
    unknownText: 'Puede que el enlace esté incompleto. Regístrate de nuevo: tarda diez segundos.',
    back: 'Quiero las recetas gratis',
    bookTitle: 'Tu Sweet Escape completo',
    bookWait: 'Esperando el pago… esta página se actualiza sola (un Pix se confirma a mano, normalmente en pocas horas).',
    bookPaid: '¡Pagado! Las 7 recetas son tuyas.',
    bookDownload: 'Descargar Sweet Escape',
    otoKicker: '¡Espera! Una cosa antes de ir a la cocina',
    otoTitle: 'Completa los 7 colores',
    otoText: 'Ya tienes el Rojo y el Caramelo. El libro completo trae los otros cinco, uno para cada día de la semana, y el porqué de cada ingrediente para que inventes los tuyos.',
    otoMissing: 'Todavía te esperan:',
    otoPromise: 'PDF al instante · garantía de 7 días',
    otoPerk: '🎁 Un extra para ti: con el libro tienes 15% de descuento en tu primera Caja de Degustación, brunch, curso o pedido para eventos.',
    otoCta: 'Quiero el libro completo · {price}',
    otoNo: 'No, gracias, con las 2 recetas me basta por ahora',
    otoDeclined: '¡Sin problema! El libro está siempre en thetropicalbakery.com/sweet-escape/es.',
    nearKicker: '¡Estás cerca de mi cocina!',
    nearTitle: { local: 'Pruébalos hechos por mí antes de cocinar', visiting: '¿Vienes a Ubatuba o Paraty? Prueba los de verdad' },
    nearQuestion: '¿Qué te encantaría más?',
    interests: {
      box: { label: 'Probar los postres de Dolly', title: 'La Caja de Degustación', text: 'Una caja kraft con los postres de la semana, hechos a mano y entregados en Ubatuba y alrededores. Encuentra tu favorito y luego hazlo en casa.', cta: 'Ver la caja de la semana', second: '¿La quieres cada semana? Mira la suscripción' },
      brunch: { label: 'Un brunch con amigas', title: 'Brunch Tropical', text: 'Té, postres saludables y conversación de verdad, conmigo de anfitriona. Grupo pequeño, lugares preciosos.', cta: 'Ver el próximo brunch' },
      course: { label: 'Aprender con Dolly', title: 'Cursos prácticos', text: 'Prepara estos y muchos más en mi mesa, en grupo pequeño, y llévate el saber a casa.', cta: 'Ver los cursos' },
      events: { label: 'Postres para mi evento', title: 'Menú de Eventos', text: 'Bliss balls, barritas banoffee y mucho más por bandeja, para fiestas, bodas, retiros y hoteles.', cta: 'Ver el Menú de Eventos' },
    },
    another: 'Otra cosa',
    awayKicker: 'Si algún día vienes a Brasil',
    awayTitle: 'Mi cocina está en la playa de Itamambuca',
    awayText: 'Entre São Paulo y Río. Retiros, cursos y brunches suceden aquí mismo, junto al mar.',
    shareTitle: '¿Conoces a alguien a quien le encantarían?',
    shareText: 'Envíale las recetas gratis. No cuesta nada y endulza su semana.',
    shareButton: 'Enviar por WhatsApp',
    shareMessage: 'Dolly de The Tropical Bakery está regalando 2 recetas: sin horno, sin azúcar refinada 🍓 {url}',
  },
  offer: {
    kicker: 'Solo para quienes cocinan conmigo',
    title: 'El Sweet Escape completo por {price}',
    text: 'Gracias por cocinar conmigo. De bienvenida, el libro completo (los 7 colores) cuesta **{price}** en lugar de {full}.',
    until: 'Este precio termina el {date}.',
    was: 'en lugar de {full}',
    expiredTitle: 'Este precio de bienvenida terminó',
    expiredText: 'El libro sigue aquí, a su precio normal, con la misma garantía de 7 días.',
    expiredCta: 'Ver Sweet Escape',
  },
};

const NL: FunnelCopy = {
  meta: {
    title: '2 gratis recepten van Dolly | The Tropical Bakery',
    description: 'Rode Bessen Bliss Balls en Pinda Banoffee Repen: twee desserts zonder oven en zonder geraffineerde suiker, gratis, uit Sweet Escape. Direct als pdf.',
    ogLocale: 'nl_NL',
  },
  hero: {
    eyebrow: 'Gratis · 2 recepten uit mijn boek Sweet Escape',
    title: '2 lekkernijen die smaken naar',
    em: 'een strandvakantie',
    lead: 'Twee van de zeven recepten uit mijn boek **Sweet Escape**, cadeau: frisse **Rode Bessen Bliss Balls** en **Pinda Banoffee Repen** in drie lagen. Zonder oven, zonder geraffineerde suiker, zonder tarwebloem. Alleen fruit, noten en dadels.',
    ticks: ['Zonder oven, 20 minuten werk', 'Vegan, geen geraffineerde suiker, glutenvrij', 'Direct als pdf, in het Nederlands'],
    badge: 'GRATIS', badgeOf: 'van 7 recepten', paidTag: '7 recepten · {price}',
  },
  strip: { label: '**2 van de 7** recepten uit Sweet Escape', worth: 'Het boek kost **{price}**. Deze twee krijg je van mij.', free: 'Gratis',
  },
  form: {
    title: 'Waar mag ik ze heen sturen?',
    name: 'Voornaam',
    email: 'E-mail',
    where: 'Waar ben je?',
    segments: { local: 'Ubatuba / Paraty en omgeving', visiting: 'Ik kom binnenkort langs', away: 'Ergens anders' },
    submit: 'Stuur me de 2 recepten',
    submitBump: 'Stuur de recepten + het hele boek · {price}',
    busy: 'Versturen…',
    fine: 'Gratis. Eén e-mail met je recepten, daarna af en toe een briefje uit mijn keuken. Uitschrijven kan altijd.',
    errName: 'Vertel me je voornaam, dan weet ik voor wie ik bak.',
    errEmail: 'Dat e-mailadres klopt niet: daar gaan je recepten naartoe.',
    errWhere: 'Kies waar je bent (dan stuur ik je wat bij je past).',
    errGeneric: 'Er ging iets mis. Probeer het zo nog eens.',
  },
  bump: {
    tag: 'Eenmalig aanbod',
    title: 'Ja! Geef me ook de andere 5 recepten',
    text: 'Neem de **complete Sweet Escape** (7 kleuren, 7 recepten, {pages} pagina’s) erbij voor **{price}**. Direct als pdf, 7 dagen geld-terug-belofte.',
    pay: 'Hoe wil je het boek betalen',
  },
  recipes: {
    kicker: 'Gratis in je pdf',
    title: 'Je 2 gratis recepten',
    items: [
      { name: 'Frisse Rode Bessen Bliss Balls', note: 'Dag 3 · Rood · voor 12–14', line: 'Kersen, aardbeien en dadels, gerold in knapperige framboos. Kinderen rollen ze graag mee.' },
      { name: 'Pinda Banoffee Repen', note: 'Dag 6 · Karamel · voor 8–10', line: 'Pindabodem, banaan-cashewcrème, dadelkaramel erop. Braziliaanse paçoca ontmoet Britse banoffee.' },
    ],
  },
  rest: { kicker: 'Al verliefd?', title: 'Nog 5 lekkernijen wachten in het boek', text: 'Sweet Escape heeft een lekkernij voor elke dag van de week, elk in een andere kleur. Neem alle 7 erbij voor **{price}**: vink gewoon het vakje in het formulier aan.', cta: 'Ja, ik wil alle 7' },
  dolly: {
    kicker: 'Hoi, ik ben Dolly',
    title: 'Lekkernijen die goed voor je zijn',
    text: 'Ik ben een Belgische chef die de stad ruilde voor het strand van Itamambuca in Brazilië. In mijn junglekeuken maak ik desserts van hele vruchten, noten en dadels, niets geraffineerd, en ik beloof je: je mist niets.',
    sign: 'Liefs,',
  },
  final: { title: 'Je twee recepten zijn één tik verwijderd', cta: 'Geef me de gratis recepten' },
  thanks: {
    checking: 'Even geduld…',
    title: 'Ze zijn van jou{name}! 🎉',
    text: 'Ik heb ze ook naar **{email}** gestuurd. Niet wachten, download ze hier meteen:',
    download: 'Download mijn 2 recepten (pdf)',
    spam: 'Geen e-mail? Kijk bij Promoties of Spam en zet hem in je inbox, dan komen mijn volgende briefjes aan.',
    unknownTitle: 'We konden je aanmelding niet vinden',
    unknownText: 'De link is misschien onvolledig. Meld je opnieuw aan: het kost tien seconden.',
    back: 'Geef me de gratis recepten',
    bookTitle: 'Je complete Sweet Escape',
    bookWait: 'Wachten op de betaling… deze pagina ververst vanzelf (een Pix wordt met de hand bevestigd, meestal binnen een paar uur).',
    bookPaid: 'Betaald! Alle 7 recepten zijn van jou.',
    bookDownload: 'Download Sweet Escape',
    otoKicker: 'Wacht! Eén ding voor je gaat bakken',
    otoTitle: 'Maak alle 7 kleuren compleet',
    otoText: 'Je hebt Rood en Karamel. Het hele boek voegt de andere vijf toe, één voor elke dag van de week, plus het waarom achter elk ingrediënt zodat je je eigen kunt bedenken.',
    otoMissing: 'Ze wachten nog op je:',
    otoPromise: 'Direct als pdf · 7 dagen geld-terug-belofte',
    otoPerk: '🎁 Extraatje: met het boek krijg je 15% korting op je eerste Proefdoos, brunch, cursus of eventbestelling.',
    otoCta: 'Voeg het hele boek toe · {price}',
    otoNo: 'Nee, dank je, de 2 recepten zijn genoeg voor nu',
    otoDeclined: 'Geen probleem! Het boek staat altijd op thetropicalbakery.com/sweet-escape/nl.',
    nearKicker: 'Je bent vlak bij mijn keuken!',
    nearTitle: { local: 'Proef ze eerst, door mij gemaakt', visiting: 'Kom je naar Ubatuba of Paraty? Proef het echte werk' },
    nearQuestion: 'Waar zou je het meest van genieten?',
    interests: {
      box: { label: 'Dolly’s lekkernijen proeven', title: 'De Proefdoos', text: 'Een kraft doos met de lekkernijen van de week, met de hand gemaakt en bezorgd rond Ubatuba. Vind je favoriet en bak hem daarna zelf.', cta: 'Bekijk de doos van de week', second: 'Elke week? Bekijk het abonnement' },
      brunch: { label: 'Een brunch met vriendinnen', title: 'Brunch Tropical', text: 'Thee, gezonde lekkernijen en echte gesprekken, met mij als gastvrouw. Kleine groep, prachtige plekken.', cta: 'Bekijk de volgende brunch' },
      course: { label: 'Leren met Dolly', title: 'Praktische cursussen', text: 'Maak deze en nog veel meer aan mijn tafel, in een kleine groep, en neem de kennis mee naar huis.', cta: 'Bekijk de cursussen' },
      events: { label: 'Lekkernijen voor mijn event', title: 'Het Eventmenu', text: 'Bliss balls, banoffee repen en meer per schaal, voor feesten, bruiloften, retraites en hotels.', cta: 'Bekijk het eventmenu' },
    },
    another: 'Iets anders',
    awayKicker: 'Als je ooit naar Brazilië komt',
    awayTitle: 'Mijn keuken ligt aan het strand van Itamambuca',
    awayText: 'Tussen São Paulo en Rio. Retraites, cursussen en brunches vinden hier plaats, vlak bij de zee.',
    shareTitle: 'Ken je iemand die hier blij van wordt?',
    shareText: 'Stuur ze de gratis recepten. Het kost niets en maakt hun week zoeter.',
    shareButton: 'Delen via WhatsApp',
    shareMessage: 'Dolly van The Tropical Bakery geeft 2 recepten weg: zonder oven, zonder geraffineerde suiker 🍓 {url}',
  },
  offer: {
    kicker: 'Alleen voor wie met mij bakt',
    title: 'De complete Sweet Escape voor {price}',
    text: 'Dank je dat je met me bakt. Als welkom kost het hele boek (alle 7 kleuren) **{price}** in plaats van {full}.',
    until: 'Deze prijs loopt af op {date}.',
    was: 'in plaats van {full}',
    expiredTitle: 'Deze welkomstprijs is voorbij',
    expiredText: 'Het boek is er nog steeds, voor de normale prijs, met dezelfde 7 dagen belofte.',
    expiredCta: 'Bekijk Sweet Escape',
  },
};

export const FUNNEL_COPY: Record<EbookLang, FunnelCopy> = { en: EN, pt: PT, es: ES, nl: NL };
