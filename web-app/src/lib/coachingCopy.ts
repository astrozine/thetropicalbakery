/**
 * The coaching page (/coaching) in each language it is written in by hand. Portuguese is Dolly's original
 * (from her Paradise Pantry guide and the Food Healing pages of Sweet Escape); English, Spanish and Dutch say the
 * same things in the same warm, first-person voice. Other languages read the English page through Google Translate.
 * Icons and photos live in the component; the lists here line up with them by position.
 *
 * Two rules for this page:
 *  - It is Dolly's way of eating, told in her own words and under her own names (her basket question, her three
 *    rules, the seven colors from Sweet Escape, the taste reset). No other author's names, labels or acronyms.
 *  - It speaks to women who may carry shame about their weight or a history with food, Dolly included. So: no
 *    scale, no numbers, no before-and-after, no "good" and "bad" foods, no weight promises, and never a diagnosis.
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
    dollyAlt: string; tag: string; talkAlt: string; studioAlt: string; tableAlt: string;
    kicker: string; text: string; hi: string; cta: string; note: string; gift: string;
  };
  feel: { lead: string; cards: { alt: string; text: string }[]; q: [string, string, string]; not: string };
  /** The promise that makes the page safe: no scale, no counting, no before-and-after, no guilt. */
  safe: { kicker: string; title: string; intro: string; items: Item[]; end: string };
  kondo: { kicker: string; title: string; intro: string; items: Item[] };
  /** Dolly's three rules, in her words, plus the seven colors of the plate. */
  way: { kicker: string; title: string; intro: string; items: Item[] };
  colors: { kicker: string; title: string; intro: string; items: { name: string; foods: string }[] };
  /** A day in the Reset: breakfast, lunch, dinner and the sweet. */
  day: { kicker: string; title: string; intro: string; items: Item[]; note: string };
  steps: { kicker: string; title: string; items: Item[] };
  pantry: {
    kicker: string; title: string; intro: string;
    /** Dolly's note (Nov 2026): the six blocks were only for sweets; the everyday kitchen needs its own base block and one for supplements. */
    daily: { kicker: string; items: Item[] };
    sweet: string; blocks: Item[];
    shop: { lead: string; text: string }[]; more: string;
  };
  inc: { photoAlt: string; kicker: string; title: string; items: string[]; end: string };
  sos: { badge: string; title: string; lead: string; weeks: Item[]; cta: string };
  dolly: { photoAlt: string; kicker: string; title: string; p1: string; p2: string; p3: string; link: string };
  final: {
    kicker: string; title: string; gifts: Item[]; cta: string; or: string; wa: string;
  };
  faq: { kicker: string; title: string; items: { q: string; a: string }[] };
}

export const COACHING_COPY: Record<CoachingLang, CoachingCopy> = {
  pt: {
    meta: {
      title: 'The Daily Tropical Reset · Food Coach Dolly | The Tropical Bakery',
      description: 'Coaching de alimentação completa com a Food Coach Dolly, do café da manhã ao jantar: só plantas, inteiras, sem sal, sem óleo e sem açúcar refinado. Sem balança, sem contar calorias, sem culpa. Conversa grátis de 30 minutos.',
      ogDescription: 'Não é mais um plano alimentar. É a sua alimentação inteira, do jeito da Dolly, e paz com a comida e com o seu corpo. Conversa grátis de 30 minutos e o e-book Sweet Escape de presente.',
      ogAlt: 'Dolly no jardim em Itamambuca',
    },
    langLabel: 'Idioma',
    whatsapp: {
      reset: 'Olá, Dolly! Quero saber mais sobre o The Daily Tropical Reset.',
      sos: 'Olá, Dolly! Quero saber mais sobre o Reset do Paladar: 14 dias sem sal e sem óleo.',
    },
    hero: {
      dollyAlt: 'Dolly com uma bandeja dos seus doces, no jardim em Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Amigas rindo à mesa com doces e chá',
      studioAlt: 'Mulheres provando doces saudáveis depois da aula',
      tableAlt: 'Mesa de brunch no jardim, com frutas tropicais',
      kicker: 'Food Healing Studio · com a Food Coach Dolly',
      text: 'Coaching de alimentação completa, do café da manhã ao jantar. Não é mais um plano alimentar: é fazer as pazes com a comida e com o seu corpo, comendo só plantas, inteiras, do jeito que a natureza entrega.',
      hi: '“Oi, eu sou a Dolly. Vamos arrumar a sua relação com a comida juntas, um passo de cada vez. Sem balança e sem culpa.”',
      cta: 'Agendar minha conversa grátis',
      note: '30 minutos · online · sem compromisso',
      gift: 'E-book Sweet Escape de presente',
    },
    feel: {
      lead: 'Talvez você esteja cansada de tanta neura com comida. E de brigar com o seu corpo.',
      cards: [
        { alt: 'Mulheres à mesa dividindo doces e frutas', text: 'Você quer alimentar melhor a sua família.' },
        { alt: 'Amigas num brunch no jardim', text: 'Você quer saúde sem obsessão.' },
        { alt: 'Amigas na calçada dividindo uma caixa de doces saudáveis', text: 'Você quer se olhar no espelho com gentileza.' },
      ],
      q: ['E se a comida finalmente parecesse ', 'segura', '?'],
      not: 'Não confusa. Não restritiva. Não algo que controla você.',
    },
    safe: {
      kicker: 'Uma promessa',
      title: 'Aqui não tem balança',
      intro: 'Eu sei o que uma dieta faz com a cabeça de uma mulher. Por isso o Reset é construído ao contrário de uma dieta.',
      items: [
        { title: 'Sem balança', text: 'A gente não pesa, não mede e não compara. Você vai sentir a diferença no corpo, no sono e na energia, não num número.' },
        { title: 'Sem contar nada', text: 'Nem calorias, nem pontos, nem porção na balancinha. Comida inteira, de planta, você come até ficar satisfeita.' },
        { title: 'Sem antes e depois', text: 'Nenhuma foto, nenhuma meta de peso, nenhuma data. O seu corpo não é um projeto: ele é a sua casa.' },
        { title: 'Sem culpa', text: 'Comida não é boa nem má, e você também não. Se um dia sai do combinado, a gente só olha o que aconteceu e segue.' },
      ],
      end: 'Quando você para de brigar com o seu corpo e começa a nutri-lo, ele responde. No tempo dele, do jeito dele.',
    },
    kondo: {
      kicker: 'O método',
      title: 'Fica só o que nutre e o que te faz feliz',
      intro: 'Comer bem começa no carrinho do mercado, não na força de vontade. Se não está em casa, você não come. Então a gente arruma a sua vida alimentar inteira como quem arruma um armário: com calma, com carinho e por categoria.',
      items: [
        { title: 'Olhar tudo, sem julgamento', text: 'Sua rotina, seus horários, suas comidas favoritas, suas vontades e cada prateleira da despensa. Nada de culpa: a gente só olha.' },
        { title: 'Agradecer e deixar ir', text: 'O que não te nutre sai de casa com carinho, e cada coisa que sai ganha uma troca gostosa. Você não perde nada: você troca.' },
        { title: 'Dar um lugar a cada coisa', text: 'Potes de vidro, básicos sempre à mão e uma semana que se organiza sozinha. Fica só o que nutre e o que te faz feliz.' },
      ],
    },
    way: {
      kicker: 'O jeito da Dolly',
      title: 'Três regras simples, para a vida inteira',
      intro: 'Depois de anos cozinhando, estudando e me curando, o meu jeito de comer cabe em três regras. Elas valem para o café da manhã, para o almoço, para o jantar e para o doce.',
      items: [
        { title: 'Cresce da terra, tem fibra e ainda parece com o que era', text: 'Essa é a minha pergunta para tudo o que entra na cesta. Frutas, folhas, legumes, feijões, grãos inteiros, castanhas e sementes passam. Pó branco em saquinho, não.' },
        { title: 'Tempero da planta inteira', text: 'Sem sal, sem óleo e sem açúcar refinado. O sabor vem de ervas, limão, especiarias, alho, cogumelos e frutas; a gordura vem inteira, da castanha, da semente, do abacate e do coco.' },
        { title: 'O máximo de vida em cada garfada', text: 'Eu escolho os alimentos que mais nutrem por garfada: folhas escuras, feijões, cebola e alho, cogumelos, frutas vermelhas, sementes. Eles entram todo dia, e o prato enche de cor.' },
      ],
    },
    colors: {
      kicker: 'Todo dia',
      title: 'As sete cores do seu prato',
      intro: 'No Sweet Escape eu dei uma cor a cada dia da semana. No Reset, as sete cores entram no prato todo dia. Se o seu prato tem cor, ele tem nutriente.',
      items: [
        { name: 'Verde', foods: 'Folhas escuras, brócolis, ervas, abacate' },
        { name: 'Vermelho', foods: 'Tomate, morango, melancia, pimentão' },
        { name: 'Roxo', foods: 'Açaí, repolho roxo, berinjela, mirtilo, uva' },
        { name: 'Laranja', foods: 'Abóbora, cenoura, manga, mamão, batata-doce' },
        { name: 'Amarelo', foods: 'Banana, abacaxi, milho, cúrcuma, limão' },
        { name: 'Branco', foods: 'Alho, cebola, cogumelos, couve-flor, coco' },
        { name: 'Marrom', foods: 'Feijões, lentilha, quinoa, grãos inteiros, castanhas, sementes, cacau' },
      ],
    },
    day: {
      kicker: 'Na prática',
      title: 'Um dia no Reset',
      intro: 'Para você ver que é comida de verdade, e muita. Um exemplo do que a gente monta junto, com o que tem na sua feira.',
      items: [
        { title: 'Café da manhã', text: 'Aveia de um dia para o outro com manga, chia e canela, ou uma tigela grande de frutas da estação com sementes e coco.' },
        { title: 'Almoço', text: 'Um prato cheio de folhas e legumes, feijão ou lentilha, um grão inteiro e um molho cremoso de castanha, tahine ou abacate.' },
        { title: 'Jantar', text: 'Sopa de legumes, refogado na água com alho e ervas, curry de grão-de-bico com leite de coco caseiro, arroz integral.' },
        { title: 'E o doce', text: 'Uma das sete cores do Sweet Escape, feita de fruta inteira, tâmara e castanha. Sim, tem doce. Doce faz parte da vida.' },
      ],
      note: 'Nada disso é obrigatório. É o seu prato, com os seus sabores, no seu ritmo.',
    },
    steps: {
      kicker: 'Como funciona',
      title: 'Passo a passo, sem sofrimento',
      items: [
        { title: 'Conversa grátis de 30 minutos', text: 'A gente se conhece, você me conta onde está e aonde quer chegar. Sem compromisso.' },
        { title: 'Raio-X da sua rotina', text: 'Como você come hoje, do café ao jantar: seus pratos favoritos, seus horários, suas vontades e a sua história com a comida. Sem julgamento.' },
        { title: 'Destralhe da despensa', text: 'O que fica, o que sai e o que entra no lugar. Sua despensa vira um lugar que te ajuda, não que te sabota.' },
        { title: 'Compras sem confusão', text: 'Como montar a sua despensa: o hortifruti primeiro, a cerealista depois, os rótulos que importam e a lista das sete cores.' },
        { title: 'Seu plano semanal completo', text: 'Cardápio da semana inteira, do café da manhã ao jantar, meal-prep de domingo e os básicos do dia a dia, para nunca ficar sem saber o que comer.' },
        { title: 'A família junto', text: 'Pratos que a casa toda come, crianças crescendo com uma energia calma em volta da comida e um ritmo que cabe na vida real.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'Eu compro ingredientes, não produtos',
      intro: 'Se cresce da terra, tem fibra e ainda parece com o que era, tem lugar no meu carrinho. Primeiro a feira, depois a cerealista, e em casa tudo em potes de vidro. A minha despensa tem duas partes: a base de todo dia e o cantinho doce.',
      daily: {
        kicker: 'Para todo dia',
        items: [
          { title: 'A base do prato de todo dia', text: 'Folhas escuras, feijões e lentilhas, cebola e alho, cogumelos, frutas vermelhas, sementes e castanhas. E os carboidratos inteiros que sustentam: abóbora, batata-doce, quinoa, arroz integral, aveia.' },
          { title: 'Os poucos complementos', text: 'Uma alimentação só de plantas pede pouca coisa de fora: B12 sempre, vitamina D conforme o sol que você pega, ômega-3 de algas. Quais e quanto, você confirma com o seu médico.' },
        ],
      },
      sweet: 'Para o cantinho doce: os meus seis blocos, com eles você faz qualquer doce sem açúcar refinado',
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
    inc: {
      photoAlt: 'Mesa de brunch no jardim, com frutas e amigas',
      kicker: 'No seu Reset',
      title: 'Tudo o que a gente constrói junto',
      items: [
        'Um olhar carinhoso sobre a sua rotina, do café ao jantar, suas comidas favoritas e suas vontades',
        'Curar a ansiedade com comida e os ciclos de tudo-ou-nada',
        'Como virar plant-based do jeito certo, sem deficiências e sem sobrecarga',
        'Refeições cheias de nutrientes que saciam de verdade, sem sal, sem óleo e sem açúcar refinado',
        'Cardápios semanais completos, meal-prep e os básicos do dia a dia',
        'Como fazer as compras e montar a despensa, do salgado ao doce',
        'Um ritmo que funciona dentro da vida real da família',
        'Crianças crescendo com uma energia calma em volta da comida',
        'Confiar no seu corpo em vez de lutar contra ele',
      ],
      end: 'E o mais importante: estabilidade por dentro. Porque quando a comida parece segura, todo o resto fica mais leve.',
    },
    sos: {
      badge: 'Pacote à parte · 14 dias',
      title: 'Reset do Paladar: 14 dias sem sal e sem óleo',
      lead: 'Para quem quer dar um passo só, bem dado. Duas semanas guiadas, com lista de compras, cardápio dia a dia e a Dolly acompanhando você. No fim, a comida volta a ter gosto de comida.',
      weeks: [
        { title: 'Semana 1 · sem óleo', text: 'Refogar na água ou no caldo, assar sem untar, molhos cremosos de castanha e abacate. A gordura vem inteira, da planta.' },
        { title: 'Semana 2 · sem sal', text: 'Ervas, limão, especiarias, alho e o umami dos cogumelos. Em poucas semanas o paladar acorda e a comida volta a ter gosto de comida.' },
      ],
      cta: 'Quero o Reset do Paladar',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam com a espátula e uma bandeja de doces',
      kicker: 'Sua Food Coach',
      title: 'Eu também já tive medo de comer',
      p1: 'Como bailarina profissional, aprendi a controlar cada caloria, cada mordida, cada forma do meu corpo. Passei anos em guerra com ele, e sei por dentro como essa guerra é silenciosa e cansativa. A saída não foi mais controle: foi confiança, e comida de verdade.',
      p2: 'Hoje eu vivo na Mata Atlântica, em Itamambuca, cozinho tudo do zero, só com plantas, e o meu corpo virou meu amigo. A comida não precisa ser temida nem proibida: ela pode ser prazerosa e gentil ao mesmo tempo.',
      p3: 'É por isso que no Reset não tem balança nem julgamento. Eu já estive do outro lado da mesa.',
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
        { q: 'É só sobre doces?', a: 'Não. Os doces são a minha porta de entrada, mas o Reset é a sua alimentação inteira: café da manhã, almoço, jantar, lanches e, sim, o doce também.' },
        { q: 'Vou emagrecer?', a: 'Eu não prometo peso, e não trabalho com ele. Quando a comida vira planta inteira, sem óleo, sem sal e sem açúcar refinado, o corpo costuma encontrar o seu próprio equilíbrio com o tempo, sem que você corra atrás. No Reset a gente não pesa, não conta e não compara. O objetivo é você se sentir nutrida, segura e em paz com o seu corpo.' },
        { q: 'Estou em tratamento para um transtorno alimentar. Posso fazer?', a: 'Pode, junto com a sua equipe, nunca no lugar dela. O coaching não é tratamento nem terapia. Conte à Dolly na conversa grátis: ela adapta o ritmo com cuidado e, se fizer sentido, conversa com quem acompanha você.' },
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
      description: 'Whole-diet food coaching with Food Coach Dolly, from breakfast to dinner: only plants, whole, with no salt, no oil and no refined sugar. No scale, no calorie counting, no guilt. Free 30-minute call.',
      ogDescription: 'Not another meal plan. Your whole way of eating, Dolly’s way, and peace with food and with your body. A free 30-minute call, and the Sweet Escape e-book as a gift.',
      ogAlt: 'Dolly in the garden at Itamambuca',
    },
    langLabel: 'Language',
    whatsapp: {
      reset: 'Hi Dolly! I’d love to know more about The Daily Tropical Reset.',
      sos: 'Hi Dolly! I’d love to know more about the Taste Reset: 14 days with no salt and no oil.',
    },
    hero: {
      dollyAlt: 'Dolly holding a tray of her treats in the garden at Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Friends laughing at a table with treats and tea',
      studioAlt: 'Women tasting healthy treats after class',
      tableAlt: 'A garden brunch table with tropical fruit',
      kicker: 'Food Healing Studio · with Food Coach Dolly',
      text: 'Whole-diet food coaching, from breakfast to dinner. Not another meal plan: making peace with food and with your body, eating only plants, whole, the way nature hands them to you.',
      hi: '“Hi, I’m Dolly. Let’s tidy up your relationship with food together, one step at a time. No scale and no guilt.”',
      cta: 'Book my free call',
      note: '30 minutes · online · no strings attached',
      gift: 'The Sweet Escape e-book as a gift',
    },
    feel: {
      lead: 'Maybe you are tired of all the stress around food. And of fighting your body.',
      cards: [
        { alt: 'Women at a table sharing treats and fruit', text: 'You want to feed your family better.' },
        { alt: 'Friends at a garden brunch', text: 'You want health without obsession.' },
        { alt: 'Friends on the sidewalk sharing a box of healthy treats', text: 'You want to look in the mirror with kindness.' },
      ],
      q: ['What if food finally felt ', 'safe', '?'],
      not: 'Not confusing. Not restrictive. Not something controlling you.',
    },
    safe: {
      kicker: 'A promise',
      title: 'There is no scale here',
      intro: 'I know what a diet does to a woman’s mind. That is why the Reset is built the opposite way round from a diet.',
      items: [
        { title: 'No scale', text: 'We don’t weigh, measure or compare. You will feel the difference in your body, your sleep and your energy, not in a number.' },
        { title: 'No counting', text: 'No calories, no points, no portions on a kitchen scale. Whole food, from plants, and you eat until you are satisfied.' },
        { title: 'No before and after', text: 'No photos, no target weight, no deadline. Your body is not a project: it is your home.' },
        { title: 'No guilt', text: 'Food isn’t good or bad, and neither are you. If a day goes off plan, we simply look at what happened and carry on.' },
      ],
      end: 'When you stop fighting your body and start nourishing it, it answers. In its own time, in its own way.',
    },
    kondo: {
      kicker: 'The method',
      title: 'Keep only what nourishes you and sparks joy',
      intro: 'Healthy eating starts in the shopping cart, not with willpower. If it isn’t in the house, you don’t eat it. So we tidy your whole food life the way you would tidy a closet: calmly, kindly and by category.',
      items: [
        { title: 'Look at everything, without judgment', text: 'Your routine, your mealtimes, your favorite foods, your cravings and every shelf in the pantry. No guilt: we just look.' },
        { title: 'Say thank you and let go', text: 'What doesn’t nourish you leaves the house kindly, and everything that leaves gets a delicious swap. You don’t lose anything: you trade up.' },
        { title: 'Give everything its place', text: 'Glass jars, staples always within reach and a week that organizes itself. Only what nourishes you and makes you happy stays.' },
      ],
    },
    way: {
      kicker: 'Dolly’s way',
      title: 'Three simple rules, for life',
      intro: 'After years of cooking, studying and healing, my way of eating fits in three rules. They hold for breakfast, for lunch, for dinner and for dessert.',
      items: [
        { title: 'It grows from the earth, carries fiber and still looks like what it was', text: 'That is my question for everything that goes in the basket. Fruit, leaves, vegetables, beans, whole grains, nuts and seeds pass. White powder in a packet doesn’t.' },
        { title: 'Seasoned by the whole plant', text: 'No salt, no oil and no refined sugar. Flavor comes from herbs, lemon, spices, garlic, mushrooms and fruit; fat comes whole, from the nut, the seed, the avocado and the coconut.' },
        { title: 'The most life in every bite', text: 'I choose the foods that nourish most per forkful: dark leafy greens, beans, onions and garlic, mushrooms, berries, seeds. They go in every day, and the plate fills with color.' },
      ],
    },
    colors: {
      kicker: 'Every day',
      title: 'The seven colors of your plate',
      intro: 'In Sweet Escape I gave each day of the week a color. In the Reset, all seven colors land on your plate every day. If your plate has color, it has nutrients.',
      items: [
        { name: 'Green', foods: 'Dark leafy greens, broccoli, herbs, avocado' },
        { name: 'Red', foods: 'Tomato, strawberry, watermelon, red pepper' },
        { name: 'Purple', foods: 'Açaí, red cabbage, eggplant, blueberry, grapes' },
        { name: 'Orange', foods: 'Pumpkin, carrot, mango, papaya, sweet potato' },
        { name: 'Yellow', foods: 'Banana, pineapple, corn, turmeric, lemon' },
        { name: 'White', foods: 'Garlic, onion, mushrooms, cauliflower, coconut' },
        { name: 'Brown', foods: 'Beans, lentils, quinoa, whole grains, nuts, seeds, cacao' },
      ],
    },
    day: {
      kicker: 'In practice',
      title: 'A day in the Reset',
      intro: 'So you can see it is real food, and plenty of it. One example of what we build together, from whatever your market has.',
      items: [
        { title: 'Breakfast', text: 'Overnight oats with mango, chia and cinnamon, or a big bowl of seasonal fruit with seeds and coconut.' },
        { title: 'Lunch', text: 'A full plate of leaves and vegetables, beans or lentils, a whole grain and a creamy sauce made from nuts, tahini or avocado.' },
        { title: 'Dinner', text: 'Vegetable soup, a water-sauté with garlic and herbs, chickpea curry with homemade coconut milk, brown rice.' },
        { title: 'And the sweet', text: 'One of the seven colors from Sweet Escape, made from whole fruit, dates and nuts. Yes, there is dessert. Dessert is part of life.' },
      ],
      note: 'None of this is compulsory. It is your plate, with your flavors, at your pace.',
    },
    steps: {
      kicker: 'How it works',
      title: 'Step by step, without the struggle',
      items: [
        { title: 'A free 30-minute call', text: 'We get to know each other; you tell me where you are and where you want to be. No strings attached.' },
        { title: 'An X-ray of your routine', text: 'How you eat today, from breakfast to dinner: your favorite dishes, your mealtimes, your cravings and your history with food. No judgment.' },
        { title: 'The pantry clear-out', text: 'What stays, what goes and what takes its place. Your pantry becomes a place that helps you instead of sabotaging you.' },
        { title: 'Shopping without the confusion', text: 'How to build your pantry: the produce market first, the bulk store second, the labels that matter and the seven-colors list.' },
        { title: 'Your complete weekly plan', text: 'A menu for the whole week, from breakfast to dinner, Sunday meal-prep and the daily staples, so you never wonder what to eat.' },
        { title: 'The whole family on board', text: 'Meals everyone at home eats, children growing up with calm energy around food, and a rhythm that fits real life.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'I shop for ingredients, not products',
      intro: 'If it grows from the earth, carries fiber and still looks like what it was, it belongs in my basket. The produce market first, the bulk store second, and at home everything in glass jars. My pantry has two parts: the everyday base and the sweet corner.',
      daily: {
        kicker: 'For every day',
        items: [
          { title: 'The base of the everyday plate', text: 'Dark leafy greens, beans and lentils, onions and garlic, mushrooms, berries, seeds and nuts. And the whole carbohydrates that keep you going: pumpkin, sweet potato, quinoa, brown rice, oats.' },
          { title: 'The few supplements', text: 'A diet of plants alone asks for very little from outside: B12 always, vitamin D depending on the sun you get, omega-3 from algae. Which ones and how much, you confirm with your doctor.' },
        ],
      },
      sweet: 'For the sweet corner: my six building blocks, with them you can make any treat without refined sugar',
      blocks: [
        { title: 'Healthy fats & proteins', text: 'Almonds, cashews, chia, flax, hemp seeds, coconut, tofu.' },
        { title: 'Natural sweetness', text: 'Medjool dates, dried figs, apricots, banana, mango, apple.' },
        { title: 'Wheat-free structure', text: 'Rolled oats, almond flour, buckwheat flour, coconut flour.' },
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
    inc: {
      photoAlt: 'A garden brunch table with fruit and friends',
      kicker: 'In your Reset',
      title: 'Everything we build together',
      items: [
        'A kind look at your routine, from breakfast to dinner, your favorite foods and your cravings',
        'Healing food anxiety and all-or-nothing cycles',
        'How to go plant-based the right way, without deficiencies or overwhelm',
        'Nutrient-rich meals that truly satisfy, with no salt, no oil and no refined sugar',
        'Complete weekly menus, meal-prep and the daily staples',
        'How to shop and build your pantry, savory to sweet',
        'A rhythm that works inside real family life',
        'Children growing up around calm, grounded food energy',
        'Trusting your body instead of fighting it',
      ],
      end: 'And most importantly: stability on the inside. Because when food feels safe, everything else softens.',
    },
    sos: {
      badge: 'Separate package · 14 days',
      title: 'The Taste Reset: 14 days with no salt and no oil',
      lead: 'For anyone who wants to take one step, and take it well. Two guided weeks, with a shopping list, a day-by-day menu and Dolly by your side. At the end, food tastes like food again.',
      weeks: [
        { title: 'Week 1 · no oil', text: 'Sauté in water or broth, bake without greasing, make creamy sauces from nuts and avocado. The fat comes whole, from the plant.' },
        { title: 'Week 2 · no salt', text: 'Herbs, lemon, spices, garlic and the umami of mushrooms. Within a few weeks your taste buds wake up and food tastes like food again.' },
      ],
      cta: 'I want the Taste Reset',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam with a spatula and a tray of treats',
      kicker: 'Your Food Coach',
      title: 'I used to be afraid of food too',
      p1: 'As a professional ballet dancer, I learned to control every calorie, every bite, every line of my body. I spent years at war with it, and I know from the inside how quiet and exhausting that war is. The way out was not more control: it was trust, and real food.',
      p2: 'Today I live in the Atlantic Forest in Itamambuca, Brazil, I make everything from scratch, only with plants, and my body has become my friend. Food doesn’t have to be feared or forbidden: it can be pleasurable and kind at the same time.',
      p3: 'That is why there is no scale and no judgment in the Reset. I have sat on the other side of that table.',
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
        { q: 'Is it only about sweets?', a: 'No. Sweets are my front door, but the Reset is your whole way of eating: breakfast, lunch, dinner, snacks and, yes, dessert too.' },
        { q: 'Will I lose weight?', a: 'I don’t promise weight, and I don’t work with it. When food becomes whole plants with no oil, no salt and no refined sugar, the body tends to find its own balance over time, without you chasing it. In the Reset we don’t weigh, count or compare. The goal is for you to feel nourished, safe and at peace with your body.' },
        { q: 'I am in treatment for an eating disorder. Can I join?', a: 'Yes, alongside your care team, never instead of it. The coaching is not treatment or therapy. Tell Dolly on the free call: she will adapt the pace with care and, if it makes sense, talk with the people looking after you.' },
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
      description: 'Coaching de alimentación completa con la Food Coach Dolly, del desayuno a la cena: solo plantas, enteras, sin sal, sin aceite y sin azúcar refinado. Sin báscula, sin contar calorías, sin culpa. Llamada gratis de 30 minutos.',
      ogDescription: 'No es otro plan de comidas. Es tu alimentación entera, a la manera de Dolly, y paz con la comida y con tu cuerpo. Una llamada gratis de 30 minutos y el e-book Sweet Escape de regalo.',
      ogAlt: 'Dolly en el jardín de Itamambuca',
    },
    langLabel: 'Idioma',
    whatsapp: {
      reset: '¡Hola, Dolly! Quiero saber más sobre The Daily Tropical Reset.',
      sos: '¡Hola, Dolly! Quiero saber más sobre el Reset del Paladar: 14 días sin sal y sin aceite.',
    },
    hero: {
      dollyAlt: 'Dolly con una bandeja de sus dulces en el jardín de Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Amigas riendo en la mesa con dulces y té',
      studioAlt: 'Mujeres probando dulces saludables después de clase',
      tableAlt: 'Mesa de brunch en el jardín con fruta tropical',
      kicker: 'Food Healing Studio · con la Food Coach Dolly',
      text: 'Coaching de alimentación completa, del desayuno a la cena. No es otro plan de comidas: es hacer las paces con la comida y con tu cuerpo, comiendo solo plantas, enteras, tal como las entrega la naturaleza.',
      hi: '“Hola, soy Dolly. Ordenemos juntas tu relación con la comida, paso a paso. Sin báscula y sin culpa.”',
      cta: 'Reservar mi llamada gratis',
      note: '30 minutos · online · sin compromiso',
      gift: 'El e-book Sweet Escape de regalo',
    },
    feel: {
      lead: 'Quizás estás cansada de tanta ansiedad con la comida. Y de pelearte con tu cuerpo.',
      cards: [
        { alt: 'Mujeres en la mesa compartiendo dulces y fruta', text: 'Quieres alimentar mejor a tu familia.' },
        { alt: 'Amigas en un brunch en el jardín', text: 'Quieres salud sin obsesión.' },
        { alt: 'Amigas en la acera compartiendo una caja de dulces saludables', text: 'Quieres mirarte al espejo con cariño.' },
      ],
      q: ['¿Y si la comida por fin se sintiera ', 'segura', '?'],
      not: 'Ni confusa. Ni restrictiva. Ni algo que te controla.',
    },
    safe: {
      kicker: 'Una promesa',
      title: 'Aquí no hay báscula',
      intro: 'Sé lo que una dieta le hace a la cabeza de una mujer. Por eso el Reset está construido al revés de una dieta.',
      items: [
        { title: 'Sin báscula', text: 'No pesamos, no medimos y no comparamos. Vas a notar la diferencia en el cuerpo, en el sueño y en la energía, no en un número.' },
        { title: 'Sin contar nada', text: 'Ni calorías, ni puntos, ni porciones en la balanza de cocina. Comida entera, de plantas, y comes hasta quedar satisfecha.' },
        { title: 'Sin antes y después', text: 'Ninguna foto, ninguna meta de peso, ninguna fecha. Tu cuerpo no es un proyecto: es tu casa.' },
        { title: 'Sin culpa', text: 'La comida no es buena ni mala, y tú tampoco. Si un día te sales de lo acordado, solo miramos qué pasó y seguimos.' },
      ],
      end: 'Cuando dejas de pelear con tu cuerpo y empiezas a nutrirlo, responde. A su tiempo, a su manera.',
    },
    kondo: {
      kicker: 'El método',
      title: 'Solo se queda lo que te nutre y te hace feliz',
      intro: 'Comer bien empieza en el carrito del súper, no en la fuerza de voluntad. Si no está en casa, no te lo comes. Así que ordenamos toda tu vida alimentaria como quien ordena un armario: con calma, con cariño y por categorías.',
      items: [
        { title: 'Mirarlo todo, sin juzgar', text: 'Tu rutina, tus horarios, tus comidas favoritas, tus antojos y cada estante de la despensa. Nada de culpa: solo miramos.' },
        { title: 'Agradecer y dejar ir', text: 'Lo que no te nutre sale de casa con cariño, y cada cosa que sale tiene un cambio delicioso. No pierdes nada: lo cambias.' },
        { title: 'Darle a cada cosa su lugar', text: 'Frascos de vidrio, básicos siempre a mano y una semana que se organiza sola. Solo se queda lo que te nutre y te hace feliz.' },
      ],
    },
    way: {
      kicker: 'A la manera de Dolly',
      title: 'Tres reglas simples, para toda la vida',
      intro: 'Después de años cocinando, estudiando y sanándome, mi forma de comer cabe en tres reglas. Valen para el desayuno, para el almuerzo, para la cena y para el postre.',
      items: [
        { title: 'Crece de la tierra, tiene fibra y todavía se parece a lo que era', text: 'Esa es mi pregunta para todo lo que entra en la cesta. Fruta, hojas, verduras, legumbres, granos enteros, frutos secos y semillas pasan. El polvo blanco en bolsita, no.' },
        { title: 'Sazonada por la planta entera', text: 'Sin sal, sin aceite y sin azúcar refinado. El sabor viene de hierbas, limón, especias, ajo, setas y fruta; la grasa llega entera, del fruto seco, la semilla, el aguacate y el coco.' },
        { title: 'El máximo de vida en cada bocado', text: 'Elijo los alimentos que más nutren por bocado: hojas verdes oscuras, legumbres, cebolla y ajo, setas, frutos rojos, semillas. Entran cada día, y el plato se llena de color.' },
      ],
    },
    colors: {
      kicker: 'Cada día',
      title: 'Los siete colores de tu plato',
      intro: 'En Sweet Escape le di un color a cada día de la semana. En el Reset, los siete colores llegan a tu plato cada día. Si tu plato tiene color, tiene nutrientes.',
      items: [
        { name: 'Verde', foods: 'Hojas verdes oscuras, brócoli, hierbas, aguacate' },
        { name: 'Rojo', foods: 'Tomate, fresa, sandía, pimiento rojo' },
        { name: 'Morado', foods: 'Açaí, col lombarda, berenjena, arándano, uva' },
        { name: 'Naranja', foods: 'Calabaza, zanahoria, mango, papaya, boniato' },
        { name: 'Amarillo', foods: 'Plátano, piña, maíz, cúrcuma, limón' },
        { name: 'Blanco', foods: 'Ajo, cebolla, setas, coliflor, coco' },
        { name: 'Marrón', foods: 'Legumbres, lentejas, quinoa, granos enteros, frutos secos, semillas, cacao' },
      ],
    },
    day: {
      kicker: 'En la práctica',
      title: 'Un día en el Reset',
      intro: 'Para que veas que es comida de verdad, y mucha. Un ejemplo de lo que armamos juntas, con lo que haya en tu mercado.',
      items: [
        { title: 'Desayuno', text: 'Avena remojada de un día para otro con mango, chía y canela, o un bol grande de fruta de temporada con semillas y coco.' },
        { title: 'Almuerzo', text: 'Un plato lleno de hojas y verduras, legumbres o lentejas, un grano entero y una salsa cremosa de frutos secos, tahini o aguacate.' },
        { title: 'Cena', text: 'Sopa de verduras, salteado en agua con ajo y hierbas, curry de garbanzos con leche de coco casera, arroz integral.' },
        { title: 'Y el dulce', text: 'Uno de los siete colores de Sweet Escape, hecho con fruta entera, dátiles y frutos secos. Sí, hay postre. El postre es parte de la vida.' },
      ],
      note: 'Nada de esto es obligatorio. Es tu plato, con tus sabores, a tu ritmo.',
    },
    steps: {
      kicker: 'Cómo funciona',
      title: 'Paso a paso, sin sufrimiento',
      items: [
        { title: 'Llamada gratis de 30 minutos', text: 'Nos conocemos, me cuentas dónde estás y a dónde quieres llegar. Sin compromiso.' },
        { title: 'Radiografía de tu rutina', text: 'Cómo comes hoy, del desayuno a la cena: tus platos favoritos, tus horarios, tus antojos y tu historia con la comida. Sin juzgar.' },
        { title: 'Limpieza de la despensa', text: 'Lo que se queda, lo que se va y lo que ocupa su lugar. Tu despensa se convierte en un lugar que te ayuda, no que te sabotea.' },
        { title: 'Compras sin confusión', text: 'Cómo montar tu despensa: primero la frutería, después la tienda a granel, las etiquetas que importan y la lista de los siete colores.' },
        { title: 'Tu plan semanal completo', text: 'El menú de toda la semana, del desayuno a la cena, el meal-prep del domingo y los básicos del día a día, para no quedarte nunca sin saber qué comer.' },
        { title: 'Toda la familia', text: 'Platos que come toda la casa, niños que crecen con una energía tranquila alrededor de la comida y un ritmo que cabe en la vida real.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'Compro ingredientes, no productos',
      intro: 'Si crece de la tierra, tiene fibra y todavía se parece a lo que era, tiene lugar en mi cesta. Primero la frutería, después la tienda a granel, y en casa todo en frascos de vidrio. Mi despensa tiene dos partes: la base de todos los días y el rincón dulce.',
      daily: {
        kicker: 'Para todos los días',
        items: [
          { title: 'La base del plato de cada día', text: 'Hojas verdes oscuras, legumbres y lentejas, cebolla y ajo, setas, frutos rojos, semillas y frutos secos. Y los carbohidratos enteros que sostienen: calabaza, boniato, quinoa, arroz integral, avena.' },
          { title: 'Los pocos complementos', text: 'Una alimentación solo de plantas pide muy poco de fuera: B12 siempre, vitamina D según el sol que tomes, omega-3 de algas. Cuáles y cuánto, lo confirmas con tu médico.' },
        ],
      },
      sweet: 'Para el rincón dulce: mis seis bloques, con ellos haces cualquier dulce sin azúcar refinado',
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
    inc: {
      photoAlt: 'Mesa de brunch en el jardín con fruta y amigas',
      kicker: 'En tu Reset',
      title: 'Todo lo que construimos juntas',
      items: [
        'Una mirada cariñosa a tu rutina, del desayuno a la cena, tus comidas favoritas y tus antojos',
        'Sanar la ansiedad con la comida y los ciclos de todo-o-nada',
        'Cómo pasarte a lo plant-based bien, sin carencias ni agobio',
        'Comidas llenas de nutrientes que sacian de verdad, sin sal, sin aceite y sin azúcar refinado',
        'Menús semanales completos, meal-prep y los básicos del día a día',
        'Cómo hacer la compra y montar tu despensa, de lo salado a lo dulce',
        'Un ritmo que funciona dentro de la vida real de la familia',
        'Niños que crecen con una energía tranquila alrededor de la comida',
        'Confiar en tu cuerpo en vez de luchar contra él',
      ],
      end: 'Y lo más importante: estabilidad por dentro. Porque cuando la comida se siente segura, todo lo demás se suaviza.',
    },
    sos: {
      badge: 'Paquete aparte · 14 días',
      title: 'Reset del Paladar: 14 días sin sal y sin aceite',
      lead: 'Para quien quiere dar un solo paso, y darlo bien. Dos semanas guiadas, con lista de la compra, menú día a día y Dolly acompañándote. Al final, la comida vuelve a saber a comida.',
      weeks: [
        { title: 'Semana 1 · sin aceite', text: 'Saltear con agua o caldo, hornear sin engrasar, salsas cremosas de frutos secos y aguacate. La grasa llega entera, de la planta.' },
        { title: 'Semana 2 · sin sal', text: 'Hierbas, limón, especias, ajo y el umami de las setas. En pocas semanas el paladar despierta y la comida vuelve a saber a comida.' },
      ],
      cta: 'Quiero el Reset del Paladar',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam con la espátula y una bandeja de dulces',
      kicker: 'Tu Food Coach',
      title: 'Yo también le tuve miedo a la comida',
      p1: 'Como bailarina profesional, aprendí a controlar cada caloría, cada bocado, cada línea de mi cuerpo. Pasé años en guerra con él, y sé por dentro lo silenciosa y agotadora que es esa guerra. La salida no fue más control: fue confianza, y comida de verdad.',
      p2: 'Hoy vivo en la Mata Atlántica, en Itamambuca (Brasil), lo cocino todo desde cero, solo con plantas, y mi cuerpo se volvió mi amigo. La comida no tiene por qué dar miedo ni estar prohibida: puede ser placentera y amable a la vez.',
      p3: 'Por eso en el Reset no hay báscula ni juicio. Yo ya estuve del otro lado de esa mesa.',
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
        { q: '¿Es solo sobre dulces?', a: 'No. Los dulces son mi puerta de entrada, pero el Reset es tu alimentación entera: desayuno, almuerzo, cena, meriendas y, sí, el postre también.' },
        { q: '¿Voy a adelgazar?', a: 'No prometo peso, y no trabajo con él. Cuando la comida pasa a ser planta entera, sin aceite, sin sal y sin azúcar refinado, el cuerpo suele encontrar su propio equilibrio con el tiempo, sin que tengas que perseguirlo. En el Reset no pesamos, no contamos y no comparamos. El objetivo es que te sientas nutrida, segura y en paz con tu cuerpo.' },
        { q: 'Estoy en tratamiento por un trastorno alimentario. ¿Puedo hacerlo?', a: 'Sí, junto con tu equipo, nunca en su lugar. El coaching no es tratamiento ni terapia. Cuéntaselo a Dolly en la llamada gratis: adaptará el ritmo con cuidado y, si tiene sentido, hablará con quienes te acompañan.' },
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
      description: 'Voedingscoaching voor je hele eetpatroon met Food Coach Dolly, van ontbijt tot avondeten: alleen planten, heel, zonder zout, olie en geraffineerde suiker. Geen weegschaal, geen calorieën tellen, geen schuldgevoel. Gratis gesprek van 30 minuten.',
      ogDescription: 'Geen zoveelste eetplan. Je hele manier van eten, op Dolly’s manier, en vrede met eten en met je lichaam. Een gratis gesprek van 30 minuten en het e-book Sweet Escape cadeau.',
      ogAlt: 'Dolly in de tuin in Itamambuca',
    },
    langLabel: 'Taal',
    whatsapp: {
      reset: 'Hoi Dolly! Ik wil graag meer weten over The Daily Tropical Reset.',
      sos: 'Hoi Dolly! Ik wil graag meer weten over de Smaak-Reset: 14 dagen zonder zout en zonder olie.',
    },
    hero: {
      dollyAlt: 'Dolly met een dienblad vol lekkers in de tuin in Itamambuca',
      tag: 'Food Coach · Food Healing Studio',
      talkAlt: 'Vriendinnen die lachen aan tafel met lekkers en thee',
      studioAlt: 'Vrouwen die gezonde zoetigheden proeven na de les',
      tableAlt: 'Brunchtafel in de tuin met tropisch fruit',
      kicker: 'Food Healing Studio · met Food Coach Dolly',
      text: 'Voedingscoaching voor je hele eetpatroon, van ontbijt tot avondeten. Geen zoveelste eetplan: vrede sluiten met eten en met je lichaam, door alleen planten te eten, heel, zoals de natuur ze geeft.',
      hi: '“Hoi, ik ben Dolly. Laten we samen je relatie met eten opruimen, stap voor stap. Zonder weegschaal en zonder schuldgevoel.”',
      cta: 'Plan mijn gratis gesprek',
      note: '30 minuten · online · vrijblijvend',
      gift: 'Het e-book Sweet Escape cadeau',
    },
    feel: {
      lead: 'Misschien ben je het gepieker over eten gewoon moe. En het vechten met je lichaam.',
      cards: [
        { alt: 'Vrouwen aan tafel die lekkers en fruit delen', text: 'Je wilt je gezin beter voeden.' },
        { alt: 'Vriendinnen bij een brunch in de tuin', text: 'Je wilt gezondheid zonder obsessie.' },
        { alt: 'Vriendinnen op straat die een doos gezonde zoetigheden delen', text: 'Je wilt met zachtheid in de spiegel kijken.' },
      ],
      q: ['Wat als eten eindelijk ', 'veilig', ' voelde?'],
      not: 'Niet verwarrend. Niet beperkend. Niet iets dat jou controleert.',
    },
    safe: {
      kicker: 'Een belofte',
      title: 'Hier staat geen weegschaal',
      intro: 'Ik weet wat een dieet met het hoofd van een vrouw doet. Daarom is de Reset precies andersom gebouwd dan een dieet.',
      items: [
        { title: 'Geen weegschaal', text: 'We wegen niet, meten niet en vergelijken niet. Je voelt het verschil in je lichaam, je slaap en je energie, niet in een getal.' },
        { title: 'Niets tellen', text: 'Geen calorieën, geen punten, geen porties op de keukenweegschaal. Heel eten, van planten, en je eet tot je voldaan bent.' },
        { title: 'Geen voor en na', text: 'Geen foto’s, geen streefgewicht, geen deadline. Je lichaam is geen project: het is je thuis.' },
        { title: 'Geen schuldgevoel', text: 'Eten is niet goed of slecht, en jij ook niet. Loopt een dag anders dan afgesproken, dan kijken we gewoon wat er gebeurde en gaan we verder.' },
      ],
      end: 'Als je stopt met vechten tegen je lichaam en het begint te voeden, antwoordt het. In zijn eigen tempo, op zijn eigen manier.',
    },
    kondo: {
      kicker: 'De methode',
      title: 'Alleen wat je voedt en blij maakt, blijft',
      intro: 'Gezond eten begint in je boodschappenkar, niet bij wilskracht. Wat niet in huis is, eet je niet. Dus ruimen we je hele eetleven op zoals je een kast opruimt: rustig, liefdevol en per categorie.',
      items: [
        { title: 'Alles bekijken, zonder oordeel', text: 'Je routine, je eetmomenten, je lievelingseten, je trek en elke plank in de voorraadkast. Geen schuldgevoel: we kijken alleen.' },
        { title: 'Bedanken en loslaten', text: 'Wat je niet voedt, gaat met zorg het huis uit, en voor alles wat gaat komt er een heerlijk alternatief. Je verliest niets: je ruilt.' },
        { title: 'Alles een eigen plek geven', text: 'Glazen potten, basisproducten altijd binnen handbereik en een week die zichzelf organiseert. Alleen wat je voedt en blij maakt, blijft.' },
      ],
    },
    way: {
      kicker: 'Dolly’s manier',
      title: 'Drie simpele regels, voor het leven',
      intro: 'Na jaren koken, studeren en helen past mijn manier van eten in drie regels. Ze gelden voor het ontbijt, de lunch, het avondeten en het toetje.',
      items: [
        { title: 'Het groeit uit de aarde, heeft vezels en lijkt nog op wat het was', text: 'Dat is mijn vraag bij alles wat in de mand gaat. Fruit, bladgroenten, groenten, bonen, volle granen, noten en zaden komen erdoor. Wit poeder in een zakje niet.' },
        { title: 'Op smaak gebracht door de hele plant', text: 'Zonder zout, zonder olie en zonder geraffineerde suiker. De smaak komt van kruiden, citroen, specerijen, knoflook, paddenstoelen en fruit; het vet komt heel, uit de noot, het zaad, de avocado en de kokos.' },
        { title: 'Zoveel mogelijk leven in elke hap', text: 'Ik kies het eten dat het meest voedt per hap: donkere bladgroenten, bonen, ui en knoflook, paddenstoelen, bessen, zaden. Die komen elke dag op tafel, en het bord loopt vol kleur.' },
      ],
    },
    colors: {
      kicker: 'Elke dag',
      title: 'De zeven kleuren van je bord',
      intro: 'In Sweet Escape gaf ik elke dag van de week een kleur. In de Reset komen alle zeven kleuren elke dag op je bord. Heeft je bord kleur, dan heeft het voedingsstoffen.',
      items: [
        { name: 'Groen', foods: 'Donkere bladgroenten, broccoli, kruiden, avocado' },
        { name: 'Rood', foods: 'Tomaat, aardbei, watermeloen, rode paprika' },
        { name: 'Paars', foods: 'Açaí, rodekool, aubergine, blauwe bes, druiven' },
        { name: 'Oranje', foods: 'Pompoen, wortel, mango, papaja, zoete aardappel' },
        { name: 'Geel', foods: 'Banaan, ananas, maïs, kurkuma, citroen' },
        { name: 'Wit', foods: 'Knoflook, ui, paddenstoelen, bloemkool, kokos' },
        { name: 'Bruin', foods: 'Bonen, linzen, quinoa, volle granen, noten, zaden, cacao' },
      ],
    },
    day: {
      kicker: 'In de praktijk',
      title: 'Een dag in de Reset',
      intro: 'Zodat je ziet dat het echt eten is, en veel. Eén voorbeeld van wat we samen bouwen, met wat jouw markt te bieden heeft.',
      items: [
        { title: 'Ontbijt', text: 'Overnight oats met mango, chia en kaneel, of een grote kom seizoensfruit met zaden en kokos.' },
        { title: 'Lunch', text: 'Een vol bord bladgroenten en groenten, bonen of linzen, een vol graan en een romige saus van noten, tahin of avocado.' },
        { title: 'Avondeten', text: 'Groentesoep, in water gesmoord met knoflook en kruiden, kikkererwtencurry met zelfgemaakte kokosmelk, zilvervliesrijst.' },
        { title: 'En het zoete', text: 'Een van de zeven kleuren uit Sweet Escape, gemaakt van heel fruit, dadels en noten. Ja, er is een toetje. Een toetje hoort bij het leven.' },
      ],
      note: 'Niets hiervan is verplicht. Het is jouw bord, met jouw smaken, in jouw tempo.',
    },
    steps: {
      kicker: 'Hoe het werkt',
      title: 'Stap voor stap, zonder lijden',
      items: [
        { title: 'Gratis gesprek van 30 minuten', text: 'We leren elkaar kennen, je vertelt me waar je nu staat en waar je naartoe wilt. Vrijblijvend.' },
        { title: 'Een röntgenfoto van je routine', text: 'Hoe je nu eet, van ontbijt tot avondeten: je lievelingsgerechten, je eetmomenten, je trek en je geschiedenis met eten. Zonder oordeel.' },
        { title: 'De voorraadkast opruimen', text: 'Wat blijft, wat gaat en wat ervoor in de plaats komt. Je voorraadkast wordt een plek die je helpt in plaats van saboteert.' },
        { title: 'Boodschappen zonder verwarring', text: 'Hoe je je voorraadkast opbouwt: eerst de groenteboer of markt, dan de natuurwinkel met bulk, de etiketten die ertoe doen en de lijst met de zeven kleuren.' },
        { title: 'Je complete weekplan', text: 'Een menu voor de hele week, van ontbijt tot avondeten, meal-prep op zondag en de dagelijkse basis, zodat je nooit meer hoeft te zoeken wat je eet.' },
        { title: 'Het hele gezin mee', text: 'Gerechten die iedereen thuis eet, kinderen die opgroeien met rust rond eten, en een ritme dat in het echte leven past.' },
      ],
    },
    pantry: {
      kicker: 'Paradise Pantry',
      title: 'Ik koop ingrediënten, geen producten',
      intro: 'Als het uit de aarde groeit, vezels heeft en nog lijkt op wat het was, hoort het in mijn mand. Eerst de markt, dan de natuurwinkel, en thuis alles in glazen potten. Mijn voorraadkast heeft twee delen: de basis voor elke dag en het zoete hoekje.',
      daily: {
        kicker: 'Voor elke dag',
        items: [
          { title: 'De basis van het dagelijkse bord', text: 'Donkere bladgroenten, bonen en linzen, ui en knoflook, paddenstoelen, bessen, zaden en noten. En de volle koolhydraten die je op de been houden: pompoen, zoete aardappel, quinoa, zilvervliesrijst, haver.' },
          { title: 'De paar supplementen', text: 'Eten van alleen planten vraagt heel weinig van buitenaf: B12 altijd, vitamine D afhankelijk van de zon die je krijgt, omega-3 uit algen. Welke en hoeveel, stem je af met je arts.' },
        ],
      },
      sweet: 'Voor het zoete hoekje: mijn zes bouwstenen, daarmee maak je elk lekkers zonder geraffineerde suiker',
      blocks: [
        { title: 'Gezonde vetten & eiwitten', text: 'Amandelen, cashewnoten, chia, lijnzaad, hennepzaad, kokos, tofu.' },
        { title: 'Natuurlijke zoetheid', text: 'Medjoul-dadels, gedroogde vijgen, abrikozen, banaan, mango, appel.' },
        { title: 'Tarwevrije basis', text: 'Havervlokken, amandelmeel, boekweitmeel, kokosmeel.' },
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
    inc: {
      photoAlt: 'Brunchtafel in de tuin met fruit en vriendinnen',
      kicker: 'In je Reset',
      title: 'Alles wat we samen opbouwen',
      items: [
        'Een liefdevolle blik op je routine, van ontbijt tot avondeten, je lievelingseten en je trek',
        'Helen van eetangst en alles-of-niets-cycli',
        'Hoe je goed plantaardig gaat eten, zonder tekorten en zonder overbelasting',
        'Voedzame maaltijden die echt verzadigen, zonder zout, olie en geraffineerde suiker',
        'Complete weekmenu’s, meal-prep en de dagelijkse basis',
        'Hoe je boodschappen doet en je voorraadkast opbouwt, van hartig tot zoet',
        'Een ritme dat werkt binnen het echte gezinsleven',
        'Kinderen die opgroeien met rust en kalmte rond eten',
        'Vertrouwen op je lichaam in plaats van ertegen vechten',
      ],
      end: 'En het allerbelangrijkste: stabiliteit vanbinnen. Want als eten veilig voelt, wordt al het andere zachter.',
    },
    sos: {
      badge: 'Apart pakket · 14 dagen',
      title: 'De Smaak-Reset: 14 dagen zonder zout en zonder olie',
      lead: 'Voor wie één stap wil zetten, en die goed wil zetten. Twee begeleide weken, met een boodschappenlijst, een menu per dag en Dolly naast je. Aan het eind smaakt eten weer naar eten.',
      weeks: [
        { title: 'Week 1 · zonder olie', text: 'Smoren in water of bouillon, bakken zonder in te vetten, romige sauzen van noten en avocado. Het vet komt heel, uit de plant.' },
        { title: 'Week 2 · zonder zout', text: 'Kruiden, citroen, specerijen, knoflook en de umami van paddenstoelen. Binnen een paar weken worden je smaakpapillen wakker en smaakt eten weer naar eten.' },
      ],
      cta: 'Ik wil de Smaak-Reset',
    },
    dolly: {
      photoAlt: 'Dolly Van Dam met een spatel en een dienblad vol lekkers',
      kicker: 'Jouw Food Coach',
      title: 'Ook ik was ooit bang voor eten',
      p1: 'Als professionele balletdanseres leerde ik elke calorie, elke hap en elke lijn van mijn lichaam te controleren. Ik heb jaren in oorlog met mijn lichaam geleefd, en ik weet van binnenuit hoe stil en uitputtend die oorlog is. De uitweg was niet méér controle: het was vertrouwen, en echt eten.',
      p2: 'Vandaag woon ik in het Atlantisch Woud in Itamambuca, Brazilië, maak ik alles zelf, alleen met planten, en is mijn lichaam mijn vriend geworden. Eten hoeft niet eng of verboden te zijn: het kan tegelijk genieten én zacht voor jezelf zijn.',
      p3: 'Daarom staat er in de Reset geen weegschaal en is er geen oordeel. Ik heb aan de andere kant van die tafel gezeten.',
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
        { q: 'Gaat het alleen over zoetigheid?', a: 'Nee. Zoetigheid is mijn voordeur, maar de Reset gaat over je hele manier van eten: ontbijt, lunch, avondeten, tussendoortjes en, ja, ook het toetje.' },
        { q: 'Ga ik afvallen?', a: 'Ik beloof geen gewicht, en ik werk er niet mee. Als eten hele planten wordt, zonder olie, zout en geraffineerde suiker, vindt het lichaam meestal vanzelf zijn eigen evenwicht, zonder dat jij erachteraan hoeft te jagen. In de Reset wegen, tellen en vergelijken we niet. Het doel is dat jij je gevoed, veilig en in vrede met je lichaam voelt.' },
        { q: 'Ik word behandeld voor een eetstoornis. Kan ik meedoen?', a: 'Ja, naast je behandelteam, nooit in plaats daarvan. De coaching is geen behandeling of therapie. Vertel het Dolly in het gratis gesprek: ze past het tempo met zorg aan en overlegt, als dat zinvol is, met de mensen die jou begeleiden.' },
        { q: 'Is het online?', a: 'Ja. Het gesprek en de sessies gaan via video, dus je kunt overal ter wereld meedoen. Ben je in de buurt van Ubatuba, Brazilië, dan kun je met Dolly ook afspreken om elkaar in het echt te zien.' },
        { q: 'Moet ik in één keer veganist worden?', a: 'Nee. De Reset gaat stap voor stap, in jouw tempo, zonder alles-of-niets. Je begint met wat voor jou het makkelijkst is en de rest ruilen we rustig om.' },
        { q: 'Werkt het als mijn partner en kinderen niet willen veranderen?', a: 'Precies daarvoor is het gezinsdeel er: gerechten die iedereen eet, zonder twee keer te koken en zonder ruzie aan tafel.' },
        { q: 'Wat kost het?', a: 'Elk plan is op maat. In het gratis gesprek van 30 minuten ontdekt Dolly wat je nodig hebt en laat ze je de mogelijkheden en de prijs zien, zonder druk.' },
        { q: 'Vervangt het mijn arts of diëtist?', a: 'Nee. De coaching is voedingseducatie en gewoontes veranderen. Heb je een aandoening of gebruik je medicijnen, blijf dan bij je arts en vertel over de veranderingen.' },
      ],
    },
  },
};
