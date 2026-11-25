/**
 * The e-mails that walk people up the value ladder after their first step (plan of 2026-11-25):
 *
 * - `carta-domingo`, "Dolly's Sunday letter": one short letter a week to the whole list, in Portuguese or English.
 *   The admin sends it by hand from Admin › E-mails, written from Dolly's latest Instagram post. `byLocale` keeps
 *   Portuguese letters for Portuguese contacts and English letters for everyone else.
 * - `livro-d1`, `livro-d3`, `livro-d7`: three e-mails for Sweet Escape buyers, 1, 3 and 7 days after the book is
 *   paid. Sent only by the automation `livro-sequencia` (groupOnly). Values: lang, book (the download link),
 *   call ('1' when the free call is on and they haven't claimed it yet), callUrl (their claim link).
 *
 * Pure string building (no server imports), so the admin can preview them.
 */

import { SITE_URL, kicker, paragraphs, bulletList } from './layout';
import type { Campaign, CampaignValues } from './campaigns';
import { letterPhotos } from './letterMail';
import { LETTER_WRITER, prettySunday, titleFrom } from '@/lib/letter';

const isPt = (v: CampaignValues) => v.lang === 'pt';
const lang = (v: CampaignValues) => (isPt(v) ? 'pt' : 'en') as 'pt' | 'en';
const track = (path: string, step: string) =>
  `${path.startsWith('http') ? '' : SITE_URL}${path}${path.includes('?') ? '&' : '?'}utm_source=email&utm_medium=escada&utm_campaign=${step}`;

const slug = (s: string) =>
  (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

const sign = (v: CampaignValues) => (isPt(v) ? 'Um beijo, Dolly' : 'With love, Dolly');
const coachingPath = (v: CampaignValues) => (isPt(v) ? '/coaching' : '/coaching/en');

// ------------------------------------------------------------ Dolly's Sunday letter

const LETTER: Campaign = {
  id: 'carta-domingo',
  theme: 'novidades',
  name: 'Carta de domingo da Dolly',
  emoji: '💌',
  topic: 'novidades',
  byLocale: true,
  lang,
  description: 'A carta semanal para toda a lista, em português OU inglês (cada idioma vai só para quem fala). Uma história da cozinha, uma dica ou receita e um link.',
  reason: 'Você recebe este e-mail porque está na lista da The Tropical Bakery.',
  reasonEn: 'You get this e-mail because you’re on The Tropical Bakery’s list.',
  fields: [
    { name: 'lang', label: 'Idioma: pt (vai para quem fala português) ou en (para todo o resto)', type: 'text', required: true, placeholder: 'pt' },
    { name: 'title', label: 'Título (vira o assunto)', type: 'text', required: true, placeholder: 'O bolo que quase deu errado' },
    { name: 'story', label: 'A história (linhas em branco separam parágrafos)', type: 'textarea', required: true, placeholder: 'Domingo de chuva em Itamambuca, e a banana passou do ponto. Em vez de jogar fora, virou o bolo mais pedido da semana.' },
    { name: 'photos', label: 'Fotos (links, um por linha; vêm sozinhos quando a Dolly manda a carta)', type: 'textarea' },
    { name: 'tipTitle', label: 'Título da dica ou receita (opcional)', type: 'text', placeholder: 'A dica da semana' },
    { name: 'tip', label: 'A dica ou receita (opcional)', type: 'textarea', placeholder: 'Banana bem madura adoça sozinha: quanto mais pintadinha, menos você precisa de tâmara.' },
    { name: 'ctaLabel', label: 'Texto do botão (opcional)', type: 'text', placeholder: 'Ver as receitas grátis' },
    { name: 'ctaPath', label: 'Página do botão', type: 'text', placeholder: '/receitas' },
  ],
  subject: v => v.title || titleFrom(v.story),
  messageKey: v => `carta-domingo:${lang(v)}:${slug(v.title || titleFrom(v.story))}`,
  build: v => ({
    preheader: (v.story || v.title || '').slice(0, 90),
    heading: v.title || titleFrom(v.story),
    body:
      letterPhotos(v.photos, isPt(v) ? 'Da cozinha da Dolly' : 'From Dolly’s kitchen') +
      paragraphs(v.story) +
      ((v.tip || '').trim() ? kicker(v.tipTitle || (isPt(v) ? 'A dica da semana' : 'This week’s tip')) + paragraphs(v.tip) : ''),
    cta: v.ctaLabel ? { label: v.ctaLabel, href: track(v.ctaPath || '/', `carta-${slug(v.title)}`) } : undefined,
    note: sign(v),
  }),
};

// ------------------------------------------------------------ the Thursday prompt to Dolly

/** To Dolly only (automation carta-pedido, sent as a one-person send): her link to write this Sunday's letter. */
const LETTER_PROMPT: Campaign = {
  id: 'carta-pedido',
  theme: 'novidades',
  name: 'Pedido da carta de domingo (para a Dolly)',
  emoji: '✍️',
  topic: 'conta',
  groupOnly: true,
  lang: () => 'en',
  description: `Toda quinta, só para a Dolly (${LETTER_WRITER.email}): o link para mandar fotos e algumas linhas da semana. Em inglês.`,
  reason: 'Você recebe este e-mail porque escreve a carta de domingo.',
  reasonEn: 'You get this e-mail because you write the Sunday letter.',
  fields: [
    { name: 'sunday', label: 'Domingo (preenchido pela automação)', type: 'text', placeholder: '2026-11-30' },
    { name: 'link', label: 'Link da página (preenchido pela automação)', type: 'text' },
  ],
  subject: () => 'Your Sunday letter: a few photos and a few lines?',
  messageKey: v => `carta-pedido:${v.sunday || 'exemplo'}`,
  build: v => ({
    preheader: 'Two minutes on your phone. Andrew does the rest.',
    heading: 'Time for your Sunday letter',
    body: paragraphs(
      `Hi ${LETTER_WRITER.name}! What happened in the kitchen this week? Tap the button, add 1 to 4 photos and write a few lines, like a message to a friend.\n\n` +
      `Andrew reads it and sends it to everyone on ${v.sunday ? prettySunday(v.sunday) : 'Sunday'}. You don’t need to log in or format anything.`,
    ),
    cta: { label: 'Write my letter', href: v.link || `${SITE_URL}/carta/escrever` },
    note: 'No time this week? Just skip it, no problem.',
  }),
};

// ------------------------------------------------------------ Sweet Escape buyers: days 1, 3, 7

const buyerBase = {
  theme: 'novidades' as const,
  topic: 'novidades',
  groupOnly: true,
  lang,
  reason: 'Você recebe este e-mail porque comprou o Sweet Escape.',
  reasonEn: 'You get this e-mail because you bought Sweet Escape.',
  fields: [
    { name: 'lang', label: 'Idioma (en ou pt)', type: 'text' as const, required: true },
    { name: 'book', label: 'Link do livro (preenchido pela automação)', type: 'text' as const },
    { name: 'call', label: 'Conversa grátis ainda não marcada: 1 (preenchido pela automação)', type: 'text' as const },
    { name: 'callUrl', label: 'Link para marcar a conversa (preenchido pela automação)', type: 'text' as const },
  ],
};

const bookLink = (v: CampaignValues, step: string) => track(v.book || (isPt(v) ? '/sweet-escape/pt' : '/sweet-escape'), step);
const callLink = (v: CampaignValues, step: string) => track(v.callUrl || `/sweet-escape/call?lang=${lang(v)}`, step);
const hasCall = (v: CampaignValues) => v.call === '1';

const BUYER_STEPS: Campaign[] = [
  {
    ...buyerBase,
    id: 'livro-d1',
    name: 'Sweet Escape · dia 1: por onde começar',
    emoji: '📖',
    description: 'Um dia depois da compra: comece por uma receita só. Sem venda.',
    subject: v => (isPt(v) ? 'Comece por uma só' : 'Start with just one'),
    messageKey: () => 'livro-d1',
    build: v => isPt(v)
      ? {
          preheader: 'Sete receitas parecem muito. Escolha uma para este fim de semana.',
          heading: 'Seu primeiro doce',
          body: paragraphs(
            'Sete receitas de uma vez parecem muito, então aqui vai a minha dica: não planeje a semana. Escolha a que te deu mais vontade e faça só essa neste fim de semana.\n\n' +
            'Faça em dobro. Criança enjoa rápido, e cada uma tem o seu preferido: quando você descobrir o da sua, já tem para o dia seguinte.\n\n' +
            'Depois me responda contando qual você fez. Eu adoro saber.',
          ),
          cta: { label: 'Abrir o meu livro', href: bookLink(v, 'livro-d1') },
          note: sign(v),
        }
      : {
          preheader: 'Seven recipes feel like a lot. Pick one for this weekend.',
          heading: 'Your first treat',
          body: paragraphs(
            'Seven recipes at once can feel like a lot, so here’s my tip: don’t plan the week. Pick the one that made you hungry first and make just that one this weekend.\n\n' +
            'Make a double batch. Kids get bored fast, and every kid has a different favorite: once you find theirs, there’s some left for tomorrow.\n\n' +
            'Then hit reply and tell me which one you made. I love hearing it.',
          ),
          cta: { label: 'Open my book', href: bookLink(v, 'livro-d1') },
          note: sign(v),
        },
  },
  {
    ...buyerBase,
    id: 'livro-d3',
    name: 'Sweet Escape · dia 3: por que eu cozinho assim',
    emoji: '🌿',
    description: 'Três dias depois: o jeito da Dolly em três regras e a conversa grátis de 30 minutos (ou o coaching, se já marcou).',
    subject: v => (isPt(v) ? 'Por que eu cozinho assim' : 'Why I cook this way'),
    messageKey: () => 'livro-d3',
    build: v => {
      const pt = isPt(v);
      const call = hasCall(v);
      return {
        preheader: pt ? 'Três regras simples, e uma conversa comigo que já vem com o seu livro.' : 'Three simple rules, and a call with me that comes with your book.',
        heading: pt ? 'Três regras, para a vida' : 'Three rules, for life',
        body:
          paragraphs(pt
            ? 'Depois de anos cozinhando, estudando e me curando, o meu jeito de comer cabe em três regras:'
            : 'After years of cooking, studying and healing, my way of eating fits in three rules:') +
          bulletList(pt
            ? ['Cresce da terra, tem fibra e ainda parece com o que era.', 'O sabor vem da planta inteira: ervas, limão, especiarias e fruta.', 'O máximo de vida em cada garfada.']
            : ['It grows from the earth, carries fiber and still looks like what it was.', 'Flavor comes from the whole plant: herbs, lemon, spices and fruit.', 'The most life in every bite.']) +
          paragraphs(pt
            ? 'Os doces são a minha porta de entrada, porque ninguém muda o jeito de comer se sentindo de castigo. E eu sei o que uma dieta faz com a cabeça de uma mulher, então aqui não tem balança nem conta de caloria.'
            : 'Treats are where I start, because nobody changes the way they eat while feeling deprived. And I know what a diet does to a woman’s mind, so there’s no scale and no calorie counting here.') +
          (call
            ? kicker(pt ? 'Já vem com o seu livro' : 'It comes with your book') +
              paragraphs(pt
                ? 'Uma conversa grátis de 30 minutos comigo, por vídeo. Você me conta o que come hoje e do que sente vontade, e eu te dou os seus primeiros passos.'
                : 'A free 30-minute video call with me. You tell me what you eat now and what you crave, and I give you your first easy steps.')
            : ''),
        cta: call
          ? { label: pt ? 'Marcar a minha conversa' : 'Book my free call', href: callLink(v, 'livro-d3') }
          : { label: pt ? 'Ver como eu acompanho' : 'See how I coach', href: track(coachingPath(v), 'livro-d3') },
        note: sign(v),
      };
    },
  },
  {
    ...buyerBase,
    id: 'livro-d7',
    name: 'Sweet Escape · dia 7: além dos doces',
    emoji: '🌴',
    description: 'Uma semana depois: o coaching (café da manhã ao jantar), e a aula ou o retiro para quem vier a Ubatuba.',
    subject: v => (isPt(v) ? 'E o resto do dia?' : 'What about the rest of the day?'),
    messageKey: () => 'livro-d7',
    build: v => {
      const pt = isPt(v);
      const call = hasCall(v);
      return {
        preheader: pt ? 'Do café da manhã ao jantar, do meu jeito. Começa com uma conversa grátis.' : 'Breakfast to dinner, my way. It starts with a free call.',
        heading: pt ? 'Além dos doces' : 'Beyond the treats',
        body:
          paragraphs(pt
            ? 'Se as receitas te deixaram curiosa sobre o resto do dia, é isso que eu faço no coaching: a sua alimentação inteira, do café da manhã ao jantar, só de plantas inteiras. Sem balança, sem contar caloria, sem culpa.'
            : 'If the recipes made you curious about the rest of the day, that’s what I do in coaching: your whole way of eating, breakfast to dinner, only whole plants. No scale, no calorie counting, no guilt.') +
          paragraphs(call
            ? (pt ? 'Começa com a conversa grátis de 30 minutos que veio com o seu livro, online, de onde você estiver.' : 'It starts with the free 30-minute call that came with your book, online, from wherever you are.')
            : (pt ? 'Começa com uma conversa grátis de 30 minutos, online, de onde você estiver.' : 'It starts with a free 30-minute call, online, from wherever you are.')) +
          kicker(pt ? 'E se vier a Ubatuba' : 'And if you ever come to Brazil') +
          bulletList(pt
            ? ['Aula de doces na minha cozinha em Itamambuca: uma tarde, você faz, prova e leva as receitas (thetropicalbakery.com/cursos).', 'Retiro: dias de praia, cachoeira e comida de verdade com a gente (thetropicalbakery.com/retreats).']
            : ['A treats class in my kitchen in Itamambuca: one afternoon, you make, taste and take the recipes home (thetropicalbakery.com/cursos).', 'A retreat: days of beach, waterfalls and real food with us (thetropicalbakery.com/retreats).']),
        cta: call
          ? { label: pt ? 'Marcar a minha conversa' : 'Book my free call', href: callLink(v, 'livro-d7') }
          : { label: pt ? 'Conhecer o coaching' : 'See the coaching', href: track(coachingPath(v), 'livro-d7') },
        note: sign(v),
      };
    },
  },
];

/** The buyers' steps, in order, with the day each one goes out (the automation reads this). */
export const BOOK_BUYER_SEQUENCE = [
  { day: 1, campaignId: 'livro-d1' },
  { day: 3, campaignId: 'livro-d3' },
  { day: 7, campaignId: 'livro-d7' },
] as const;

/** Buyers' e-mails wear the book's look, like the free-recipes ones. The letter keeps the bakery's. */
export const LADDER_CAMPAIGNS: Campaign[] = [
  LETTER,
  LETTER_PROMPT,
  ...BUYER_STEPS.map(c => ({
    ...c,
    build: (v: CampaignValues) => ({
      ...c.build(v),
      look: {
        hero: `se-hero-${lang(v)}.jpg`, heroHeight: 420, accent: '#ff4f0a',
        heroAlt: isPt(v) ? 'Sweet Escape, da cozinha da Dolly' : 'Sweet Escape, from Dolly’s kitchen',
        kicker: isPt(v) ? 'Sweet Escape · da cozinha da Dolly' : 'Sweet Escape · from Dolly’s kitchen',
      },
    }),
  })),
];
