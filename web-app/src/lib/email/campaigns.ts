/**
 * The e-mails we actually send, one definition each: who it's for, what it says,
 * and the key that stops the same person getting it twice.
 *
 * Pure string building, so the admin can preview exactly what will land.
 */

import { SITE_URL, bulletList, esc, paragraphs } from './layout';
import type { ContactTag } from '@/lib/emailTopics';

export type FieldType = 'text' | 'textarea' | 'date' | 'number';

export interface CampaignField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  help?: string;
  required?: boolean;
}

export type CampaignValues = Record<string, string>;

export interface CampaignContent {
  preheader: string;
  heading: string;
  body: string;
  cta?: { label: string; href: string };
  note?: string;
}

export interface Campaign {
  id: string;
  name: string;
  emoji: string;
  /** Topic id from emailTopics.ts — decides who may receive it. */
  topic: string;
  /** Extra tag filter on top of the topic, when the audience is narrower. */
  tags?: ContactTag[];
  description: string;
  /** Line explaining to the reader why they got it. */
  reason: string;
  fields: CampaignField[];
  subject: (v: CampaignValues) => string;
  /** Unique per send. The same key is never delivered twice to one address. */
  messageKey: (v: CampaignValues) => string;
  build: (v: CampaignValues) => CampaignContent;
}

// ---------------------------------------------------------------- helpers

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-09-26" -> "26 de setembro" */
export const prettyDate = (iso: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((iso || '').trim());
  if (!m) return (iso || '').trim();
  return `${Number(m[3])} de ${MONTHS[Number(m[2]) - 1]}`;
};

/** A comma/newline separated list of dates -> "26 de setembro e 3 de outubro" */
export const prettyDateList = (raw: string) => {
  const parts = (raw || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean).map(prettyDate);
  if (parts.length <= 1) return parts[0] || '';
  return `${parts.slice(0, -1).join(', ')} e ${parts[parts.length - 1]}`;
};

const listFrom = (raw: string) => (raw || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);

const slug = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);

const url = (path: string) => `${SITE_URL}${path}`;

// ---------------------------------------------------------------- campaigns

export const CAMPAIGNS: Campaign[] = [
  {
    id: 'delivery-dates',
    name: 'Novas datas de entrega',
    emoji: '📅',
    topic: 'caixa',
    description: 'Avisa que abriram dias novos de entrega da Caixa de Degustação.',
    reason: 'Você recebe este e-mail porque pediu para saber das nossas caixas.',
    fields: [
      { name: 'dates', label: 'Datas (uma por linha, formato AAAA-MM-DD)', type: 'textarea', required: true, placeholder: '2026-09-26\n2026-10-03' },
    ],
    subject: v => `Novas datas de entrega abertas: ${prettyDateList(v.dates)}`,
    messageKey: v => `delivery-dates:${listFrom(v.dates).sort().join(',')}`,
    build: v => ({
      preheader: `Garanta sua caixa para ${prettyDateList(v.dates)}.`,
      heading: 'Abrimos novas datas de entrega',
      body:
        paragraphs(
          `A Caixa de Degustação já pode ser entregue em ${prettyDateList(v.dates)}. ` +
          `Cada edição é feita à mão, em quantidade limitada — quando acaba, acaba.`,
        ) + bulletList(listFrom(v.dates).map(d => `Entrega em ${prettyDate(d)}`)),
      cta: { label: 'Garantir minha caixa', href: url('/caixas') },
      note: 'Entregas em Itamambuca, praias vizinhas e Ubatuba.',
    }),
  },

  {
    id: 'box-live',
    name: 'A caixa da semana entrou no ar',
    emoji: '📦',
    topic: 'caixa',
    description: 'Anuncia a edição da semana, com os doces que vão dentro.',
    reason: 'Você recebe este e-mail porque pediu para saber das nossas caixas.',
    fields: [
      { name: 'title', label: 'Nome da edição', type: 'text', required: true, placeholder: 'Chegada da Primavera: Sensações Amarelas' },
      { name: 'intro', label: 'Sobre esta edição', type: 'textarea', placeholder: 'Uma ou duas frases sobre o tema da semana.' },
      { name: 'treats', label: 'Doces (um por linha)', type: 'textarea', placeholder: 'Tortinha de maracujá\nTrufa de cacau e castanha' },
      { name: 'quantity', label: 'Quantas caixas existem', type: 'number', placeholder: '30' },
    ],
    subject: v => `Já está no ar: ${v.title}`,
    messageKey: v => `box-live:${slug(v.title)}`,
    build: v => ({
      preheader: v.intro?.slice(0, 90) || 'A edição desta semana já pode ser reservada.',
      heading: v.title,
      body:
        paragraphs(v.intro || 'A edição desta semana já está pronta para reserva.') +
        (listFrom(v.treats).length ? `<p style="color:#a6832b;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;margin:0 0 10px;">O que vem dentro</p>${bulletList(listFrom(v.treats))}` : '') +
        (v.quantity ? paragraphs(`São apenas ${esc(v.quantity)} caixas desta edição.`) : ''),
      cta: { label: 'Ver a caixa desta semana', href: url('/caixas') },
      note: 'Cada caixa é vegana, sem glúten e sem açúcar refinado.',
    }),
  },

  {
    id: 'box-last-chance',
    name: 'Últimas caixas da edição',
    emoji: '⏳',
    topic: 'caixa',
    description: 'Empurrãozinho quando restam poucas unidades.',
    reason: 'Você recebe este e-mail porque pediu para saber das nossas caixas.',
    fields: [
      { name: 'title', label: 'Nome da edição', type: 'text', required: true },
      { name: 'remaining', label: 'Quantas restam', type: 'number', required: true, placeholder: '5' },
    ],
    subject: v => `Restam ${v.remaining} caixas de ${v.title}`,
    messageKey: v => `box-last-chance:${slug(v.title)}`,
    build: v => ({
      preheader: `Últimas unidades de ${v.title}.`,
      heading: `Últimas ${esc(v.remaining)} caixas`,
      body: paragraphs(
        `A edição ${v.title} está quase no fim: restam ${v.remaining} caixas. ` +
        `Como tudo é feito em uma cozinha só, não dá para repor no meio da semana.`,
      ),
      cta: { label: 'Pegar a minha', href: url('/caixas') },
    }),
  },

  {
    id: 'waitlist-turn',
    name: 'Chegou a sua vez (fila de espera)',
    emoji: '🎟️',
    topic: 'caixa',
    description: 'Para quem estava na fila esperando o próximo lote.',
    reason: 'Você recebe este e-mail porque entrou na fila de espera da Caixa de Degustação.',
    fields: [
      { name: 'batch', label: 'Nome ou data do lote', type: 'text', required: true, placeholder: 'Lote de 3 de outubro' },
      { name: 'deadline', label: 'Até quando ela pode reservar', type: 'text', placeholder: 'até quinta-feira' },
    ],
    subject: () => 'Chegou a sua vez na fila 🎟️',
    messageKey: v => `waitlist-turn:${slug(v.batch)}`,
    build: v => ({
      preheader: 'Guardamos uma caixa para você.',
      heading: 'Chegou a sua vez',
      body: paragraphs(
        `Abriu vaga no ${v.batch} e você é a próxima pessoa da fila. ` +
        (v.deadline ? `Guardamos a caixa ${v.deadline}; depois disso ela passa para a próxima pessoa.` : 'Reserve a sua antes que o lote feche.'),
      ),
      cta: { label: 'Reservar minha caixa', href: url('/caixas') },
    }),
  },

  {
    id: 'subscriber-delivery',
    name: 'Sua caixa chega em breve (assinantes)',
    emoji: '🔁',
    topic: 'assinatura',
    tags: ['assinante'],
    description: 'Lembrete carinhoso para quem assina, antes da entrega.',
    reason: 'Você recebe este e-mail porque assina a Caixa de Degustação.',
    fields: [
      { name: 'date', label: 'Data da entrega (AAAA-MM-DD)', type: 'date', required: true },
      { name: 'preview', label: 'Uma prévia do que vem (opcional)', type: 'textarea' },
    ],
    subject: v => `Sua caixa chega ${prettyDate(v.date)} 🌴`,
    messageKey: v => `subscriber-delivery:${(v.date || '').trim()}`,
    build: v => ({
      preheader: `Entrega em ${prettyDate(v.date)}.`,
      heading: `Sua caixa chega ${prettyDate(v.date)}`,
      body:
        paragraphs(
          `A Dolly já está preparando a sua caixa da semana. Ela sai fresquinha e chega em ${prettyDate(v.date)}.`,
        ) + (v.preview ? paragraphs(v.preview) : ''),
      cta: { label: 'Ver minha assinatura', href: url('/minha-conta') },
      note: 'Precisa pular esta semana ou mudar o endereço? É só responder no WhatsApp.',
    }),
  },

  {
    id: 'events-menu',
    name: 'Menu de Eventos atualizado',
    emoji: '🎉',
    topic: 'eventos',
    tags: ['eventos'],
    description: 'Para quem organiza casamentos, festas e encomendas grandes.',
    reason: 'Você recebe este e-mail porque pediu um orçamento de evento com a gente.',
    fields: [
      { name: 'season', label: 'Temporada ou motivo', type: 'text', required: true, placeholder: 'Verão 2027' },
      { name: 'intro', label: 'Texto de abertura', type: 'textarea', placeholder: 'O que mudou no menu, novidades, prazos.' },
      { name: 'highlights', label: 'Destaques (um por linha)', type: 'textarea' },
      { name: 'deadline', label: 'Prazo para encomendar (opcional)', type: 'text', placeholder: 'até 15 de dezembro' },
    ],
    subject: v => `Menu de Eventos — ${v.season}`,
    messageKey: v => `events-menu:${slug(v.season)}`,
    build: v => ({
      preheader: `Novidades do Menu de Eventos para ${v.season}.`,
      heading: `Menu de Eventos — ${v.season}`,
      body:
        paragraphs(v.intro || 'Atualizamos o Menu de Eventos com as criações desta temporada.') +
        bulletList(listFrom(v.highlights)) +
        (v.deadline ? paragraphs(`Para garantir produção, encomende ${v.deadline}.`) : ''),
      cta: { label: 'Ver o Menu de Eventos', href: url('/menu') },
      note: 'Tudo vegano, sem glúten e sem açúcar refinado — seus convidados com restrição comem igual a todo mundo.',
    }),
  },

  {
    id: 'course-open',
    name: 'Curso com vagas abertas',
    emoji: '🎓',
    topic: 'cursos',
    tags: ['cursos'],
    description: 'Nova turma de curso em Itamambuca.',
    reason: 'Você recebe este e-mail porque demonstrou interesse nos nossos cursos.',
    fields: [
      { name: 'course', label: 'Nome do curso', type: 'text', required: true },
      { name: 'date', label: 'Data (AAAA-MM-DD)', type: 'date', required: true },
      { name: 'spots', label: 'Quantas vagas', type: 'number', placeholder: '8' },
      { name: 'intro', label: 'Sobre a turma', type: 'textarea' },
    ],
    subject: v => `Nova turma: ${v.course} — ${prettyDate(v.date)}`,
    messageKey: v => `course-open:${slug(v.course)}:${(v.date || '').trim()}`,
    build: v => ({
      preheader: `${v.course} em ${prettyDate(v.date)}.`,
      heading: `${v.course}`,
      body:
        paragraphs(v.intro || `Abrimos uma nova turma para ${prettyDate(v.date)}.`) +
        bulletList([`Data: ${prettyDate(v.date)}`, ...(v.spots ? [`Vagas: ${v.spots}`] : []), 'Itamambuca, Ubatuba']),
      cta: { label: 'Quero minha vaga', href: url('/cursos') },
    }),
  },

  {
    id: 'retreat-dates',
    name: 'Retiro com datas abertas',
    emoji: '🏝️',
    topic: 'cursos',
    tags: ['retiros', 'cursos'],
    description: 'Datas de retiro na casa em Itamambuca.',
    reason: 'Você recebe este e-mail porque demonstrou interesse nos nossos retiros.',
    fields: [
      { name: 'period', label: 'Período', type: 'text', required: true, placeholder: '12 a 16 de novembro' },
      { name: 'focus', label: 'Foco do retiro', type: 'text', placeholder: 'Saúde & Nutrição' },
      { name: 'intro', label: 'Sobre o retiro', type: 'textarea' },
    ],
    subject: v => `Retiro em Itamambuca: ${v.period}`,
    messageKey: v => `retreat-dates:${slug(v.period)}`,
    build: v => ({
      preheader: `Retiro de ${v.period} em Itamambuca.`,
      heading: `Retiro em Itamambuca — ${v.period}`,
      body:
        paragraphs(v.intro || 'Abrimos novas datas na nossa casa a 100 metros da praia.') +
        bulletList([`Quando: ${v.period}`, ...(v.focus ? [`Foco: ${v.focus}`] : []), 'Comida vegana, sem glúten e sem açúcar refinado', 'Trilhas, cachoeiras e praia']),
      cta: { label: 'Ver os retiros', href: url('/retreats') },
    }),
  },

  {
    id: 'partner-news',
    name: 'Novidades para parceiros',
    emoji: '🤝',
    topic: 'parcerias',
    tags: ['parceiro'],
    description: 'Para hotéis, pousadas, restaurantes, padarias e afiliados.',
    reason: 'Você recebe este e-mail porque é (ou pediu para ser) parceiro da Tropical Bakery.',
    fields: [
      { name: 'title', label: 'Assunto da novidade', type: 'text', required: true, placeholder: 'Nova linha para o café da manhã' },
      { name: 'body', label: 'Mensagem', type: 'textarea', required: true },
      { name: 'ctaLabel', label: 'Texto do botão', type: 'text', placeholder: 'Ver as parcerias' },
      { name: 'ctaPath', label: 'Página do botão', type: 'text', placeholder: '/b2b/hotels' },
    ],
    subject: v => v.title,
    messageKey: v => `partner-news:${slug(v.title)}`,
    build: v => ({
      preheader: v.body?.slice(0, 90) || v.title,
      heading: v.title,
      body: paragraphs(v.body),
      cta: { label: v.ctaLabel || 'Ver as parcerias', href: url(v.ctaPath || '/b2b/hotels') },
      note: 'Quer conversar sobre volumes e margens? É só responder no WhatsApp.',
    }),
  },

  {
    id: 'job-opening',
    name: 'Vaga aberta',
    emoji: '🧑‍🍳',
    topic: 'equipe',
    tags: ['candidato'],
    description: 'Para quem já se candidatou e quer saber de novas vagas.',
    reason: 'Você recebe este e-mail porque se candidatou a uma vaga com a gente.',
    fields: [
      { name: 'role', label: 'Vaga', type: 'text', required: true, placeholder: 'Auxiliar de confeitaria' },
      { name: 'details', label: 'Detalhes (horário, tipo de contrato…)', type: 'textarea' },
    ],
    subject: v => `Vaga aberta: ${v.role}`,
    messageKey: v => `job-opening:${slug(v.role)}`,
    build: v => ({
      preheader: `Estamos contratando: ${v.role}.`,
      heading: `Vaga aberta: ${v.role}`,
      body: paragraphs(v.details || 'Abrimos uma vaga nova e lembramos de você.'),
      cta: { label: 'Ver a vaga e se candidatar', href: url('/trabalhe-conosco') },
    }),
  },

  {
    id: 'newsletter',
    name: 'Carta da padaria (texto livre)',
    emoji: '🌴',
    topic: 'novidades',
    description: 'Uma carta aberta para toda a lista: receitas, estação, bastidores.',
    reason: 'Você recebe este e-mail porque pediu para acompanhar as novidades da Tropical Bakery.',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'body', label: 'Texto (linhas em branco separam parágrafos)', type: 'textarea', required: true },
      { name: 'ctaLabel', label: 'Texto do botão (opcional)', type: 'text' },
      { name: 'ctaPath', label: 'Página do botão', type: 'text', placeholder: '/caixas' },
    ],
    subject: v => v.title,
    messageKey: v => `newsletter:${slug(v.title)}`,
    build: v => ({
      preheader: v.body?.slice(0, 90) || v.title,
      heading: v.title,
      body: paragraphs(v.body),
      cta: v.ctaLabel ? { label: v.ctaLabel, href: url(v.ctaPath || '/') } : undefined,
    }),
  },
];

export const campaignById = (id: string) => CAMPAIGNS.find(c => c.id === id);
