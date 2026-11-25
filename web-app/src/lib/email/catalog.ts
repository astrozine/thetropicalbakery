import 'server-only';
import { AUTOMATIONS } from './automationDefs';
import { CAMPAIGNS, previewValues, type Campaign, type CampaignValues } from './campaigns';
import { SITE_URL, greeting, type BuiltEmail, type EmailLang } from './layout';
import { orderPaidEmail, orderReceivedEmail, type ReceiptOrder } from './receipts';
import { ebookPaidEmail, ebookReceivedEmail, type EbookReceipt } from './ebookReceipts';
import { freeRecipesEmail } from './funnelMail';
import { brunchConfirmedEmail, brunchReservedEmail, brunchWaitlistEmail } from './brunchMail';
import { appPlusPixEmail, appPlusUnlockedEmail } from './appPlusMail';
import { sampleAlert } from './alerts';
import { EBOOK_LANGS, type EbookLang } from '@/lib/ebookCopy';
import type { BrunchEvent } from '@/lib/brunch';

/**
 * Every e-mail the site sends, with made-up example data, for Admin › E-mails › "Todos os e-mails" (so Andrew can show
 * Dolly what customers actually receive).
 *
 * It builds itself as far as it can:
 * - Every campaign in CAMPAIGNS shows up on its own, including the ones the automations send (free-recipes sequence,
 *   brunch reminders), with the example text of its fields.
 * - The automatic e-mails (receipts, e-book, free recipes, brunch, app) are listed in AUTOMATIC below by the same
 *   `template` id their send writes to `email_sends`. Each one previews through the very builder the send uses
 *   (orderReceivedEmail, ebookPaidEmail, ...), so a change to the words shows here at once.
 * - Anything in `email_sends` whose template is in neither list is reported by the admin page as "sent but not shown
 *   here", so a brand-new e-mail can't hide: add it to AUTOMATIC with its builder and example data.
 */

export interface CatalogVariant { id: string; label: string }

export interface CatalogEntry {
  /** The `template` its sends write to email_sends (campaign id for campaigns). */
  id: string;
  group: CatalogGroup;
  name: string;
  /** When it goes out, in plain words. */
  when: string;
  /** Who it goes to: the customer, or the two of you. */
  to: 'cliente' | 'equipe';
  /** Sent by itself (true) or only when someone presses Enviar in Admin › E-mails. */
  automatic: boolean;
  /** The automation (Admin › E-mails › Agenda) that sends it when switched on, in its own words. */
  rule?: string;
  langs: EmailLang[];
  variants?: CatalogVariant[];
  render: (lang: EmailLang, variant: string) => BuiltEmail;
}

export const GROUPS = [
  'Sweet Escape (e-book)',
  'Receitas grátis',
  'Pedidos, aulas e retiros',
  'Brunch',
  'App Bateu Vontade?',
  'Campanhas para a lista',
  'Avisos para vocês dois',
] as const;
export type CatalogGroup = (typeof GROUPS)[number];

// ---------------------------------------------------------------- example data

const PIX = '00020101021226870014br.gov.bcb.pix2565exemplo.pix.copia.e.cola.da.tropical.bakery5204000053039865802BR6304ABCD';

const eventsOrder = (method: string): ReceiptOrder => ({
  reference: 'ORD1764000EXEMPLO', customerName: 'Maria Souza', customerEmail: 'maria@exemplo.com', method,
  lines: [{ name: 'Brownie de cacau (12 un.)', quantity: 1, unit: 96 }, { name: 'Bliss Balls de frutas vermelhas (20 un.)', quantity: 2, unit: 70 }],
  fee: 15, total: 251, date: '2026-12-12', pixPayload: method === 'pix' ? PIX : null,
});

const courseOrder = (method: string): ReceiptOrder => ({
  reference: 'PRP1764000EXEMPLO', customerName: 'Maria Souza', customerEmail: 'maria@exemplo.com', method,
  summary: 'Aula de doces com a Dolly, 2 pessoas', fee: 0, total: 660, pixPayload: method === 'pix' ? PIX : null,
});

const book = (lang: EmailLang, method: string): EbookReceipt => ({
  reference: 'EBK1764000EXEMPLO', customerName: 'Maria Souza', customerEmail: 'maria@exemplo.com', method,
  total: 47, key: 'exemplo', lang: lang as EbookLang, book: lang as EbookLang, pixPayload: method === 'pix' ? PIX : null,
});

const brunchEvent: BrunchEvent = {
  id: 'exemplo', slug: 'exemplo', title: 'Brunch de verão', subtitle: null, theme: null, description: null,
  starts_at: '2026-12-13T13:00:00.000Z', ends_at: '2026-12-13T16:00:00.000Z', venue_kind: 'casa', venue_name: 'Casa da Dolly',
  venue_blurb: null, venue_photo: null, venue_url: null, city: 'Itamambuca, Ubatuba', price: 180, capacity: 12, cover_url: null,
  gallery: [], includes: [], extras: [], sponsors: [], members_first_until: null, host_note: null, status: 'publicado',
};
const guest = { event: brunchEvent, name: 'Maria Souza', email: 'maria@exemplo.com' };

const ALERT_ROWS: Record<string, Record<string, unknown>> = {
  funnel_leads: { id: 'exemplo', first_name: 'Alyssa', lang: 'en', segment: 'away', utm_source: 'meta', utm_campaign: 'free_recipes_en_video', email: 'alyssa@exemplo.com' },
  orders: { id: 'exemplo', customer_name: 'Maria Souza', total_price: 251, items_summary: 'Brownie de cacau, Bliss Balls', requested_date: '2026-12-12', pix_transaction_id: 'ORD1764000EXEMPLO', customer_whatsapp: '12999999999', customer_email: 'maria@exemplo.com' },
  course_registrations: { id: 'exemplo', customer_name: 'Maria Souza', interest_type: 'curso', specific_interest: 'Aula de doces', requested_date: '2026-12-05', group_size: 2, customer_whatsapp: '12999999999', email: 'maria@exemplo.com' },
};

// ---------------------------------------------------------------- the automatic e-mails

const ALL_BOOK_LANGS = EBOOK_LANGS as EmailLang[];

const AUTOMATIC: CatalogEntry[] = [
  {
    id: 'ebook-received', group: 'Sweet Escape (e-book)', to: 'cliente', automatic: true, langs: ALL_BOOK_LANGS,
    name: 'Recebemos seu pedido do livro',
    when: 'Logo que alguém compra o Sweet Escape no site. Com Pix, leva o código copia e cola e o link pessoal de download.',
    variants: [{ id: 'pix', label: 'Pagou com Pix' }, { id: 'stripe', label: 'Pagou com cartão' }],
    render: (lang, v) => ebookReceivedEmail(book(lang, v || 'pix')),
  },
  {
    id: 'ebook-paid', group: 'Sweet Escape (e-book)', to: 'cliente', automatic: true, langs: ALL_BOOK_LANGS,
    name: 'Seu livro está pronto',
    when: 'Quando o pagamento do livro é confirmado. Leva o download, o presente de 15% e (se estiver ligada) a ligação grátis com a Dolly.',
    variants: [{ id: 'call', label: 'Com a ligação grátis' }, { id: 'nocall', label: 'Sem a ligação (desligada)' }],
    render: (lang, v) => ebookPaidEmail(book(lang, 'pix'), v !== 'nocall'),
  },
  {
    id: 'receitas-d0', group: 'Receitas grátis', to: 'cliente', automatic: true, langs: ALL_BOOK_LANGS,
    name: 'As 2 receitas grátis (dia 0)',
    when: 'Na hora em que alguém se cadastra em /free-recipes ou /receitas: o PDF com as 2 receitas e o convite para o livro.',
    render: lang => freeRecipesEmail({ firstName: 'Maria', lang: lang as EbookLang }),
  },
  {
    id: 'order-received', group: 'Pedidos, aulas e retiros', to: 'cliente', automatic: true, langs: ['pt'],
    name: 'Recebemos seu pedido',
    when: 'Logo depois de um pedido no site (menu de eventos, caixa) ou de uma proposta de aula/retiro. Com Pix, leva o código.',
    variants: [{ id: 'events-pix', label: 'Doces, Pix' }, { id: 'events-card', label: 'Doces, cartão' }, { id: 'course-pix', label: 'Aula, Pix' }],
    render: (_l, v) => orderReceivedEmail(v === 'course-pix' ? courseOrder('pix') : eventsOrder(v === 'events-card' ? 'mercadopago' : 'pix')),
  },
  {
    id: 'order-paid', group: 'Pedidos, aulas e retiros', to: 'cliente', automatic: true, langs: ['pt'],
    name: 'Pagamento confirmado',
    when: 'Quando o pagamento cai (cartão na hora; Pix quando vocês confirmam na Caixa de Entrada).',
    variants: [{ id: 'events', label: 'Doces' }, { id: 'course', label: 'Aula ou retiro' }],
    render: (_l, v) => orderPaidEmail(v === 'course' ? courseOrder('pix') : eventsOrder('pix')),
  },
  {
    id: 'brunch-reserved', group: 'Brunch', to: 'cliente', automatic: true, langs: ['pt'],
    name: 'Seu lugar está guardado',
    when: 'Quando alguém compra um ingresso de brunch e o pagamento ainda não caiu.',
    render: () => brunchReservedEmail({ ...guest, reference: 'BRU1764000EXEMPLO', total: 180, method: 'pix', pixPayload: PIX }),
  },
  {
    id: 'brunch-confirmed', group: 'Brunch', to: 'cliente', automatic: true, langs: ['pt'],
    name: 'Você está dentro (brunch)',
    when: 'Quando o ingresso do brunch é pago: data, lugar, a sala do grupo e o Círculo Tropical.',
    render: () => brunchConfirmedEmail({ ...guest, reference: 'BRU1764000EXEMPLO', total: 180 }),
  },
  {
    id: 'brunch-waitlist', group: 'Brunch', to: 'cliente', automatic: true, langs: ['pt'],
    name: 'Lista de espera do brunch',
    when: 'Quando alguém tenta comprar um brunch lotado.',
    render: () => brunchWaitlistEmail(guest),
  },
  {
    id: 'app-plus-pix', group: 'App Bateu Vontade?', to: 'cliente', automatic: true, langs: ['pt'],
    name: 'Falta só o Pix (Tropical+)',
    when: 'Quando alguém pede o Tropical+ no app e escolhe Pix.',
    render: () => appPlusPixEmail({ name: 'Maria Souza', email: 'maria@exemplo.com', reference: 'APP1764000EXEMPLO', total: 19.9, pixPayload: PIX }),
  },
  {
    id: 'app-plus-paid', group: 'App Bateu Vontade?', to: 'cliente', automatic: true, langs: ['pt'],
    name: 'Tropical+ liberado',
    when: 'Quando o pagamento do Tropical+ é confirmado.',
    render: () => appPlusUnlockedEmail({ name: 'Maria Souza', email: 'maria@exemplo.com', reference: 'APP1764000EXEMPLO' }),
  },
  {
    id: 'alerta-interno', group: 'Avisos para vocês dois', to: 'equipe', automatic: true, langs: ['en'],
    name: 'Aviso de novidade no site',
    when: 'Para o Andrew e a Dolly (não para clientes): cada cadastro, pedido, pedido de aula, contato ou candidatura novo.',
    variants: [{ id: 'funnel_leads', label: 'Receitas grátis' }, { id: 'orders', label: 'Pedido' }, { id: 'course_registrations', label: 'Aula' }],
    render: (_l, v) => sampleAlert(ALERT_ROWS[v] ? v : 'funnel_leads', ALERT_ROWS[v] || ALERT_ROWS.funnel_leads)!,
  },
];

// ---------------------------------------------------------------- the campaigns, straight from CAMPAIGNS

const isFunnelStep = (c: Campaign) => c.topic === 'receitas';
/** The Sweet Escape buyers' e-mails (automation livro-sequencia). */
const isBookStep = (c: Campaign) => c.id.startsWith('livro-');
/** Written in English and Portuguese (the funnel, the buyers' e-mails, Dolly's Sunday letter). */
const bilingual = (c: Campaign) => !!c.lang;

/** Fills what an automation would fill, so the free-recipes steps read like the real ones. */
function exampleValues(c: Campaign, lang: EmailLang): CampaignValues {
  const v = previewValues(c, {});
  if (bilingual(c)) v.lang = lang;
  if (isBookStep(c)) v.call = '1';
  if (isFunnelStep(c)) {
    v.lang = lang;
    v.offer = 'exemplo';
    v.until = lang === 'pt' ? 'domingo, 30 de novembro' : 'Sunday, November 30';
    v.call = '1';
  }
  return v;
}

function fromCampaign(c: Campaign): CatalogEntry {
  const funnel = isFunnelStep(c);
  const book = isBookStep(c);
  const rule = AUTOMATIONS.find(a => a.campaignId === c.id || (funnel && a.campaignId.startsWith('receitas-')) || (book && a.campaignId.startsWith('livro-')));
  return {
    id: c.id,
    group: funnel ? 'Receitas grátis' : book ? 'Sweet Escape (e-book)' : c.groupOnly && c.theme === 'brunch' ? 'Brunch' : 'Campanhas para a lista',
    name: c.name,
    when: c.description,
    to: 'cliente',
    // groupOnly campaigns are sent by an automation or the brunch page, never by hand from Admin › E-mails.
    automatic: !!c.groupOnly,
    rule: rule?.name,
    langs: bilingual(c) ? ['en', 'pt'] : ['pt'],
    render: lang => {
      const v = exampleValues(c, lang);
      const l = c.lang?.(v) ?? 'pt';
      const content = c.build(v);
      return {
        messageKey: c.messageKey(v),
        subject: c.subject(v),
        layout: {
          ...content,
          theme: c.theme,
          lang: l,
          body: greeting('Maria', l) + content.body,
          prefsUrl: `${SITE_URL}/preferencias?token=exemplo`,
          unsubscribeUrl: `${SITE_URL}/preferencias?token=exemplo&sair=1`,
          reason: l === 'en' && c.reasonEn ? c.reasonEn : c.reason,
        },
      };
    },
  };
}

export const CATALOG: CatalogEntry[] = [...AUTOMATIC, ...CAMPAIGNS.map(fromCampaign)]
  .sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));

export const catalogEntry = (id: string) => CATALOG.find(e => e.id === id);
