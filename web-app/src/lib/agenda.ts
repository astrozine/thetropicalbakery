/**
 * Minha Conta's agenda: what a customer has with Dolly (classes, retreats, events-menu orders, proposals,
 * a business partnership). Data comes from my_agenda() (migration_50_my_agenda.sql). Pure: no browser or server imports.
 */

export type RequestStage = 'new' | 'contacted' | 'scheduling' | 'scheduled' | 'resolved' | string;

export interface AgendaRequest {
  id: string;
  created_at: string;
  kind: 'curso' | 'retiro' | string;
  interest: string | null;
  date: string | null;
  group_size: number | null;
  stage: RequestStage;
}

export interface AgendaProposal {
  id: string;
  created_at: string;
  kind: 'curso' | 'retiro' | string;
  title: string;
  dates_label: string | null;
  price: number;
  expires_on: string | null;
  paid: boolean;
}

export interface AgendaRetreat {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  courses: string[] | null;
  status: 'reservado' | 'confirmado' | string;
  total: number | null;
  deposit_paid: number | null;
  room: string | null;
}

export type EventStage = 'awaiting_payment' | 'confirmed' | 'preparing' | 'ready' | 'done' | 'quote' | 'cancelled';

export interface AgendaEvent {
  id: string;
  created_at: string;
  requested_date: string | null;
  items_summary: string | null;
  total_price: number | null;
  kind: 'events' | 'quote';
  stage: EventStage;
}

export interface AgendaPartner {
  business_name: string;
  kind: string;
  status: 'pendente' | 'ativo' | 'pausado' | string;
  portal_message: string | null;
  restocks: { items: string; wanted_date: string | null; status: string; created_at: string }[];
}

/** What my_agenda() returns. A section is null when its table does not exist yet. */
export interface Agenda {
  requests: AgendaRequest[] | null;
  proposals: AgendaProposal[] | null;
  retreats: AgendaRetreat[] | null;
  events: AgendaEvent[] | null;
  partner: AgendaPartner | null;
}

export type Tone = 'wait' | 'ok' | 'info' | 'quiet';

export const TONE: Record<Tone, { color: string; bg: string }> = {
  wait: { color: '#7a4a00', bg: '#fff4e5' },
  ok: { color: '#0b6b3a', bg: '#e6f4ec' },
  info: { color: '#4a5568', bg: '#edf2f7' },
  quiet: { color: '#6b5d53', bg: '#f1ece3' },
};

export const REQUEST_STAGE: Record<string, { label: string; tone: Tone }> = {
  new: { label: 'Pedido recebido', tone: 'info' },
  contacted: { label: 'A Dolly falou com você', tone: 'info' },
  scheduling: { label: 'Combinando a data', tone: 'wait' },
  scheduled: { label: 'Confirmado', tone: 'ok' },
  resolved: { label: 'Resolvido', tone: 'quiet' },
};

export const EVENT_STAGE: Record<EventStage, { label: string; tone: Tone }> = {
  quote: { label: 'Orçamento pedido', tone: 'info' },
  awaiting_payment: { label: 'Aguardando pagamento', tone: 'wait' },
  confirmed: { label: 'Pagamento confirmado', tone: 'ok' },
  preparing: { label: 'Em preparo', tone: 'ok' },
  ready: { label: 'Saiu para entrega', tone: 'ok' },
  done: { label: 'Entregue', tone: 'quiet' },
  cancelled: { label: 'Cancelado', tone: 'quiet' },
};

export const PARTNER_STATUS: Record<string, { label: string; tone: Tone }> = {
  pendente: { label: 'Em análise', tone: 'wait' },
  ativo: { label: 'Parceria ativa', tone: 'ok' },
  pausado: { label: 'Pausada', tone: 'quiet' },
};

export const RESTOCK_STATUS: Record<string, string> = {
  novo: 'pedido enviado',
  confirmado: 'confirmado',
  entregue: 'entregue',
};

/** Everything Dolly offers, in ladder order. The account page lists these under "Com a Dolly". */
export const DOLLY_OFFERS: { id: string; emoji: string; title: string; line: string; href: string }[] = [
  { id: 'curso', emoji: '👩‍🍳', title: 'Aula na cozinha da Dolly', line: 'Três horas de mão na massa em Itamambuca', href: '/cursos' },
  { id: 'coaching', emoji: '💬', title: 'Coaching de alimentação', line: 'Conversas com a Dolly sobre comer bem, no seu ritmo', href: '/coaching' },
  { id: 'eventos', emoji: '🎉', title: 'Menu de eventos', line: 'Doces para festas, casamentos e encontros', href: '/menu' },
  { id: 'retiro', emoji: '🌿', title: 'Retiro em Itamambuca', line: 'Dias de comida, mar e descanso com a Dolly', href: '/retreats' },
  { id: 'parceria', emoji: '🤝', title: 'Parceria para empresas', line: 'Doces da Dolly no seu hotel, pousada ou café', href: '/b2b' },
  { id: 'ebook', emoji: '📖', title: 'E-book Sweet Escape', line: 'As receitas da Dolly para fazer em casa', href: '/sweet-escape/pt' },
];
