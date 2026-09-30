/**
 * Clube Tropical: the loyalty rules behind Minha Conta.
 * Everything a customer is promised lives here, so changing a reward is a one-line edit.
 * Pure: no imports from the browser or the server.
 */

/** A stamp for every paid tasting box (and every delivered subscription box). */
export const STAMPS_PER_REWARD = 6;

/** What a full card earns. Shown on the card, so keep it short and true. */
export const STAMP_REWARD = 'um mimo surpresa da Dolly na próxima caixa';

export interface Level {
  id: string;
  name: string;
  emoji: string;
  /** Paid boxes needed. A subscriber is always at least Palmeira. */
  minBoxes: number;
  blurb: string;
}

export const LEVELS: Level[] = [
  { id: 'semente', name: 'Semente', emoji: '🌱', minBoxes: 0, blurb: 'Tudo começa com a primeira caixa.' },
  { id: 'broto', name: 'Broto', emoji: '🌿', minBoxes: 1, blurb: 'Você já provou. Agora é hábito.' },
  { id: 'palmeira', name: 'Palmeira', emoji: '🌴', minBoxes: 3, blurb: 'Da casa. A Dolly já sabe do que você gosta.' },
  { id: 'sol', name: 'Sol Tropical', emoji: '☀️', minBoxes: 10, blurb: 'Família Tropical. Obrigada por estar aqui.' },
];

export function levelFor(paidBoxes: number, subscriber: boolean): { level: Level; next: Level | null; toNext: number } {
  let i = 0;
  LEVELS.forEach((l, idx) => { if (paidBoxes >= l.minBoxes) i = idx; });
  if (subscriber) i = Math.max(i, LEVELS.findIndex(l => l.id === 'palmeira'));
  const next = LEVELS[i + 1] ?? null;
  return { level: LEVELS[i], next, toNext: next ? Math.max(1, next.minBoxes - paidBoxes) : 0 };
}

/** What my_journey() (migration 30) returns. */
export interface Journey {
  paid_boxes: number;
  paid_events: number;
  event_quotes: number;
  course_inquiries: number;
  retreat_inquiries: number;
  first_order_at: string | null;
  orders: JourneyOrder[];
}

export interface JourneyOrder {
  id: string;
  created_at: string;
  requested_date: string | null;
  items_summary: string | null;
  total_price: number | null;
  order_kind: 'box' | 'events' | 'quote' | null;
  fulfillment: string | null;
  stage: 'awaiting_payment' | 'confirmed' | 'preparing' | 'ready' | 'done' | 'quote';
}

export const ORDER_STAGE: Record<JourneyOrder['stage'], { label: string; color: string; bg: string }> = {
  awaiting_payment: { label: 'Aguardando pagamento', color: '#7a4a00', bg: '#fff4e5' },
  confirmed: { label: 'Pagamento confirmado', color: '#0b6b3a', bg: '#e6f4ec' },
  preparing: { label: 'Em preparo', color: '#8a6d1f', bg: '#fdf1d6' },
  ready: { label: 'Pronta!', color: '#0b6b3a', bg: '#d7f0e1' },
  done: { label: 'Entregue', color: '#6b5d53', bg: '#f1ece3' },
  quote: { label: 'Orçamento pedido', color: '#4a5568', bg: '#edf2f7' },
};

/** The value ladder, in the order we'd like people to climb it. */
export type StepId = 'caixa' | 'assinatura' | 'eventos' | 'curso' | 'retiro';

export interface TrailStep {
  id: StepId;
  emoji: string;
  title: string;
  /** Shown when this is the next step: why it's worth it. */
  pitch: string;
  cta: string;
  href: string;
  image: string;
  /** Shown once done. */
  doneLabel: string;
}

export const TRAIL: TrailStep[] = [
  {
    id: 'caixa', emoji: '📦', title: 'Sua primeira caixa',
    pitch: 'Doces veganos e sem glúten, feitos na semana em que chegam. O jeito mais gostoso de começar.',
    cta: 'Escolher minha caixa', href: '/caixas', image: '/box1.jpg', doneLabel: 'Provou',
  },
  {
    id: 'assinatura', emoji: '💌', title: 'Assinatura semanal',
    pitch: 'Uma caixa nova toda semana, escolhida para o seu perfil de sabor, com preço de assinante e sem precisar lembrar de pedir.',
    cta: 'Ver planos de assinatura', href: '/assinatura', image: '/box2.jpg', doneLabel: 'Assinante',
  },
  {
    id: 'eventos', emoji: '🎉', title: 'Doces para o seu evento',
    pitch: 'Aniversário, casamento, café da empresa: bolos, tartelettes e cupcakes da Dolly para todo mundo comer, inclusive quem tem restrição.',
    cta: 'Montar meu orçamento', href: '/menu', image: '/event_hero.jpg', doneLabel: 'Festejou',
  },
  {
    id: 'curso', emoji: '👩‍🍳', title: 'Aprenda com a Dolly',
    pitch: 'Cursos de confeitaria saudável: as receitas por trás das suas caixas, na sua cozinha.',
    cta: 'Conhecer os cursos', href: '/cursos', image: '/dolly-course1.jpg', doneLabel: 'Inscrito',
  },
  {
    id: 'retiro', emoji: '🏝️', title: 'Retiro em Itamambuca',
    pitch: 'Dias de praia, mata e cozinha com a Dolly, no lugar onde tudo isso nasce.',
    cta: 'Ver os retiros', href: '/retreats', image: '/retreats/Beach shot Itamambuca.webp', doneLabel: 'Conversando',
  },
];

export function trailDone(j: Journey | null, subscriber: boolean): Record<StepId, boolean> {
  return {
    caixa: !!j && j.paid_boxes > 0,
    assinatura: subscriber,
    eventos: !!j && j.paid_events + j.event_quotes > 0,
    curso: !!j && j.course_inquiries > 0,
    retiro: !!j && j.retreat_inquiries > 0,
  };
}
