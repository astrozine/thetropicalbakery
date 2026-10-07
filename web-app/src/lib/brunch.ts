/**
 * Brunch Tropical and the Círculo Tropical: everything a guest is promised lives here, so changing a perk is a
 * one-line edit (the same rule as src/lib/loyalty.ts). Pure: no browser or server imports, so the public pages,
 * the admin, Minha Conta and the e-mails all read the same words.
 *
 * Schema: migration_41_brunch.sql.
 */

export const BRUNCH_PATH = '/brunch';
export const roomPath = (slug: string) => `/brunch/sala/${slug}`;
export const eventPath = (slug: string) => `/brunch/${slug}`;

/** The host shown in the group chat when an admin posts without a brunch profile of their own. */
export const HOST = { name: 'Dolly', photo: '/dolly/dolly-face.jpg', role: 'Anfitriã · confeiteira' };

/**
 * How long the ticket stays usable as credit on the annual subscription, counted from the brunch day.
 * Keep in step with brunch_claim_credit() in migration_41_brunch.sql (interval '30 days').
 */
export const CREDIT_DAYS = 30;

/** How long an unpaid seat is held. Pix is confirmed by hand, card/PayPal confirm themselves in minutes. */
export const HOLD_HOURS = { pix: 24, card: 2 } as const;

export type VenueKind = 'casa' | 'pousada' | 'praia' | 'restaurante' | 'espaco' | 'outro';

export const VENUE_KINDS: { id: VenueKind; label: string; emoji: string; blurb: string }[] = [
  { id: 'casa', label: 'Na casa da Dolly', emoji: '🏡', blurb: 'O nosso home bakery em Itamambuca, no meio da mata.' },
  { id: 'pousada', label: 'Pousada parceira', emoji: '🌺', blurb: 'Uma pousada da região que abre as portas para a gente.' },
  { id: 'praia', label: 'Pé na areia', emoji: '🏖️', blurb: 'Uma mesa montada numa praia bonita da região.' },
  { id: 'restaurante', label: 'Restaurante', emoji: '🍽️', blurb: 'Um restaurante parceiro, com a mesa da Dolly.' },
  { id: 'espaco', label: 'Espaço de eventos', emoji: '🎶', blurb: 'Um espaço com música, pop-ups e mais gente boa.' },
  { id: 'outro', label: 'Lugar surpresa', emoji: '✨', blurb: 'Um lugar especial, revelado para quem garantir o lugar.' },
];
export const venueKind = (id: string | null | undefined) => VENUE_KINDS.find(v => v.id === id) ?? VENUE_KINDS[0];

export type SponsorKind = 'patrocinador' | 'popup' | 'anfitriao';
export const SPONSOR_KINDS: { id: SponsorKind; label: string }[] = [
  { id: 'anfitriao', label: 'Anfitrião do lugar' },
  { id: 'patrocinador', label: 'Patrocinador' },
  { id: 'popup', label: 'Pop-up' },
];
export interface Sponsor {
  name: string;
  kind: SponsorKind;
  logo_url?: string | null;
  url?: string | null;
  blurb?: string | null;
}

/** What a ticket includes when Dolly hasn't written her own list. The value stack on the page. */
export const DEFAULT_INCLUDES = [
  'Mesa de doces saudáveis da Dolly, feitos para este brunch',
  'Chás, cafés e sucos da estação à vontade',
  'Roda de conversa sobre saúde, bem-estar e carreira, com quem já vive disso',
  'Uma caixinha de doces para levar para casa',
  'Entrada no grupo do brunch com a Dolly, antes e depois do encontro',
];

/** Extras Dolly can tick for an event (she can also type her own). */
export const EXTRA_SUGGESTIONS = [
  '🎶 Música ao vivo',
  '🛍️ Pop-up de marcas locais',
  '🧘 Alongamento ou meditação de abertura',
  '📸 Fotos profissionais do encontro',
  '🌊 Banho de mar depois',
  '🎁 Brindes dos parceiros',
];

/**
 * The Círculo Tropical: what anyone who has paid for a brunch gets. Proposed by Claude on 2026-10-07 —
 * confirm with Andrew and Dolly before making any of them bigger.
 */
export interface Perk { emoji: string; title: string; text: string }
export const CIRCLE_PERKS: Perk[] = [
  {
    emoji: '💌', title: 'O ingresso vira crédito',
    text: `Assinou a Caixa de Degustação no plano Anual em até ${CREDIT_DAYS} dias depois do brunch? O valor do ingresso sai da sua primeira mensalidade.`,
  },
  {
    emoji: '🎉', title: '10% no Menu de Eventos',
    text: 'Aniversário, evento da empresa, encontro com clientes: os doces da Dolly com desconto de membro do Círculo.',
  },
  {
    emoji: '⏰', title: 'Você compra antes',
    text: 'Os próximos brunches abrem primeiro para quem já veio e para quem assina a caixa. Os lugares acabam rápido.',
  },
  {
    emoji: '💬', title: 'O grupo, antes e depois',
    text: 'Um grupo só das pessoas do seu brunch, com a Dolly lá dentro: para se conhecer antes e continuar a conversa depois.',
  },
];

// ------------------------------------------------------------------- vote

/**
 * "Monte o brunch": the guests vote on the treats and the topics. Keep in step with brunch_vote_check() and
 * brunch_option_check() in migration_41_brunch.sql.
 */
export const VOTES_PER_KIND = 3;
export const SUGGESTIONS_PER_PERSON = 3;
export const VOTE_CLOSE_DAYS = 2;

export type PollKind = 'doce' | 'tema';
export const POLL_KINDS: { id: PollKind; label: string; emoji: string; ask: string; suggest: string }[] = [
  { id: 'doce', label: 'Doces', emoji: '🧁', ask: 'O que a Dolly faz para a mesa?', suggest: 'Ex: tartelette de maracujá, bolo de cenoura com cacau' },
  { id: 'tema', label: 'Temas', emoji: '💬', ask: 'Sobre o que vamos conversar?', suggest: 'Ex: como cobrar pelo meu trabalho, Instagram para terapeutas' },
];

export interface PollOption {
  id: string;
  event_id: string;
  kind: PollKind;
  label: string;
  details: string | null;
  treat_id: string | null;
  image_url: string | null;
  suggested_by: string | null;
  chosen: boolean;
  created_at: string;
}
export interface PollVote { option_id: string; event_id: string; user_id: string; created_at: string }

export const votesCloseAt = (e: Pick<BrunchEvent, 'starts_at' | 'votes_close_at'>) =>
  new Date(e.votes_close_at || new Date(new Date(e.starts_at).getTime() - VOTE_CLOSE_DAYS * 86400000).toISOString());

// ------------------------------------------------------------------ types

export type EventStatus = 'rascunho' | 'publicado' | 'encerrado' | 'cancelado';
export type TicketStatus = 'reservado' | 'pago' | 'espera' | 'cancelado';

export interface BrunchEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  theme: string | null;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  venue_kind: VenueKind;
  venue_name: string | null;
  venue_blurb: string | null;
  venue_photo: string | null;
  venue_url: string | null;
  city: string | null;
  price: number;
  capacity: number;
  cover_url: string | null;
  gallery: string[];
  includes: string[];
  extras: string[];
  sponsors: Sponsor[];
  members_first_until: string | null;
  host_note: string | null;
  /** When the guests' vote closes; null = VOTE_CLOSE_DAYS before the brunch. */
  votes_close_at?: string | null;
  status: EventStatus;
  created_at?: string;
}

export interface Availability { event_id: string; capacity: number; taken: number; waiting: number }

export interface BrunchProfile {
  user_id: string;
  display_name: string | null;
  emoji: string | null;
  photo_url: string | null;
  headline: string | null;
  bio: string | null;
  instagram: string | null;
  business_name: string | null;
  business_url: string | null;
  offers: string | null;
  seeks: string | null;
}

/** One row of my_brunches().tickets */
export interface MyTicket {
  id: string;
  status: TicketStatus;
  reference: string | null;
  price: number;
  hold_until: string | null;
  paid_at: string | null;
  checked_in_at: string | null;
  credit_claimed_at: string | null;
  credit_applied_at: string | null;
  popup_request: string | null;
  event_id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  theme: string | null;
  starts_at: string;
  ends_at: string | null;
  venue_kind: VenueKind;
  venue_name: string | null;
  city: string | null;
  cover_url: string | null;
  event_status: EventStatus;
  address: string | null;
  maps_url: string | null;
  arrival_notes: string | null;
  guests: number;
}

export interface MyBrunches {
  alumni: boolean;
  profile: BrunchProfile | null;
  tickets: MyTicket[];
}

export interface RoomMember extends Partial<Omit<BrunchProfile, 'user_id'>> {
  user_id: string | null;
  ticket_id: string;
  first_name: string;
  is_me: boolean;
}

export interface RoomData {
  event: BrunchEvent & { address: string | null; maps_url: string | null; arrival_notes: string | null };
  is_admin: boolean;
  members: RoomMember[];
  hosts: { user_id: string; display_name: string | null; emoji: string | null; photo_url: string | null }[];
}

export interface ChatMessage {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  is_host: boolean;
  created_at: string;
}

// ---------------------------------------------------------------- helpers

/** Everything is in Brasília time, whatever the visitor's phone says. */
const TZ = 'America/Sao_Paulo';

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }).replace(':00', 'h').replace(':', 'h');
export const fmtShort = (iso: string) => {
  const d = new Date(iso);
  return {
    day: d.toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit' }),
    month: d.toLocaleDateString('pt-BR', { timeZone: TZ, month: 'short' }).replace('.', ''),
    weekday: d.toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'short' }).replace('.', ''),
  };
};
export const fmtWhen = (e: { starts_at: string; ends_at?: string | null }) =>
  `${fmtDay(e.starts_at)}, ${fmtTime(e.starts_at)}${e.ends_at ? ` às ${fmtTime(e.ends_at)}` : ''}`;

/** "2026-11-08T10:00" as typed in the admin (Brasília) -> ISO in UTC. */
export const brasiliaToIso = (local: string) => (local ? new Date(`${local}:00-03:00`).toISOString() : '');
/** ISO -> "2026-11-08T10:00" for a datetime-local input (Brasília). */
export const isoToBrasilia = (iso: string | null | undefined) =>
  iso ? new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString().slice(0, 16) : '';

export function seatsLeft(e: Pick<BrunchEvent, 'capacity'>, a?: Availability | null) {
  const taken = a?.taken ?? 0;
  return Math.max(0, e.capacity - taken);
}

export const isUpcoming = (e: Pick<BrunchEvent, 'starts_at'>, now = Date.now()) => new Date(e.starts_at).getTime() > now;

export const membersOnlyNow = (e: Pick<BrunchEvent, 'members_first_until'>, now = Date.now()) =>
  !!e.members_first_until && new Date(e.members_first_until).getTime() > now;

/** Last day the ticket can still become subscription credit. */
export const creditDeadline = (startsAt: string) => new Date(new Date(startsAt).getTime() + CREDIT_DAYS * 86400000);

export const slugify = (s: string) =>
  (s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

/** Turns a stored event row (sponsors may be null/odd on old rows) into a safe BrunchEvent. */
export function normalizeEvent(row: Record<string, unknown>): BrunchEvent {
  const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]).filter(Boolean) : []);
  return {
    ...(row as unknown as BrunchEvent),
    price: Number(row.price ?? 0),
    capacity: Number(row.capacity ?? 0),
    gallery: arr(row.gallery),
    includes: arr(row.includes),
    extras: arr(row.extras),
    sponsors: Array.isArray(row.sponsors) ? (row.sponsors as Sponsor[]).filter(s => s && s.name) : [],
  };
}

/** "Add to Google Calendar", so the date is in their phone the moment they pay. */
export function calendarLink(e: Pick<BrunchEvent, 'title' | 'starts_at' | 'ends_at' | 'venue_name' | 'city' | 'slug'>): string {
  const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const end = e.ends_at || new Date(new Date(e.starts_at).getTime() + 3 * 3600 * 1000).toISOString();
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Brunch Tropical: ${e.title}`,
    dates: `${stamp(e.starts_at)}/${stamp(end)}`,
    details: `O endereço e o grupo estão na sua sala: https://thetropicalbakery.com${roomPath(e.slug)}`,
    location: e.venue_name || e.city || 'Itamambuca, Ubatuba',
  });
  return `https://calendar.google.com/calendar/render?${q.toString()}`;
}

export const EMOJI_CHOICES = ['🌺', '🌴', '🥭', '🍍', '🥥', '🌿', '☀️', '🌊', '🦜', '🌸', '🍵', '✨', '💛', '🧘‍♀️', '📚', '💼', '🎨', '🌙'];
