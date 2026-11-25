/**
 * The free-recipes e-mail sequence (lib/funnel.ts SEQUENCE), one campaign per step. Sent only by the automation
 * 'receitas-sequencia' to the people whose sign-up is that many days old (groupOnly: never to the whole list), in
 * English or Portuguese (Spanish and Dutch sign-ups read the English one). Each step reaches a person once:
 * the messageKey has no date in it.
 *
 * Values every step gets: lang ('en' | 'pt'). The selling steps also get `offer` (a signed welcome-price token) and
 * `until` (when it runs out, already written out in that language).
 */

import { SITE_URL, bulletList, kicker, paragraphs } from './layout';
import type { Campaign, CampaignValues } from './campaigns';
import { EBOOK, BOOK_OFFERS, TOTAL_TREATS } from '@/lib/ebook';
import { EBOOK_COPY, LANG_PATH } from '@/lib/ebookCopy';
import { FUNNEL, freePdf } from '@/lib/funnel';
import { BONUS_CALL_COPY } from '@/lib/bonusCall';

const isPt = (v: CampaignValues) => v.lang === 'pt';
const lang = (v: CampaignValues) => (isPt(v) ? 'pt' : 'en') as 'pt' | 'en';
/** The free call with Dolly that comes with the book, when the automation says it is on (v.call = '1'). */
const callLine = (v: CampaignValues) => (v.call === '1' ? paragraphs(BONUS_CALL_COPY[lang(v)].line) : '');
const track = (path: string, step: string) => `${SITE_URL}${path}${path.includes('?') ? '&' : '?'}utm_source=email&utm_medium=funil&utm_campaign=${step}`;

const full = (v: CampaignValues) => (isPt(v) ? `R$ ${BOOK_OFFERS.full.brl}` : `US$ ${BOOK_OFFERS.full.usd}`);
const welcome = (v: CampaignValues) => (isPt(v) ? `R$ ${BOOK_OFFERS.welcome.brl}` : `US$ ${BOOK_OFFERS.welcome.usd}`);
const bookPage = (v: CampaignValues, step: string) => track(LANG_PATH[lang(v)], step);
const offerLink = (v: CampaignValues, step: string) =>
  track(`${FUNNEL.offerPath}?t=${encodeURIComponent(v.offer || '')}&lang=${lang(v)}`, step);

/** The five recipes the free PDF does not have, in the reader's language, each with what wins a kid over. */
const missing = (v: CampaignValues) =>
  EBOOK_COPY[lang(v)].recipes.filter((_, i) => i !== 2 && i !== 5).map(r => `${r.name}. ${r.kidAngle}`);

const base = {
  theme: 'novidades' as const,
  topic: 'receitas',
  groupOnly: true,
  lang,
  reason: 'Você recebe este e-mail porque baixou as receitas grátis da Dolly.',
  reasonEn: 'You get this e-mail because you downloaded Dolly’s free recipes.',
  fields: [
    { name: 'lang', label: 'Idioma (en ou pt)', type: 'text' as const, required: true },
    { name: 'offer', label: 'Link do preço de boas-vindas (preenchido pela automação)', type: 'text' as const },
    { name: 'until', label: 'Até quando vale (preenchido pela automação)', type: 'text' as const },
  ],
};

const STEPS: Campaign[] = [
  {
    ...base,
    id: 'receitas-d1',
    name: 'Receitas grátis · dia 1: dicas para fazer',
    emoji: '🍓',
    description: 'Um dia depois das receitas: três dicas para acertar de primeira, e o link do PDF de novo.',
    subject: v => (isPt(v) ? '3 truques para as suas Bliss Balls darem certo de primeira' : '3 tricks so your Bliss Balls work the first time'),
    messageKey: () => 'receitas-d1',
    build: v => isPt(v)
      ? {
          preheader: 'Tâmara macia, mãos molhadas e faca quente. Simples assim.',
          heading: 'Bora para a cozinha?',
          body:
            paragraphs('Ontem você recebeu as minhas duas receitas. Se ainda não fez nenhuma, comece pelas Bliss Balls: não vão ao forno, levam 20 minutos e as crianças adoram enrolar.') +
            kicker('Três truques da minha cozinha', '💡') +
            bulletList([
              'Tâmara macia é o segredo. Se estiverem secas, deixe 10 minutos em água morna e escorra bem.',
              'Molhe as mãos para enrolar as bolinhas: a massa não gruda e elas ficam lisinhas.',
              'Nas Barrinhas Banoffee, corte com uma faca quente (passe na água fervendo e seque). As camadas ficam perfeitas.',
            ]) +
            paragraphs('Sem framboesa liofilizada? Passe as bolinhas no coco ralado ou em castanhas picadas. Fica lindo também.\n\nFez? Me marca no Instagram, @_thetropicalbakery_. Eu vejo todas!\n\nUm aviso: criança se apaixona rápido por um doce novo, e enjoa dele na mesma velocidade. Daqui a dois dias eu te conto o que fazer com isso.'),
          cta: { label: 'Abrir minhas receitas', href: `${SITE_URL}${freePdf('pt')}` },
          note: 'Com carinho, Dolly',
        }
      : {
          preheader: 'Soft dates, wet hands and a hot knife. That’s it.',
          heading: 'Ready to bake?',
          body:
            paragraphs('Yesterday you got my two recipes. If you haven’t made one yet, start with the Bliss Balls: no oven, 20 minutes, and kids love rolling them.') +
            kicker('Three tricks from my kitchen', '💡') +
            bulletList([
              'Soft dates are the secret. If yours are dry, soak them in warm water for 10 minutes and drain well.',
              'Wet your hands to roll the balls: the dough won’t stick and they come out smooth.',
              'For the Banoffee Bars, cut with a hot knife (dip it in boiling water, wipe dry). Perfect layers every time.',
            ]) +
            paragraphs('No freeze-dried raspberry? Roll the balls in shredded coconut or chopped nuts. Just as pretty.\n\nMade them? Tag me on Instagram, @_thetropicalbakery_. I look at every single one!\n\nOne heads-up: kids fall for a new treat fast, and get bored of it just as fast. In two days I’ll tell you what to do about that.'),
          cta: { label: 'Open my recipes', href: `${SITE_URL}${freePdf('en')}` },
          note: 'With love, Dolly',
        },
  },

  {
    ...base,
    id: 'receitas-d3',
    name: 'Receitas grátis · dia 3: criança enjoa rápido',
    emoji: '🙄',
    description: 'Vende o livro pela dor real: duas receitas enjoam rápido, e cada criança tem um favorito diferente. Mostra as outras 5 pelo olhar da criança, preço normal e garantia.',
    subject: v => (isPt(v) ? 'E quando enjoarem das Bliss Balls?' : 'What happens when they’re bored of the Bliss Balls?'),
    messageKey: () => 'receitas-d3',
    build: v => isPt(v)
      ? {
          preheader: 'Duas receitas duram uma semana. Depois vem o “de novo isso?”.',
          heading: 'Criança enjoa. Rápido.',
          body:
            paragraphs('Você conhece essa história. A primeira fornada é um sucesso. A segunda passa. Na terceira vem a cara de “de novo isso?”.\n\nE tem mais: ninguém garante que o favorito da criançada aí de casa está entre os dois doces que eu te mandei. Cada criança é de um jeito. Uma é louca por chocolate, outra só quer o que dá para pegar com a mão, outra só aceita o que parece sorvete.\n\nPor isso o Sweet Escape tem 7. Sete sabores, formatos e texturas diferentes, para você achar aquele que eles pedem de novo.') +
            kicker('Mais 5 chances de achar o favorito', '🎯') +
            bulletList(missing(v)) +
            paragraphs(`E como o livro explica o porquê de cada ingrediente, você adapta qualquer um ao que eles estiverem curtindo na semana.\n\nO livro completo custa ${full(v)}, em PDF na hora. Se ninguém aí em casa achar um favorito, eu devolvo o seu dinheiro (garantia de 7 dias).`) + callLine(v),
          cta: { label: 'Achar o favorito deles', href: bookPage(v, 'receitas-d3') },
          note: 'Com carinho, Dolly',
        }
      : {
          preheader: 'Two recipes last about a week. Then comes “this again?”',
          heading: 'Kids get bored. Fast.',
          body:
            paragraphs('You know how this goes. The first batch is a hit. The second one is fine. By the third you get the face: “this again?”\n\nAnd here’s the other thing: nobody can promise your kid’s favorite is one of the two treats I sent you. Every kid is different. One lives for chocolate, one only eats what they can hold, one wants anything that looks like ice cream.\n\nThat’s why Sweet Escape has 7. Seven different flavors, shapes and textures, so you keep going until you find the one they ask for again.') +
            kicker('5 more chances to find their favorite', '🎯') +
            bulletList(missing(v)) +
            paragraphs(`And because the book explains the why behind every ingredient, you can twist any of them into whatever they’re into this week.\n\nThe full book is ${full(v)}, an instant PDF. If nobody at home finds a favorite, I give your money back (7-day promise).`) + callLine(v),
          cta: { label: 'Find their favorite', href: bookPage(v, 'receitas-d3') },
          note: 'With love, Dolly',
        },
  },

  {
    ...base,
    id: 'receitas-d5',
    name: 'Receitas grátis · dia 5: preço de boas-vindas',
    emoji: '🎁',
    description: 'O downsell: as 7 receitas pelo preço de boas-vindas antes de bater o tédio, com link assinado que vence em 2 dias.',
    subject: v => (isPt(v) ? `Antes de bater o tédio: as 7 receitas por ${welcome(v)}` : `Before the boredom hits: all 7 recipes for ${welcome(v)}`),
    messageKey: () => 'receitas-d5',
    build: v => isPt(v)
      ? {
          preheader: `Só para quem baixou as receitas, até ${v.until}.`,
          heading: `As 7 receitas por ${welcome(v)}`,
          body:
            paragraphs(`A essa altura, as Bliss Balls e as Barrinhas Banoffee já tiveram o seu momento. Não espere a cara de “de novo isso?”.\n\nFiz um preço de boas-vindas só para quem baixou as receitas: ${welcome(v)} em vez de ${full(v)}. Vale até ${v.until}. Depois volta ao preço normal.`) +
            bulletList([
              '5 doces novos, 5 novas chances de achar o favorito deles',
              'Muffins, sanduíche de sorvete, tartarugas de chocolate, cheesecake roxo e quadradinhos de abacaxi',
              'O porquê de cada ingrediente, para você inventar variações',
              `${EBOOK.pages} páginas em PDF, na hora`,
              'Garantia de 7 dias: ninguém gostou, eu devolvo',
            ]) + callLine(v),
          cta: { label: `Quero as 7 por ${welcome(v)}`, href: offerLink(v, 'receitas-d5') },
          note: `Preço de boas-vindas válido até ${v.until}.`,
        }
      : {
          preheader: `Only for people who got the free recipes, until ${v.until}.`,
          heading: `All 7 recipes for ${welcome(v)}`,
          body:
            paragraphs(`By now the Bliss Balls and the Banoffee Bars have had their moment. Don’t wait for the “this again?” face.\n\nHere’s a welcome price, only for people who downloaded the free recipes: ${welcome(v)} instead of ${full(v)}. It’s good until ${v.until}. Then it goes back to normal.`) +
            bulletList([
              '5 new treats, 5 new chances to find their favorite',
              'Muffins, ice cream sandwiches, chocolate turtles, a purple cheesecake and pineapple squares',
              'The why behind every ingredient, so you can make your own versions',
              `${EBOOK.pages} pages, instant PDF`,
              '7-day promise: if nobody loves it, I give your money back',
            ]) + callLine(v),
          cta: { label: `Get all 7 for ${welcome(v)}`, href: offerLink(v, 'receitas-d5') },
          note: `Welcome price good until ${v.until}.`,
        },
  },

  {
    ...base,
    id: 'receitas-d7',
    name: 'Receitas grátis · dia 7: último dia',
    emoji: '⏳',
    description: 'Último lembrete do preço de boas-vindas, que termina hoje: duas receitas não seguram um mês de lanche.',
    subject: v => (isPt(v) ? `Último dia: as 7 receitas por ${welcome(v)}` : `Last day: all 7 recipes for ${welcome(v)}`),
    messageKey: () => 'receitas-d7',
    build: v => isPt(v)
      ? {
          preheader: 'Duas receitas não seguram um mês de lanche.',
          heading: 'Último dia',
          body: paragraphs(`Rapidinho: o preço de boas-vindas do Sweet Escape (${welcome(v)} em vez de ${full(v)}) termina ${v.until}.\n\nDuas receitas não seguram um mês de lanche. E você só descobre qual vai ser o favorito deles quando eles provam. Com sete, a chance é de verdade.\n\nE se ninguém aí em casa gostar, a garantia de 7 dias continua valendo.`) + callLine(v),
          cta: { label: `Quero as 7 por ${welcome(v)}`, href: offerLink(v, 'receitas-d7') },
          note: 'Com carinho, Dolly',
        }
      : {
          preheader: 'Two recipes won’t get you through a month of snack time.',
          heading: 'Last day',
          body: paragraphs(`Quick one: the welcome price for Sweet Escape (${welcome(v)} instead of ${full(v)}) ends ${v.until}.\n\nTwo recipes won’t get you through a month of snack time. And you only find out which one becomes their favorite once they taste it. Seven gives you a real shot.\n\nAnd if nobody at home loves any of them, the 7-day promise still stands.`) + callLine(v),
          cta: { label: `Get all 7 for ${welcome(v)}`, href: offerLink(v, 'receitas-d7') },
          note: 'With love, Dolly',
        },
  },

  {
    ...base,
    id: 'receitas-local',
    name: 'Receitas grátis · dia 9: venha cozinhar comigo (região)',
    emoji: '🌴',
    description: 'Só para quem mora ou está em Ubatuba / Paraty: a aula de doces, o Menu de Eventos e o coaching.',
    subject: v => (isPt(v) ? 'Você está pertinho: vem cozinhar comigo?' : 'You’re close by: come and cook with me?'),
    messageKey: () => 'receitas-local',
    build: v => isPt(v)
      ? {
          preheader: 'Uma tarde de doces na minha cozinha em Itamambuca, doces para a sua festa e uma conversa grátis.',
          heading: 'Venha cozinhar comigo',
          body:
            paragraphs('Você me contou que está por aqui, em Ubatuba ou Paraty. Então, além das receitas, tem mais jeitos de a gente se ver:') +
            bulletList([
              'Aula de doces na minha cozinha em Itamambuca: todo dia às 14h, três horas. Você faz, prova e leva as receitas.',
              'Menu de Eventos: bliss balls e barrinhas por bandeja para a sua festa (thetropicalbakery.com/menu).',
              'Coaching de alimentação: uma conversa grátis de 30 minutos, online (thetropicalbakery.com/coaching).',
            ]),
          cta: { label: 'Marcar minha aula', href: track('/cursos', 'receitas-local') },
          note: 'Prefere conversar? Responda pelo WhatsApp que aparece no site.',
        }
      : {
          preheader: 'An afternoon of treats in my kitchen in Itamambuca, treats for your party and a free call.',
          heading: 'Come and cook with me',
          body:
            paragraphs('You told me you’re around Ubatuba or Paraty. So besides the recipes, there are more ways to meet:') +
            bulletList([
              'A treats class in my kitchen in Itamambuca: every day at 2 pm, three hours. You make, taste and take the recipes home.',
              'Events Menu: bliss balls and bars by the tray for your party (thetropicalbakery.com/menu).',
              'Food coaching: a free 30-minute call, online (thetropicalbakery.com/coaching/en).',
            ]),
          cta: { label: 'Book my class', href: track('/cursos', 'receitas-local') },
          note: 'With love, Dolly',
        },
  },

  {
    ...base,
    id: 'receitas-visita',
    name: 'Receitas grátis · dia 9: quando vier a Ubatuba',
    emoji: '🏝️',
    description: 'Para quem está longe de Ubatuba: a aula quando vier, o retiro e o coaching online.',
    subject: v => (isPt(v) ? 'Quando vier a Ubatuba, venha cozinhar comigo' : 'When you come to Brazil, come and cook with me'),
    messageKey: () => 'receitas-visita',
    build: v => isPt(v)
      ? {
          preheader: 'Uma tarde na minha cozinha em Itamambuca, um retiro na praia ou uma conversa online.',
          heading: 'Venha me conhecer',
          body:
            paragraphs('Essas receitas nasceram na minha cozinha em Itamambuca, pertinho da praia, em Ubatuba. Se um dia você vier para cá, ou quiser seguir comigo de onde estiver, tem três jeitos:') +
            bulletList([
              'Aula de doces: uma tarde na minha cozinha, todo dia às 14h. Você faz, prova e leva as receitas.',
              'Retiro: dias de praia, cachoeira e comida de verdade com a gente (thetropicalbakery.com/retreats).',
              'Coaching de alimentação: uma conversa grátis de 30 minutos, online, de onde você estiver (thetropicalbakery.com/coaching).',
            ]),
          cta: { label: 'Ver as aulas', href: track('/cursos', 'receitas-visita') },
          note: 'Um beijo, Dolly',
        }
      : {
          preheader: 'An afternoon in my kitchen in Itamambuca, a beach retreat or a call online.',
          heading: 'Come and meet me',
          body:
            paragraphs('These recipes were born in my kitchen in Itamambuca, a few steps from the beach in Ubatuba, Brazil. If you ever come here, or want to keep going with me from wherever you are, there are three ways:') +
            bulletList([
              'A treats class: an afternoon in my kitchen, every day at 2 pm. You make, taste and take the recipes home.',
              'A retreat: days of beach, waterfalls and real food with us (thetropicalbakery.com/retreats).',
              'Food coaching: a free 30-minute call, online, from wherever you are (thetropicalbakery.com/coaching/en).',
            ]),
          cta: { label: 'See the classes', href: track('/cursos', 'receitas-visita') },
          note: 'With love, Dolly',
        },
  },
];

/** Every step wears the book's look (the page they signed up on), not the bakery's tropical banner. */
export const FUNNEL_CAMPAIGNS: Campaign[] = STEPS.map(c => ({
  ...c,
  build: v => ({
    ...c.build(v),
    look: {
      hero: `se-hero-${lang(v)}.jpg`, heroHeight: 420, accent: '#ff4f0a',
      heroAlt: isPt(v) ? 'Sweet Escape: 2 receitas grátis de 7' : 'Sweet Escape: 2 free recipes out of 7',
      kicker: isPt(v) ? 'Sweet Escape · da cozinha da Dolly' : 'Sweet Escape · from Dolly’s kitchen',
    },
  }),
}));
