/**
 * Payment proposals ("propostas", migration 36): a personal offer Dolly sends to someone interested in a
 * course or a retreat, as a link to /proposta/<id>. Pure data and words, shared by the admin (which writes
 * them) and the client's page (which sells them). No server-only imports here.
 */

export type OfferKind = 'retiro' | 'curso';
export type OfferLang = 'pt' | 'en';

export interface Offer {
  id: string;
  kind: OfferKind;
  lang: OfferLang;
  customer_name: string;
  customer_email: string | null;
  customer_whatsapp: string | null;
  title: string;
  dates_label: string | null;
  price: number;
  anchor_price: number | null;
  included: string[];
  bonuses: string[];
  note: string | null;
  image_url: string | null;
  expires_on: string | null;
  status: 'open' | 'cancelled';
  order_reference: string | null;
  lead_source: string | null;
  lead_id: string | null;
  created_at: string;
}

/** What the client's page needs (never the WhatsApp or e-mail). */
export type PublicOffer = Pick<Offer, 'id' | 'kind' | 'lang' | 'title' | 'dates_label' | 'price' | 'anchor_price' |
  'included' | 'bonuses' | 'note' | 'image_url' | 'expires_on' | 'status'> & {
  firstName: string;
  paid: boolean;
  /** The order a payment was started on (to check it after a card/PayPal page sends them back). */
  reference: string | null;
  expired: boolean;
};

export const firstName = (name: string) => (name || '').trim().split(/\s+/)[0] || '';

/** Photos for the page: the retreat house and Itamambuca, or Dolly in the kitchen and the treats. */
export const OFFER_PHOTOS: Record<OfferKind, string[]> = {
  retiro: ['/retreats/Terrace.webp', '/retreats/Beach shot Itamambuca.webp', '/retreats/Prumirim waterfall.webp', '/retreats/Room shot with view on window and plants.webp'],
  curso: ['/dolly/dolly-tray.jpg', '/ebook/sweet-escape/chocolate-cut.webp', '/ebook/sweet-escape/yellow-stack.webp', '/dolly/dolly-spatula.jpg'],
};
export const OFFER_HERO: Record<OfferKind, string> = { retiro: '/retreats/Drone shot of Itamabuca.webp', curso: '/dolly/hero-mata.webp' };

/** Starting points for the admin form: Dolly edits them per person. */
export const DEFAULT_INCLUDED: Record<OfferKind, Record<OfferLang, string[]>> = {
  retiro: {
    pt: [
      'Suíte na casa em Itamambuca, a poucos passos da praia',
      'Imersão Tropical Bakery: workshop de confeitaria com a Chef Dolly',
      'Café da manhã e refeições plant-based feitas na hora',
      'Atividades na mata e no mar: trilha, cachoeira, praia',
    ],
    en: [
      'Your suite at the house in Itamambuca, steps from the beach',
      'The Tropical Bakery immersion: a pastry workshop with Chef Dolly',
      'Breakfast and plant-based meals made fresh',
      'Rainforest and ocean: trail, waterfall, beach',
    ],
  },
  curso: {
    pt: [
      'Aulas práticas com a Chef Dolly, mão na massa do começo ao fim',
      'Técnica belga com ingredientes brasileiros',
      'Todas as receitas da aula para você refazer em casa',
    ],
    en: [
      'Hands-on classes with Chef Dolly, start to finish',
      'Belgian technique with Brazilian ingredients',
      'Every recipe from class, to make again at home',
    ],
  },
};

export const DEFAULT_BONUS: Record<OfferLang, string> = {
  pt: 'De presente: o e-book Sweet Escape da Dolly, 7 sobremesas de frutas, castanhas e plantas inteiras',
  en: 'A gift: Dolly’s Sweet Escape e-book, 7 desserts made from fruit, nuts and whole plants',
};

type Copy = {
  eyebrow: (name: string) => string;
  promise: Record<OfferKind, string>;
  heroCta: string;
  validUntil: (d: string) => string;
  fromDolly: string;
  whatYouGet: string;
  includedTitle: string;
  bonusTitle: string;
  stackTitle: string;
  valueLabel: string;
  todayLabel: string;
  payTitle: string;
  payLead: string;
  methods: { pix: [string, string]; card: [string, string]; stripe: [string, string]; paypal: [string, string] };
  payButton: (price: string) => string;
  opening: string;
  pixTitle: string;
  pixLead: string;
  copy: string;
  copied: string;
  pixAfter: string;
  safe: string;
  reserved: (d: string) => string;
  questions: string;
  paidTitle: string;
  paidLead: string;
  checking: string;
  waitingTitle: string;
  waitingLead: string;
  cancelledPay: string;
  expiredTitle: string;
  expiredLead: string;
  closedTitle: string;
  barKicker: string;
  barLabel: string;
};

export const OFFER_COPY: Record<OfferLang, Copy> = {
  pt: {
    eyebrow: name => `Uma proposta só para ${name}`,
    promise: {
      retiro: 'Dias de mar, mata e doces feitos à mão, no seu ritmo. Você volta para casa outra pessoa.',
      curso: 'Aprenda a fazer doces que impressionam, com quem faz isso todo dia, e leve a técnica para a sua cozinha.',
    },
    heroCta: 'Quero garantir minha vaga',
    validUntil: d => `Reservado para você até ${d}`,
    fromDolly: 'Um recado da Dolly',
    whatYouGet: 'O que você vai viver',
    includedTitle: 'Está tudo incluído',
    bonusTitle: 'E ainda',
    stackTitle: 'Sua proposta',
    valueLabel: 'Valor de tudo isso',
    todayLabel: 'Para você',
    payTitle: 'Garanta sua vaga agora',
    payLead: 'Escolha como pagar. Leva um minuto.',
    methods: {
      pix: ['Pix', 'Na hora, sem taxa'],
      card: ['Cartão de crédito', 'Cartões do Brasil, parcele'],
      stripe: ['Cartão internacional', 'Cartão de fora do Brasil'],
      paypal: ['PayPal', 'Com a sua conta PayPal'],
    },
    payButton: p => `Pagar ${p} e garantir minha vaga`,
    opening: 'Abrindo o pagamento…',
    pixTitle: 'Seu Pix está pronto',
    pixLead: 'Abra o app do seu banco, escolha Pix copia e cola ou leia o QR code.',
    copy: 'Copiar código Pix',
    copied: 'Copiado ✓',
    pixAfter: 'Assim que o Pix cair, a Dolly confirma e fala com você no WhatsApp.',
    safe: '🔒 Pagamento seguro. Não guardamos os dados do seu cartão.',
    reserved: d => `Sua vaga fica reservada até ${d}. Depois disso, ela pode ir para outra pessoa.`,
    questions: 'Alguma dúvida? Responda a mensagem da Dolly no WhatsApp.',
    paidTitle: 'Vaga garantida! 🎉',
    paidLead: 'Pagamento confirmado. A Dolly vai falar com você no WhatsApp com todos os detalhes. Que alegria ter você com a gente!',
    checking: 'Confirmando seu pagamento…',
    waitingTitle: 'Estamos aguardando a confirmação',
    waitingLead: 'Alguns pagamentos levam uns minutos. Assim que confirmar, esta página mostra sua vaga garantida.',
    cancelledPay: 'O pagamento não foi concluído e nada foi cobrado. Você pode tentar de novo abaixo.',
    expiredTitle: 'Esta proposta expirou',
    expiredLead: 'O prazo desta reserva passou. Fale com a Dolly no WhatsApp: se ainda houver vaga, ela renova para você.',
    closedTitle: 'Esta proposta não está mais disponível',
    barKicker: 'Sua proposta',
    barLabel: 'Garantir',
  },
  en: {
    eyebrow: name => `A proposal just for ${name}`,
    promise: {
      retiro: 'Days of ocean, rainforest and handmade treats, at your own pace. You go home a different person.',
      curso: 'Learn to make treats that wow from someone who bakes them every day, and take the technique home.',
    },
    heroCta: 'I want my spot',
    validUntil: d => `Held for you until ${d}`,
    fromDolly: 'A note from Dolly',
    whatYouGet: 'What you will live',
    includedTitle: 'Everything is included',
    bonusTitle: 'And also',
    stackTitle: 'Your proposal',
    valueLabel: 'All of this is worth',
    todayLabel: 'For you',
    payTitle: 'Secure your spot now',
    payLead: 'Choose how to pay. It takes a minute.',
    methods: {
      pix: ['Pix', 'Instant, Brazil only'],
      card: ['Brazilian card', 'Cards issued in Brazil'],
      stripe: ['Card', 'Any card, from any country'],
      paypal: ['PayPal', 'With your PayPal account'],
    },
    payButton: p => `Pay ${p} and secure my spot`,
    opening: 'Opening the payment…',
    pixTitle: 'Your Pix is ready',
    pixLead: 'Open your bank app, choose Pix copy-and-paste or scan the QR code.',
    copy: 'Copy Pix code',
    copied: 'Copied ✓',
    pixAfter: 'As soon as the Pix arrives, Dolly confirms it and messages you on WhatsApp.',
    safe: '🔒 Secure payment. We never store your card details.',
    reserved: d => `Your spot is held until ${d}. After that it may go to someone else.`,
    questions: 'Any questions? Just reply to Dolly on WhatsApp.',
    paidTitle: 'Your spot is secured! 🎉',
    paidLead: 'Payment confirmed. Dolly will message you on WhatsApp with every detail. We cannot wait to have you here!',
    checking: 'Confirming your payment…',
    waitingTitle: 'Waiting for the confirmation',
    waitingLead: 'Some payments take a few minutes. Once it is confirmed, this page will show your spot secured.',
    cancelledPay: 'The payment was not completed and nothing was charged. You can try again below.',
    expiredTitle: 'This proposal has expired',
    expiredLead: 'The hold on this spot has passed. Message Dolly on WhatsApp: if there is still room, she will renew it for you.',
    closedTitle: 'This proposal is no longer available',
    barKicker: 'Your proposal',
    barLabel: 'Secure it',
  },
};

export const offerDay = (iso: string, lang: OfferLang) =>
  new Date(iso + 'T12:00:00').toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

export const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
