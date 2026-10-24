import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, bulletList, copyBox, greeting, kicker, orderTable, paragraphs, type LayoutOptions } from './layout';
import { deliver } from './send';
import { formatBRL } from '@/lib/deliveryZones';
import { APP_PLUS } from '@/lib/vontade';

/**
 * The two e-mails of the app's Tropical+ (lib/payments/appPlus.ts): "here is your Pix" and "it's unlocked".
 * Transactional (topic `pedido`), one per order each, like the brunch ones in ./brunchMail.ts.
 */

const first = (name: string) => (name || '').trim().split(' ')[0];
const APP_URL = `${SITE_URL}/vontade`;

async function send(db: SupabaseClient, email: string, messageKey: string, subject: string, layout: Omit<LayoutOptions, 'theme'>) {
  const to = (email || '').trim().toLowerCase();
  if (!to.includes('@')) return;
  try {
    await deliver(db, {
      email: to, token: '', messageKey, subject, topic: 'pedido',
      template: messageKey.split(':')[0], transactional: true, layout: { ...layout, theme: 'novidades' },
    });
  } catch (err) {
    console.error('app-plus e-mail failed for', to, messageKey, err);
  }
}

export async function sendAppPlusPix(db: SupabaseClient, o: { name: string; email: string; reference: string; total: number; pixPayload: string }) {
  const body =
    (first(o.name) ? greeting(first(o.name)) : '') +
    paragraphs('Falta só o Pix. Assim que ele cair, a Dolly confirma e o Tropical+ libera sozinho no app, na mesma conta.') +
    kicker('Seu pedido', '🌴') +
    orderTable([
      { label: APP_PLUS.name, amount: formatBRL(o.total) },
      { label: 'Total', amount: formatBRL(o.total), strong: true },
    ]) +
    copyBox('Pix copia e cola', o.pixPayload);
  await send(db, o.email, `app-plus-pix:${o.reference}`, 'Falta só o Pix para liberar o Tropical+', {
    preheader: `Pix de ${formatBRL(o.total)}, pagamento único.`,
    heading: 'Falta só o Pix',
    body,
    cta: { label: 'Voltar ao app', href: APP_URL },
    note: `Pedido ${o.reference}. ${APP_PLUS.promise}`,
  });
}

export async function sendAppPlusUnlocked(db: SupabaseClient, o: { name: string; email: string; reference: string }) {
  const body =
    (first(o.name) ? greeting(first(o.name)) : '') +
    paragraphs('Pronto: o Tropical+ está liberado na sua conta. Obrigada por apoiar uma cozinha pequena!') +
    kicker('O que abriu', '🗺️') +
    bulletList([
      'O plano completo de todas as vontades, fase por fase',
      'As armadilhas de cada vontade e o que fazer em cada uma',
      'Todas as receitas de resgate',
    ]) +
    paragraphs('É só abrir o app com a mesma conta. Se já estava aberto, puxe a tela para atualizar.');
  await send(db, o.email, `app-plus-paid:${o.reference}`, 'Tropical+ liberado 🌴', {
    preheader: 'Todos os planos e receitas do Bateu Vontade? estão abertos.',
    heading: 'Tropical+ liberado',
    body,
    cta: { label: 'Abrir o app', href: APP_URL },
    note: `Pedido ${o.reference}. ${APP_PLUS.promise}`,
  });
}
