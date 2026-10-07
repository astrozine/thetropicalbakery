import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, bulletList, copyBox, esc, greeting, kicker, orderTable, paragraphs, type LayoutOptions } from './layout';
import { deliver } from './send';
import { formatBRL } from '@/lib/deliveryZones';
import { CIRCLE_PERKS, HOLD_HOURS, calendarLink, eventPath, fmtWhen, roomPath, venueKind, type BrunchEvent } from '@/lib/brunch';

/**
 * The brunch e-mails nobody has to switch on, because they answer something the person just did: "your seat is
 * held, here is the Pix", "you're in, here is the group", "you're on the waiting list". Transactional (topic
 * `pedido`), one per ticket each, like the box receipts in ./receipts.ts. Everything that goes to a group of
 * guests (reminders, chat digest, follow-up, Dolly's notes) is a campaign in ./campaigns.ts and goes through
 * sendCampaign, so opt-outs keep meaning something.
 */

interface Who {
  event: BrunchEvent;
  name: string;
  email: string;
}

const first = (name: string) => (name || '').trim().split(' ')[0];

const where = (e: BrunchEvent) => {
  const v = venueKind(e.venue_kind);
  return `${v.emoji} ${e.venue_name || v.label}${e.city ? ` · ${e.city}` : ''}`;
};

async function send(db: SupabaseClient, email: string, messageKey: string, subject: string, layout: Omit<LayoutOptions, 'theme'>) {
  const to = (email || '').trim().toLowerCase();
  if (!to.includes('@')) return;
  try {
    await deliver(db, {
      email: to, token: '', messageKey, subject, topic: 'pedido',
      template: messageKey.split(':')[0], transactional: true, layout: { ...layout, theme: 'brunch' },
    });
  } catch (err) {
    console.error('brunch e-mail failed for', to, messageKey, err);
  }
}

export async function sendBrunchReserved(db: SupabaseClient, o: Who & { reference: string; total: number; method: string; pixPayload: string | null }) {
  const isPix = o.method === 'pix';
  const body =
    (first(o.name) ? greeting(first(o.name)) : '') +
    paragraphs(isPix
      ? `Seu lugar no brunch "${o.event.title}" está guardado por ${HOLD_HOURS.pix} horas. Assim que o Pix cair, a gente confirma e te manda a entrada no grupo.`
      : 'Seu lugar está guardado enquanto o pagamento confirma, o que costuma levar poucos minutos.') +
    kicker('Seu ingresso') +
    orderTable([
      { label: `Brunch Tropical: ${o.event.title}`, amount: formatBRL(o.total) },
      { label: 'Total', amount: formatBRL(o.total), strong: true },
    ]) +
    paragraphs(`${fmtWhen(o.event)}\n${where(o.event)}`) +
    (isPix && o.pixPayload ? copyBox('Pix copia e cola', o.pixPayload) : '');

  await send(db, o.email, `brunch-reserved:${o.reference}`, `Seu lugar está guardado: ${o.event.title}`, {
    preheader: isPix ? `Falta o Pix de ${formatBRL(o.total)} para garantir seu lugar.` : 'Seu lugar está guardado.',
    heading: 'Seu lugar está guardado',
    body,
    cta: { label: 'Ver meu ingresso', href: `${SITE_URL}/minha-conta` },
    note: `Pedido ${o.reference}. Os lugares são por ordem de pagamento: quem paga primeiro, garante.`,
  });
}

export async function sendBrunchConfirmed(db: SupabaseClient, o: Who & { reference: string | null; total: number }) {
  const room = `${SITE_URL}${roomPath(o.event.slug)}`;
  const body =
    (first(o.name) ? greeting(first(o.name)) : '') +
    paragraphs(`Você está dentro! Seu lugar no brunch "${o.event.title}" está garantido e a Dolly já está te esperando no grupo.`) +
    kicker('Quando e onde') +
    paragraphs(`${fmtWhen(o.event)}\n${where(o.event)}\n\nO endereço exato está na sua sala do brunch.`) +
    `<p style="margin:0 0 18px;"><a href="${esc(calendarLink(o.event))}" style="color:#a6832b;font-weight:bold;">📅 Colocar na minha agenda</a></p>` +
    kicker('Antes do brunch') +
    bulletList([
      'Monte o seu cartão: uma foto, um emoji, o que você faz e com o que pode ajudar. É assim que as pessoas te acham na mesa.',
      'Diga oi no grupo. A Dolly abre a conversa e apresenta todo mundo.',
    ]) +
    kicker('Agora você é do Círculo Tropical') +
    bulletList(CIRCLE_PERKS.map(p => `${p.emoji} ${p.title}: ${p.text}`));

  await send(db, o.email, `brunch-confirmed:${o.reference ?? `${o.event.id}:${o.email.toLowerCase()}`}`, `Você está dentro ✨ ${o.event.title}`, {
    preheader: `${fmtWhen(o.event)}. Entre no grupo e monte o seu cartão.`,
    heading: 'Seu lugar está garantido',
    body,
    cta: { label: 'Entrar no grupo do brunch', href: room },
    note: o.reference ? `Pedido ${o.reference}${o.total ? ` · ${formatBRL(o.total)}` : ''}.` : undefined,
  });
}

export async function sendBrunchWaitlist(db: SupabaseClient, o: Who) {
  const body =
    (first(o.name) ? greeting(first(o.name)) : '') +
    paragraphs(`Os lugares do brunch "${o.event.title}" acabaram, mas você está na lista de espera. Se alguém desistir, a gente avisa todo mundo da lista ao mesmo tempo, e quem pagar primeiro fica com o lugar.`) +
    paragraphs('Fique de olho no seu e-mail. E se quiser garantir o próximo, os brunches abrem antes para quem já é do Círculo.');

  await send(db, o.email, `brunch-waitlist:${o.event.id}`, `Você está na lista de espera: ${o.event.title}`, {
    preheader: 'Se um lugar abrir, você fica sabendo na hora.',
    heading: 'Você está na lista de espera',
    body,
    cta: { label: 'Ver os próximos brunches', href: `${SITE_URL}${eventPath(o.event.slug)}` },
  });
}
