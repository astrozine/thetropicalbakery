/**
 * Every word of the Sweet Escape sales page, the order form, the download page and its e-mails, in the three
 * languages we write by hand. The BOOK is English-only; these pages exist so a Portuguese or Spanish reader can
 * understand what they are buying, and every one of them says plainly that the book itself is in English.
 *
 * Why hand-written: the site's Google Translate treats every page as Portuguese, so it cannot turn this page
 * INTO Portuguese at all, and a machine-translated sales page reads cheap. French, German, Italian and Dutch
 * still go through Google from the language bar on the English page.
 *
 * Markup in strings: **bold**, *italic*. Placeholders: {price} {pages} {n} {value} {each} {email} {name}.
 * Recipe NAMES stay in English in every language: that is what the reader will find in the book.
 * Pure data, no imports beyond types: the server e-mails read it too.
 */

/** The page languages AND the book languages are the same four: each has its own hand-written page and its own PDF. */
export type EbookLang = 'en' | 'pt' | 'es' | 'nl';
export const EBOOK_LANGS: EbookLang[] = ['en', 'pt', 'es', 'nl'];
export const isEbookLang = (v: unknown): v is EbookLang => v === 'en' || v === 'pt' || v === 'es' || v === 'nl';

/** Languages offered through Google Translate from the English page. */
export const GOOGLE_LANGS = [
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
] as const;

export const LANG_LABEL: Record<EbookLang, string> = { en: 'English', pt: 'Português', es: 'Español', nl: 'Nederlands' };
export const LANG_PATH: Record<EbookLang, string> = { en: '/sweet-escape', pt: '/sweet-escape/pt', es: '/sweet-escape/es', nl: '/sweet-escape/nl' };

export interface RecipeCopy { name: string; color: string; subtitle: string; hook: string; makes: string; kidAngle: string; alt: string }

export interface EbookCopy {
  meta: { title: string; description: string; ogTitle: string; ogLocale: string };
  langBar: { label: string; auto: string; suggest: string; suggestGo: string };
  /** Shown when the book they will get is the English edition and they do not read English. */
  english: { badge: string; title: string; text: string; tick: string; tickError: string };
  /** Shown when the book is in their own language: which editions exist. */
  edition: { badge: string; title: string; text: string };
  hero: { eyebrow: string; script: string; title: string; em: string; lead: string; cta: string; ticks: string[]; card: string; card2: string };
  problem: { kicker: string; title1: string; title2: string; pains: string[]; bigIdea: string };
  journey: { kicker: string; title: string; lead: string; day: string; tabs: string };
  recipes: RecipeCopy[];
  learn: { kicker: string; title: string; lead: string; blocks: { title: string; text: string }[] };
  peek: { kicker: string; title: string; lead: string; alts: string[] };
  family: { kicker: string; title: string; lead: string; checks: string[] };
  math: { kicker: string; title: string; treats: string; bakery: string; book: string; small: string };
  story: { kicker: string; title: string; paragraphs: string[]; sign: string; photoAlt: string };
  offer: { kicker: string; title: string; stack: { what: string; detail: string; bonus?: boolean }[]; promiseDays: string; promiseTitle: string; promiseText: string; coverAlt: string; usd: string };
  faq: { kicker: string; title: string; items: { q: string; a: string }[] };
  final: { line: string; title1: string; script: string; title2: string; ps: string };
  buyBar: { kicker: string; note: string; label: string };
  form: {
    name: string; email: string; emailNote: string; whatsapp: string; optional: string; bookLang: string; payLegend: string;
    card: string; cardNote: string; pix: string; pixMethodNote: string; paypal: string; paypalNote: string;
    submit: string; busy: string; fine: string; currencyNote: string; errName: string; errEmail: string; errGeneric: string;
    pixTitle: string; pixLabel: string; pixCopy: string; pixCopied: string; pixNote: string; pixPaid: string;
  };
  thanks: {
    checking: string; checkingSub: string; paidTitle: string; paidText: string; fileError: string; download: string;
    startTitle: string; start: string[]; waitTitle: string; waitPix: string; waitCard: string;
    failedTitle: string; failedText: string; retry: string; unknownTitle: string; unknownText: string; back: string;
    nextTitle: string; next: { title: string; text: string }[];
  };
  mail: {
    edition: string; hi: string; receivedPix: string; receivedCard: string; yourOrder: string; receivedSubject: string;
    receivedPreheaderPix: string; receivedPreheaderCard: string; receivedHeading: string; myPage: string; receivedNote: string;
    paidText: string; whereToStart: string; tips: string[]; paidLink: string; paidSubject: string; paidPreheader: string;
    paidHeading: string; paidCta: string; paidNote: string;
  };
}

const EN: EbookCopy = {
  meta: {
    title: 'Sweet Escape · 7 plant-based treats your family will love | The Tropical Bakery',
    description: 'Dolly’s e-book: 7 colors, 7 plant-based desserts made from fruit, nuts and whole plants. Silky creams, caramel, chocolate mousse, cheesecake. Instant PDF.',
    ogTitle: 'Sweet Escape · the plant-based treat book from Dolly’s jungle kitchen',
    ogLocale: 'en_US',
  },
  langBar: { label: 'Read this page in', auto: 'automatic translation', suggest: 'Prefer another language?', suggestGo: 'Read in' },
  english: {
    badge: 'English edition',
    title: 'This edition is written in English',
    text: 'Sweet Escape comes in English, Português, Español and Nederlands. Readers of any other language get the English edition: simple, friendly English, a photo for every recipe, and measurements in cups and spoons with oven temperatures in °C and °F. This page can be translated, the book can’t.',
    tick: 'I understand I’m getting the English edition.',
    tickError: 'Please confirm you know you’re getting the English edition.',
  },
  edition: {
    badge: 'Available in 4 languages',
    title: 'Available in 4 languages',
    text: 'English, Português, Español and Nederlands. Pick yours when you order; any other language gets the English edition.',
  },
  hero: {
    eyebrow: 'New · the e-book from Dolly’s jungle kitchen',
    script: 'Sweet', title: 'treats your kids beg for,', em: 'made from plants.',
    lead: '**Sweet Escape** is seven vibrant plant-based desserts, one for each color of nature, and the secrets behind them. Silky creams, luscious caramel, chocolate mousse, cheesecake: indulgence and nourishment in the very same bite.',
    cta: 'Get Sweet Escape · {price}',
    ticks: ['Instant PDF', '{pages} pages', '7-day promise'],
    card: 'colors · 7 recipes', card2: 'one delicious escape',
  },
  problem: {
    kicker: 'Sound familiar?', title1: 'You want them to eat well.', title2: 'They want dessert.',
    pains: [
      'You stand in the snack aisle, torn between the “healthy” bar that tastes like cardboard and the one you know you’ll regret.',
      'Every dinner turns into a negotiation over three pieces of broccoli.',
      'You’ve tried “healthy desserts”. Everyone was polite. Nobody asked for seconds.',
    ],
    bigIdea: 'Here’s the secret Dolly learned in her kitchen: **children don’t eat vegetables. They eat colors.** Make it pink with beetroot, green with spirulina, purple with sweet potato, and suddenly the plants are the treat.',
  },
  journey: { kicker: 'The journey', title: '7 days. 7 colors. 7 treats.', lead: 'One recipe a day, each one a color of nature. Tap a day.', day: 'Day', tabs: 'Choose a day' },
  recipes: [
    { name: 'Sun-Kissed Coco-Pineapple Paradise Squares', color: 'Yellow', subtitle: 'with turmeric-spiced coconut topping', hook: 'A silky pineapple-cashew cream on a date-almond base. Tastes like a beach holiday, sets in the freezer while you do something else.', makes: 'Serves 8', kidAngle: 'Looks like a slice of sunshine. Nobody asks where the vegetables are.', alt: 'Layered pineapple coconut squares on a wooden stump' },
    { name: 'Chai-Spiced Mango Muffins', color: 'Orange', subtitle: 'with blood orange & carrot cashew cream whip', hook: 'Oat and almond muffins sweetened only with a date caramel, studded with ripe mango and topped with a whipped cream that hides a carrot.', makes: 'Makes 8–10', kidAngle: 'A cupcake with a swirl on top. The carrot is our secret.', alt: 'Mango muffins with orange cashew cream and tropical flowers' },
    { name: 'Tangy Red Berry Bliss Balls', color: 'Red', subtitle: 'jewel-like treats with cherry, strawberry, cranberry & beet', hook: 'No oven, no mixer. Blend, roll, and coat in crunchy freeze-dried raspberry. The quickest recipe in the book and the one kids help make.', makes: 'Makes 12–14', kidAngle: 'Small hands can roll them. Beetroot never looked this much like candy.', alt: 'Pink berry bliss balls with fresh cherries and strawberries' },
    { name: 'Purple Sweet Potato Longevity Cheesecake', color: 'Purple', subtitle: 'with forest dark berries & Blue Zones inspiration', hook: 'A walnut-cacao crust, a creamy purple layer made from sweet potato, and a pourable berry topping. The one that gets photographed.', makes: 'Serves 8–10', kidAngle: 'It’s purple. That’s the whole argument, and it works.', alt: 'Purple sweet potato cheesecake slice with a violet flower' },
    { name: 'Supergreen Laguna Nicecream Pistachio Tacos', color: 'Green', subtitle: 'a joyful, melting, spirulina-powered treat', hook: 'Crunchy pistachio taco cookies filled with soft-serve made from frozen bananas. Ice cream, but it’s fruit.', makes: 'Makes 6–8', kidAngle: 'Green ice cream in a taco. It disappears before it can melt.', alt: 'Green pistachio taco cookies filled with spirulina banana nicecream' },
    { name: 'Peanutty Banoffee Bars', color: 'Caramel', subtitle: 'a raw three-layer treat bridging Brazil and Britain', hook: 'A paçoca-style peanut base, a banana-cashew cream, and a runny caramel made from nothing but dates. The cover star.', makes: 'Makes 8–10', kidAngle: 'Peanut butter and caramel. You won’t have to ask twice.', alt: 'Banoffee bars with date caramel drizzle on a green plate' },
    { name: 'Dark Cocoa Mousse Turtles', color: 'Chocolate', subtitle: 'a velvet-dark ode to chocolate, with a surprising pear', hook: 'A pecan-cocoa base, a mousse whipped from a ripe pear, and a glossy chocolate shell. Pecan halves become little heads and feet.', makes: 'Makes 6–8', kidAngle: 'They’re turtles. Made of chocolate. With a pear hiding inside.', alt: 'Chocolate mousse turtles with pecan heads and feet' },
  ],
  learn: {
    kicker: 'Not just recipes', title: 'Learn the magic behind them',
    lead: '“The magic lies not in memorizing recipes, but in understanding the *why* behind them.” Why do dates replace sugar so well? Why does almond flour make a treat soft *and* filling? Once you know the six building blocks, seven recipes become endless possibilities.',
    blocks: [
      { title: 'Healthy fats & proteins', text: 'Nuts, seeds, avocado and coconut give creaminess, richness and the kind of fullness sugar never does.' },
      { title: 'Natural sweetness', text: 'Dates, dried fruit and ripe fruit: whole, fiber-rich sweetness that doesn’t spike and crash.' },
      { title: 'The base', text: 'Oats, almond flour and even tubers give structure and comfort, with no white wheat flour anywhere.' },
      { title: 'Flavors & spices', text: 'Cacao, vanilla, cinnamon, cardamom, clove and tropical zest: the soul of every treat.' },
      { title: 'Toppings & textures', text: 'Freeze-dried fruit, seeds, coconut, a chocolate shell, edible flowers: beauty and crunch.' },
      { title: 'Color & mood', text: 'Beetroot, spirulina, turmeric, blueberries. Nature’s palette, and the reason kids reach for it.' },
    ],
  },
  peek: {
    kicker: 'Peek inside', title: '{pages} pages you’ll want to cook from', lead: 'Tap any page to see it up close.',
    alts: ['Contents page of Sweet Escape', 'Rule #2: the six building blocks', 'Day 1 Yellow recipe opener', 'A recipe page with ingredients and steps', 'Why pineapple? The story behind the ingredient', 'Health benefits of every ingredient', 'Day 4 Purple recipe opener', 'Dolly’s story: from ballet to the jungle kitchen'],
  },
  family: {
    kicker: 'For parents', title: 'Win them over with a treat, not a lecture',
    lead: 'These are desserts that *seduce*. Chocolate turtles with pecan feet. Green ice-cream tacos. Pink jewels you roll together at the kitchen table. Your family falls in love with fruit, nuts and whole plants without ever being told it’s good for them.',
    checks: [
      'Swap the after-school cookie for something you’re proud to hand over',
      'Get the kids cooking: most recipes are blend, roll, press and freeze',
      'Birthday-worthy desserts, with no dairy, eggs or white sugar in the bowl',
      'Make a batch on Sunday and the freezer does the rest of the week',
    ],
  },
  math: {
    kicker: 'Do the math', title: 'One book. About {n} treats.', treats: 'treats from one round of all 7 recipes',
    bakery: 'what they’d cost from our bakery at ~{each} each', book: 'for the book you can cook from forever',
    small: 'Ingredients not included, of course. But you already know where the supermarket is.',
  },
  story: {
    kicker: 'Meet Dolly', title: 'From the ballet stage to a jungle kitchen',
    paragraphs: [
      'My relationship with food began in a world where discipline was everything: professional ballet. I learned to control every calorie, every bite, and it left me disconnected from the joy of food.',
      'Through love and loss, I rebuilt my life on the Brazilian coast, surrounded by the ocean, the rainforest, the sunlight and the abundance of Brazil. That is where food became creativity, nourishment became pleasure, and dessert became a celebration rather than a compromise.',
      '*Sweet Escape* is everything I learned, woven through seven recipes, so you can bring that same joy into your own kitchen.',
    ],
    sign: 'Come into my jungle kitchen.', photoAlt: 'Dolly holding a tray of her plant-based treats in the garden',
  },
  offer: {
    kicker: 'Everything you get', title: 'Your sweet escape, today',
    stack: [
      { what: 'The Sweet Escape e-book', detail: '{pages} full-color pages, 7 complete recipes with every layer, step and photo' },
      { what: 'The 6 building blocks', detail: 'the framework that lets you invent your own treats after the seventh day' },
      { what: '“Why this ingredient?” stories', detail: 'the history and magic of pineapple, mango, berries, sweet potato, spirulina, peanut and cacao' },
      { what: 'Health benefits for every recipe', detail: 'what each ingredient does for you and your family, in plain words' },
      { what: 'Dolly’s six rules & simple toolkit', detail: 'a blender, some molds and a freezer. That’s the whole kitchen.' },
      { what: 'Bonus: a free 30-minute Food Healing call', detail: 'book an intake call with Dolly from inside the book', bonus: true },
      { what: 'Bonus: an invitation to Sunbaked Letters', detail: 'Dolly’s weekly letter of recipes and food healing', bonus: true },
    ],
    promiseDays: 'days', promiseTitle: 'The sweet promise',
    promiseText: 'Make one recipe. If it doesn’t win you over, write to us within 7 days and get every centavo back.',
    coverAlt: 'Sweet Escape e-book cover', usd: 'one payment · PDF',
  },
  faq: {
    kicker: 'Questions', title: 'Good to know',
    items: [
      { q: 'Which languages is the book in?', a: 'English, Português (Brazil), Español and Nederlands, fully translated with every recipe and photo. Choose your language when you order. Readers of any other language get the English edition: simple, friendly English, with measurements in cups and spoons and oven temperatures in °C and °F. This page is also available in Portuguese, Spanish and Dutch.' },
      { q: 'How do I get it?', a: 'It’s a PDF. After paying by card or PayPal your download opens straight away, and a personal link arrives by e-mail. With Pix (Brazil), Dolly confirms the payment by hand, usually within a few hours, and the same link unlocks itself.' },
      { q: 'Do I need special equipment?', a: 'No. A blender or food processor, a few silicone molds or a tray, and a freezer. Most treats are raw: you blend, press, and let the freezer do the work. Only the muffins and the taco cookies need an oven.' },
      { q: 'Is it really without refined sugar?', a: 'Every recipe is sweetened with dates, raisins and fruit. The one exception is the chocolate shell on Day 7: the book shows you how to choose a dark chocolate without refined sugar, because most shop-bought ones contain some.' },
      { q: 'Is it vegan? Gluten-free?', a: '100% plant-based, no dairy, no eggs, and no wheat flour. Some recipes use oats: pick certified gluten-free oats if you need to.' },
      { q: 'My child has a nut allergy.', a: 'Please be careful: nuts, seeds and coconut are the heart of most recipes (almonds, cashews, walnuts, pecans, pistachios, peanuts). The building-blocks chapter helps you think about swaps, but this book is not written for a nut-free kitchen.' },
      { q: 'I’m a beginner. Will I manage?', a: 'Yes. Rule #4 is literally “work smart, not hard”. Start with Day 3, the Red Berry Bliss Balls: no oven, ten minutes, and little hands can roll them.' },
      { q: 'What if I don’t love it?', a: 'Write to us within 7 days and we refund every centavo. No forms, no hard feelings.' },
    ],
  },
  final: {
    line: 'Seven colors. Seven creations. Seven little reasons to fall in love with plants all over again.',
    title1: 'Your', script: 'sweet escape', title2: 'is waiting.',
    ps: '**P.S.** If you scrolled straight down here: it’s {pages} pages, 7 plant-based desserts your family will actually ask for, the framework to invent your own, and a 7-day promise. All for {price}, less than two treats from our own bakery.',
  },
  buyBar: { kicker: 'Sweet Escape e-book', note: 'Instant PDF · 7 recipes', label: 'Get it' },
  form: {
    bookLang: 'Book language',
    name: 'Your name', email: 'E-mail', emailNote: '(your book goes here)', whatsapp: 'WhatsApp', optional: '(optional)',
    payLegend: 'How would you like to pay?',
    card: 'Card', cardNote: 'instant download', pix: 'Pix', pixMethodNote: 'Brazil · confirmed by hand', paypal: 'PayPal', paypalNote: 'from anywhere',
    submit: 'Yes! Send me Sweet Escape · {price}', busy: 'One moment…',
    fine: '🔒 Secure payment · PDF by e-mail · 7-day money-back promise',
    currencyNote: 'This way of paying charges {reais} (Brazilian reais), about US$ {usd}; your bank or PayPal converts it.',
    errName: 'Please tell us your name.', errEmail: 'Please check your e-mail: that is where your book goes.', errGeneric: 'Something went wrong. Please try again.',
    pixTitle: 'Almost yours! Pay {price} with Pix', pixLabel: 'Or Pix copia e cola:', pixCopy: 'Copy the Pix code', pixCopied: 'Copied ✓',
    pixNote: 'We also e-mailed this code and your personal download link to **{email}**. Dolly confirms Pix payments by hand, usually within a few hours, and your link unlocks itself.',
    pixPaid: 'I’ve paid · go to my download page',
  },
  thanks: {
    checking: 'Checking your order…', checkingSub: 'This takes a few seconds.',
    paidTitle: 'Welcome to the jungle kitchen{name}! 🌈',
    paidText: 'Your copy of **Sweet Escape** is ready. Save it to your phone or tablet and cook straight from it. This page and the link in your e-mail work whenever you need them.',
    fileError: 'The download didn’t start. Please try once more; if it still fails, message us on WhatsApp and we’ll send it straight away.',
    download: 'Download Sweet Escape (PDF)',
    startTitle: 'Where to start',
    start: ['Read the six rules first: they make every recipe easier.', 'Day 3, the Red Berry Bliss Balls, needs no oven: perfect with kids.', 'Soak cashews the night before Days 1, 2 and 6.'],
    waitTitle: 'Thank you{name}! Almost there',
    waitPix: 'Dolly confirms Pix payments by hand, usually within a few hours. Keep this page open or come back from the link in your e-mail: your download unlocks here by itself.',
    waitCard: 'We’re waiting for the payment confirmation. Some banks take a minute or two; this page updates by itself.',
    failedTitle: 'The payment didn’t go through', failedText: 'Nothing was charged. You can try again with another card, or pay with Pix.', retry: 'Try again',
    unknownTitle: 'We couldn’t find this order', unknownText: 'Please open the link from your e-mail again. If you paid and it still doesn’t work, message us on WhatsApp with your e-mail address and we’ll sort it out.', back: 'Back to Sweet Escape',
    nextTitle: 'Want someone else to do the baking?',
    next: [
      { title: 'The Tasting Box', text: 'Dolly’s treats, fresh from our kitchen in Itamambuca.' },
      { title: 'Cook with Dolly', text: 'Hands-on courses to go further than the book.' },
      { title: 'The retreat', text: 'Cook in the jungle kitchen itself, steps from the beach.' },
    ],
  },
  mail: {
    hi: 'Hi {name}!',
    receivedPix: 'Thank you for ordering Sweet Escape! Your book is reserved. As soon as your Pix of {price} arrives and Dolly confirms it, the button below unlocks your download. Keep this e-mail: the link is yours for good.',
    receivedCard: 'Thank you for ordering Sweet Escape! We are just waiting for the payment confirmation, which usually takes a minute. The button below is your personal download link, and it is yours for good.',
    edition: 'Your edition', yourOrder: 'Your order', receivedSubject: 'Your Sweet Escape order ({ref})',
    receivedPreheaderPix: 'One Pix of {price} and the book is yours.', receivedPreheaderCard: 'Your plant-based treat book is on its way.',
    receivedHeading: 'Your sweet escape is waiting', myPage: 'My download page', receivedNote: 'Order {ref}. Questions? Just reply on WhatsApp: +55 11 93211-9196.',
    paidText: 'Payment confirmed. Welcome to the jungle kitchen! Your copy of Sweet Escape is ready to download: 72 pages, seven colors, seven treats.',
    whereToStart: 'Where to start',
    tips: ['Read the six rules first (pages 4–11). They are the “why” that makes every recipe easier.', 'Day 3, the Red Berry Bliss Balls, needs no oven and is perfect to make with kids.', 'Soak your cashews the night before Day 1, 2 or 6 and everything goes faster.'],
    paidLink: 'The link below works whenever you need it, on any device. Save the PDF to your phone or tablet and cook straight from it.',
    paidSubject: 'Your Sweet Escape e-book is ready 🌈', paidPreheader: 'Your download link is inside. Enjoy your sweet escape!',
    paidHeading: 'Your book is ready', paidCta: 'Download Sweet Escape', paidNote: 'Order {ref}. Show us what you make: @thetropicalbakery on Instagram.',
  },
};

const PT: EbookCopy = {
  meta: {
    title: 'Sweet Escape · 7 doces de plantas que a família vai amar | The Tropical Bakery',
    description: 'O e-book da Dolly: 7 cores, 7 sobremesas feitas de frutas, castanhas e plantas inteiras. Cremes sedosos, caramelo, mousse de chocolate, cheesecake. PDF na hora. Em português, English, Español e Nederlands.',
    ogTitle: 'Sweet Escape · o livro de doces de plantas da cozinha da Dolly na mata',
    ogLocale: 'pt_BR',
  },
  langBar: { label: 'Leia esta página em', auto: 'tradução automática', suggest: 'Prefere ler em português?', suggestGo: 'Ler em' },
  english: {
    badge: 'E-book em inglês',
    title: 'Atenção: esta edição é em inglês',
    text: 'Você escolheu a edição em inglês: um inglês simples e amigável, com foto em toda receita, medidas em xícaras (cups) e colheres e forno em °C e °F. A edição em português também está à venda: é só escolher o idioma no pedido.',
    tick: 'Entendo que vou receber a edição em inglês.',
    tickError: 'Confirme, por favor, que você sabe que vai receber a edição em inglês.',
  },
  edition: {
    badge: 'E-book em português',
    title: 'Disponível em português (e em outros 3 idiomas)',
    text: 'O livro inteiro, receitas e fotos, foi traduzido para o português. Também há English, Español e Nederlands: você escolhe no pedido. Quem lê outro idioma recebe a edição em inglês.',
  },
  hero: {
    eyebrow: 'Novo · o e-book da cozinha da Dolly na mata',
    script: 'Doces', title: 'que seus filhos pedem,', em: 'feitos de plantas.',
    lead: '**Sweet Escape** são sete sobremesas vibrantes à base de plantas, uma para cada cor da natureza, e os segredos por trás delas. Cremes sedosos, caramelo, mousse de chocolate, cheesecake: prazer e nutrição na mesma mordida.',
    cta: 'Quero o Sweet Escape · {price}',
    ticks: ['PDF na hora', '{pages} páginas', 'Garantia de 7 dias'],
    card: 'cores · 7 receitas', card2: 'uma fuga deliciosa',
  },
  problem: {
    kicker: 'Te parece familiar?', title1: 'Você quer que eles comam bem.', title2: 'Eles querem sobremesa.',
    pains: [
      'Você está no corredor de lanchinhos, em dúvida entre a barrinha “saudável” com gosto de papelão e aquela que você sabe que vai se arrepender.',
      'Todo jantar vira uma negociação por três pedaços de brócolis.',
      'Você já tentou “sobremesas saudáveis”. Todo mundo foi educado. Ninguém pediu mais.',
    ],
    bigIdea: 'O segredo que a Dolly aprendeu na cozinha: **criança não come legumes. Criança come cores.** Deixe rosa com beterraba, verde com spirulina, roxo com batata-doce, e de repente as plantas viram a guloseima.',
  },
  journey: { kicker: 'A jornada', title: '7 dias. 7 cores. 7 doces.', lead: 'Uma receita por dia, cada uma com uma cor da natureza. Toque em um dia.', day: 'Dia', tabs: 'Escolha um dia' },
  recipes: [
    { name: 'Quadradinhos Paraíso de Coco e Abacaxi Beijados de Sol', color: 'Amarelo', subtitle: 'com cobertura de coco e cúrcuma', hook: 'Um creme sedoso de abacaxi e castanha de caju sobre uma base de tâmara e amêndoa. Gosto de férias na praia, e firma no freezer enquanto você faz outra coisa.', makes: 'Rende 8', kidAngle: 'Parece uma fatia de sol. Ninguém pergunta onde estão os legumes.', alt: 'Quadradinhos de abacaxi e coco em camadas sobre um toco de madeira' },
    { name: 'Muffins de Manga com Especiarias Chai', color: 'Laranja', subtitle: 'com chantilly de caju, laranja-sanguínea e cenoura', hook: 'Muffins de aveia e amêndoa adoçados só com um caramelo de tâmaras, cheios de manga madura e cobertos com um chantilly que esconde uma cenoura.', makes: 'Rende 8–10', kidAngle: 'Um cupcake com redemoinho em cima. A cenoura é segredo nosso.', alt: 'Muffins de manga com creme laranja de caju e flores tropicais' },
    { name: 'Bliss Balls Azedinhas de Frutas Vermelhas', color: 'Vermelho', subtitle: 'joias de cereja, morango, cranberry e beterraba', hook: 'Sem forno, sem batedeira. Bata, enrole e passe na framboesa liofilizada crocante. A receita mais rápida do livro, e a que as crianças ajudam a fazer.', makes: 'Rende 12–14', kidAngle: 'Mãos pequenas conseguem enrolar. Beterraba nunca pareceu tanto com bala.', alt: 'Bolinhas rosadas de frutas vermelhas com cerejas e morangos' },
    { name: 'Cheesecake da Longevidade de Batata-Doce Roxa', color: 'Roxo', subtitle: 'com frutas silvestres e inspiração nas Zonas Azuis', hook: 'Base de nozes e cacau, uma camada cremosa roxa feita de batata-doce e uma calda de frutas silvestres. A que todo mundo fotografa.', makes: 'Rende 8–10', kidAngle: 'É roxo. Esse é o argumento inteiro, e funciona.', alt: 'Fatia de cheesecake de batata-doce roxa com uma flor violeta' },
    { name: 'Tacos de Pistache com Nicecream Supergreen Laguna', color: 'Verde', subtitle: 'um doce alegre e geladinho, com spirulina', hook: 'Biscoitos crocantes de pistache em formato de taco, recheados com sorvete cremoso feito de banana congelada. É sorvete, mas é fruta.', makes: 'Rende 6–8', kidAngle: 'Sorvete verde dentro de um taco. Some antes de derreter.', alt: 'Tacos de pistache verdes recheados com sorvete de banana e spirulina' },
    { name: 'Barrinhas Banoffee de Amendoim', color: 'Caramelo', subtitle: 'um doce cru de três camadas entre o Brasil e a Inglaterra', hook: 'Base de amendoim estilo paçoca, creme de banana com caju e um caramelo escorrendo feito só de tâmaras. A estrela da capa.', makes: 'Rende 8–10', kidAngle: 'Pasta de amendoim e caramelo. Você não vai precisar oferecer duas vezes.', alt: 'Barrinhas banoffee com calda de caramelo de tâmaras num prato verde' },
    { name: 'Tartarugas de Mousse de Cacau Escuro', color: 'Chocolate', subtitle: 'uma ode ao chocolate escuro, com uma pera surpresa', hook: 'Base de pecã e cacau, uma mousse batida com pera madura e uma casquinha brilhante de chocolate. Metades de pecã viram cabecinhas e patinhas.', makes: 'Rende 6–8', kidAngle: 'São tartarugas. De chocolate. Com uma pera escondida dentro.', alt: 'Tartarugas de mousse de chocolate com cabeça e patas de pecã' },
  ],
  learn: {
    kicker: 'Não são só receitas', title: 'Aprenda a mágica por trás delas',
    lead: '“A mágica não está em decorar receitas, e sim em entender o *porquê* por trás delas.” Por que a tâmara substitui o açúcar tão bem? Por que a farinha de amêndoa deixa um doce macio *e* que sustenta? Quando você conhece os seis pilares, sete receitas viram possibilidades sem fim.',
    blocks: [
      { title: 'Gorduras boas e proteínas', text: 'Castanhas, sementes, abacate e coco dão cremosidade, riqueza e uma saciedade que o açúcar nunca dá.' },
      { title: 'Doçura natural', text: 'Tâmaras, frutas secas e frutas maduras: doçura inteira, cheia de fibras, sem pico e sem queda.' },
      { title: 'A base', text: 'Aveia, farinha de amêndoa e até tubérculos dão estrutura e conforto, sem farinha de trigo branca.' },
      { title: 'Sabores e especiarias', text: 'Cacau, baunilha, canela, cardamomo, cravo e raspas tropicais: a alma de cada doce.' },
      { title: 'Coberturas e texturas', text: 'Frutas liofilizadas, sementes, coco, casquinha de chocolate, flores comestíveis: beleza e crocância.' },
      { title: 'Cor e humor', text: 'Beterraba, spirulina, cúrcuma, mirtilo. A paleta da natureza, e o motivo de as crianças estenderem a mão.' },
    ],
  },
  peek: {
    kicker: 'Dê uma espiada', title: '{pages} páginas para cozinhar junto', lead: 'Toque em uma página para ver de perto.',
    alts: ['Sumário do Sweet Escape', 'Regra nº 2: os seis pilares', 'Abertura da receita do Dia 1, Amarelo', 'Página de receita com ingredientes e modo de preparo', 'Por que abacaxi? A história do ingrediente', 'Benefícios de cada ingrediente', 'Abertura da receita do Dia 4, Roxo', 'A história da Dolly: do balé à cozinha na mata'],
  },
  family: {
    kicker: 'Para mães e pais', title: 'Conquiste com um doce, não com um sermão',
    lead: 'São sobremesas que *seduzem*. Tartarugas de chocolate com patinhas de pecã. Tacos de sorvete verde. Joias cor-de-rosa que vocês enrolam juntos na mesa da cozinha. Sua família se apaixona por frutas, castanhas e plantas inteiras sem ninguém dizer que faz bem.',
    checks: [
      'Troque o biscoito do lanche por algo que você tem orgulho de entregar',
      'Coloque as crianças na cozinha: a maioria das receitas é bater, enrolar, apertar e congelar',
      'Sobremesas dignas de aniversário, sem leite, ovo ou açúcar branco na tigela',
      'Faça uma fornada no domingo e o freezer cuida do resto da semana',
    ],
  },
  math: {
    kicker: 'Faça as contas', title: 'Um livro. Uns {n} doces.', treats: 'doces numa rodada das 7 receitas',
    bakery: 'o que custariam na nossa confeitaria, a ~{each} cada', book: 'pelo livro que você usa para sempre',
    small: 'Ingredientes não inclusos, claro. Mas você já sabe onde fica o mercado.',
  },
  story: {
    kicker: 'Conheça a Dolly', title: 'Do palco do balé a uma cozinha na mata',
    paragraphs: [
      'Minha relação com a comida começou num mundo em que a disciplina era tudo: o balé profissional. Aprendi a controlar cada caloria, cada mordida, e isso me afastou da alegria de comer.',
      'Entre amor e perda, reconstruí minha vida no litoral brasileiro, cercada pelo mar, pela mata, pelo sol e pela abundância do Brasil. Foi ali que a comida virou criatividade, nutrir virou prazer, e a sobremesa virou celebração em vez de concessão.',
      'O *Sweet Escape* é tudo o que aprendi, em sete receitas, para você levar essa mesma alegria para a sua cozinha.',
    ],
    sign: 'Entre na minha cozinha na mata.', photoAlt: 'Dolly segurando uma bandeja dos seus doces de plantas no jardim',
  },
  offer: {
    kicker: 'Tudo o que você recebe', title: 'Seu sweet escape, hoje',
    stack: [
      { what: 'O e-book Sweet Escape', detail: '{pages} páginas coloridas, 7 receitas completas com cada camada, passo e foto' },
      { what: 'Os 6 pilares', detail: 'o método para você inventar seus próprios doces depois do sétimo dia' },
      { what: 'Histórias “Por que este ingrediente?”', detail: 'a história e a mágica do abacaxi, manga, frutas vermelhas, batata-doce, spirulina, amendoim e cacau' },
      { what: 'Benefícios de cada receita', detail: 'o que cada ingrediente faz por você e pela sua família, em palavras simples' },
      { what: 'As seis regras e o kit básico da Dolly', detail: 'um liquidificador, algumas forminhas e um freezer. É a cozinha inteira.' },
      { what: 'Bônus: uma conversa grátis de 30 minutos de Food Healing', detail: 'agende com a Dolly por um link dentro do livro', bonus: true },
      { what: 'Bônus: um convite para as Sunbaked Letters', detail: 'a carta semanal da Dolly, com receitas e food healing (em inglês)', bonus: true },
    ],
    promiseDays: 'dias', promiseTitle: 'A promessa doce',
    promiseText: 'Faça uma receita. Se não te conquistar, escreva pra gente em até 7 dias e devolvemos cada centavo.',
    coverAlt: 'Capa do e-book Sweet Escape', usd: 'Pagamento único · PDF',
  },
  faq: {
    kicker: 'Dúvidas', title: 'Bom saber',
    items: [
      { q: 'Em quais idiomas está o livro?', a: 'Em português do Brasil, com todas as receitas e fotos traduzidas. Também existe em English, Español e Nederlands: você escolhe o idioma no pedido. Quem lê outro idioma recebe a edição em inglês (um inglês simples e amigável, com medidas em xícaras e forno em °C).' },
      { q: 'Como eu recebo?', a: 'É um PDF. Pagando no cartão, o download abre na hora e um link pessoal chega por e-mail. No Pix, a Dolly confirma o pagamento à mão, normalmente em poucas horas, e o mesmo link se libera sozinho.' },
      { q: 'Preciso de algum equipamento especial?', a: 'Não. Um liquidificador ou processador, algumas forminhas de silicone ou uma assadeira, e um freezer. A maioria dos doces é crua: você bate, aperta e o freezer faz o resto. Só os muffins e os biscoitos de taco vão ao forno.' },
      { q: 'É mesmo sem açúcar refinado?', a: 'Toda receita é adoçada com tâmaras, uvas-passas e frutas. A única exceção é a casquinha de chocolate do Dia 7: o livro ensina a escolher um chocolate amargo sem açúcar refinado, porque a maioria dos de mercado tem um pouco.' },
      { q: 'É vegano? Sem glúten?', a: '100% vegetal, sem leite, sem ovo e sem farinha de trigo. Algumas receitas levam aveia: use aveia certificada sem glúten se precisar.' },
      { q: 'Meu filho tem alergia a castanhas.', a: 'Cuidado, por favor: castanhas, sementes e coco são o coração da maioria das receitas (amêndoa, caju, nozes, pecã, pistache, amendoim). O capítulo dos pilares ajuda a pensar em substituições, mas este livro não foi escrito para uma cozinha sem castanhas.' },
      { q: 'Sou iniciante. Vou conseguir?', a: 'Vai. A Regra nº 4 é literalmente “trabalhe com inteligência, não com esforço”. Comece pelo Dia 3, as Red Berry Bliss Balls: sem forno, dez minutos, e mãozinhas conseguem enrolar.' },
      { q: 'E se eu não gostar?', a: 'Escreva pra gente em até 7 dias e devolvemos cada centavo. Sem formulário, sem ressentimento.' },
    ],
  },
  final: {
    line: 'Sete cores. Sete criações. Sete pequenos motivos para se apaixonar de novo pelas plantas.',
    title1: 'Seu', script: 'sweet escape', title2: 'está esperando.',
    ps: '**P.S.** Se você rolou direto até aqui: são {pages} páginas, 7 sobremesas de plantas que a sua família vai pedir de verdade, o método para inventar as suas e uma garantia de 7 dias. Tudo por {price}, menos que dois doces da nossa confeitaria.',
  },
  buyBar: { kicker: 'E-book Sweet Escape', note: 'PDF na hora · em português', label: 'Quero' },
  form: {
    bookLang: 'Idioma do livro',
    name: 'Seu nome', email: 'E-mail', emailNote: '(o livro chega aqui)', whatsapp: 'WhatsApp', optional: '(opcional)',
    payLegend: 'Como você quer pagar?',
    card: 'Cartão', cardNote: 'download na hora', pix: 'Pix', pixMethodNote: 'confirmado à mão', paypal: 'PayPal', paypalNote: 'de qualquer país',
    submit: 'Sim! Quero o Sweet Escape · {price}', busy: 'Um momento…',
    fine: '🔒 Pagamento seguro · PDF por e-mail · garantia de 7 dias',
    currencyNote: '',
    errName: 'Conta pra gente o seu nome.', errEmail: 'Confira o seu e-mail: é para lá que o livro vai.', errGeneric: 'Algo deu errado. Tente de novo.',
    pixTitle: 'Quase seu! Pague {price} no Pix', pixLabel: 'Ou Pix copia e cola:', pixCopy: 'Copiar o código Pix', pixCopied: 'Copiado ✓',
    pixNote: 'Também mandamos este código e o seu link de download para **{email}**. A Dolly confirma o Pix à mão, normalmente em poucas horas, e o seu link se libera sozinho.',
    pixPaid: 'Já paguei · ir para o meu download',
  },
  thanks: {
    checking: 'Conferindo o seu pedido…', checkingSub: 'Leva só alguns segundos.',
    paidTitle: 'Boas-vindas à cozinha na mata{name}! 🌈',
    paidText: 'O seu **Sweet Escape** está pronto. Salve no celular ou tablet e cozinhe direto dele. Esta página e o link do seu e-mail funcionam sempre que precisar.',
    fileError: 'O download não começou. Tente mais uma vez; se ainda falhar, chame a gente no WhatsApp e enviamos na hora.',
    download: 'Baixar o Sweet Escape (PDF)',
    startTitle: 'Por onde começar',
    start: ['Leia primeiro as seis regras: elas deixam todas as receitas mais fáceis.', 'O Dia 3, Red Berry Bliss Balls, não vai ao forno: perfeito com as crianças.', 'Deixe a castanha de caju de molho na noite anterior aos Dias 1, 2 e 6.'],
    waitTitle: 'Obrigada{name}! Quase lá',
    waitPix: 'A Dolly confirma o Pix à mão, normalmente em poucas horas. Deixe esta página aberta ou volte pelo link do seu e-mail: o download se libera aqui sozinho.',
    waitCard: 'Estamos esperando a confirmação do pagamento. Alguns bancos levam um ou dois minutos; esta página se atualiza sozinha.',
    failedTitle: 'O pagamento não passou', failedText: 'Nada foi cobrado. Tente de novo com outro cartão, ou pague no Pix.', retry: 'Tentar de novo',
    unknownTitle: 'Não encontramos este pedido', unknownText: 'Abra de novo o link do seu e-mail. Se você pagou e ainda não funciona, chame a gente no WhatsApp com o seu e-mail que a gente resolve.', back: 'Voltar ao Sweet Escape',
    nextTitle: 'Quer que alguém faça os doces por você?',
    next: [
      { title: 'Caixa de Degustação', text: 'Os doces da Dolly, fresquinhos da nossa cozinha em Itamambuca.' },
      { title: 'Cozinhe com a Dolly', text: 'Cursos práticos para ir além do livro.' },
      { title: 'O retiro', text: 'Cozinhe na própria cozinha na mata, a passos da praia.' },
    ],
  },
  mail: {
    hi: 'Oi, {name}!',
    receivedPix: 'Obrigada por pedir o Sweet Escape! O seu livro está reservado. Assim que o Pix de {price} cair e a Dolly confirmar, o botão abaixo libera o download. Guarde este e-mail: o link é seu para sempre.',
    receivedCard: 'Obrigada por pedir o Sweet Escape! Só estamos esperando a confirmação do pagamento, que costuma levar um minuto. O botão abaixo é o seu link pessoal de download, e é seu para sempre.',
    edition: 'Sua edição', yourOrder: 'Seu pedido', receivedSubject: 'Seu pedido do Sweet Escape ({ref})',
    receivedPreheaderPix: 'Um Pix de {price} e o livro é seu.', receivedPreheaderCard: 'O seu livro de doces de plantas está a caminho.',
    receivedHeading: 'Seu sweet escape está esperando', myPage: 'Minha página de download', receivedNote: 'Pedido {ref}. Dúvidas? Chame no WhatsApp: +55 11 93211-9196.',
    paidText: 'Pagamento confirmado. Boas-vindas à cozinha na mata! O seu Sweet Escape está pronto para baixar: 72 páginas, sete cores, sete doces.',
    whereToStart: 'Por onde começar',
    tips: ['Leia primeiro as seis regras (páginas 4–11). Elas são o “porquê” que deixa toda receita mais fácil.', 'O Dia 3, Red Berry Bliss Balls, não vai ao forno e é perfeito para fazer com as crianças.', 'Deixe a castanha de caju de molho na noite anterior aos Dias 1, 2 ou 6 e tudo fica mais rápido.'],
    paidLink: 'O link abaixo funciona sempre que precisar, em qualquer aparelho. Salve o PDF no celular ou tablet e cozinhe direto dele.',
    paidSubject: 'Seu e-book Sweet Escape está pronto 🌈', paidPreheader: 'O seu link de download está aqui dentro. Aproveite!',
    paidHeading: 'Seu livro está pronto', paidCta: 'Baixar o Sweet Escape', paidNote: 'Pedido {ref}. Mostre o que você fez: @thetropicalbakery no Instagram.',
  },
};

const ES: EbookCopy = {
  meta: {
    title: 'Sweet Escape · 7 postres de plantas que tu familia va a amar | The Tropical Bakery',
    description: 'El e-book de Dolly: 7 colores, 7 postres hechos con frutas, frutos secos y plantas enteras. Cremas sedosas, caramelo, mousse de chocolate, cheesecake. PDF al instante. En español, English, Português y Nederlands.',
    ogTitle: 'Sweet Escape · el libro de postres de plantas de la cocina de Dolly en la selva',
    ogLocale: 'es_ES',
  },
  langBar: { label: 'Lee esta página en', auto: 'traducción automática', suggest: '¿Prefieres leer en español?', suggestGo: 'Leer en' },
  english: {
    badge: 'E-book en inglés',
    title: 'Atención: esta edición está en inglés',
    text: 'Elegiste la edición en inglés: un inglés sencillo y cercano, con foto en cada receta, medidas en tazas (cups) y cucharas y horno en °C y °F. La edición en español también está a la venta: solo elige el idioma al pedir.',
    tick: 'Entiendo que recibiré la edición en inglés.',
    tickError: 'Confirma, por favor, que sabes que recibirás la edición en inglés.',
  },
  edition: {
    badge: 'E-book en español',
    title: 'Disponible en español (y en otros 3 idiomas)',
    text: 'El libro entero, con todas sus recetas, está traducido al español. También hay English, Português y Nederlands: eliges al hacer el pedido. Otros idiomas reciben la edición en inglés.',
  },
  hero: {
    eyebrow: 'Nuevo · el e-book de la cocina de Dolly en la selva',
    script: 'Dulces', title: 'que tus hijos te piden,', em: 'hechos de plantas.',
    lead: '**Sweet Escape** son siete postres vibrantes a base de plantas, uno por cada color de la naturaleza, y los secretos detrás de ellos. Cremas sedosas, caramelo, mousse de chocolate, cheesecake: placer y nutrición en el mismo bocado.',
    cta: 'Quiero Sweet Escape · {price}',
    ticks: ['PDF al instante', '{pages} páginas', 'Garantía de 7 días'],
    card: 'colores · 7 recetas', card2: 'una escapada deliciosa',
  },
  problem: {
    kicker: '¿Te suena?', title1: 'Tú quieres que coman bien.', title2: 'Ellos quieren postre.',
    pains: [
      'Estás en el pasillo de los snacks, dudando entre la barrita “saludable” que sabe a cartón y la que sabes que te vas a arrepentir.',
      'Cada cena se convierte en una negociación por tres trocitos de brócoli.',
      'Ya probaste “postres saludables”. Todos fueron educados. Nadie repitió.',
    ],
    bigIdea: 'El secreto que Dolly aprendió en su cocina: **los niños no comen verduras. Comen colores.** Hazlo rosa con remolacha, verde con espirulina, morado con camote, y de repente las plantas son el premio.',
  },
  journey: { kicker: 'El viaje', title: '7 días. 7 colores. 7 dulces.', lead: 'Una receta por día, cada una con un color de la naturaleza. Toca un día.', day: 'Día', tabs: 'Elige un día' },
  recipes: [
    { name: 'Cuadritos Paraíso de Coco y Piña Besados por el Sol', color: 'Amarillo', subtitle: 'con cobertura de coco y cúrcuma', hook: 'Una crema sedosa de piña y anacardo sobre una base de dátil y almendra. Sabe a vacaciones en la playa y cuaja en el congelador mientras haces otra cosa.', makes: 'Para 8', kidAngle: 'Parece una porción de sol. Nadie pregunta dónde están las verduras.', alt: 'Cuadraditos de piña y coco en capas sobre un tronco de madera' },
    { name: 'Muffins de Mango con Especias Chai', color: 'Naranja', subtitle: 'con crema batida de anacardo, naranja sanguina y zanahoria', hook: 'Muffins de avena y almendra endulzados solo con un caramelo de dátiles, llenos de mango maduro y coronados con una crema que esconde una zanahoria.', makes: 'Salen 8–10', kidAngle: 'Un cupcake con remolino encima. La zanahoria es nuestro secreto.', alt: 'Muffins de mango con crema naranja de anacardo y flores tropicales' },
    { name: 'Bliss Balls Aciditas de Frutos Rojos', color: 'Rojo', subtitle: 'joyas de cereza, fresa, arándano rojo y remolacha', hook: 'Sin horno, sin batidora. Licúa, forma bolitas y rebózalas en frambuesa liofilizada crujiente. La receta más rápida del libro, y la que los niños ayudan a hacer.', makes: 'Salen 12–14', kidAngle: 'Las manos pequeñas pueden formarlas. La remolacha nunca se pareció tanto a un caramelo.', alt: 'Bolitas rosadas de frutos rojos con cerezas y fresas' },
    { name: 'Cheesecake de la Longevidad de Camote Morado', color: 'Morado', subtitle: 'con frutos del bosque e inspiración de las Zonas Azules', hook: 'Base de nueces y cacao, una capa cremosa morada hecha de camote y una salsa de frutos del bosque. La que todos fotografían.', makes: 'Para 8–10', kidAngle: 'Es morado. Ese es todo el argumento, y funciona.', alt: 'Porción de cheesecake de camote morado con una flor violeta' },
    { name: 'Tacos de Pistacho con Nicecream Supergreen Laguna', color: 'Verde', subtitle: 'un dulce alegre y helado, con espirulina', hook: 'Galletas crujientes de pistacho con forma de taco, rellenas de un helado cremoso hecho de banana congelado. Es helado, pero es fruta.', makes: 'Salen 6–8', kidAngle: 'Helado verde dentro de un taco. Desaparece antes de derretirse.', alt: 'Tacos de pistacho verdes rellenos de helado de banana y espirulina' },
    { name: 'Barritas Banoffee de Maní', color: 'Caramelo', subtitle: 'un dulce crudo de tres capas entre Brasil y Gran Bretaña', hook: 'Base de maní al estilo paçoca brasileña, crema de banana y anacardo y un caramelo líquido hecho solo de dátiles. La estrella de la portada.', makes: 'Salen 8–10', kidAngle: 'Crema de maní y caramelo. No vas a tener que ofrecerlo dos veces.', alt: 'Barritas banoffee con caramelo de dátiles en un plato verde' },
    { name: 'Tortugas de Mousse de Cacao Oscuro', color: 'Chocolate', subtitle: 'una oda al chocolate oscuro, con una pera sorpresa', hook: 'Base de pecanas y cacao, una mousse batida con pera madura y una capa brillante de chocolate. Las mitades de pecana se convierten en cabecitas y patitas.', makes: 'Salen 6–8', kidAngle: 'Son tortugas. De chocolate. Con una pera escondida dentro.', alt: 'Tortugas de mousse de chocolate con cabeza y patas de pecana' },
  ],
  learn: {
    kicker: 'No son solo recetas', title: 'Aprende la magia que hay detrás',
    lead: '“La magia no está en memorizar recetas, sino en entender el *porqué* detrás de ellas.” ¿Por qué el dátil sustituye tan bien al azúcar? ¿Por qué la harina de almendra hace un dulce suave *y* saciante? Cuando conoces los seis pilares, siete recetas se vuelven posibilidades infinitas.',
    blocks: [
      { title: 'Grasas buenas y proteínas', text: 'Frutos secos, semillas, aguacate y coco dan cremosidad, riqueza y una saciedad que el azúcar nunca da.' },
      { title: 'Dulzor natural', text: 'Dátiles, frutas secas y fruta madura: dulzor entero, lleno de fibra, sin subidones ni bajones.' },
      { title: 'La base', text: 'Avena, harina de almendra y hasta tubérculos dan estructura y confort, sin harina de trigo blanca.' },
      { title: 'Sabores y especias', text: 'Cacao, vainilla, canela, cardamomo, clavo y ralladura tropical: el alma de cada dulce.' },
      { title: 'Coberturas y texturas', text: 'Fruta liofilizada, semillas, coco, una capa de chocolate, flores comestibles: belleza y crujiente.' },
      { title: 'Color y ánimo', text: 'Remolacha, espirulina, cúrcuma, arándanos. La paleta de la naturaleza, y la razón por la que los niños estiran la mano.' },
    ],
  },
  peek: {
    kicker: 'Echa un vistazo', title: '{pages} páginas para cocinar con ellas', lead: 'Toca una página para verla de cerca.',
    alts: ['Índice de Sweet Escape', 'Regla n.º 2: los seis pilares', 'Apertura de la receta del Día 1, Amarillo', 'Página de receta con ingredientes y pasos', '¿Por qué piña? La historia del ingrediente', 'Beneficios de cada ingrediente', 'Apertura de la receta del Día 4, Morado', 'La historia de Dolly: del ballet a la cocina en la selva'],
  },
  family: {
    kicker: 'Para madres y padres', title: 'Conquístalos con un dulce, no con un sermón',
    lead: 'Son postres que *seducen*. Tortugas de chocolate con patitas de pecana. Tacos de helado verde. Joyas rosas que formáis juntos en la mesa de la cocina. Tu familia se enamora de la fruta, los frutos secos y las plantas enteras sin que nadie le diga que es sano.',
    checks: [
      'Cambia la galleta de la merienda por algo que te enorgullezca dar',
      'Mete a los niños en la cocina: casi todas las recetas son triturar, formar, presionar y congelar',
      'Postres dignos de cumpleaños, sin lácteos, huevo ni azúcar blanco en el bol',
      'Prepara una tanda el domingo y el congelador se encarga del resto de la semana',
    ],
  },
  math: {
    kicker: 'Haz las cuentas', title: 'Un libro. Unos {n} dulces.', treats: 'dulces en una ronda de las 7 recetas',
    bakery: 'lo que costarían en nuestra pastelería, a ~{each} cada uno', book: 'por el libro que usarás siempre',
    small: 'Ingredientes no incluidos, claro. Pero ya sabes dónde está el supermercado.',
  },
  story: {
    kicker: 'Conoce a Dolly', title: 'Del escenario del ballet a una cocina en la selva',
    paragraphs: [
      'Mi relación con la comida empezó en un mundo donde la disciplina lo era todo: el ballet profesional. Aprendí a controlar cada caloría, cada bocado, y eso me alejó de la alegría de comer.',
      'Entre el amor y la pérdida, reconstruí mi vida en la costa brasileña, rodeada del mar, la selva, el sol y la abundancia de Brasil. Allí la comida se volvió creatividad, nutrirse se volvió placer, y el postre se volvió una celebración en lugar de una concesión.',
      '*Sweet Escape* es todo lo que aprendí, en siete recetas, para que lleves esa misma alegría a tu cocina.',
    ],
    sign: 'Entra en mi cocina en la selva.', photoAlt: 'Dolly sosteniendo una bandeja de sus dulces de plantas en el jardín',
  },
  offer: {
    kicker: 'Todo lo que recibes', title: 'Tu sweet escape, hoy',
    stack: [
      { what: 'El e-book Sweet Escape', detail: '{pages} páginas a todo color, 7 recetas completas con cada capa, paso y foto' },
      { what: 'Los 6 pilares', detail: 'el método para inventar tus propios dulces después del séptimo día' },
      { what: 'Historias “¿Por qué este ingrediente?”', detail: 'la historia y la magia de la piña, el mango, los frutos rojos, el camote, la espirulina, el maní y el cacao' },
      { what: 'Beneficios de cada receta', detail: 'lo que hace cada ingrediente por ti y tu familia, en palabras sencillas' },
      { what: 'Las seis reglas y el kit básico de Dolly', detail: 'una licuadora, unos moldes y un congelador. Esa es toda la cocina.' },
      { what: 'Bonus: una llamada gratis de 30 minutos de Food Healing', detail: 'resérvala con Dolly desde un enlace dentro del libro', bonus: true },
      { what: 'Bonus: una invitación a Sunbaked Letters', detail: 'la carta semanal de Dolly con recetas y food healing (en inglés)', bonus: true },
    ],
    promiseDays: 'días', promiseTitle: 'La promesa dulce',
    promiseText: 'Haz una receta. Si no te conquista, escríbenos en 7 días y te devolvemos hasta el último céntimo.',
    coverAlt: 'Portada del e-book Sweet Escape', usd: 'pago único · PDF',
  },
  faq: {
    kicker: 'Preguntas', title: 'Bueno saberlo',
    items: [
      { q: '¿En qué idiomas está el libro?', a: 'En español, con todas las recetas y fotos traducidas. También existe en English, Português y Nederlands: eliges el idioma al pedir. Quien lee otro idioma recibe la edición en inglés (un inglés sencillo y cercano, con medidas en tazas y horno en °C y °F).' },
      { q: '¿Cómo lo recibo?', a: 'Es un PDF. Pagando con tarjeta o PayPal, la descarga se abre al momento y te llega un enlace personal por e-mail. Con Pix (Brasil), Dolly confirma el pago a mano, normalmente en pocas horas, y el mismo enlace se desbloquea solo.' },
      { q: '¿Necesito algún equipo especial?', a: 'No. Una licuadora o procesador, unos moldes de silicona o una bandeja, y un congelador. La mayoría de los dulces son crudos: licuas, presionas y el congelador hace el resto. Solo los muffins y las galletas taco van al horno.' },
      { q: '¿De verdad es sin azúcar refinado?', a: 'Cada receta se endulza con dátiles, pasas y fruta. La única excepción es la capa de chocolate del Día 7: el libro te enseña a elegir un chocolate negro sin azúcar refinado, porque la mayoría de los del súper llevan un poco.' },
      { q: '¿Es vegano? ¿Sin gluten?', a: '100% vegetal, sin lácteos, sin huevo y sin harina de trigo. Algunas recetas llevan avena: usa avena certificada sin gluten si lo necesitas.' },
      { q: 'Mi hijo es alérgico a los frutos secos.', a: 'Ten cuidado, por favor: frutos secos, semillas y coco son el corazón de casi todas las recetas (almendra, anacardo, nuez, pecana, pistacho, maní). El capítulo de los pilares ayuda a pensar en sustituciones, pero este libro no está escrito para una cocina sin frutos secos.' },
      { q: 'Soy principiante. ¿Podré hacerlo?', a: 'Sí. La Regla n.º 4 es literalmente “trabaja con inteligencia, no con esfuerzo”. Empieza por el Día 3, las Red Berry Bliss Balls: sin horno, diez minutos, y las manos pequeñas pueden formarlas.' },
      { q: '¿Y si no me gusta?', a: 'Escríbenos en 7 días y te devolvemos hasta el último céntimo. Sin formularios, sin rencores.' },
    ],
  },
  final: {
    line: 'Siete colores. Siete creaciones. Siete pequeñas razones para volver a enamorarte de las plantas.',
    title1: 'Tu', script: 'sweet escape', title2: 'te está esperando.',
    ps: '**P.D.** Si bajaste directo hasta aquí: son {pages} páginas, 7 postres de plantas que tu familia va a pedir de verdad, el método para inventar los tuyos y una garantía de 7 días. Todo por {price}, menos que dos dulces de nuestra pastelería.',
  },
  buyBar: { kicker: 'E-book Sweet Escape', note: 'PDF al instante · en español', label: 'Lo quiero' },
  form: {
    bookLang: 'Idioma del libro',
    name: 'Tu nombre', email: 'E-mail', emailNote: '(aquí llega tu libro)', whatsapp: 'WhatsApp', optional: '(opcional)',
    payLegend: '¿Cómo quieres pagar?',
    card: 'Tarjeta', cardNote: 'descarga al instante', pix: 'Pix', pixMethodNote: 'Brasil · confirmado a mano', paypal: 'PayPal', paypalNote: 'desde cualquier país',
    submit: '¡Sí! Quiero Sweet Escape · {price}', busy: 'Un momento…',
    fine: '🔒 Pago seguro · PDF por e-mail · garantía de 7 días',
    currencyNote: 'Esta forma de pago cobra {reais} (reales brasileños), unos US$ {usd}; tu banco o PayPal hace la conversión.',
    errName: 'Dinos tu nombre, por favor.', errEmail: 'Revisa tu e-mail: ahí es donde llega tu libro.', errGeneric: 'Algo salió mal. Inténtalo de nuevo.',
    pixTitle: '¡Casi tuyo! Paga {price} con Pix', pixLabel: 'O Pix copia e cola:', pixCopy: 'Copiar el código Pix', pixCopied: 'Copiado ✓',
    pixNote: 'También enviamos este código y tu enlace de descarga a **{email}**. Dolly confirma los pagos Pix a mano, normalmente en pocas horas, y tu enlace se desbloquea solo.',
    pixPaid: 'Ya pagué · ir a mi descarga',
  },
  thanks: {
    checking: 'Revisando tu pedido…', checkingSub: 'Solo tarda unos segundos.',
    paidTitle: '¡Te damos la bienvenida a la cocina en la selva{name}! 🌈',
    paidText: 'Tu **Sweet Escape** está listo. Guárdalo en el celular o la tablet y cocina directamente desde él. Esta página y el enlace de tu e-mail funcionan siempre que los necesites.',
    fileError: 'La descarga no empezó. Inténtalo una vez más; si sigue fallando, escríbenos por WhatsApp y te lo enviamos enseguida.',
    download: 'Descargar Sweet Escape (PDF)',
    startTitle: 'Por dónde empezar',
    start: ['Lee primero las seis reglas: hacen que cada receta sea más fácil.', 'El Día 3, Red Berry Bliss Balls, no lleva horno: perfecto con niños.', 'Deja los anacardos en remojo la noche antes de los Días 1, 2 y 6.'],
    waitTitle: '¡Gracias{name}! Casi listo',
    waitPix: 'Dolly confirma los pagos Pix a mano, normalmente en pocas horas. Deja esta página abierta o vuelve desde el enlace de tu e-mail: la descarga se desbloquea aquí sola.',
    waitCard: 'Estamos esperando la confirmación del pago. Algunos bancos tardan un minuto o dos; esta página se actualiza sola.',
    failedTitle: 'El pago no se completó', failedText: 'No se cobró nada. Inténtalo de nuevo con otra tarjeta.', retry: 'Intentar de nuevo',
    unknownTitle: 'No encontramos este pedido', unknownText: 'Abre de nuevo el enlace de tu e-mail. Si pagaste y sigue sin funcionar, escríbenos por WhatsApp con tu e-mail y lo resolvemos.', back: 'Volver a Sweet Escape',
    nextTitle: '¿Quieres que alguien más haga los dulces?',
    next: [
      { title: 'La Caja de Degustación', text: 'Los dulces de Dolly, recién hechos en nuestra cocina de Itamambuca (Brasil).' },
      { title: 'Cocina con Dolly', text: 'Cursos prácticos para ir más allá del libro.' },
      { title: 'El retiro', text: 'Cocina en la propia cocina en la selva, a pasos de la playa.' },
    ],
  },
  mail: {
    hi: '¡Hola, {name}!',
    receivedPix: '¡Gracias por pedir Sweet Escape! Tu libro está reservado. En cuanto llegue tu Pix de {price} y Dolly lo confirme, el botón de abajo desbloquea tu descarga. Guarda este e-mail: el enlace es tuyo para siempre.',
    receivedCard: '¡Gracias por pedir Sweet Escape! Solo estamos esperando la confirmación del pago, que suele tardar un minuto. El botón de abajo es tu enlace personal de descarga, y es tuyo para siempre.',
    edition: 'Tu edición', yourOrder: 'Tu pedido', receivedSubject: 'Tu pedido de Sweet Escape ({ref})',
    receivedPreheaderPix: 'Un Pix de {price} y el libro es tuyo.', receivedPreheaderCard: 'Tu libro de postres de plantas está en camino.',
    receivedHeading: 'Tu sweet escape te está esperando', myPage: 'Mi página de descarga', receivedNote: 'Pedido {ref}. ¿Dudas? Escríbenos por WhatsApp: +55 11 93211-9196.',
    paidText: 'Pago confirmado. ¡Te damos la bienvenida a la cocina en la selva! Tu Sweet Escape está listo para descargar: 72 páginas, siete colores, siete dulces.',
    whereToStart: 'Por dónde empezar',
    tips: ['Lee primero las seis reglas (páginas 4–11). Son el “porqué” que hace que cada receta sea más fácil.', 'El Día 3, Red Berry Bliss Balls, no lleva horno y es perfecto para hacer con niños.', 'Deja los anacardos en remojo la noche antes del Día 1, 2 o 6 y todo irá más rápido.'],
    paidLink: 'El enlace de abajo funciona siempre que lo necesites, en cualquier dispositivo. Guarda el PDF en el celular o la tablet y cocina directamente desde él.',
    paidSubject: 'Tu e-book Sweet Escape está listo 🌈', paidPreheader: 'Tu enlace de descarga está dentro. ¡Disfruta!',
    paidHeading: 'Tu libro está listo', paidCta: 'Descargar Sweet Escape', paidNote: 'Pedido {ref}. Enséñanos lo que hagas: @thetropicalbakery en Instagram.',
  },
};

const NL: EbookCopy = {
  meta: {
    title: 'Sweet Escape · 7 plantaardige traktaties waar je gezin dol op wordt | The Tropical Bakery',
    description: 'Het e-book van Dolly: 7 kleuren, 7 plantaardige desserts van fruit, noten en hele planten. Zijdezachte crèmes, karamel, chocolademousse, cheesecake. Meteen als PDF, in het Nederlands, English, Português en Español.',
    ogTitle: 'Sweet Escape · het boek met plantaardige traktaties uit Dolly’s jungle-keuken',
    ogLocale: 'nl_NL',
  },
  langBar: { label: 'Lees deze pagina in', auto: 'automatische vertaling', suggest: 'Liever in het Nederlands lezen?', suggestGo: 'Lezen in het' },
  english: {
    badge: 'E-book in het Engels',
    title: 'Let op: deze editie is in het Engels',
    text: 'Je koos de Engelse editie: eenvoudig, vriendelijk Engels, met een foto bij elk recept, maten in cups en lepels en ovenstanden in °C en °F. De Nederlandse editie is ook te koop: kies gewoon je taal bij het bestellen.',
    tick: 'Ik begrijp dat ik de Engelse editie krijg.',
    tickError: 'Bevestig even dat je weet dat je de Engelse editie krijgt.',
  },
  edition: {
    badge: 'E-book in het Nederlands',
    title: 'Beschikbaar in het Nederlands (en nog 3 talen)',
    text: 'Het hele boek, recepten en foto’s, is vertaald naar het Nederlands. Er is ook English, Português en Español: kies bij het bestellen. Alle andere talen krijgen de Engelse editie.',
  },
  hero: {
    eyebrow: 'Nieuw · het e-book uit Dolly’s jungle-keuken',
    script: 'Zoete', title: 'traktaties waar je kinderen om smeken,', em: 'gemaakt van planten.',
    lead: '**Sweet Escape** zijn zeven levendige plantaardige desserts, één voor elke kleur van de natuur, en de geheimen erachter. Zijdezachte crèmes, heerlijke karamel, chocolademousse, cheesecake: genieten en voeden in dezelfde hap.',
    cta: 'Ja, ik wil Sweet Escape · {price}',
    ticks: ['Meteen als PDF', '{pages} pagina’s', '7 dagen garantie'],
    card: 'kleuren · 7 recepten', card2: 'één heerlijke ontsnapping',
  },
  problem: {
    kicker: 'Komt dit je bekend voor?', title1: 'Jij wilt dat ze gezond eten.', title2: 'Zij willen dessert.',
    pains: [
      'Je staat in het snoepgangpad, verscheurd tussen de “gezonde” reep die naar karton smaakt en degene waar je straks spijt van krijgt.',
      'Elk avondeten wordt een onderhandeling over drie stukjes broccoli.',
      'Je probeerde “gezonde desserts”. Iedereen was beleefd. Niemand vroeg om meer.',
    ],
    bigIdea: 'Het geheim dat Dolly in haar keuken leerde: **kinderen eten geen groente. Ze eten kleuren.** Maak het roze met rode biet, groen met spirulina, paars met zoete aardappel, en ineens zijn de planten de traktatie.',
  },
  journey: { kicker: 'De reis', title: '7 dagen. 7 kleuren. 7 traktaties.', lead: 'Eén recept per dag, elk een kleur van de natuur. Tik op een dag.', day: 'Dag', tabs: 'Kies een dag' },
  recipes: [
    { name: 'Zongekuste Kokos-Ananas Paradijsblokjes', color: 'Geel', subtitle: 'met een kokostopping met kurkuma', hook: 'Een zijdezachte ananas-cashewcrème op een bodem van dadel en amandel. Smaakt naar een strandvakantie en trekt vast in de vriezer terwijl jij iets anders doet.', makes: 'Voor 8', kidAngle: 'Ziet eruit als een plak zonneschijn. Niemand vraagt waar de groente is.', alt: 'Gelaagde ananas-kokosblokjes op een boomstam' },
    { name: 'Mangomuffins met Chai-kruiden', color: 'Oranje', subtitle: 'met cashew-slagroom van bloedsinaasappel en wortel', hook: 'Muffins van haver en amandel, alleen gezoet met dadelkaramel, vol rijpe mango en bekroond met een slagroom die een wortel verbergt.', makes: 'Goed voor 8–10', kidAngle: 'Een cupcake met een krul erop. De wortel is ons geheim.', alt: 'Mangomuffins met oranje cashewroom en tropische bloemen' },
    { name: 'Frisse Rode Bessen Bliss Balls', color: 'Rood', subtitle: 'juweelachtige hapjes met kers, aardbei, cranberry en biet', hook: 'Geen oven, geen mixer. Mixen, rollen en wentelen door knapperige gevriesdroogde framboos. Het snelste recept uit het boek, en het recept waar kinderen bij helpen.', makes: 'Goed voor 12–14', kidAngle: 'Kleine handjes kunnen ze rollen. Biet leek nog nooit zo veel op snoep.', alt: 'Roze bessenballetjes met verse kersen en aardbeien' },
    { name: 'Paarse Zoete Aardappel Longevity Cheesecake', color: 'Paars', subtitle: 'met donkere bosbessen en geïnspireerd op de Blue Zones', hook: 'Een bodem van walnoot en cacao, een romige paarse laag van zoete aardappel en een gietbare bessentopping. Degene die iedereen fotografeert.', makes: 'Voor 8–10', kidAngle: 'Hij is paars. Dat is het hele argument, en het werkt.', alt: 'Plak paarse zoete aardappel-cheesecake met een violette bloem' },
    { name: 'Supergreen Laguna Nicecream Pistache Taco’s', color: 'Groen', subtitle: 'een vrolijke, smeltende traktatie boordevol spirulina', hook: 'Knapperige taco-koekjes van pistache, gevuld met zachte ijs van bevroren bananen. Het is ijs, maar het is fruit.', makes: 'Goed voor 6–8', kidAngle: 'Groen ijs in een taco. Is op voor het kan smelten.', alt: 'Groene pistache-taco’s gevuld met spirulina-bananenijs' },
    { name: 'Pinda Banoffee Repen', color: 'Karamel', subtitle: 'een rauwe traktatie in drie lagen die Brazilië en Engeland verbindt', hook: 'Een bodem van pinda in paçoca-stijl, een banaan-cashewcrème en een vloeibare karamel van niets dan dadels. De ster van de cover.', makes: 'Goed voor 8–10', kidAngle: 'Pindakaas en karamel. Je hoeft het geen twee keer aan te bieden.', alt: 'Banoffee-repen met dadelkaramel op een groen bord' },
    { name: 'Pure Cacao Mousse Schildpadjes', color: 'Chocolade', subtitle: 'een fluweelzachte ode aan de diepste chocolade, met een peerverrassing', hook: 'Een bodem van pecannoot en cacao, een mousse van rijpe peer en een glanzend laagje chocolade. Pecannoothelften worden kopjes en pootjes.', makes: 'Goed voor 6–8', kidAngle: 'Het zijn schildpadjes. Van chocolade. Met een peer erin verstopt.', alt: 'Chocolademousse-schildpadjes met kop en pootjes van pecannoot' },
  ],
  learn: {
    kicker: 'Meer dan recepten', title: 'Leer de magie erachter',
    lead: '“De magie zit niet in het uit je hoofd leren van recepten, maar in begrijpen *waarom* ze werken.” Waarom vervangen dadels suiker zo goed? Waarom maakt amandelmeel een traktatie zacht *én* verzadigend? Als je de zes bouwstenen kent, worden zeven recepten eindeloze mogelijkheden.',
    blocks: [
      { title: 'Gezonde vetten en eiwitten', text: 'Noten, zaden, avocado en kokos geven romigheid, rijkdom en een verzadiging die suiker nooit geeft.' },
      { title: 'Natuurlijke zoetheid', text: 'Dadels, gedroogd en rijp fruit: hele, vezelrijke zoetheid zonder piek en dip.' },
      { title: 'De bodem', text: 'Haver, amandelmeel en zelfs knolgewassen geven structuur en comfort, zonder wit tarwemeel.' },
      { title: 'Smaken en specerijen', text: 'Cacao, vanille, kaneel, kardemom, kruidnagel en tropische rasp: de ziel van elke traktatie.' },
      { title: 'Toppings en texturen', text: 'Gevriesdroogd fruit, zaden, kokos, een chocoladelaagje, eetbare bloemen: schoonheid en knapperigheid.' },
      { title: 'Kleur en stemming', text: 'Rode biet, spirulina, kurkuma, bosbessen. Het palet van de natuur, en de reden dat kinderen ernaar grijpen.' },
    ],
  },
  peek: {
    kicker: 'Neem een kijkje', title: '{pages} pagina’s om uit te koken', lead: 'Tik op een pagina om hem van dichtbij te zien.',
    alts: ['Inhoudsopgave van Sweet Escape', 'Regel nr. 2: de zes bouwstenen', 'Opening van het recept van Dag 1, Geel', 'Een receptpagina met ingrediënten en stappen', 'Waarom ananas? Het verhaal achter het ingrediënt', 'Gezondheidsvoordelen van elk ingrediënt', 'Opening van het recept van Dag 4, Paars', 'Dolly’s verhaal: van ballet naar de jungle-keuken'],
  },
  family: {
    kicker: 'Voor ouders', title: 'Win ze voor je met een traktatie, niet met een preek',
    lead: 'Dit zijn desserts die *verleiden*. Chocoladeschildpadjes met pecanpootjes. Groene ijs-taco’s. Roze juweeltjes die je samen aan de keukentafel rolt. Je gezin wordt verliefd op fruit, noten en hele planten zonder dat iemand zegt dat het gezond is.',
    checks: [
      'Ruil het koekje na school in voor iets waar je trots op bent',
      'Laat de kinderen meekoken: de meeste recepten zijn mixen, rollen, drukken en bevriezen',
      'Desserts die een verjaardag waardig zijn, zonder zuivel, eieren of witte suiker in de kom',
      'Maak zondag een portie en de vriezer doet de rest van de week',
    ],
  },
  math: {
    kicker: 'Reken maar mee', title: 'Eén boek. Zo’n {n} traktaties.', treats: 'traktaties uit één ronde van alle 7 recepten',
    bakery: 'wat ze bij onze bakkerij zouden kosten, tegen ~{each} per stuk', book: 'voor het boek waar je altijd uit kunt koken',
    small: 'Ingrediënten niet inbegrepen, natuurlijk. Maar je weet waar de supermarkt is.',
  },
  story: {
    kicker: 'Maak kennis met Dolly', title: 'Van het balletpodium naar een jungle-keuken',
    paragraphs: [
      'Mijn relatie met eten begon in een wereld waar discipline alles was: professioneel ballet. Ik leerde elke calorie, elke hap te beheersen, en dat maakte dat ik het plezier in eten kwijtraakte.',
      'Door liefde en verlies bouwde ik mijn leven opnieuw op aan de Braziliaanse kust, omringd door de oceaan, het regenwoud, het zonlicht en de overvloed van Brazilië. Daar werd eten creativiteit, voeden werd genieten, en dessert werd een feest in plaats van een compromis.',
      '*Sweet Escape* is alles wat ik leerde, verweven door zeven recepten, zodat jij diezelfde vreugde in je eigen keuken kunt brengen.',
    ],
    sign: 'Kom binnen in mijn jungle-keuken.', photoAlt: 'Dolly met een schaal van haar plantaardige traktaties in de tuin',
  },
  offer: {
    kicker: 'Alles wat je krijgt', title: 'Jouw sweet escape, vandaag',
    stack: [
      { what: 'Het e-book Sweet Escape', detail: '{pages} pagina’s in vol kleur, 7 complete recepten met elke laag, stap en foto' },
      { what: 'De 6 bouwstenen', detail: 'het raamwerk waarmee je na de zevende dag je eigen traktaties bedenkt' },
      { what: 'Verhalen “Waarom dit ingrediënt?”', detail: 'de geschiedenis en magie van ananas, mango, bessen, zoete aardappel, spirulina, pinda en cacao' },
      { what: 'Gezondheidsvoordelen bij elk recept', detail: 'wat elk ingrediënt doet voor jou en je gezin, in gewone woorden' },
      { what: 'Dolly’s zes regels en eenvoudige keukenset', detail: 'een blender, wat vormpjes en een vriezer. Dat is de hele keuken.' },
      { what: 'Bonus: een gratis Food Healing-gesprek van 30 minuten', detail: 'boek een kennismaking met Dolly vanuit het boek', bonus: true },
      { what: 'Bonus: een uitnodiging voor Sunbaked Letters', detail: 'Dolly’s wekelijkse brief met recepten en food healing (in het Engels)', bonus: true },
    ],
    promiseDays: 'dagen', promiseTitle: 'De zoete belofte',
    promiseText: 'Maak één recept. Wint het je niet voor zich, schrijf ons binnen 7 dagen en je krijgt elke cent terug.',
    coverAlt: 'Omslag van het e-book Sweet Escape', usd: 'eenmalige betaling · PDF',
  },
  faq: {
    kicker: 'Vragen', title: 'Goed om te weten',
    items: [
      { q: 'In welke talen is het boek?', a: 'In het Nederlands, English, Português (Brazilië) en Español, volledig vertaald met recepten en foto’s. Kies je taal bij het bestellen. Wie een andere taal leest, krijgt de Engelse editie: eenvoudig, vriendelijk Engels met maten in cups en lepels en ovenstanden in °C en °F.' },
      { q: 'Hoe krijg ik het?', a: 'Het is een PDF. Na betaling met kaart of PayPal opent je download meteen en komt er een persoonlijke link per e-mail. Met Pix (Brazilië) bevestigt Dolly de betaling met de hand, meestal binnen enkele uren, en dezelfde link ontgrendelt zichzelf.' },
      { q: 'Heb ik speciale apparatuur nodig?', a: 'Nee. Een blender of keukenmachine, een paar siliconen vormpjes of een bakplaat, en een vriezer. De meeste traktaties zijn rauw: je mixt, drukt aan en de vriezer doet de rest. Alleen de muffins en de taco-koekjes gaan in de oven.' },
      { q: 'Is het echt zonder geraffineerde suiker?', a: 'Elk recept wordt gezoet met dadels, rozijnen en fruit. De enige uitzondering is het chocoladelaagje van Dag 7: het boek leert je een pure chocolade zonder geraffineerde suiker te kiezen, want de meeste uit de winkel bevatten wat.' },
      { q: 'Is het vegan? Glutenvrij?', a: '100% plantaardig, zonder zuivel, zonder eieren en zonder tarwemeel. Sommige recepten gebruiken haver: kies gecertificeerd glutenvrije haver als je dat nodig hebt.' },
      { q: 'Mijn kind is allergisch voor noten.', a: 'Wees voorzichtig: noten, zaden en kokos zijn het hart van de meeste recepten (amandel, cashew, walnoot, pecannoot, pistache, pinda). Het hoofdstuk over de bouwstenen helpt je nadenken over alternatieven, maar dit boek is niet geschreven voor een notenvrije keuken.' },
      { q: 'Ik ben beginner. Lukt dat?', a: 'Ja. Regel nr. 4 is letterlijk “werk slim, niet hard”. Begin met Dag 3, de Frisse Rode Bessen Bliss Balls: geen oven, tien minuten, en kleine handjes kunnen ze rollen.' },
      { q: 'En als ik er niet blij mee ben?', a: 'Schrijf ons binnen 7 dagen en je krijgt elke cent terug. Geen formulieren, geen hard feelings.' },
    ],
  },
  final: {
    line: 'Zeven kleuren. Zeven creaties. Zeven kleine redenen om opnieuw verliefd te worden op planten.',
    title1: 'Jouw', script: 'sweet escape', title2: 'wacht op je.',
    ps: '**P.S.** Als je meteen naar beneden scrolde: het zijn {pages} pagina’s, 7 plantaardige desserts waar je gezin echt om vraagt, het raamwerk om je eigen te bedenken en 7 dagen garantie. Alles voor {price}, minder dan twee traktaties uit onze eigen bakkerij.',
  },
  buyBar: { kicker: 'E-book Sweet Escape', note: 'Meteen als PDF · in het Nederlands', label: 'Ik wil het' },
  form: {
    name: 'Je naam', email: 'E-mail', emailNote: '(hier komt je boek aan)', whatsapp: 'WhatsApp', optional: '(optioneel)',
    bookLang: 'Taal van het boek',
    payLegend: 'Hoe wil je betalen?',
    card: 'Kaart', cardNote: 'meteen downloaden', pix: 'Pix', pixMethodNote: 'Brazilië · met de hand bevestigd', paypal: 'PayPal', paypalNote: 'vanuit elk land',
    submit: 'Ja! Ik wil Sweet Escape · {price}', busy: 'Een moment…',
    fine: '🔒 Veilig betalen · PDF per e-mail · 7 dagen garantie',
    currencyNote: 'Deze betaalmethode rekent {reais} (Braziliaanse real) af, ongeveer US$ {usd}; je bank of PayPal rekent het om.',
    errName: 'Vertel ons even je naam.', errEmail: 'Controleer je e-mail: daar komt je boek aan.', errGeneric: 'Er ging iets mis. Probeer het opnieuw.',
    pixTitle: 'Bijna van jou! Betaal {price} met Pix', pixLabel: 'Of Pix copia e cola:', pixCopy: 'Kopieer de Pix-code', pixCopied: 'Gekopieerd ✓',
    pixNote: 'We mailden deze code en je persoonlijke downloadlink ook naar **{email}**. Dolly bevestigt Pix-betalingen met de hand, meestal binnen enkele uren, en je link ontgrendelt zichzelf.',
    pixPaid: 'Ik heb betaald · naar mijn download',
  },
  thanks: {
    checking: 'Je bestelling controleren…', checkingSub: 'Dit duurt een paar seconden.',
    paidTitle: 'Welkom in de jungle-keuken{name}! 🌈',
    paidText: 'Jouw exemplaar van **Sweet Escape** staat klaar. Bewaar het op je telefoon of tablet en kook er rechtstreeks uit. Deze pagina en de link in je e-mail werken wanneer je ze nodig hebt.',
    fileError: 'De download is niet gestart. Probeer het nog eens; lukt het nog niet, stuur ons dan een WhatsApp-bericht en we sturen het meteen.',
    download: 'Download Sweet Escape (PDF)',
    startTitle: 'Waar te beginnen',
    start: ['Lees eerst de zes regels: ze maken elk recept makkelijker.', 'Dag 3, de Frisse Rode Bessen Bliss Balls, heeft geen oven nodig: perfect met kinderen.', 'Week de cashewnoten de avond voor Dag 1, 2 en 6 in.'],
    waitTitle: 'Bedankt{name}! Bijna daar',
    waitPix: 'Dolly bevestigt Pix-betalingen met de hand, meestal binnen enkele uren. Laat deze pagina open of kom terug via de link in je e-mail: je download ontgrendelt hier vanzelf.',
    waitCard: 'We wachten op de betalingsbevestiging. Sommige banken doen er een of twee minuten over; deze pagina ververst zichzelf.',
    failedTitle: 'De betaling is niet gelukt', failedText: 'Er is niets afgeschreven. Probeer het opnieuw met een andere kaart.', retry: 'Opnieuw proberen',
    unknownTitle: 'We vinden deze bestelling niet', unknownText: 'Open de link uit je e-mail opnieuw. Als je betaald hebt en het werkt nog steeds niet, stuur ons dan een WhatsApp-bericht met je e-mailadres en we lossen het op.', back: 'Terug naar Sweet Escape',
    nextTitle: 'Wil je dat iemand anders het bakken doet?',
    next: [
      { title: 'De Proefdoos', text: 'Dolly’s traktaties, vers uit onze keuken in Itamambuca (Brazilië).' },
      { title: 'Kook met Dolly', text: 'Praktische cursussen om verder te gaan dan het boek.' },
      { title: 'De retraite', text: 'Kook in de jungle-keuken zelf, op een steenworp van het strand.' },
    ],
  },
  mail: {
    hi: 'Hoi {name}!',
    receivedPix: 'Bedankt voor je bestelling van Sweet Escape! Je boek is gereserveerd. Zodra je Pix van {price} binnen is en Dolly het bevestigt, ontgrendelt de knop hieronder je download. Bewaar deze e-mail: de link is voorgoed van jou.',
    receivedCard: 'Bedankt voor je bestelling van Sweet Escape! We wachten alleen nog op de betalingsbevestiging, wat meestal een minuut duurt. De knop hieronder is je persoonlijke downloadlink, en die is voorgoed van jou.',
    yourOrder: 'Je bestelling', receivedSubject: 'Je Sweet Escape-bestelling ({ref})',
    receivedPreheaderPix: 'Eén Pix van {price} en het boek is van jou.', receivedPreheaderCard: 'Je boek met plantaardige traktaties is onderweg.',
    edition: 'Jouw editie',
    receivedHeading: 'Je sweet escape wacht op je', myPage: 'Mijn downloadpagina', receivedNote: 'Bestelling {ref}. Vragen? Stuur een WhatsApp-bericht: +55 11 93211-9196.',
    paidText: 'Betaling bevestigd. Welkom in de jungle-keuken! Jouw exemplaar van Sweet Escape staat klaar om te downloaden: 72 pagina’s, zeven kleuren, zeven traktaties.',
    whereToStart: 'Waar te beginnen',
    tips: ['Lees eerst de zes regels (pagina’s 4–11). Ze zijn het “waarom” dat elk recept makkelijker maakt.', 'Dag 3, de Frisse Rode Bessen Bliss Balls, heeft geen oven nodig en is perfect om met kinderen te maken.', 'Week je cashewnoten de avond voor Dag 1, 2 of 6 in en alles gaat sneller.'],
    paidLink: 'De link hieronder werkt wanneer je hem nodig hebt, op elk apparaat. Bewaar de PDF op je telefoon of tablet en kook er rechtstreeks uit.',
    paidSubject: 'Je e-book Sweet Escape staat klaar 🌈', paidPreheader: 'Je downloadlink zit erin. Veel plezier!',
    paidHeading: 'Je boek staat klaar', paidCta: 'Download Sweet Escape', paidNote: 'Bestelling {ref}. Laat ons zien wat je maakt: @thetropicalbakery op Instagram.',
  },
};

export const EBOOK_COPY: Record<EbookLang, EbookCopy> = { en: EN, pt: PT, es: ES, nl: NL };

/** Fills {placeholders}. */
export const fill = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
