/**
 * The coaching page (/coaching) in each language it is written in by hand. Portuguese is Dolly's original
 * (from her Paradise Pantry guide and the Food Healing pages of Sweet Escape); English, Spanish and Dutch say the
 * same things in the same warm, first-person voice. Other languages read the English page through Google Translate.
 * Icons and photos live in the component; the lists here line up with them by position.
 */

export type CoachingLang = 'pt' | 'en' | 'es' | 'nl';
export const COACHING_LANGS: CoachingLang[] = ['pt', 'en', 'es', 'nl'];
export const isCoachingLang = (l: string): l is CoachingLang => (COACHING_LANGS as string[]).includes(l);

export const COACHING_PATH: Record<CoachingLang, string> = {
  pt: '/coaching',
  en: '/coaching/en',
  es: '/coaching/es',
  nl: '/coaching/nl',
};

/** The switcher's labels: each language named in itself. */
export const COACHING_LANG_LABEL: Record<CoachingLang, string> = { pt: 'Português', en: 'English', es: 'Español', nl: 'Nederlands' };

type Item = { title: string; text: string };

export interface CoachingCopy {
  meta: { title: string; description: string; ogDescription: string; ogAlt: string };
  langLabel: string;
  whatsapp: { reset: string; sos: string };
  hero: {
    dollyAlt: string; tag: string; talkAlt: string; studioAlt: string; treatAlt: string;
    kicker: string; text: string; hi: string; cta: string; note: string; gift: string;
  };
  feel: { lead: string; cards: { alt: string; text: string }[]; q: [string, string, string]; not: string };
  kondo: { kicker: string; title: string; intro: string; items: Item[] };
  steps: { kicker: string; title: string; items: Item[] };
  pantry: {
    kicker: string; title: string; intro: string; blocks: Item[];
    shop: { lead: string; text: string }[]; more: string;
  };
  gb: { kicker: string; title: string; intro: string; names: string[] };
  inc: { photoAlt: string; kicker: string; title: string; items: string[]; end: string };
  sos: { badge: string; title: string; lead: string; weeks: Item[]; cta: string };
  dolly: { photoAlt: string; kicker: string; title: string; p1: string; p2: string; link: string };
  final: {
    kicker: string; title: string; gifts: Item[]; cta: string; or: string; wa: string;
  };
  faq: { kicker: string; title: string; items: { q: string; a: string }[] };
}

export const COACHING_COPY: Record<CoachingLang, CoachingCopy> = {
  pt: {
    meta: {
      title: 'The Daily Tropical Reset · Food Coach Dolly | The Tropical Bakery',
      description: 'Um Marie Kondo dos seus hábitos alimentares e da sua despensa, com a Food Coach Dolly. Plant-based nutritariano sem sal, óleo e açúcar, plano semanal, meal-prep e a família junto. Conversa grátis de 30 minutos.',
      ogDescription: 'Comer bem começa pelo que entra em casa. Conversa grátis de 30 minutos e o e-book Sweet Escape de presente.',
      ogAlt: 'Bliss balls de frutas vermelhas da Dolly',
    },
    langLabel: 'Idioma',
    whatsapp: {
      reset: 'Olá, Dolly! Quero saber mais sobre o The Daily Tropical Reset.',
      sos: 'Olá, Dolly! Quero saber mais sobre o Reset SOS: sem sal e sem óleo em 2 semanas.',
    },
    hero: {
      dollyAlt: 'Dolly com uma bandeja dos seus doces, no jardim em Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Amigas rindo à mesa com doces e chá',
      studioAlt: 'Mulheres provando doces saudáveis depois da aula',
      treatAlt: 'Bliss balls de frutas vermelhas',
      kicker: 'Food Healing Studio · com a Food Coach Dolly',
      text: 'Um Marie Kondo dos seus hábitos alimentares e da sua despensa. Porque comer bem começa pelo que entra em casa.',
      hi: '“Oi, eu sou a Dolly. Vamos arrumar a sua relação com a comida juntas, um passo de cada vez.”',
      cta: 'Agendar minha conversa grátis',
      note: '30 minutos · online · sem compromisso',
      gift: 'E-book Sweet Escape de presente',
    },
    feel: {
      lead: 'Talvez você esteja cansada de tanta neura com comida.',
      cards: [
        { alt: 'Mulheres à mesa dividindo doces e frutas', text: 'Você quer alimentar melhor a sua família.' },
        { alt: 'Amigas num brunch no jardim', text: 'Você quer saúde sem obsessão.' },
        { alt: 'Amigas na calçada dividindo uma caixa de doces saudáveis', text: 'Você quer equilíbrio, não sobrecarga.' },
      ],
      q: ['E se a comida finalmente parecesse ', 'segura', '?'],
      not: 'Não confusa. Não restritiva. Não algo que controla você.',
    },
    kondo: {
      kicker: 'O método',
      title: 'Fica só o que nutre e o que te faz feliz',
      intro: 'Comer bem começa no carrinho do mercado, não na força de vontade. Se não está em casa, você não come. Então a gente arruma a sua vida alimentar como quem arruma um armário: com calma, com carinho e por categoria.',
      items: [
        { title: 'Olhar tudo, sem julgamento', text: 'Sua rotina, seus horários, suas comidas favoritas, suas vontades e cada prateleira da despensa. Nada de culpa: a gente só olha.' },
        { title: 'Agradecer e deixar ir', text: 'O que não te nutre sai de casa com carinho, e cada coisa que sai ganha uma troca gostosa. Você não perde nada: você troca.' },
        { title: 'Dar um lugar a cada coisa', text: 'Potes de vidro, básicos sempre à mão e uma semana que se organiza sozinha. Fica só o que nutre e o que te faz feliz.' },
      ],
    },
    steps: {
      kicker: 'Como funciona',
      title: 'Passo a passo, sem sofrimento',
      items: [
        { title: 'Conversa grátis de 30 minutos', text: 'A gente se conhece, você me conta onde está e aonde quer chegar. Sem compromisso.' },
        { title: 'Raio-X da sua rotina', text: 'Como você come hoje, seus pratos favoritos e as suas vontades. Para cada vontade, uma alternativa que você vai amar.' },
        { title: 'Destralhe da despensa', text: 'O que fica, o que sai e o que entra no lugar. Sua despensa vira um lugar que te ajuda, não que te sabota.' },
        { title: 'Compras sem confusão', text: 'Como montar a sua despensa saudável: o hortifruti primeiro, a cerealista depois, os rótulos que importam e a lista dos G-BOMBS.' },
        { title: 'Seu plano semanal completo', text: 'Cardápio da semana inteira, meal-prep de domingo e os básicos do dia a dia, para nunca ficar sem saber o que comer.' },
        { title: 'A família junto', text: 'Pratos que a casa toda come, crianças crescendo com uma energia calma em volta da comida e um ritmo que cabe na vida real.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'Eu compro ingredientes, não produtos',
      intro: 'Se cresce da terra, tem fibra e ainda parece com o que era, tem lugar no meu carrinho. Monte a sua despensa em volta destes seis blocos e você nunca mais vai ficar perdida no mercado. Você simplesmente reconhece o que pertence.',
      blocks: [
        { title: 'Gorduras boas e proteínas', text: 'Amêndoas, castanhas, chia, linhaça, cânhamo, coco, tofu.' },
        { title: 'Doçura natural', text: 'Tâmaras, figos secos, damascos, banana, manga, maçã.' },
        { title: 'Base sem trigo', text: 'Aveia, farinha de amêndoas, de trigo-sarraceno, de coco.' },
        { title: 'Sabores e especiarias', text: 'Frutas frescas, cacau, baunilha, canela, cravo, gengibre.' },
        { title: 'Coberturas e texturas', text: 'Nibs de cacau, coco tostado, sementes, frutas liofilizadas.' },
        { title: 'Cor e vibe', text: 'Beterraba, cúrcuma, espirulina, matcha, açaí, mirtilo.' },
      ],
      shop: [
        { lead: '1º o hortifruti.', text: 'Frutas da estação, folhas, legumes coloridos e ervas frescas. O fresco não é acompanhamento, é a base.' },
        { lead: '2º a cerealista.', text: 'A granel, na quantidade certa, com menos embalagem e mais qualidade.' },
        { lead: 'Em casa, potes de vidro.', text: 'Uma despensa bonita, sem tóxicos, onde tudo fica à vista.' },
      ],
      more: 'O guia completo Paradise Pantry vem com o seu coaching.',
    },
    gb: {
      kicker: 'Nutritariano e SOS free',
      title: 'O máximo de nutrientes em cada garfada',
      intro: 'Nutritariano é escolher os alimentos com mais vitaminas, minerais, fibras e antioxidantes por caloria. SOS free é sem sal, sem óleo e sem açúcar refinado. E todo dia entram no prato os G-BOMBS, os alimentos que mais protegem:',
      names: ['Folhas verdes', 'Feijões e grãos', 'Cebola e alho', 'Cogumelos', 'Frutas vermelhas', 'Sementes e castanhas'],
    },
    inc: {
      photoAlt: 'Cheesecake da Dolly com calda de frutas vermelhas',
      kicker: 'No seu Reset',
      title: 'Tudo o que a gente constrói junto',
      items: [
        'Análise da sua rotina, comidas favoritas e vontades',
        'Alternativas saudáveis para cada vontade',
        'Planos de refeição semanais completos',
        'Como virar plant-based do jeito certo, sem deficiências',
        'Comer nutritariano e SOS free: sem sal, sem óleo, sem açúcar refinado',
        'Como fazer as compras e montar a despensa saudável',
        'Os G-BOMBS todos os dias, sem pensar',
        'Meal-prep e os básicos diários',
        'Como levar tudo isso para a família e as refeições em casa',
        'Passo a passo, no seu ritmo: sem sofrimento e sem tudo-ou-nada',
      ],
      end: 'E o mais importante: estabilidade por dentro. Porque quando a comida parece segura, todo o resto fica mais leve.',
    },
    sos: {
      badge: 'Pacote à parte · 14 dias',
      title: 'Reset SOS: sem sal e sem óleo em 2 semanas',
      lead: 'Para quem quer dar um passo só, bem dado. Duas semanas guiadas, com lista de compras, cardápio dia a dia e a Dolly acompanhando você.',
      weeks: [
        { title: 'Semana 1 · sem óleo', text: 'Refogar na água ou no caldo, assar sem untar, molhos cremosos de castanha e abacate. A gordura vem inteira, da planta.' },
        { title: 'Semana 2 · sem sal', text: 'Ervas, limão, especiarias, alho e o umami dos cogumelos. Em poucas semanas o paladar acorda e a comida volta a ter gosto de comida.' },
      ],
      cta: 'Quero o Reset SOS',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam com a espátula e uma bandeja de doces',
      kicker: 'Sua Food Coach',
      title: 'Eu também já tive medo de comer',
      p1: 'Como bailarina profissional, aprendi a controlar cada caloria, cada mordida, as formas do meu corpo. Isso me desconectou do prazer de comer. Aos poucos eu me curei, e você também vai se curar.',
      p2: 'Hoje eu vivo na Mata Atlântica, em Itamambuca, e cozinho tudo do zero, só com plantas. A comida não precisa ser temida nem proibida: ela pode ser prazerosa e gentil ao mesmo tempo.',
      link: 'Conheça a história da Dolly →',
    },
    final: {
      kicker: 'Entre no estúdio',
      title: 'Comece com dois presentes',
      gifts: [
        { title: 'Conversa grátis de 30 minutos', text: 'Online, com a Dolly. A gente olha a sua rotina e o primeiro passo.' },
        { title: 'E-book Sweet Escape', text: '7 cores, 7 doces plant-based sem açúcar refinado, de presente para você.' },
      ],
      cta: 'Agendar minha conversa grátis',
      or: 'Prefere conversar antes?',
      wa: 'Fale com a Dolly no WhatsApp',
    },
    faq: {
      kicker: 'Dúvidas',
      title: 'Bom saber',
      items: [
        { q: 'É online?', a: 'Sim. A conversa e os encontros são por vídeo, então dá para fazer de qualquer lugar. Quem está perto de Ubatuba pode combinar com a Dolly um encontro presencial.' },
        { q: 'Preciso virar vegana de uma vez?', a: 'Não. O Reset é passo a passo, no seu ritmo, sem tudo-ou-nada. Você começa pelo que é mais fácil para você e a gente vai trocando o resto com calma.' },
        { q: 'Funciona com marido e filhos que não querem mudar?', a: 'É exatamente por isso que existe a parte da família: pratos que todo mundo come, sem cozinhar duas vezes e sem briga na mesa.' },
        { q: 'Quanto custa?', a: 'Cada plano é feito sob medida. Na conversa grátis de 30 minutos a Dolly entende o que você precisa e te mostra as opções e o valor, sem pressão.' },
        { q: 'Substitui o meu médico ou nutricionista?', a: 'Não. O coaching é educação alimentar e mudança de hábitos. Se você tem uma condição de saúde ou toma remédios, continue com o seu médico e conte a ele sobre as mudanças.' },
      ],
    },
  },

  en: {
    meta: {
      title: 'The Daily Tropical Reset · Food Coach Dolly | The Tropical Bakery',
      description: 'A Marie Kondo for your eating habits and your pantry, with Food Coach Dolly. Whole-food, plant-based and nutritarian with no salt, oil or sugar, a weekly plan, meal-prep and the whole family on board. Free 30-minute call.',
      ogDescription: 'Healthy eating starts with what you bring into the house. A free 30-minute call, and the Sweet Escape e-book as a gift.',
      ogAlt: 'Dolly’s red berry bliss balls',
    },
    langLabel: 'Language',
    whatsapp: {
      reset: 'Hi Dolly! I’d love to know more about The Daily Tropical Reset.',
      sos: 'Hi Dolly! I’d love to know more about the SOS Reset: salt-free and oil-free in 2 weeks.',
    },
    hero: {
      dollyAlt: 'Dolly holding a tray of her treats in the garden at Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Friends laughing at a table with treats and tea',
      studioAlt: 'Women tasting healthy treats after class',
      treatAlt: 'Red berry bliss balls',
      kicker: 'Food Healing Studio · with Food Coach Dolly',
      text: 'A Marie Kondo for your eating habits and your pantry. Because healthy eating starts with what you bring into the house.',
      hi: '“Hi, I’m Dolly. Let’s tidy up your relationship with food together, one step at a time.”',
      cta: 'Book my free call',
      note: '30 minutes · online · no strings attached',
      gift: 'The Sweet Escape e-book as a gift',
    },
    feel: {
      lead: 'Maybe you are tired of all the stress around food.',
      cards: [
        { alt: 'Women at a table sharing treats and fruit', text: 'You want to feed your family better.' },
        { alt: 'Friends at a garden brunch', text: 'You want health without obsession.' },
        { alt: 'Friends on the sidewalk sharing a box of healthy treats', text: 'You want balance, not overload.' },
      ],
      q: ['What if food finally felt ', 'safe', '?'],
      not: 'Not confusing. Not restrictive. Not something controlling you.',
    },
    kondo: {
      kicker: 'The method',
      title: 'Keep only what nourishes you and sparks joy',
      intro: 'Healthy eating starts in the shopping cart, not with willpower. If it isn’t in the house, you don’t eat it. So we tidy your food life the way you would tidy a closet: calmly, kindly and by category.',
      items: [
        { title: 'Look at everything, without judgment', text: 'Your routine, your mealtimes, your favorite foods, your cravings and every shelf in the pantry. No guilt: we just look.' },
        { title: 'Say thank you and let go', text: 'What doesn’t nourish you leaves the house kindly, and everything that leaves gets a delicious swap. You don’t lose anything: you trade up.' },
        { title: 'Give everything its place', text: 'Glass jars, staples always within reach and a week that organizes itself. Only what nourishes you and makes you happy stays.' },
      ],
    },
    steps: {
      kicker: 'How it works',
      title: 'Step by step, without the struggle',
      items: [
        { title: 'A free 30-minute call', text: 'We get to know each other; you tell me where you are and where you want to be. No strings attached.' },
        { title: 'An X-ray of your routine', text: 'How you eat today, your favorite dishes and your cravings. For every craving, an alternative you’ll love.' },
        { title: 'The pantry clear-out', text: 'What stays, what goes and what takes its place. Your pantry becomes a place that helps you instead of sabotaging you.' },
        { title: 'Shopping without the confusion', text: 'How to build your healthy pantry: the produce market first, the bulk store second, the labels that matter and the G-BOMBS list.' },
        { title: 'Your complete weekly plan', text: 'A menu for the whole week, Sunday meal-prep and the daily staples, so you never wonder what to eat.' },
        { title: 'The whole family on board', text: 'Meals everyone at home eats, children growing up with calm energy around food, and a rhythm that fits real life.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'I shop for ingredients, not products',
      intro: 'If it grows from the earth, carries fiber and still looks like what it was, it belongs in my basket. Build your pantry around these six blocks and you will never feel lost in a grocery store again. You’ll simply recognize what belongs.',
      blocks: [
        { title: 'Healthy fats & proteins', text: 'Almonds, cashews, chia, flax, hemp seeds, coconut, tofu.' },
        { title: 'Natural sweetness', text: 'Medjool dates, dried figs, apricots, banana, mango, apple.' },
        { title: 'Gluten-free structure', text: 'Rolled oats, almond flour, buckwheat flour, coconut flour.' },
        { title: 'Flavors & spices', text: 'Fresh fruit, raw cacao, vanilla, cinnamon, clove, ginger.' },
        { title: 'Toppings & textures', text: 'Cacao nibs, toasted coconut, seeds, freeze-dried fruit.' },
        { title: 'Color & mood', text: 'Beetroot, turmeric, spirulina, matcha, açaí, blueberry.' },
      ],
      shop: [
        { lead: 'First, the produce market.', text: 'Seasonal fruit, leafy greens, colorful vegetables and fresh herbs. Fresh produce isn’t a side element; it’s the foundation.' },
        { lead: 'Second, the bulk store.', text: 'Just the amount you need, with less packaging and better quality.' },
        { lead: 'At home, glass jars.', text: 'A beautiful, non-toxic pantry where everything is in sight.' },
      ],
      more: 'The full Paradise Pantry guide comes with your coaching.',
    },
    gb: {
      kicker: 'Nutritarian & SOS-free',
      title: 'The most nutrients in every bite',
      intro: 'Nutritarian means choosing the foods with the most vitamins, minerals, fiber and antioxidants per calorie. SOS-free means no salt, no oil and no refined sugar. And every day your plate gets the G-BOMBS, the most protective foods there are:',
      names: ['Leafy greens', 'Beans & legumes', 'Onions & garlic', 'Mushrooms', 'Berries', 'Seeds & nuts'],
    },
    inc: {
      photoAlt: 'Dolly’s cheesecake with a red berry topping',
      kicker: 'In your Reset',
      title: 'Everything we build together',
      items: [
        'A look at your routine, favorite foods and cravings',
        'Healthy alternatives for every craving',
        'Complete weekly meal plans',
        'How to go plant-based the right way, without deficiencies',
        'Eating nutritarian and SOS-free: no salt, no oil, no refined sugar',
        'How to shop and build your healthy pantry',
        'The G-BOMBS every day, without thinking about it',
        'Meal-prep and daily staples',
        'How to bring it all into family life and family meals',
        'Step by step, at your pace: no struggle and no all-or-nothing',
      ],
      end: 'And most importantly: stability on the inside. Because when food feels safe, everything else softens.',
    },
    sos: {
      badge: 'Separate package · 14 days',
      title: 'SOS Reset: salt-free and oil-free in 2 weeks',
      lead: 'For anyone who wants to take one step, and take it well. Two guided weeks, with a shopping list, a day-by-day menu and Dolly by your side.',
      weeks: [
        { title: 'Week 1 · no oil', text: 'Sauté in water or broth, bake without greasing, make creamy sauces from nuts and avocado. The fat comes whole, from the plant.' },
        { title: 'Week 2 · no salt', text: 'Herbs, lemon, spices, garlic and the umami of mushrooms. Within a few weeks your taste buds wake up and food tastes like food again.' },
      ],
      cta: 'I want the SOS Reset',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam with a spatula and a tray of treats',
      kicker: 'Your Food Coach',
      title: 'I used to be afraid of food too',
      p1: 'As a professional ballet dancer, I learned to control every calorie, every bite, the shape of my body. It cut me off from the pleasure of eating. Little by little I healed, and you will heal too.',
      p2: 'Today I live in the Atlantic Forest in Itamambuca, Brazil, and I make everything from scratch, only with plants. Food doesn’t have to be feared or forbidden: it can be pleasurable and kind at the same time.',
      link: 'Read Dolly’s story →',
    },
    final: {
      kicker: 'Step into the studio',
      title: 'Start with two gifts',
      gifts: [
        { title: 'A free 30-minute call', text: 'Online, with Dolly. We look at your routine and your first step.' },
        { title: 'The Sweet Escape e-book', text: '7 colors, 7 plant-based treats with no refined sugar, as a gift for you.' },
      ],
      cta: 'Book my free call',
      or: 'Rather chat first?',
      wa: 'Message Dolly on WhatsApp',
    },
    faq: {
      kicker: 'Questions',
      title: 'Good to know',
      items: [
        { q: 'Is it online?', a: 'Yes. The call and the sessions happen by video, so you can join from anywhere in the world. If you are near Ubatuba, Brazil, you can arrange to meet Dolly in person.' },
        { q: 'Do I have to go vegan overnight?', a: 'No. The Reset is step by step, at your pace, with no all-or-nothing. You start with what is easiest for you and we swap the rest calmly.' },
        { q: 'Does it work if my partner and kids don’t want to change?', a: 'That is exactly why there is a family part: meals everyone eats, without cooking twice and without fights at the table.' },
        { q: 'How much does it cost?', a: 'Every plan is made to measure. On the free 30-minute call Dolly gets to know what you need and shows you the options and the price, with no pressure.' },
        { q: 'Does it replace my doctor or dietitian?', a: 'No. The coaching is food education and habit change. If you have a health condition or take medication, keep seeing your doctor and tell them about the changes.' },
      ],
    },
  },

  es: {
    meta: {
      title: 'The Daily Tropical Reset · Food Coach Dolly | The Tropical Bakery',
      description: 'Un Marie Kondo de tus hábitos alimentarios y de tu despensa, con la Food Coach Dolly. Plant-based y nutritariano, sin sal, aceite ni azúcar, plan semanal, meal-prep y toda la familia. Llamada gratis de 30 minutos.',
      ogDescription: 'Comer bien empieza por lo que entra en casa. Una llamada gratis de 30 minutos y el e-book Sweet Escape de regalo.',
      ogAlt: 'Bliss balls de frutos rojos de Dolly',
    },
    langLabel: 'Idioma',
    whatsapp: {
      reset: '¡Hola, Dolly! Quiero saber más sobre The Daily Tropical Reset.',
      sos: '¡Hola, Dolly! Quiero saber más sobre el Reset SOS: sin sal y sin aceite en 2 semanas.',
    },
    hero: {
      dollyAlt: 'Dolly con una bandeja de sus dulces en el jardín de Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Amigas riendo en la mesa con dulces y té',
      studioAlt: 'Mujeres probando dulces saludables después de clase',
      treatAlt: 'Bliss balls de frutos rojos',
      kicker: 'Food Healing Studio · con la Food Coach Dolly',
      text: 'Un Marie Kondo de tus hábitos alimentarios y de tu despensa. Porque comer bien empieza por lo que entra en casa.',
      hi: '“Hola, soy Dolly. Ordenemos juntas tu relación con la comida, paso a paso.”',
      cta: 'Reservar mi llamada gratis',
      note: '30 minutos · online · sin compromiso',
      gift: 'El e-book Sweet Escape de regalo',
    },
    feel: {
      lead: 'Quizás estás cansada de tanta ansiedad con la comida.',
      cards: [
        { alt: 'Mujeres en la mesa compartiendo dulces y fruta', text: 'Quieres alimentar mejor a tu familia.' },
        { alt: 'Amigas en un brunch en el jardín', text: 'Quieres salud sin obsesión.' },
        { alt: 'Amigas en la acera compartiendo una caja de dulces saludables', text: 'Quieres equilibrio, no agobio.' },
      ],
      q: ['¿Y si la comida por fin se sintiera ', 'segura', '?'],
      not: 'Ni confusa. Ni restrictiva. Ni algo que te controla.',
    },
    kondo: {
      kicker: 'El método',
      title: 'Solo se queda lo que te nutre y te hace feliz',
      intro: 'Comer bien empieza en el carrito del súper, no en la fuerza de voluntad. Si no está en casa, no te lo comes. Así que ordenamos tu vida alimentaria como quien ordena un armario: con calma, con cariño y por categorías.',
      items: [
        { title: 'Mirarlo todo, sin juzgar', text: 'Tu rutina, tus horarios, tus comidas favoritas, tus antojos y cada estante de la despensa. Nada de culpa: solo miramos.' },
        { title: 'Agradecer y dejar ir', text: 'Lo que no te nutre sale de casa con cariño, y cada cosa que sale tiene un cambio delicioso. No pierdes nada: lo cambias.' },
        { title: 'Darle a cada cosa su lugar', text: 'Frascos de vidrio, básicos siempre a mano y una semana que se organiza sola. Solo se queda lo que te nutre y te hace feliz.' },
      ],
    },
    steps: {
      kicker: 'Cómo funciona',
      title: 'Paso a paso, sin sufrimiento',
      items: [
        { title: 'Llamada gratis de 30 minutos', text: 'Nos conocemos, me cuentas dónde estás y a dónde quieres llegar. Sin compromiso.' },
        { title: 'Radiografía de tu rutina', text: 'Cómo comes hoy, tus platos favoritos y tus antojos. Para cada antojo, una alternativa que te va a encantar.' },
        { title: 'Limpieza de la despensa', text: 'Lo que se queda, lo que se va y lo que ocupa su lugar. Tu despensa se convierte en un lugar que te ayuda, no que te sabotea.' },
        { title: 'Compras sin confusión', text: 'Cómo montar tu despensa saludable: primero la frutería, después la tienda a granel, las etiquetas que importan y la lista de los G-BOMBS.' },
        { title: 'Tu plan semanal completo', text: 'El menú de toda la semana, el meal-prep del domingo y los básicos del día a día, para no quedarte nunca sin saber qué comer.' },
        { title: 'Toda la familia', text: 'Platos que come toda la casa, niños que crecen con una energía tranquila alrededor de la comida y un ritmo que cabe en la vida real.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'Compro ingredientes, no productos',
      intro: 'Si crece de la tierra, tiene fibra y todavía se parece a lo que era, tiene lugar en mi cesta. Arma tu despensa alrededor de estos seis bloques y nunca más te sentirás perdida en el súper. Simplemente reconocerás lo que pertenece.',
      blocks: [
        { title: 'Grasas buenas y proteínas', text: 'Almendras, anacardos, chía, lino, cáñamo, coco, tofu.' },
        { title: 'Dulzor natural', text: 'Dátiles, higos secos, orejones, plátano, mango, manzana.' },
        { title: 'Base sin trigo', text: 'Avena, harina de almendra, de trigo sarraceno, de coco.' },
        { title: 'Sabores y especias', text: 'Fruta fresca, cacao, vainilla, canela, clavo, jengibre.' },
        { title: 'Coberturas y texturas', text: 'Nibs de cacao, coco tostado, semillas, fruta liofilizada.' },
        { title: 'Color y vibra', text: 'Remolacha, cúrcuma, espirulina, matcha, açaí, arándano.' },
      ],
      shop: [
        { lead: 'Primero, la frutería.', text: 'Fruta de temporada, hojas verdes, verduras de colores y hierbas frescas. Lo fresco no es el acompañamiento: es la base.' },
        { lead: 'Después, la tienda a granel.', text: 'En la cantidad justa, con menos envases y más calidad.' },
        { lead: 'En casa, frascos de vidrio.', text: 'Una despensa bonita, sin tóxicos, donde todo está a la vista.' },
      ],
      more: 'La guía completa Paradise Pantry viene con tu coaching.',
    },
    gb: {
      kicker: 'Nutritariano y SOS free',
      title: 'El máximo de nutrientes en cada bocado',
      intro: 'Nutritariano es elegir los alimentos con más vitaminas, minerales, fibra y antioxidantes por caloría. SOS free es sin sal, sin aceite y sin azúcar refinado. Y cada día entran en tu plato los G-BOMBS, los alimentos que más protegen:',
      names: ['Hojas verdes', 'Legumbres', 'Cebolla y ajo', 'Setas', 'Frutos rojos', 'Semillas y frutos secos'],
    },
    inc: {
      photoAlt: 'Cheesecake de Dolly con salsa de frutos rojos',
      kicker: 'En tu Reset',
      title: 'Todo lo que construimos juntas',
      items: [
        'Análisis de tu rutina, tus comidas favoritas y tus antojos',
        'Alternativas saludables para cada antojo',
        'Planes de comidas semanales completos',
        'Cómo pasarte a lo plant-based bien, sin carencias',
        'Comer nutritariano y SOS free: sin sal, sin aceite, sin azúcar refinado',
        'Cómo hacer la compra y montar tu despensa saludable',
        'Los G-BOMBS todos los días, sin pensarlo',
        'Meal-prep y los básicos del día a día',
        'Cómo llevar todo esto a la familia y a las comidas en casa',
        'Paso a paso, a tu ritmo: sin sufrimiento y sin todo-o-nada',
      ],
      end: 'Y lo más importante: estabilidad por dentro. Porque cuando la comida se siente segura, todo lo demás se suaviza.',
    },
    sos: {
      badge: 'Paquete aparte · 14 días',
      title: 'Reset SOS: sin sal y sin aceite en 2 semanas',
      lead: 'Para quien quiere dar un solo paso, y darlo bien. Dos semanas guiadas, con lista de la compra, menú día a día y Dolly acompañándote.',
      weeks: [
        { title: 'Semana 1 · sin aceite', text: 'Saltear con agua o caldo, hornear sin engrasar, salsas cremosas de frutos secos y aguacate. La grasa llega entera, de la planta.' },
        { title: 'Semana 2 · sin sal', text: 'Hierbas, limón, especias, ajo y el umami de las setas. En pocas semanas el paladar despierta y la comida vuelve a saber a comida.' },
      ],
      cta: 'Quiero el Reset SOS',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam con la espátula y una bandeja de dulces',
      kicker: 'Tu Food Coach',
      title: 'Yo también le tuve miedo a la comida',
      p1: 'Como bailarina profesional, aprendí a controlar cada caloría, cada bocado, las formas de mi cuerpo. Eso me desconectó del placer de comer. Poco a poco me sané, y tú también te vas a sanar.',
      p2: 'Hoy vivo en la Mata Atlántica, en Itamambuca (Brasil), y lo cocino todo desde cero, solo con plantas. La comida no tiene por qué dar miedo ni estar prohibida: puede ser placentera y amable a la vez.',
      link: 'Conoce la historia de Dolly →',
    },
    final: {
      kicker: 'Entra en el estudio',
      title: 'Empieza con dos regalos',
      gifts: [
        { title: 'Llamada gratis de 30 minutos', text: 'Online, con Dolly. Miramos tu rutina y tu primer paso.' },
        { title: 'El e-book Sweet Escape', text: '7 colores, 7 dulces plant-based sin azúcar refinado, de regalo para ti.' },
      ],
      cta: 'Reservar mi llamada gratis',
      or: '¿Prefieres hablar antes?',
      wa: 'Escríbele a Dolly por WhatsApp',
    },
    faq: {
      kicker: 'Preguntas',
      title: 'Bueno saberlo',
      items: [
        { q: '¿Es online?', a: 'Sí. La llamada y las sesiones son por videollamada, así que puedes hacerlo desde cualquier lugar. Si estás cerca de Ubatuba (Brasil), puedes quedar con Dolly en persona.' },
        { q: '¿Tengo que hacerme vegana de golpe?', a: 'No. El Reset es paso a paso, a tu ritmo, sin todo-o-nada. Empiezas por lo que te resulta más fácil y vamos cambiando el resto con calma.' },
        { q: '¿Funciona si mi pareja y mis hijos no quieren cambiar?', a: 'Justamente para eso está la parte de la familia: platos que come todo el mundo, sin cocinar dos veces y sin peleas en la mesa.' },
        { q: '¿Cuánto cuesta?', a: 'Cada plan se hace a medida. En la llamada gratis de 30 minutos Dolly entiende lo que necesitas y te muestra las opciones y el precio, sin presión.' },
        { q: '¿Sustituye a mi médico o nutricionista?', a: 'No. El coaching es educación alimentaria y cambio de hábitos. Si tienes una condición de salud o tomas medicación, sigue con tu médico y cuéntale los cambios.' },
      ],
    },
  },

  nl: {
    meta: {
      title: 'The Daily Tropical Reset · Food Coach Dolly | The Tropical Bakery',
      description: 'Een Marie Kondo voor je eetgewoontes en je voorraadkast, met Food Coach Dolly. Plantaardig en nutritarisch zonder zout, olie en suiker, een weekplan, meal-prep en het hele gezin mee. Gratis gesprek van 30 minuten.',
      ogDescription: 'Gezond eten begint bij wat je in huis haalt. Een gratis gesprek van 30 minuten en het e-book Sweet Escape cadeau.',
      ogAlt: 'Dolly’s bliss balls van rood fruit',
    },
    langLabel: 'Taal',
    whatsapp: {
      reset: 'Hoi Dolly! Ik wil graag meer weten over The Daily Tropical Reset.',
      sos: 'Hoi Dolly! Ik wil graag meer weten over de SOS Reset: zoutvrij en olievrij in 2 weken.',
    },
    hero: {
      dollyAlt: 'Dolly met een dienblad vol lekkers in de tuin in Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Vriendinnen die lachen aan tafel met lekkers en thee',
      studioAlt: 'Vrouwen die gezonde zoetigheden proeven na de les',
      treatAlt: 'Bliss balls van rood fruit',
      kicker: 'Food Healing Studio · met Food Coach Dolly',
      text: 'Een Marie Kondo voor je eetgewoontes en je voorraadkast. Want gezond eten begint bij wat je in huis haalt.',
      hi: '“Hoi, ik ben Dolly. Laten we samen je relatie met eten opruimen, stap voor stap.”',
      cta: 'Plan mijn gratis gesprek',
      note: '30 minuten · online · vrijblijvend',
      gift: 'Het e-book Sweet Escape cadeau',
    },
    feel: {
      lead: 'Misschien ben je het gepieker over eten gewoon moe.',
      cards: [
        { alt: 'Vrouwen aan tafel die lekkers en fruit delen', text: 'Je wilt je gezin beter voeden.' },
        { alt: 'Vriendinnen bij een brunch in de tuin', text: 'Je wilt gezondheid zonder obsessie.' },
        { alt: 'Vriendinnen op straat die een doos gezonde zoetigheden delen', text: 'Je wilt balans, geen overbelasting.' },
      ],
      q: ['Wat als eten eindelijk ', 'veilig', ' voelde?'],
      not: 'Niet verwarrend. Niet beperkend. Niet iets dat jou controleert.',
    },
    kondo: {
      kicker: 'De methode',
      title: 'Alleen wat je voedt en blij maakt, blijft',
      intro: 'Gezond eten begint in je boodschappenkar, niet bij wilskracht. Wat niet in huis is, eet je niet. Dus ruimen we je eetleven op zoals je een kast opruimt: rustig, liefdevol en per categorie.',
      items: [
        { title: 'Alles bekijken, zonder oordeel', text: 'Je routine, je eetmomenten, je lievelingseten, je trek en elke plank in de voorraadkast. Geen schuldgevoel: we kijken alleen.' },
        { title: 'Bedanken en loslaten', text: 'Wat je niet voedt, gaat met zorg het huis uit, en voor alles wat gaat komt er een heerlijk alternatief. Je verliest niets: je ruilt.' },
        { title: 'Alles een eigen plek geven', text: 'Glazen potten, basisproducten altijd binnen handbereik en een week die zichzelf organiseert. Alleen wat je voedt en blij maakt, blijft.' },
      ],
    },
    steps: {
      kicker: 'Hoe het werkt',
      title: 'Stap voor stap, zonder lijden',
      items: [
        { title: 'Gratis gesprek van 30 minuten', text: 'We leren elkaar kennen, je vertelt me waar je nu staat en waar je naartoe wilt. Vrijblijvend.' },
        { title: 'Een röntgenfoto van je routine', text: 'Hoe je nu eet, je lievelingsgerechten en je trek. Voor elke trek een alternatief waar je dol op wordt.' },
        { title: 'De voorraadkast opruimen', text: 'Wat blijft, wat gaat en wat ervoor in de plaats komt. Je voorraadkast wordt een plek die je helpt in plaats van saboteert.' },
        { title: 'Boodschappen zonder verwarring', text: 'Hoe je je gezonde voorraadkast opbouwt: eerst de groenteboer of markt, dan de natuurwinkel met bulk, de etiketten die ertoe doen en de G-BOMBS-lijst.' },
        { title: 'Je complete weekplan', text: 'Een menu voor de hele week, meal-prep op zondag en de dagelijkse basis, zodat je nooit meer hoeft te zoeken wat je eet.' },
        { title: 'Het hele gezin mee', text: 'Gerechten die iedereen thuis eet, kinderen die opgroeien met rust rond eten, en een ritme dat in het echte leven past.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'Ik koop ingrediënten, geen producten',
      intro: 'Als het uit de aarde groeit, vezels heeft en nog lijkt op wat het was, hoort het in mijn mand. Bouw je voorraadkast rond deze zes bouwstenen en je voelt je nooit meer verloren in de supermarkt. Je herkent gewoon wat erbij hoort.',
      blocks: [
        { title: 'Gezonde vetten & eiwitten', text: 'Amandelen, cashewnoten, chia, lijnzaad, hennepzaad, kokos, tofu.' },
        { title: 'Natuurlijke zoetheid', text: 'Medjoul-dadels, gedroogde vijgen, abrikozen, banaan, mango, appel.' },
        { title: 'Glutenvrije basis', text: 'Havervlokken, amandelmeel, boekweitmeel, kokosmeel.' },
        { title: 'Smaken & specerijen', text: 'Vers fruit, rauwe cacao, vanille, kaneel, kruidnagel, gember.' },
        { title: 'Toppings & texturen', text: 'Cacaonibs, geroosterde kokos, zaden, gevriesdroogd fruit.' },
        { title: 'Kleur & sfeer', text: 'Rode biet, kurkuma, spirulina, matcha, açaí, blauwe bes.' },
      ],
      shop: [
        { lead: 'Eerst de groenteboer of markt.', text: 'Seizoensfruit, bladgroenten, kleurrijke groenten en verse kruiden. Vers is geen bijzaak: het is de basis.' },
        { lead: 'Dan de natuurwinkel met bulk.', text: 'Precies de hoeveelheid die je nodig hebt, met minder verpakking en betere kwaliteit.' },
        { lead: 'Thuis: glazen potten.', text: 'Een mooie, gifvrije voorraadkast waar alles in het zicht staat.' },
      ],
      more: 'De volledige Paradise Pantry-gids krijg je bij je coaching.',
    },
    gb: {
      kicker: 'Nutritarisch & SOS-vrij',
      title: 'Zoveel mogelijk voedingsstoffen in elke hap',
      intro: 'Nutritarisch betekent kiezen voor voeding met de meeste vitaminen, mineralen, vezels en antioxidanten per calorie. SOS-vrij betekent zonder zout, zonder olie en zonder geraffineerde suiker. En elke dag komen de G-BOMBS op je bord, de voeding die je het best beschermt:',
      names: ['Bladgroenten', 'Bonen & peulvruchten', 'Ui & knoflook', 'Paddenstoelen', 'Bessen', 'Zaden & noten'],
    },
    inc: {
      photoAlt: 'Dolly’s cheesecake met een saus van rood fruit',
      kicker: 'In je Reset',
      title: 'Alles wat we samen opbouwen',
      items: [
        'Een analyse van je routine, lievelingseten en trek',
        'Gezonde alternatieven voor elke trek',
        'Complete weekmenu’s',
        'Hoe je goed plantaardig gaat eten, zonder tekorten',
        'Nutritarisch en SOS-vrij eten: zonder zout, olie en geraffineerde suiker',
        'Hoe je boodschappen doet en je gezonde voorraadkast opbouwt',
        'Elke dag de G-BOMBS, zonder erover na te denken',
        'Meal-prep en de dagelijkse basis',
        'Hoe je dit alles meeneemt in het gezinsleven en de maaltijden thuis',
        'Stap voor stap, in jouw tempo: zonder lijden en zonder alles-of-niets',
      ],
      end: 'En het allerbelangrijkste: stabiliteit vanbinnen. Want als eten veilig voelt, wordt al het andere zachter.',
    },
    sos: {
      badge: 'Apart pakket · 14 dagen',
      title: 'SOS Reset: zoutvrij en olievrij in 2 weken',
      lead: 'Voor wie één stap wil zetten, en die goed wil zetten. Twee begeleide weken, met een boodschappenlijst, een menu per dag en Dolly naast je.',
      weeks: [
        { title: 'Week 1 · zonder olie', text: 'Smoren in water of bouillon, bakken zonder in te vetten, romige sauzen van noten en avocado. Het vet komt heel, uit de plant.' },
        { title: 'Week 2 · zonder zout', text: 'Kruiden, citroen, specerijen, knoflook en de umami van paddenstoelen. Binnen een paar weken worden je smaakpapillen wakker en smaakt eten weer naar eten.' },
      ],
      cta: 'Ik wil de SOS Reset',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam met een spatel en een dienblad vol lekkers',
      kicker: 'Jouw Food Coach',
      title: 'Ook ik was ooit bang voor eten',
      p1: 'Als professionele balletdanseres leerde ik elke calorie, elke hap en de vorm van mijn lichaam te controleren. Dat sneed me af van het plezier van eten. Beetje bij beetje ben ik genezen, en jij zult ook genezen.',
      p2: 'Vandaag woon ik in het Atlantisch Woud in Itamambuca, Brazilië, en maak ik alles zelf, alleen met planten. Eten hoeft niet eng of verboden te zijn: het kan tegelijk genieten én zacht voor jezelf zijn.',
      link: 'Lees het verhaal van Dolly →',
    },
    final: {
      kicker: 'Stap de studio binnen',
      title: 'Begin met twee cadeaus',
      gifts: [
        { title: 'Gratis gesprek van 30 minuten', text: 'Online, met Dolly. We kijken naar je routine en je eerste stap.' },
        { title: 'Het e-book Sweet Escape', text: '7 kleuren, 7 plantaardige zoetigheden zonder geraffineerde suiker, cadeau voor jou.' },
      ],
      cta: 'Plan mijn gratis gesprek',
      or: 'Liever eerst even praten?',
      wa: 'Stuur Dolly een WhatsApp',
    },
    faq: {
      kicker: 'Vragen',
      title: 'Goed om te weten',
      items: [
        { q: 'Is het online?', a: 'Ja. Het gesprek en de sessies gaan via video, dus je kunt overal ter wereld meedoen. Ben je in de buurt van Ubatuba, Brazilië, dan kun je met Dolly ook afspreken om elkaar in het echt te zien.' },
        { q: 'Moet ik in één keer veganist worden?', a: 'Nee. De Reset gaat stap voor stap, in jouw tempo, zonder alles-of-niets. Je begint met wat voor jou het makkelijkst is en de rest ruilen we rustig om.' },
        { q: 'Werkt het als mijn partner en kinderen niet willen veranderen?', a: 'Precies daarvoor is het gezinsdeel er: gerechten die iedereen eet, zonder twee keer te koken en zonder ruzie aan tafel.' },
        { q: 'Wat kost het?', a: 'Elk plan is op maat. In het gratis gesprek van 30 minuten ontdekt Dolly wat je nodig hebt en laat ze je de mogelijkheden en de prijs zien, zonder druk.' },
        { q: 'Vervangt het mijn arts of diëtist?', a: 'Nee. De coaching is voedingseducatie en gewoontes veranderen. Heb je een aandoening of gebruik je medicijnen, blijf dan bij je arts en vertel over de veranderingen.' },
      ],
    },
  },
};
