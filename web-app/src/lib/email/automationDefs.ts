/**
 * The always-on rules: what the scheduler watches, and what it sends when it
 * sees it.
 *
 * Pure definitions, no database and no server-only imports, so the admin page
 * can render the list and the cron route can act on it from the same source.
 * The row in `email_automations` (migration 26) holds only the knobs and the
 * on/off switch; everything a person reads lives here.
 *
 * Adding a rule: add it here, give it a branch in automations.ts, and add a
 * row to the seed in migration_26_email_scheduler.sql.
 */

export type AutomationKnob = 'threshold' | 'offsetDays';

export interface AutomationDef {
  /** Also the primary key in email_automations. */
  id: string;
  name: string;
  emoji: string;
  /** Which campaign it sends (src/lib/email/campaigns.ts). */
  campaignId: string;
  /** What has to happen for it to fire, in the admin's words. */
  watches: string;
  /** What the customer ends up getting. */
  sends: string;
  /** Which knobs this rule actually uses. */
  knobs: AutomationKnob[];
  /** Label for each knob, because "5" alone means nothing. */
  knobLabel: Partial<Record<AutomationKnob, string>>;
}

export const AUTOMATIONS: AutomationDef[] = [
  {
    id: 'box-live',
    name: 'Caixa nova entrou no ar',
    emoji: '📦',
    campaignId: 'box-live',
    watches: 'Uma caixa fica ativa e disponível para pedido (inclusive quando a data de abertura chega).',
    sends: 'Anuncia a edição, com os doces que vão dentro, para todo mundo que quer saber das caixas — inclusive quem está na fila de espera.',
    knobs: [],
    knobLabel: {},
  },
  {
    id: 'box-last-chance',
    name: 'Últimas caixas',
    emoji: '⏳',
    campaignId: 'box-last-chance',
    watches: 'O estoque de uma caixa cai até o número que você escolher, e ainda não esgotou.',
    sends: 'Um empurrãozinho dizendo quantas restam.',
    knobs: ['threshold'],
    knobLabel: { threshold: 'Avisar quando restarem' },
  },
  {
    id: 'delivery-dates',
    name: 'Novas datas de entrega',
    emoji: '📅',
    campaignId: 'delivery-dates',
    watches: 'Abrem dias de entrega que ninguém foi avisado ainda (as mesmas datas do botão em Admin › Calendário).',
    sends: 'Avisa as datas novas e marca elas como avisadas, para não repetir.',
    knobs: [],
    knobLabel: {},
  },
  {
    id: 'subscriber-delivery',
    name: 'Lembrete de entrega (assinantes)',
    emoji: '🔁',
    campaignId: 'subscriber-delivery',
    watches: 'Falta o número de dias que você escolher para um dia de entrega aberto.',
    sends: 'Um lembrete carinhoso só para quem assina, com a data da entrega.',
    knobs: ['offsetDays'],
    knobLabel: { offsetDays: 'Avisar quantos dias antes' },
  },
];

export const automationById = (id: string) => AUTOMATIONS.find(a => a.id === id);

/** The row shape in `email_automations`. */
export interface AutomationRow {
  id: string;
  enabled: boolean;
  threshold: number | null;
  offset_days: number | null;
  send_hour: number;
  last_run_at: string | null;
  last_result: string | null;
}
