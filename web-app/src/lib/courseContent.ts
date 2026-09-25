/**
 * Everything the course pages say, in one place, so the wording can be tuned without touching layout.
 * Prices and the on/off switch live in the database (Admin > Cursos); this is the story around them.
 *
 * Sections each course can use:
 *  - magic:   Dolly's "magic flavour combinations" that make taste buds and teeth feel what people crave in junk food
 *  - paths:   where the course can take someone (health, own business, awareness, working with us)
 *  - retreat: the course packaged with the beach (a stay at the retreat house)
 *  - family:  the rainy-day version for the whole family
 */

export type PathId = 'saude' | 'negocio' | 'consciencia' | 'equipe';

export interface MagicTrick {
  emoji: string;
  /** What people crave. */
  craving: string;
  /** How the combination fools the mouth. */
  trick: string;
}

export interface CourseContent {
  slug: string;
  title: string;
  eyebrow: string;
  tagline: string;
  heroImage: string;
  floating: string[];
  story: string[];
  whoFor: string[];
  youLeaveWith: string[];
  magicIntro: string;
  magic: MagicTrick[];
  journey: { title: string; text: string }[];
  paths: PathId[];
  retreatText?: string;
  familyText?: string;
  faq: { q: string; a: string }[];
  /** What the enquiry form records as the interest. */
  enquiry: string;
  cta: string;
  gallery: string[];
}

/** The full set of tricks. Each course shows the ones that fit it. */
export const MAGIC_TRICKS: Record<string, MagicTrick> = {
  caramelo: { emoji: '🍯', craving: 'Caramelo e doce de leite', trick: 'Tâmaras maduras, pasta de castanha e baunilha: o dente sente a “puxada” do caramelo, sem uma colher de açúcar refinado.' },
  crocante: { emoji: '🥨', craving: 'A crocância de um salgadinho', trick: 'Sementes e castanhas tostadas a seco, sem óleo. O barulho da mordida engana o cérebro, que lê “fritura”.' },
  cremoso: { emoji: '🍦', craving: 'Sorvete e creme de leite', trick: 'Banana congelada batida e castanha-de-caju hidratada viram uma cremosidade que desliza como se tivesse nata.' },
  chocolate: { emoji: '🍫', craving: 'Chocolate intenso', trick: 'Cacau puro com fruta doce e um fundo de especiarias: profundo, amargo na medida, e o corpo não pede “só mais um” por culpa.' },
  acidez: { emoji: '🍋', craving: 'O “doce que brilha”', trick: 'Maracujá, limão e tamarindo acendem a língua: a acidez faz a fruta parecer mais doce do que é.' },
  especiarias: { emoji: '✨', craving: 'Doce sem açúcar que parece doce', trick: 'Canela, cardamomo e fava de baunilha têm cheiro de doce. O nariz convence a boca antes da primeira mordida.' },
  textura: { emoji: '🥥', craving: 'A mordida de um bolo de padaria', trick: 'Farinhas de castanha e coco, bem hidratadas, dão aquela massa úmida e macia, sem glúten e sem manteiga.' },
};

const m = (...ids: string[]) => ids.map(id => MAGIC_TRICKS[id]);

export const COURSE_CONTENT: CourseContent[] = [
  {
    slug: 'turismo-gastronomico',
    title: 'Turismo Gastronômico',
    eyebrow: 'Um dia inteiro · Para quem está em Itamambuca',
    tagline: 'Um dia com a Dolly na cozinha tropical, a praia a poucos passos, e sabores que você não acredita que são saudáveis.',
    heroImage: '/assets/surfers_retreat_treats_1789884582282.jpg',
    floating: ['/menu-items/Screenshot_20260412_123155_Edits.jpg', '/menu-items/20260724_154636.jpg', '/retreats/Beach shot Itamambuca.webp'],
    story: [
      'Você veio para Itamambuca pela praia. Leve para casa uma coisa que ninguém mais vai ter: um dia inteiro aprendendo com a Dolly, a chef belga por trás da The Tropical Bakery, a transformar frutas da Mata Atlântica em sobremesas de vitrine, 100% plant-based, sem glúten e sem açúcar refinado.',
      'É mão na massa do começo ao fim, em clima de férias. Você prova, erra, ri, acerta, e sai com as receitas, a técnica e aquela sensação boa de ter aprendido algo que vai usar a vida inteira.',
    ],
    whoFor: ['Turistas e moradores de Itamambuca e Ubatuba', 'Casais, amigos e famílias em busca de uma experiência diferente', 'Quem ama doce e quer comer melhor sem abrir mão do prazer', 'Iniciantes: não precisa saber nada de confeitaria'],
    youLeaveWith: ['As receitas que você preparou, para refazer em casa', 'Os “truques de sabor” da Dolly para enganar a vontade de doce', 'Uma degustação completa das criações da casa', 'Fotos lindas e uma memória de viagem que tem gosto'],
    magicIntro: 'O ponto alto do dia: provar, de olhos fechados, doces que o seu cérebro jura que são “de verdade”. E depois descobrir como foram feitos.',
    magic: m('caramelo', 'cremoso', 'acidez'),
    journey: [
      { title: 'Boas-vindas tropicais', text: 'Chegada, um café da casa e a história da Tropical Bakery, entre frutas e especiarias.' },
      { title: 'A oficina dos sabores', text: 'Você aprende as combinações que imitam caramelo, creme e chocolate, e entende por que funcionam.' },
      { title: 'Mão na massa', text: 'Cada pessoa monta as suas criações, com a Dolly ao lado corrigindo o ponto e o capricho.' },
      { title: 'Degustação e fotos', text: 'A mesa posta, tudo o que foi feito do jeito de vitrine, e a hora de provar tudo com calma.' },
    ],
    paths: ['saude', 'consciencia', 'equipe'],
    retreatText: 'Transforme o dia em férias completas: hospede-se na casa de retiro em Itamambuca, aprenda de manhã e passe a tarde no mar, na cachoeira do Prumirim ou numa trilha até a ilha.',
    familyText: 'Choveu? O Turismo Gastronômico vira programa de família: crianças e adultos na mesma bancada, cada um fazendo o seu doce, e todo mundo pode repetir.',
    faq: [
      { q: 'Preciso saber cozinhar?', a: 'Não. O dia foi pensado para iniciantes. A Dolly acompanha cada passo.' },
      { q: 'Tem alguma restrição alimentar?', a: 'Tudo é 100% plant-based, sem glúten e sem açúcar refinado. Se você tem alergia a castanhas ou outra alergia séria, avise no formulário e a gente adapta.' },
      { q: 'Posso ir com crianças?', a: 'Pode, e é ótimo em dia de chuva. Conte quantas pessoas e as idades no formulário.' },
      { q: 'Dá para combinar com hospedagem?', a: 'Dá. Veja o formato Curso + Retiro abaixo, ou marque essa opção quando falar com a gente.' },
    ],
    enquiry: 'Turismo Gastronômico (1 Dia)',
    cta: 'Reservar meu dia com a Dolly',
    gallery: ['/menu-items/Screenshot_20260412_123155_Edits.jpg', '/menu-items/20260724_154636.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/Screenshot_20260810_135948_Photos.jpg'],
  },
  {
    slug: 'capacitacao-profissional',
    title: 'Capacitação Profissional',
    eyebrow: 'Encontros semanais · Para cozinheiras e cozinheiros',
    tagline: 'A técnica que transforma uma boa cozinheira em uma profissional disputada: comida saudável que a família inteira pede de novo.',
    heroImage: '/assets/chef_training_1789884593538.jpg',
    floating: ['/menu-items/20250823_121752.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/20250907_143728.jpg'],
    story: [
      'Uma formação contínua, semana a semana, para cozinheiras e cozinheiros particulares de Itamambuca e região, muitas vezes com o curso pago pelos próprios empregadores. O objetivo é simples: elevar a comida do dia a dia de uma casa ao nível de um restaurante saudável.',
      'Aqui se aprende o que não cabe numa receita: planejar uma semana inteira de cardápio sem sal, sem óleo e sem açúcar refinado, substituir ingredientes sem perder o sabor, e usar as combinações mágicas da Dolly para que ninguém da casa sinta falta do que foi tirado.',
    ],
    whoFor: ['Cozinheiras e cozinheiros particulares', 'Empregadores que querem investir na sua equipe de casa', 'Quem cozinha para famílias com restrições (glúten, lactose, diabetes, veganismo)', 'Quem quer transformar o talento em profissão ou em um negócio próprio'],
    youLeaveWith: ['Cardápios semanais completos, prontos para aplicar', 'Um repertório de substituições que funcionam de verdade', 'Técnica de confeitaria saudável de nível profissional', 'Uma formação da The Tropical Bakery para mostrar no currículo'],
    magicIntro: 'Na cozinha profissional, os truques de sabor da Dolly viram ferramenta de trabalho: é o que faz a família do seu empregador esquecer que a comida é “saudável”.',
    magic: m('crocante', 'cremoso', 'textura', 'especiarias'),
    journey: [
      { title: 'Base e diagnóstico', text: 'O que a casa onde você trabalha come, o que precisa mudar, e as restrições de cada pessoa.' },
      { title: 'Substituições e técnica', text: 'Semana a semana, as trocas que funcionam: sem glúten, sem óleo, sem açúcar refinado, sem perder a graça.' },
      { title: 'Os truques de sabor', text: 'Crocância sem fritura, cremosidade sem lácteos, doçura sem açúcar: a parte que faz a família pedir bis.' },
      { title: 'Cardápio da semana', text: 'Você monta cardápios completos, com lista de compras e preparo adiantado, para o dia a dia real.' },
    ],
    paths: ['negocio', 'equipe', 'saude'],
    retreatText: 'Vem de outra cidade? Faça a capacitação em formato intensivo, hospedado na casa de retiro em Itamambuca: cozinha de manhã, praia no fim da tarde, e a cabeça descansada para aprender.',
    faq: [
      { q: 'Meu empregador pode pagar?', a: 'Sim, e é o formato mais comum. Na inscrição, diga que é patrocinado e a gente combina com quem vai pagar.' },
      { q: 'Preciso ter experiência?', a: 'Ajuda, mas não é obrigatório. O curso começa pela base e avança no seu ritmo.' },
      { q: 'Isso pode virar trabalho com a Tropical Bakery?', a: 'Pode. Quem se destaca pode ser chamado para eventos, produção ou parcerias. Veja também a página Trabalhe Conosco.' },
    ],
    enquiry: 'Capacitação Profissional para Cozinheiros',
    cta: 'Quero me matricular',
    gallery: ['/menu-items/20250823_121752.jpg', '/menu-items/Screenshot_20260623_080155_Gallery.jpg', '/menu-items/20250907_143728.jpg', '/menu-items/Screenshot_20260415_110305_Gallery.jpg'],
  },
  {
    slug: 'saude-bem-estar',
    title: 'Saúde, Sabores e Bem-Estar',
    eyebrow: 'Para quem quer cuidar do corpo sem abrir mão do prazer',
    tagline: 'Pare de brigar com a vontade de doce. Aprenda a satisfazê-la com comida que cuida de você.',
    heroImage: '/menu-items/20260620_163438.jpg',
    floating: ['/menu-items/Screenshot_20260518_122444_Gallery.jpg', '/menu-items/20250907_143728.jpg', '/menu-items/Screenshot_20260818_075043_Gallery.jpg'],
    story: [
      'Este é o curso para quem já tentou “comer direito” e desistiu porque tudo ficava sem graça. Ou para quem recebeu um diagnóstico, precisa mudar a alimentação da casa e não sabe por onde começar.',
      'A Dolly ensina a lógica por trás de cada ingrediente: por que a gente sente vontade do que sente, e como montar sobremesas e pratos que entregam exatamente aquela sensação, com ingredientes integrais, plant-based, sem glúten e sem açúcar refinado. Não é dieta. É aprender a comer bem e gostar muito.',
    ],
    whoFor: ['Quem quer reduzir açúcar, glúten, lactose ou ultraprocessados', 'Quem cuida da alimentação da família', 'Pessoas em transição para o veganismo ou com orientação médica para mudar a dieta', 'Quem ama doce e quer continuar amando, com saúde'],
    youLeaveWith: ['Receitas que matam a vontade de doce sem culpa', 'O entendimento de por que certos alimentos viciam, e como substituí-los', 'Um cardápio que a família inteira aceita (inclusive as crianças)', 'Mais energia, mais consciência e menos briga com a comida'],
    magicIntro: 'O coração deste curso. A vontade de doce não é fraqueza: é o corpo procurando uma sensação. A Dolly ensina a entregar essa sensação por outro caminho.',
    magic: m('caramelo', 'chocolate', 'cremoso', 'crocante', 'especiarias', 'acidez'),
    journey: [
      { title: 'Entender a vontade', text: 'O que o açúcar, o sal e a gordura fazem com o paladar, e por que a gente sempre quer mais.' },
      { title: 'Os ingredientes certos', text: 'Integrais, plant-based e sem glúten: o que usar, onde comprar em Ubatuba e como guardar.' },
      { title: 'A mágica dos sabores', text: 'As combinações que imitam caramelo, chocolate, creme e crocância, na prática.' },
      { title: 'Para a vida real', text: 'Um plano simples para a sua casa, e receitas que cabem na rotina.' },
    ],
    paths: ['saude', 'consciencia', 'negocio'],
    retreatText: 'Faça do curso um retiro de bem-estar: hospedagem na casa em Itamambuca, cozinha de manhã, e tardes de mar, rio e natureza para o corpo acompanhar o que a cabeça está aprendendo.',
    familyText: 'Em dia de chuva, a versão em família é perfeita: pais e filhos aprendem juntos que doce saudável pode ser o preferido da casa.',
    faq: [
      { q: 'É uma dieta?', a: 'Não. É aprender a cozinhar e a comer de um jeito que dá prazer e faz bem, sem contar calorias.' },
      { q: 'Tenho diabetes / intolerância / alergia. Posso fazer?', a: 'Pode, e é para você. Conte no formulário e a Dolly adapta. O curso não substitui a orientação do seu médico ou nutricionista.' },
      { q: 'Minha família não gosta de comida saudável.', a: 'É justamente o que o curso resolve: receitas que ninguém percebe que são saudáveis.' },
      { q: 'Posso fazer junto com um retiro?', a: 'Pode. Veja o formato Curso + Retiro abaixo.' },
    ],
    enquiry: 'Curso de Saúde e Bem-Estar',
    cta: 'Começar minha jornada',
    gallery: ['/menu-items/20260620_163438.jpg', '/menu-items/Screenshot_20260518_122444_Gallery.jpg', '/menu-items/20250907_143728.jpg', '/menu-items/Screenshot_20260818_075043_Gallery.jpg'],
  },
];

export const courseBySlug = (slug: string) => COURSE_CONTENT.find(c => c.slug === slug);

export const PATHS: Record<PathId, { emoji: string; title: string; text: string; link?: { href: string; label: string } }> = {
  saude: { emoji: '🌿', title: 'Mais saúde, sem sacrifício', text: 'Comer o que você deseja, feito de ingredientes que cuidam de você. Menos açúcar, mais energia, e nenhuma sensação de dieta.' },
  negocio: { emoji: '🚀', title: 'O seu próprio negócio', text: 'Doces saudáveis são um dos mercados que mais crescem. Você sai com técnica, receitas testadas e a confiança para vender as suas criações.' },
  consciencia: { emoji: '🧠', title: 'Consciência no prato', text: 'Entender o que você come, ler um rótulo, saber por que o corpo pede o que pede. Uma mudança que fica para a vida toda.' },
  equipe: { emoji: '🤝', title: 'Trabalhar com a Tropical Bakery', text: 'Quem se destaca pode ser convidado para eventos, produção e parcerias. Talvez o próximo capítulo esteja aqui.', link: { href: '/trabalhe-conosco', label: 'Ver Trabalhe Conosco' } },
};

/** Beach-side photos for the "Curso + Retiro" section. */
export const RETREAT_PHOTOS = ['/retreats/Beach shot Itamambuca.webp', '/retreats/Prumirim waterfall.webp', '/retreats/Terrace with table and chairs.webp', '/retreats/Evening shot Itamabuca beach.webp'];
