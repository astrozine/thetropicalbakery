/**
 * The admin inbox works like a mail client: every message sits in one of four places.
 * The flows in InboxFeed.tsx keep their own detailed steps (Contatado, Em Preparo, ...);
 * this file says which of the four places each step belongs to, and when a message
 * deserves a red flag. Pure functions, no imports, so anything can use them.
 */

export type Bucket = 'attention' | 'progress' | 'done' | 'closed';

export const BUCKET_ORDER: Bucket[] = ['attention', 'progress', 'done', 'closed'];

export const BUCKETS: Record<Bucket, { label: string; tab: string; icon: string; color: string; bg: string; hint: string; empty: string }> = {
  attention: {
    label: 'Precisa de você', tab: 'Precisa de você', icon: '🔔', color: '#c0392b', bg: '#fdecea',
    hint: 'Chegou e ninguém respondeu ainda.', empty: 'Tudo em dia! Nada esperando por você. 🎉',
  },
  progress: {
    label: 'Em andamento', tab: 'Em andamento', icon: '🔄', color: '#8a6d1f', bg: '#fdf3d9',
    hint: 'Você já está cuidando disto.', empty: 'Nada em andamento agora.',
  },
  done: {
    label: 'Concluído', tab: 'Concluídos', icon: '✅', color: '#0b6b3a', bg: '#e6f4ec',
    hint: 'Resolvido, sem mais nada a fazer.', empty: 'Nenhum item concluído ainda.',
  },
  closed: {
    label: 'Arquivado', tab: 'Arquivados', icon: '🗄️', color: '#6c757d', bg: '#f1f2f6',
    hint: 'Guardado ou cancelado, fora do caminho.', empty: 'Nada arquivado.',
  },
};

/** Statuses that put a message in "closed" whatever its flow says. */
export const CLOSED_STATUSES = ['archived', 'cancelled'];

/**
 * First step of the flow = waiting for you, last step = done, anything between = in progress.
 * `cancelled` is not a step to walk through, so it is ignored when finding the last one.
 */
export function bucketOf(flow: { status: string }[], status: string): Bucket {
  if (CLOSED_STATUSES.includes(status)) return 'closed';
  const steps = flow.filter(f => f.status !== 'cancelled');
  const idx = steps.findIndex(f => f.status === status);
  if (idx <= 0) return 'attention';
  if (idx === steps.length - 1) return 'done';
  return 'progress';
}

export interface Urgency {
  /** 'urgent' = act today (red); 'late' = has been waiting too long (orange). */
  level: 'urgent' | 'late';
  text: string;
}

const DAY = 86400000;

/**
 * When a message needs a red flag.
 *  - an order whose delivery/pickup day is today, tomorrow or already gone, and it has not left yet
 *  - anything still waiting for a first answer after a day or more
 */
export function urgencyOf(opts: {
  bucket: Bucket;
  status: string;
  createdAt: string;
  /** Delivery or pickup day of an order, 'YYYY-MM-DD'. */
  dueDate?: string | null;
  pickup?: boolean;
  now?: number;
}): Urgency | null {
  const now = opts.now ?? Date.now();
  const { bucket, status } = opts;

  if ((bucket === 'attention' || bucket === 'progress') && opts.dueDate && status !== 'shipped') {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    const days = Math.round((new Date(opts.dueDate + 'T00:00:00').getTime() - start.getTime()) / DAY);
    const word = opts.pickup ? 'Retirada' : 'Entrega';
    const left = opts.pickup ? 'ainda não está pronta' : 'ainda não saiu';
    if (Number.isFinite(days)) {
      if (days < 0) return { level: 'urgent', text: `${word} era ${days === -1 ? 'ontem' : `há ${-days} dias`} e ${left}` };
      if (days === 0) return { level: 'urgent', text: `${word} é hoje e ${left}` };
      if (days === 1) return { level: 'urgent', text: `${word} é amanhã e ${left}` };
    }
  }

  if (bucket === 'attention') {
    const t = new Date(opts.createdAt).getTime();
    const days = Math.floor((now - t) / DAY);
    if (Number.isFinite(days) && days >= 1) {
      return { level: 'late', text: days === 1 ? 'Sem resposta há 1 dia' : `Sem resposta há ${days} dias` };
    }
  }

  return null;
}

/** Sorting weight: red flags first, then late, then the rest. */
export const urgencyRank = (u: Urgency | null) => (u ? (u.level === 'urgent' ? 0 : 1) : 2);
