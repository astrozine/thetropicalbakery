/** Shared types and labels for the two private areas: partners (B2B) and workers (equipe). */

export type PartnerKind = 'hotel' | 'pousada' | 'airbnb' | 'restaurante' | 'padaria' | 'afiliado' | 'outro';
export type PartnerStatus = 'pendente' | 'ativo' | 'pausado';

export interface Partner {
  id: string;
  business_name: string;
  kind: PartnerKind;
  contact_name: string | null;
  email: string;
  whatsapp: string | null;
  address: string | null;
  neighborhood: string | null;
  commission_pct: number;
  affiliate_code: string | null;
  monthly_goal: number;
  status: PartnerStatus;
  notes: string | null;
  portal_message: string | null;
  created_at: string;
}

export interface RestockRequest {
  id: string;
  partner_id: string;
  items: string;
  notes: string | null;
  wanted_date: string | null;
  status: 'novo' | 'confirmado' | 'entregue' | 'cancelado';
  created_at: string;
}

export const PARTNER_KINDS: { id: PartnerKind; label: string; emoji: string }[] = [
  { id: 'hotel', label: 'Hotel', emoji: '🏨' },
  { id: 'pousada', label: 'Pousada', emoji: '🌺' },
  { id: 'airbnb', label: 'Airbnb / casa de aluguel', emoji: '🏡' },
  { id: 'restaurante', label: 'Restaurante', emoji: '🍽️' },
  { id: 'padaria', label: 'Padaria / café', emoji: '🥐' },
  { id: 'afiliado', label: 'Afiliado (indica e ganha)', emoji: '🤝' },
  { id: 'outro', label: 'Outro', emoji: '✨' },
];

export const partnerKind = (id: string) => PARTNER_KINDS.find(k => k.id === id) ?? PARTNER_KINDS[PARTNER_KINDS.length - 1];

export const PARTNER_STATUS: Record<PartnerStatus, { label: string; color: string; bg: string; hint: string }> = {
  pendente: { label: 'Aguardando aprovação', color: '#8a5a00', bg: '#fff4e0', hint: 'A Dolly vai confirmar sua parceria em breve.' },
  ativo: { label: 'Parceria ativa', color: '#1e6b3c', bg: '#f0faf4', hint: 'Tudo em ordem — pode pedir reposição quando precisar.' },
  pausado: { label: 'Pausada', color: '#7f8c8d', bg: '#f1f2f6', hint: 'A parceria está pausada. Fale com a gente para retomar.' },
};

export const RESTOCK_STATUS: Record<RestockRequest['status'], { label: string; color: string; bg: string }> = {
  novo: { label: 'Pedido enviado', color: '#8a5a00', bg: '#fff4e0' },
  confirmado: { label: 'Confirmado', color: '#1a5276', bg: '#eaf2f8' },
  entregue: { label: 'Entregue', color: '#1e6b3c', bg: '#f0faf4' },
  cancelado: { label: 'Cancelado', color: '#c0392b', bg: '#fdecea' },
};

// ---------------------------------------------------------------- workers

export type WorkerRole = 'cozinha' | 'entregas' | 'atendimento' | 'retiros' | 'limpeza' | 'outro';

export interface Worker {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  role: WorkerRole;
  hourly_rate: number;
  monthly_wage: number;
  status: 'ativo' | 'inativo';
  notes: string | null;
  portal_message: string | null;
  created_at: string;
}

export interface WorkShift {
  id: string;
  worker_id: string;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  task: string | null;
  status: 'agendado' | 'feito' | 'faltou' | 'cancelado';
  paid: boolean;
  notes: string | null;
}

export const WORKER_ROLES: { id: WorkerRole; label: string; emoji: string }[] = [
  { id: 'cozinha', label: 'Cozinha / confeitaria', emoji: '🧑‍🍳' },
  { id: 'entregas', label: 'Entregas', emoji: '🛵' },
  { id: 'atendimento', label: 'Atendimento', emoji: '💬' },
  { id: 'retiros', label: 'Retiros e casa', emoji: '🏝️' },
  { id: 'limpeza', label: 'Limpeza', emoji: '🧼' },
  { id: 'outro', label: 'Outro', emoji: '✨' },
];

export const workerRole = (id: string) => WORKER_ROLES.find(r => r.id === id) ?? WORKER_ROLES[WORKER_ROLES.length - 1];

export const SHIFT_STATUS: Record<WorkShift['status'], { label: string; color: string; bg: string; emoji: string }> = {
  agendado: { label: 'Agendado', color: '#1a5276', bg: '#eaf2f8', emoji: '📅' },
  feito: { label: 'Feito', color: '#1e6b3c', bg: '#f0faf4', emoji: '✅' },
  faltou: { label: 'Faltou', color: '#c0392b', bg: '#fdecea', emoji: '⚠️' },
  cancelado: { label: 'Cancelado', color: '#7f8c8d', bg: '#f1f2f6', emoji: '—' },
};

/** Hours in one shift, from its start and end time. */
export function shiftHours(s: WorkShift): number {
  if (!s.start_time || !s.end_time) return 0;
  const [sh, sm] = s.start_time.split(':').map(Number);
  const [eh, em] = s.end_time.split(':').map(Number);
  const mins = (eh * 60 + em) - (sh * 60 + sm);
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0;
}

/**
 * What a month of shifts is worth. An hourly worker is paid for the hours they
 * actually did; a monthly wage is shown as-is, because it doesn't depend on hours.
 */
export function monthPay(worker: Worker, shifts: WorkShift[]) {
  const done = shifts.filter(s => s.status === 'feito');
  const hours = done.reduce((n, s) => n + shiftHours(s), 0);
  const fromHours = Math.round(hours * (worker.hourly_rate || 0) * 100) / 100;
  const unpaidHours = done.filter(s => !s.paid).reduce((n, s) => n + shiftHours(s), 0);
  return {
    hours,
    shifts: done.length,
    pay: worker.monthly_wage > 0 ? worker.monthly_wage : fromHours,
    /** Only meaningful for hourly workers. */
    pending: worker.monthly_wage > 0 ? 0 : Math.round(unpaidHours * (worker.hourly_rate || 0) * 100) / 100,
    isMonthly: worker.monthly_wage > 0,
  };
}

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

export const MONTH_NAMES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
