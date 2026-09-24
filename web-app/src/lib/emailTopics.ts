/**
 * What we may e-mail people about, grouped the way the people themselves think
 * about us: someone who once ordered a box does not want partner-programme news,
 * and a hotel manager does not want "your box arrives tomorrow".
 *
 * Each topic is a separate opt-out on /preferencias, so nobody has to leave
 * everything just to stop one kind of message.
 *
 * Topic ids and tag names are also used in migration_15_email_preferences.sql.
 */

/** Lists a contact can belong to. A topic reaches a person only if their tags match. */
export type ContactTag = 'cliente' | 'assinante' | 'eventos' | 'cursos' | 'retiros' | 'parceiro' | 'candidato';

export const TAG_LABELS: Record<ContactTag, string> = {
  cliente: 'Cliente',
  assinante: 'Assinante',
  eventos: 'Eventos / atacado',
  cursos: 'Cursos',
  retiros: 'Retiros',
  parceiro: 'Parceria B2B',
  candidato: 'Candidato a vaga',
};

export interface EmailTopic {
  id: string;
  /** Short name the person sees on the preferences page. */
  label: string;
  /** Plain-words explanation of what lands in their inbox. */
  description: string;
  emoji: string;
  /** Who it's for, in our own words (shown in the admin). */
  audience: string;
  /**
   * Tags that may receive this topic. Empty = anyone on the list.
   */
  tags: ContactTag[];
  /**
   * Transactional messages answer something the person just did (an order, a
   * sign-up, a password link). They are never marketing, so they ignore
   * unsubscribes and are not listed on the preferences page.
   */
  transactional?: boolean;
}

export const EMAIL_TOPICS: EmailTopic[] = [
  {
    id: 'caixa',
    label: 'Caixa de Degustação',
    description: 'Quando abrimos datas de entrega e quando a caixa da semana entra no ar.',
    emoji: '📦',
    audience: 'Clientes e interessados na caixa',
    tags: [],
  },
  {
    id: 'assinatura',
    label: 'Minha assinatura',
    description: 'Avisos sobre as suas entregas, pausas e mudanças no seu plano.',
    emoji: '🔁',
    audience: 'Assinantes',
    tags: ['assinante'],
  },
  {
    id: 'eventos',
    label: 'Eventos e encomendas grandes',
    description: 'Novidades do Menu de Eventos, prazos de temporada e ideias para festas e casamentos.',
    emoji: '🎉',
    audience: 'Quem pediu orçamento de evento / atacado',
    tags: ['eventos'],
  },
  {
    id: 'cursos',
    label: 'Cursos e retiros',
    description: 'Novas turmas, datas de retiro e vagas que abrem em Itamambuca.',
    emoji: '🎓',
    audience: 'Interessados em cursos e retiros',
    tags: ['cursos', 'retiros'],
  },
  {
    id: 'parcerias',
    label: 'Parcerias (hotéis, pousadas, restaurantes)',
    description: 'Novidades do programa de parceria, reposição e comissões.',
    emoji: '🤝',
    audience: 'Parceiros B2B e afiliados',
    tags: ['parceiro'],
  },
  {
    id: 'equipe',
    label: 'Vagas e trabalho',
    description: 'Quando abrimos vagas na cozinha, nas entregas ou nos retiros.',
    emoji: '🧑‍🍳',
    audience: 'Candidatos e equipe',
    tags: ['candidato'],
  },
  {
    id: 'novidades',
    label: 'Novidades da padaria',
    description: 'Uma carta ocasional: receitas, o que está na estação, o que estamos criando.',
    emoji: '🌴',
    audience: 'Todo mundo na lista',
    tags: [],
  },

  // --- Transactional: never unsubscribable, not shown on the preferences page ---
  {
    id: 'pedido',
    label: 'Confirmações de pedido',
    description: 'Recibo e status do que você pediu.',
    emoji: '🧾',
    audience: 'Quem acabou de pedir',
    tags: [],
    transactional: true,
  },
  {
    id: 'conta',
    label: 'Sua conta',
    description: 'Entrada no site e avisos de segurança.',
    emoji: '🔑',
    audience: 'Quem tem conta',
    tags: [],
    transactional: true,
  },
];

export const topicById = (id: string) => EMAIL_TOPICS.find(t => t.id === id);

/** The topics a person can switch off. */
export const MARKETING_TOPICS = EMAIL_TOPICS.filter(t => !t.transactional);

export interface ContactPrefs {
  opted_out?: string[] | null;
  unsubscribed_all?: boolean | null;
  tags?: string[] | null;
}

/**
 * May we send this topic to this contact?
 * Transactional messages always go. Marketing needs: not globally unsubscribed,
 * not opted out of the topic, and (when the topic is audience-specific) a matching tag.
 */
export function canReceive(topicId: string, contact: ContactPrefs): boolean {
  const topic = topicById(topicId);
  if (!topic) return false;
  if (topic.transactional) return true;
  if (contact.unsubscribed_all) return false;
  if ((contact.opted_out || []).includes(topicId)) return false;
  if (topic.tags.length === 0) return true;
  const tags = contact.tags || [];
  return topic.tags.some(t => tags.includes(t));
}
