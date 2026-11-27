import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, copyBox, greeting, kicker, orderTable, paragraphs, type BuiltEmail, type EmailLang } from './layout';
import { deliver } from './send';
import { JOURNAL_COPY, fmtBRL, type JournalLang } from '@/lib/journal/journal';

/**
 * The two e-mails of a Recipe Journal purchase (lib/payments/journal.ts): "here is your Pix" (only for the direct Pix)
 * and "your recipe is open". Transactional (topic `pedido`), one per order each, Portuguese or English like the page.
 */

const first = (name: string) => (name || '').trim().split(' ')[0];

export interface JournalMail {
  name: string;
  email: string;
  reference: string;
  total: number;
  /** What they bought, in their language ("Bliss Balls Azedinhas de Frutas Vermelhas"). */
  title: string;
  /** Full address of the recipe or collection page. */
  href: string;
  lang: JournalLang;
}

async function send(db: SupabaseClient, email: string, { messageKey, subject, layout }: BuiltEmail) {
  const to = (email || '').trim().toLowerCase();
  if (!to.includes('@')) return;
  try {
    await deliver(db, {
      email: to, token: '', messageKey, subject, topic: 'pedido',
      template: messageKey.split(':')[0], transactional: true, layout,
    });
  } catch (err) {
    console.error('journal e-mail failed for', to, messageKey, err);
  }
}

export async function sendJournalPix(db: SupabaseClient, o: JournalMail & { pixPayload: string }) {
  await send(db, o.email, journalPixEmail(o));
}

export function journalPixEmail(o: JournalMail & { pixPayload: string }): BuiltEmail {
  const en = o.lang === 'en';
  const lang: EmailLang = en ? 'en' : 'pt';
  const body =
    (first(o.name) ? greeting(first(o.name), lang) : '') +
    paragraphs(en
      ? 'Only the Pix is left. As soon as it arrives, Dolly confirms it and the recipe opens on your account, on the same page.'
      : 'Falta só o Pix. Assim que ele cair, a Dolly confirma e a receita abre na sua conta, na mesma página.') +
    kicker(en ? 'Your order' : 'Seu pedido') +
    orderTable([
      { label: o.title, amount: fmtBRL(o.total) },
      { label: 'Total', amount: fmtBRL(o.total), strong: true },
    ]) +
    copyBox(en ? 'Pix copy and paste' : 'Pix copia e cola', o.pixPayload);
  return { messageKey: `journal-pix:${o.reference}`, subject: en ? 'Only the Pix is left for your recipe' : 'Falta só o Pix para abrir a sua receita', layout: {
    theme: 'novidades', lang,
    preheader: en ? `Pix of ${fmtBRL(o.total)}, one-time payment.` : `Pix de ${fmtBRL(o.total)}, pagamento único.`,
    heading: en ? 'Only the Pix is left' : 'Falta só o Pix',
    body,
    cta: { label: en ? 'Back to the recipe' : 'Voltar à receita', href: o.href },
    note: `${en ? 'Order' : 'Pedido'} ${o.reference}. ${JOURNAL_COPY[o.lang].payHint}`,
  } };
}

export async function sendJournalUnlocked(db: SupabaseClient, o: JournalMail) {
  await send(db, o.email, journalUnlockedEmail(o));
}

export function journalUnlockedEmail(o: JournalMail): BuiltEmail {
  const en = o.lang === 'en';
  const lang: EmailLang = en ? 'en' : 'pt';
  const body =
    (first(o.name) ? greeting(first(o.name), lang) : '') +
    paragraphs(en
      ? `It's yours: “${o.title}” is open on your account, with every ingredient and every step. Thank you for supporting a small kitchen in Itamambuca!`
      : `É sua: “${o.title}” está aberta na sua conta, com todos os ingredientes e o passo a passo. Obrigada por apoiar uma cozinha pequena em Itamambuca!`) +
    paragraphs(en
      ? 'Open it any time, on any phone, signed in with the same account. If you make it, tag us on Instagram: Dolly loves to see it.'
      : 'Abra quando quiser, em qualquer celular, entrando com a mesma conta. Se fizer, marca a gente no Instagram: a Dolly ama ver.');
  return { messageKey: `journal-paid:${o.reference}`, subject: en ? `Your recipe is open: ${o.title}` : `Sua receita está aberta: ${o.title}`, layout: {
    theme: 'novidades', lang,
    preheader: en ? 'Every ingredient and every step, on your account.' : 'Todos os ingredientes e o passo a passo, na sua conta.',
    heading: en ? 'Your recipe is open' : 'Sua receita está aberta',
    body,
    cta: { label: en ? 'Open the recipe' : 'Abrir a receita', href: o.href },
    note: `${en ? 'Order' : 'Pedido'} ${o.reference}. ${en ? 'All your recipes' : 'Todas as suas receitas'}: ${SITE_URL}${en ? '/en/journal/my-recipes' : '/diario/minhas-receitas'}`,
  } };
}
