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

const isPt = (v: CampaignValues) => v.lang === 'pt';
const lang = (v: CampaignValues) => (isPt(v) ? 'pt' : 'en') as 'pt' | 'en';
const track = (path: string, step: string) => `${SITE_URL}${path}${path.includes('?') ? '&' : '?'}utm_source=email&utm_medium=funil&utm_campaign=${step}`;

const full = (v: CampaignValues) => (isPt(v) ? `R$ ${BOOK_OFFERS.full.brl}` : `US$ ${BOOK_OFFERS.full.usd}`);
const welcome = (v: CampaignValues) => (isPt(v) ? `R$ ${BOOK_OFFERS.welcome.brl}` : `US$ ${BOOK_OFFERS.welcome.usd}`);
const bookPage = (v: CampaignValues, step: string) => track(LANG_PATH[lang(v)], step);
const offerLink = (v: CampaignValues, step: string) =>
  track(`${FUNNEL.offerPath}?t=${encodeURIComponent(v.offer || '')}&lang=${lang(v)}`, step);

/** The five recipes the free PDF does not have (days 1, 2, 4, 5, 7), in the reader's language. */
const missing = (v: CampaignValues) =>
  EBOOK_COPY[lang(v)].recipes.filter((_, i) => i !== 2 && i !== 5).map(r => `${r.color}: ${r.name}`);

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

export const FUNNEL_CAMPAIGNS: Campaign[] = [
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
            kicker('Três truques da minha cozinha') +
            bulletList([
              'Tâmara macia é o segredo. Se estiverem secas, deixe 10 minutos em água morna e escorra bem.',
              'Molhe as mãos para enrolar as bolinhas: a massa não gruda e elas ficam lisinhas.',
              'Nas Barrinhas Banoffee, corte com uma faca quente (passe na água fervendo e seque). As camadas ficam perfeitas.',
            ]) +
            paragraphs('Sem framboesa liofilizada? Passe as bolinhas no coco ralado ou em castanhas picadas. Fica lindo também.\n\nFez? Me marca no Instagram, @_thetropicalbakery_. Eu vejo todas!'),
          cta: { label: 'Abrir minhas receitas', href: `${SITE_URL}${freePdf('pt')}` },
          note: 'Com carinho, Dolly',
        }
      : {
          preheader: 'Soft dates, wet hands and a hot knife. That’s it.',
          heading: 'Ready to bake?',
          body:
            paragraphs('Yesterday you got my two recipes. If you haven’t made one yet, start with the Bliss Balls: no oven, 20 minutes, and kids love rolling them.') +
            kicker('Three tricks from my kitchen') +
            bulletList([
              'Soft dates are the secret. If yours are dry, soak them in warm water for 10 minutes and drain well.',
              'Wet your hands to roll the balls: the dough won’t stick and they come out smooth.',
              'For the Banoffee Bars, cut with a hot knife (dip it in boiling water, wipe dry). Perfect layers every time.',
            ]) +
            paragraphs('No freeze-dried raspberry? Roll the balls in shredded coconut or chopped nuts. Just as pretty.\n\nMade them? Tag me on Instagram, @_thetropicalbakery_. I look at every single one!'),
          cta: { label: 'Open my recipes', href: `${SITE_URL}${freePdf('en')}` },
          note: 'With love, Dolly',
        },
  },

  {
    ...base,
    id: 'receitas-d3',
    name: 'Receitas grátis · dia 3: as outras 5 cores',
    emoji: '🌈',
    description: 'Apresenta o livro completo: as cinco receitas que faltam, o que ele ensina e o preço normal.',
    subject: v => (isPt(v) ? 'As 5 cores que você ainda não provou' : 'The 5 colors you haven’t tried yet'),
    messageKey: () => 'receitas-d3',
    build: v => isPt(v)
      ? {
          preheader: 'Amarelo, laranja, roxo, verde e chocolate. Um doce para cada dia da semana.',
          heading: 'Você tem 2 cores. Faltam 5.',
          body:
            paragraphs('O Vermelho e o Caramelo vieram do meu livro Sweet Escape: 7 Cores, 7 Receitas. Eu montei o livro como uma semana: cada dia uma cor, cada cor um doce que cuida de você.') +
            kicker('Ainda esperando por você') +
            bulletList(missing(v)) +
            paragraphs(`Além das receitas, o livro explica o porquê de cada ingrediente, para você começar a inventar os seus. Uma rodada pelo livro rende uns ${TOTAL_TREATS} doces.\n\nO livro completo custa ${full(v)}, em PDF na hora, com garantia de 7 dias.`),
          cta: { label: 'Ver o Sweet Escape', href: bookPage(v, 'receitas-d3') },
          note: 'Com carinho, Dolly',
        }
      : {
          preheader: 'Yellow, orange, purple, green and chocolate. A treat for every day of the week.',
          heading: 'You have 2 colors. 5 to go.',
          body:
            paragraphs('Red and Caramel come from my book Sweet Escape: 7 Colors, 7 Recipes. I built it like a week: every day a color, every color a treat that loves you back.') +
            kicker('Still waiting for you') +
            bulletList(missing(v)) +
            paragraphs(`Besides the recipes, the book explains the why behind every ingredient, so you can start inventing your own. One run through the book makes about ${TOTAL_TREATS} treats.\n\nThe full book is ${full(v)}, an instant PDF with a 7-day money-back promise.`),
          cta: { label: 'See Sweet Escape', href: bookPage(v, 'receitas-d3') },
          note: 'With love, Dolly',
        },
  },

  {
    ...base,
    id: 'receitas-d5',
    name: 'Receitas grátis · dia 5: preço de boas-vindas',
    emoji: '🎁',
    description: 'O downsell: o livro completo pelo preço de boas-vindas, com link assinado que vence em 2 dias.',
    subject: v => (isPt(v) ? `Um presente de boas-vindas: o livro completo por ${welcome(v)}` : `A welcome gift: the full book for ${welcome(v)}`),
    messageKey: () => 'receitas-d5',
    build: v => isPt(v)
      ? {
          preheader: `Só para quem baixou as receitas, até ${v.until}.`,
          heading: `Sweet Escape por ${welcome(v)}`,
          body:
            paragraphs(`Obrigada por cozinhar comigo esta semana. Quero que você tenha as 7 cores, então fiz um preço de boas-vindas só para quem baixou as receitas: ${welcome(v)} em vez de ${full(v)}.\n\nVale até ${v.until}. Depois volta ao preço normal.`) +
            bulletList(['As 7 receitas, uma para cada dia da semana', 'O porquê de cada ingrediente', `${EBOOK.pages} páginas em PDF, na hora`, 'Garantia de 7 dias: não gostou, devolvo']),
          cta: { label: `Quero por ${welcome(v)}`, href: offerLink(v, 'receitas-d5') },
          note: `Preço de boas-vindas válido até ${v.until}.`,
        }
      : {
          preheader: `Only for people who downloaded the recipes, until ${v.until}.`,
          heading: `Sweet Escape for ${welcome(v)}`,
          body:
            paragraphs(`Thank you for baking with me this week. I’d love you to have all 7 colors, so here is a welcome price only for people who downloaded the recipes: ${welcome(v)} instead of ${full(v)}.\n\nIt’s good until ${v.until}. Then it goes back to the normal price.`) +
            bulletList(['All 7 recipes, one for every day of the week', 'The why behind every ingredient', `${EBOOK.pages} pages, instant PDF`, '7-day money-back promise']),
          cta: { label: `Get it for ${welcome(v)}`, href: offerLink(v, 'receitas-d5') },
          note: `Welcome price good until ${v.until}.`,
        },
  },

  {
    ...base,
    id: 'receitas-d7',
    name: 'Receitas grátis · dia 7: último dia',
    emoji: '⏳',
    description: 'Último lembrete do preço de boas-vindas, que termina hoje.',
    subject: v => (isPt(v) ? `Hoje é o último dia do livro por ${welcome(v)}` : `Last day: the full book for ${welcome(v)}`),
    messageKey: () => 'receitas-d7',
    build: v => isPt(v)
      ? {
          preheader: 'Amanhã o Sweet Escape volta ao preço normal.',
          heading: 'Último dia',
          body: paragraphs(`Só um lembrete carinhoso: o preço de boas-vindas do Sweet Escape (${welcome(v)} em vez de ${full(v)}) termina ${v.until}.\n\nSe as duas receitas já viraram favoritas na sua casa, as outras cinco vão virar também. E se não gostar, a garantia de 7 dias continua valendo.`),
          cta: { label: `Quero por ${welcome(v)}`, href: offerLink(v, 'receitas-d7') },
          note: 'Com carinho, Dolly',
        }
      : {
          preheader: 'Tomorrow Sweet Escape goes back to its normal price.',
          heading: 'Last day',
          body: paragraphs(`Just a friendly reminder: the welcome price for Sweet Escape (${welcome(v)} instead of ${full(v)}) ends ${v.until}.\n\nIf those two recipes are already favorites at home, the other five will be too. And if you don’t love it, the 7-day promise still stands.`),
          cta: { label: `Get it for ${welcome(v)}`, href: offerLink(v, 'receitas-d7') },
          note: 'With love, Dolly',
        },
  },

  {
    ...base,
    id: 'receitas-local',
    name: 'Receitas grátis · dia 9: prove os de verdade (região)',
    emoji: '🌴',
    description: 'Só para quem mora ou vai visitar Ubatuba / Paraty: a caixa, a assinatura, o brunch, os cursos e o Menu de Eventos.',
    subject: v => (isPt(v) ? 'Você está pertinho: quer provar os meus?' : 'You’re close by: want to taste mine?'),
    messageKey: () => 'receitas-local',
    build: v => isPt(v)
      ? {
          preheader: 'Caixa da semana, brunch, cursos e doces para eventos, aqui em Ubatuba.',
          heading: 'Prove feitos por mim',
          body:
            paragraphs('Você me contou que está por aqui, em Ubatuba ou Paraty. Então, além das receitas, eu posso levar os doces até você:') +
            bulletList([
              'Caixa de Degustação: os doces da semana, numa caixa kraft, entregue em Ubatuba e região.',
              'Assinatura: a caixa toda semana, com os seus favoritos escolhidos por você.',
              'Brunch Tropical: chá, doces e conversa de verdade, em grupo pequeno.',
              'Cursos: aprenda estes e muitos outros na minha mesa.',
              'Menu de Eventos: bliss balls e barrinhas por bandeja para a sua festa.',
            ]),
          cta: { label: 'Ver a caixa da semana', href: track('/caixas', 'receitas-local') },
          note: 'Prefere conversar? Responda pelo WhatsApp que aparece no site.',
        }
      : {
          preheader: 'This week’s box, brunch, courses and event treats, right here in Ubatuba.',
          heading: 'Taste them made by me',
          body:
            paragraphs('You told me you’re around Ubatuba or Paraty. So besides the recipes, I can bring the treats to you:') +
            bulletList([
              'Tasting Box: this week’s treats in a kraft box, delivered around Ubatuba.',
              'Subscription: the box every week, with the favorites you pick.',
              'Brunch Tropical: tea, treats and real conversation, in a small group.',
              'Courses: learn these and many more at my table.',
              'Events Menu: bliss balls and bars by the tray for your party.',
            ]),
          cta: { label: 'See this week’s box', href: track('/caixas', 'receitas-local') },
          note: 'With love, Dolly',
        },
  },
];
