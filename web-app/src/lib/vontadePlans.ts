import 'server-only';
import type { Craving } from '@/lib/vontade';

/**
 * The Tropical+ half of every craving in "Bateu Vontade?": the plan week by week, the traps and what to do in each,
 * and the one G-BOMBS habit that helps most. Server-only on purpose: /api/vontade/plan sends it in full only to
 * Tropical+ members, and to everyone else just the outline (every phase's title) and the first phase in full, so the
 * free part shows the whole shape of the plan without giving it away.
 *
 * Honest by rule: say how long it really takes, never promise a cure, and point to a doctor where medication is involved.
 */
interface FullPlan {
  phases: { when: string; title: string; text: string }[];
  traps: { trap: string; move: string }[];
  daily: string;
  careful?: string;
}

const MEDS_SALT = 'Se você toma remédio para pressão, avise seu médico antes de cortar o sal: a dose pode precisar de ajuste.';
const MEDS_SUGAR = 'Se você tem diabetes, converse com seu médico antes de mudar muito o açúcar ou o carboidrato: os remédios podem precisar de ajuste.';

export const PLANS: Record<Craving, FullPlan> = {
  chocolate: {
    phases: [
      { when: 'Dias 1 a 3', title: 'Tire de vista', text: 'Nada de chocolate em casa, na bolsa ou na gaveta do trabalho. Deixe tâmara e cacau puro no lugar. Toda vontade: brigadeiro de tâmara ou sorvete de banana com cacau.' },
      { when: 'Semanas 1 e 2', title: 'Fruta antes da vontade', text: 'Coma uma fruta com frutas vermelhas no meio da tarde, antes da hora em que a vontade costuma chegar. O doce que vem antes desarma o que viria depois.' },
      { when: 'Semanas 3 e 4', title: 'Menos tâmara', text: 'A fruta começa a parecer mais doce. Corte pela metade as tâmaras das receitas e deixe o cacau e a banana fazerem o trabalho.' },
    ],
    traps: [
      { trap: 'TPM', move: 'A vontade de chocolate costuma crescer nesses dias. Planeje: 4 brigadeiros de tâmara prontos na geladeira, e não brigue com ela.' },
      { trap: 'Depois do almoço', move: 'Quase sempre é hábito, não fome. Escove os dentes ou tome um chá de canela logo depois de comer.' },
      { trap: 'Estresse', move: 'Banana amassada com cacau puro acalma. Respire fundo 5 vezes antes de decidir.' },
    ],
    daily: 'Frutas vermelhas e sementes todo dia (o B e o S do G-BOMBS): doce de verdade, com nutriente junto.',
    careful: MEDS_SUGAR,
  },
  cremoso: {
    phases: [
      { when: 'Dias 1 a 3', title: 'Jante de verdade', text: 'Vontade de doce cremoso à noite costuma ser jantar fraco. Coloque feijão e verdura no jantar e veja a diferença já nos primeiros dias.' },
      { when: 'Semanas 1 e 2', title: 'Pote pronto', text: 'No domingo, faça 3 potes de pudim de chia com cacau. Quando a vontade bater, o cremoso já está esperando.' },
      { when: 'Semanas 3 e 4', title: 'O conforto fica, o açúcar sai', text: 'Se o doce é o momento de relaxar, mantenha o momento: chá quente, sofá, um potinho pequeno. O ritual continua, só muda o que vai na colher.' },
    ],
    traps: [
      { trap: 'Cansaço à noite', move: 'Cansaço pede açúcar rápido. Durma 30 minutos mais cedo por uma semana e conte as vontades no app.' },
      { trap: 'Festa e aniversário', move: 'Coma antes de ir e leve um doce seu para dividir. Ninguém fica de mão vazia.' },
      { trap: 'Pular refeição', move: 'Fome acumulada vira vontade de doce às 16h. No almoço, coma até matar a fome, com feijão.' },
    ],
    daily: 'Feijão no almoço e no jantar (o B do G-BOMBS): é o que mais segura a fome do fim do dia.',
    careful: MEDS_SUGAR,
  },
  fresquinho: {
    phases: [
      { when: 'Hoje', title: 'Estoque de gelado', text: 'Descasque e congele bananas maduras e cubos de manga. Com o estoque pronto, a vontade se resolve em 3 minutos.' },
      { when: 'Semana 1', title: 'Gelado com azedinho', text: 'Use limão, maracujá e hortelã: o azedo faz a fruta parecer mais doce e mais refrescante.' },
      { when: 'Daí em diante', title: 'Fruta da época', text: 'Fruta da estação é mais doce e mais barata. Caqui, manga, abacaxi, jabuticaba: cada época tem o seu sorvete.' },
    ],
    traps: [
      { trap: 'Calor', move: 'Água gelada com limão antes de tudo: muitas vezes é sede.' },
      { trap: 'Sorveteria com os amigos', move: 'Peça açaí puro, sem xarope, ou vá só pela companhia. Em casa você tem o seu.' },
      { trap: 'Freezer vazio', move: 'Lembrete no domingo: banana e manga para congelar.' },
    ],
    daily: 'Frutas vermelhas congeladas sempre no freezer (o B de berries): sorvete, geleia e lanche prontos.',
  },
  crocante: {
    phases: [
      { when: 'Semana 1', title: 'Porção pronta', text: 'Separe porções de 30 g de castanhas e sementes em potinhos. Crocância com medida.' },
      { when: 'Semana 2', title: 'Crocante que não é castanha', text: 'Maçã gelada, pepino, cenoura, salsão: morder alto também resolve, com muito menos caloria.' },
      { when: 'Semana 3 em diante', title: 'Olhe para a tensão', text: 'Se a vontade de morder vem nos dias tensos, é a tensão pedindo. Caminhe 5 minutos ou mastigue cenoura gelada.' },
    ],
    traps: [
      { trap: 'TV e celular', move: 'Nunca coma do pacote. Sirva no potinho e guarde o resto antes de sentar.' },
      { trap: 'Biscoito com o café', move: 'Rodelas de maçã com pasta de amendoim: o ritual continua.' },
      { trap: 'Ansiedade', move: 'Morder alivia. Deixe palitos de cenoura e pepino gelados na porta da geladeira.' },
    ],
    daily: 'Sementes todo dia (o S do G-BOMBS), na medida: uma colher de chia ou linhaça e um punhado de castanhas.',
  },
  salgadinho: {
    phases: [
      { when: 'Semana 1', title: 'Primeiro, o sal escondido', text: 'Pão, caldo em cubo, shoyu, salgadinho e embutidos têm mais sal que o saleiro. Tire esses antes de mexer no sal da panela.' },
      { when: 'Semanas 2 e 3', title: 'Acidez no lugar do sal', text: 'Limão em tudo: feijão, salada, legumes, arroz. Vinagre de maçã e cupuaçu também acendem o sabor. Alho, cebola, ervas e pimenta fazem o resto.' },
      { when: 'Semanas 4 a 8', title: 'O paladar vira', text: 'É aqui que acontece: a comida sem sal começa a ter gosto, e a de fora parece salgada demais. Não volte "só para testar": cada volta atrasa o ajuste.' },
    ],
    traps: [
      { trap: 'Restaurante', move: 'Peça sem sal e leve limão. Prefira grelhados e saladas; é nos molhos que mora o sal.' },
      { trap: 'Família cozinhando com sal', move: 'Separe a sua porção antes de o sal entrar na panela.' },
      { trap: 'Petisco à noite', move: 'Grão-de-bico crocante pronto num pote, ou pepino com limão. Crocante e azedo resolvem.' },
    ],
    daily: 'Cebola e alho todo dia (o O do G-BOMBS): eles dão sabor de verdade e o sal faz menos falta.',
    careful: MEDS_SALT,
  },
  umami: {
    phases: [
      { when: 'Semana 1', title: 'Cogumelo em tudo', text: 'Cogumelo tostado no feijão, no arroz, na salada. Frigideira seca bem quente é o segredo do dourado.' },
      { when: 'Semana 2', title: 'Caldo de verdade', text: 'Faça o caldo de cogumelo, tomate e cebola e congele em forminhas de gelo. Ele substitui o caldo em cubo.' },
      { when: 'Semana 3 em diante', title: 'Seu armário umami', text: 'Tomate seco sem sal, cebola dourada na água, levedura nutricional, cogumelo seco: monte o seu armário de sabor.' },
    ],
    traps: [
      { trap: 'Saudade de carne', move: 'Cogumelo grelhado com alho e pimenta dentro de uma folha de alface ou sobre batata-doce: textura e sabor parecidos.' },
      { trap: 'Shoyu', move: 'Troque por limão, alho, gengibre e um pouco da água de hidratar cogumelo seco.' },
      { trap: 'Fast-food', move: 'Batata-doce recheada com feijão e cogumelo: o mesmo conforto, em 10 minutos.' },
    ],
    daily: 'Cogumelos todo dia (o M do G-BOMBS): umami puro e um dos pilares do prato denso.',
    careful: MEDS_SALT,
  },
  queijo: {
    phases: [
      { when: 'Semana 1', title: 'Tire de casa', text: 'Queijo na geladeira vence qualquer plano. Comece tirando, e deixe no lugar o queijinho de caju pronto.' },
      { when: 'Semanas 2 e 3', title: 'Não procure o mesmo gosto', text: 'Levedura nutricional na pipoca, no feijão e na salada. O queijinho de caju é outra coisa, gostosa do jeito dela.' },
      { when: 'Semanas 4 a 6', title: 'A vontade diminui', text: 'Depois de algumas semanas totalmente sem, a maioria das pessoas sente bem menos falta. Um pedaço "só para provar" recomeça a contagem.' },
    ],
    traps: [
      { trap: 'Pizza no fim de semana', move: 'Faça a sua: base de batata-doce, molho de tomate, cogumelo e o molho de queijo de batata.' },
      { trap: 'Pão de queijo', move: 'Batata-doce assada com levedura e orégano: quente, macia e com gosto de queijo.' },
      { trap: 'Comer fora', move: 'Peça sem queijo já no pedido; tirar depois não adianta.' },
    ],
    daily: 'Feijões todo dia (o B do G-BOMBS): saciam como o queijo saciava.',
    careful: MEDS_SALT,
  },
  frito: {
    phases: [
      { when: 'Semana 1', title: 'Forno no lugar da fritura', text: 'Toda batata e todo empanado vão para o forno ou para a air fryer, sem óleo. O papel-manteiga evita grudar.' },
      { when: 'Semanas 2 a 4', title: 'Gordura com fibra', text: 'Abacate, castanha e semente entram no prato. A vontade de gordura diminui quando a gordura de verdade está presente.' },
      { when: 'Semanas 5 a 12', title: 'O paladar muda', text: 'Aos poucos a fritura começa a pesar e a parecer gordurosa demais. É o sinal de que deu certo.' },
    ],
    traps: [
      { trap: 'Cheiro de fritura na rua', move: 'Leve grão-de-bico crocante na bolsa.' },
      { trap: 'Fim de semana e festa', move: 'Coma uma batata-doce de forno com guacamole antes de sair.' },
      { trap: 'Cansaço', move: 'Fritura é comida de cansaço. Deixe batata-doce assada pronta na geladeira, é só esquentar.' },
    ],
    daily: 'Folhas verdes no almoço e no jantar (o G do G-BOMBS): volume e nutriente, a base do prato denso.',
  },
  refri: {
    phases: [
      { when: 'Dias 1 a 7', title: 'Gás sem açúcar', text: 'Troque o refri por água com gás gelada e limão. Se for de cola ou guaraná, diminua aos poucos: meio copo a menos por dia ajuda com a dor de cabeça da cafeína.' },
      { when: 'Semana 2', title: 'A sua soda', text: 'Soda de maracujá e chá gelado de hibisco prontos na geladeira, numa garrafa bonita: o ritual conta.' },
      { when: 'Semana 3 em diante', title: 'A fruta basta', text: 'O refri passa a parecer doce demais. Água com gás e limão vira o seu refrigerante.' },
    ],
    traps: [
      { trap: 'Almoço', move: 'Jarra de água com gás e limão na mesa antes de sentar.' },
      { trap: 'Sono da tarde', move: 'É a cafeína pedindo. Caminhe 5 minutos e beba água gelada.' },
      { trap: 'Lanchonete', move: 'Peça água com gás e limão. Ninguém repara.' },
    ],
    daily: 'Frutas vermelhas na água ou no chá (o B de berries): cor, sabor e nutriente.',
    careful: MEDS_SUGAR,
  },
  paoemassa: {
    phases: [
      { when: 'Semana 1', title: 'Café da manhã primeiro', text: 'Troque o pão branco da manhã por aveia com fruta ou batata-doce. É a refeição que decide o resto do dia.' },
      { when: 'Semana 2', title: 'Inteiro no lugar do branco', text: 'Arroz integral, batata-doce, mandioca, macarrão de feijão ou de arroz integral. O carboidrato fica, a fibra volta.' },
      { when: 'Semana 3 em diante', title: 'Feijão em toda refeição', text: 'Feijão e grão-de-bico espaçam a fome. Com eles, a vontade de pão no meio da tarde quase some.' },
    ],
    traps: [
      { trap: 'Padaria', move: 'Não passe na frente com fome. Leve uma banana.' },
      { trap: 'Macarronada de domingo', move: 'Faça, mas com metade de massa e metade de legumes e cogumelos.' },
      { trap: 'Pão à noite', move: 'Batata-doce recheada ou panqueca de aveia: o mesmo conforto, e a fome espaça.' },
    ],
    daily: 'Feijões todo dia (o B do G-BOMBS): o carboidrato que mais sacia.',
    careful: MEDS_SUGAR,
  },
};
