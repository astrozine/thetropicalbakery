/**
 * The shell every Tropical Bakery e-mail is poured into: logo that links home,
 * one clear button, the footer with our real links, and the two things every
 * marketing e-mail must carry — where it came from and how to stop it.
 *
 * Server-side only (used by the API routes).
 */

export const SITE_URL = 'https://thetropicalbakery.com';
export const STORE_WHATSAPP = '5511932119196';
export const FROM_ADDRESS = 'The Tropical Bakery <nao-responda@thetropicalbakery.com>';

const COCOA = '#3c2a21';
const GOLD = '#d4af37';
const CREAM = '#fdfaf3';
const TEXT = '#594a42';
const MUTED = '#a89a90';

export interface LayoutOptions {
  /** Hidden line Gmail shows next to the subject. */
  preheader: string;
  /** Big heading inside the card. */
  heading: string;
  /** Body HTML (paragraphs, lists — already escaped by the caller). */
  body: string;
  cta?: { label: string; href: string };
  /** Small print under the button, above the footer. */
  note?: string;
  /** Manage-preferences link; omitted for transactional mail. */
  prefsUrl?: string;
  unsubscribeUrl?: string;
  /** Why this person is getting it, e.g. "Você recebe este e-mail porque assina a Caixa de Degustação." */
  reason?: string;
}

/** Escapes text coming from the admin form so a stray < can't break the e-mail. */
export const esc = (s: string) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Turns plain text with blank lines into paragraphs. */
export const paragraphs = (text: string) =>
  esc(text)
    .split(/\n\s*\n/)
    .map(p => `<p style="color:${TEXT};font-size:15px;line-height:1.75;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

export const bulletList = (items: string[]) =>
  items.length
    ? `<ul style="margin:0 0 20px;padding:0;list-style:none;">${items
        .map(
          i =>
            `<li style="color:${TEXT};font-size:15px;line-height:1.7;margin:0 0 8px;padding-left:18px;position:relative;">` +
            `<span style="color:${GOLD};">&#10022;</span>&nbsp;${esc(i)}</li>`,
        )
        .join('')}</ul>`
    : '';

const FOOTER_LINKS: { label: string; path: string }[] = [
  { label: 'Caixa de Degustação', path: '/caixas' },
  { label: 'Assinatura', path: '/assinatura' },
  { label: 'Menu de Eventos', path: '/menu' },
  { label: 'Cursos', path: '/cursos' },
  { label: 'Retiros', path: '/retreats' },
];

export function renderEmail(o: LayoutOptions): string {
  const cta = o.cta
    ? `<div style="text-align:center;margin:0 0 8px;">
         <a href="${o.cta.href}" style="display:inline-block;background:${GOLD};color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 34px;border-radius:8px;">${esc(o.cta.label)}</a>
       </div>`
    : '';

  const note = o.note
    ? `<p style="color:${MUTED};font-size:12px;line-height:1.6;text-align:center;margin:16px 0 0;">${o.note}</p>`
    : '';

  const manage = o.prefsUrl
    ? `<p style="color:${MUTED};font-size:12px;line-height:1.7;margin:14px 0 0;">
         ${o.reason ? `${esc(o.reason)}<br>` : ''}
         <a href="${o.prefsUrl}" style="color:${MUTED};text-decoration:underline;">Escolher quais e-mails receber</a>
         &nbsp;·&nbsp;
         <a href="${o.unsubscribeUrl || o.prefsUrl}" style="color:${MUTED};text-decoration:underline;">Descadastrar de tudo</a>
       </p>`
    : '';

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>${esc(o.heading)}</title></head>
<body style="margin:0;padding:0;background:${CREAM};">
  <span style="display:none!important;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${esc(o.preheader)}</span>
  <div style="background:${CREAM};padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;">

      <div style="text-align:center;margin-bottom:20px;">
        <a href="${SITE_URL}" style="text-decoration:none;">
          <img src="${SITE_URL}/logo-gold.webp" alt="The Tropical Bakery" width="110" style="display:block;margin:0 auto;border:0;">
        </a>
      </div>

      <div style="background:#ffffff;border:1px solid #e8e1d7;border-radius:16px;padding:32px 28px;">
        <h1 style="color:${COCOA};font-size:22px;line-height:1.3;margin:0 0 16px;text-align:center;">${esc(o.heading)}</h1>
        ${o.body}
        ${cta}
        ${note}
      </div>

      <div style="text-align:center;padding:22px 8px 0;">
        <p style="margin:0 0 10px;">
          ${FOOTER_LINKS.map(
            l => `<a href="${SITE_URL}${l.path}" style="color:${TEXT};font-size:12px;text-decoration:none;margin:0 6px;">${l.label}</a>`,
          ).join('&nbsp;·&nbsp;')}
        </p>
        <p style="color:${MUTED};font-size:12px;line-height:1.7;margin:0;">
          The Tropical Bakery · Itamambuca, Ubatuba — SP<br>
          Doces veganos, sem glúten e sem açúcar refinado, feitos à mão.<br>
          <a href="https://wa.me/${STORE_WHATSAPP}" style="color:${GOLD};text-decoration:none;">Falar com a gente no WhatsApp</a>
          &nbsp;·&nbsp;
          <a href="${SITE_URL}" style="color:${GOLD};text-decoration:none;">thetropicalbakery.com</a>
        </p>
        ${manage}
      </div>

    </div>
  </div>
</body></html>`;
}

/** Same content as plain text, for clients that refuse HTML. */
export function plainTextFallback(o: LayoutOptions): string {
  const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  return [
    o.heading,
    '',
    strip(o.body),
    o.cta ? `\n${o.cta.label}: ${o.cta.href}` : '',
    '',
    `The Tropical Bakery — Itamambuca, Ubatuba/SP`,
    SITE_URL,
    o.prefsUrl ? `\nPreferências de e-mail: ${o.prefsUrl}` : '',
    o.unsubscribeUrl ? `Descadastrar: ${o.unsubscribeUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
