/**
 * The shell every Tropical Bakery e-mail is poured into: the pineapple logo, a photo that says what the
 * e-mail is about, one clear button, a strip of photos from the matching page, the "Belgian skill,
 * Brazilian nature" band, the footer with our real links, and the two things every marketing e-mail
 * must carry — where it came from and how to stop it.
 *
 * Built for real inboxes, not browsers: tables for layout (Outlook), every style inline (Gmail strips
 * most <style>), images as JPG/PNG from public/email/ (Gmail does not show SVG; regenerate them with
 * tools/email-images.cjs), width/height and alt text on every image, a colour behind every image so the
 * layout holds when images are blocked. Pure string building, so the admin can preview it.
 */

import { SUBSTACK_URL } from '@/lib/siteContact';

export const SITE_URL = 'https://thetropicalbakery.com';
export const STORE_WHATSAPP = '5511932119196';
export const FROM_ADDRESS = 'The Tropical Bakery <nao-responda@thetropicalbakery.com>';

const COCOA = '#3c2a21';
const GOLD = '#d4af37';
const GOLD_DEEP = '#a6832b';
const CREAM = '#fdfaf3';
const SAND = '#f3ead8';
const LINE = '#eadfca';
const TEXT = '#594a42';
const MUTED = '#a89a90';

const HEADING_FONT = `'Unbounded','Outfit',Helvetica,Arial,sans-serif`;
const BODY_FONT = `'Outfit',Helvetica,Arial,sans-serif`;

/** Which page an e-mail belongs to. Picks the top photo, the kicker and the photo strip. */
export type EmailTheme = 'caixa' | 'assinatura' | 'eventos' | 'cursos' | 'retiros' | 'parcerias' | 'equipe' | 'novidades';

interface ThemeDef {
  kicker: string;
  heroAlt: string;
  stripTitle: string;
  strip: { img: string; caption: string; alt: string; path: string }[];
}

const THEMES: Record<EmailTheme, ThemeDef> = {
  caixa: {
    kicker: 'Caixa de Degustação',
    heroAlt: 'Caixa de Degustação aberta, com doces veganos',
    stripTitle: 'Saído da nossa cozinha',
    strip: [
      { img: 'tile-pitaya', caption: 'Pitaya & cacau', alt: 'Doce de pitaya em prato dourado', path: '/caixas' },
      { img: 'tile-bundt', caption: 'Bundt de chocolate', alt: 'Mini bundt coberto de chocolate', path: '/caixas' },
      { img: 'tile-berry', caption: 'Torta de frutas vermelhas', alt: 'Torta de frutas vermelhas', path: '/caixas' },
    ],
  },
  assinatura: {
    kicker: 'Sua assinatura',
    heroAlt: 'Caixa de Degustação com doces da semana',
    stripTitle: 'O que anda saindo do forno',
    strip: [
      { img: 'tile-truffles', caption: 'Trufas de morango', alt: 'Trufas cobertas de morango', path: '/assinatura' },
      { img: 'tile-caramel', caption: 'Bundt de caramelo', alt: 'Bolinhos com calda de caramelo', path: '/assinatura' },
      { img: 'tile-mango', caption: 'Cheesecake de manga', alt: 'Cheesecake vegano de manga', path: '/assinatura' },
    ],
  },
  eventos: {
    kicker: 'Menu de Eventos',
    heroAlt: 'Convidados provando doces numa festa tropical',
    stripTitle: 'Mesas que a gente já montou',
    strip: [
      { img: 'tile-event-night', caption: 'Jantares ao ar livre', alt: 'Jantar tropical à noite', path: '/menu' },
      { img: 'tile-table', caption: 'Mesas de doces', alt: 'Mesa farta de doces tropicais', path: '/menu' },
      { img: 'tile-glasses', caption: 'Taças individuais', alt: 'Taças de açaí com creme', path: '/menu' },
    ],
  },
  cursos: {
    kicker: 'Cursos em Itamambuca',
    heroAlt: 'Aula prática de confeitaria',
    stripTitle: 'O que se aprende na bancada',
    strip: [
      { img: 'tile-nuts', caption: 'Castanhas & sementes', alt: 'Ilustração de castanhas e nozes', path: '/cursos' },
      { img: 'tile-mango', caption: 'Sobremesas cruas', alt: 'Cheesecake vegano de manga', path: '/cursos' },
      { img: 'tile-bakery', caption: 'Vitrine de padaria', alt: 'Vitrine com pães e doces', path: '/cursos' },
    ],
  },
  retiros: {
    kicker: 'Retiros em Itamambuca',
    heroAlt: 'Praia de Itamambuca vista do alto',
    stripTitle: 'Pertinho da casa',
    strip: [
      { img: 'tile-island', caption: 'Ilha do Prumirim · 15–20 min', alt: 'Ilha do Prumirim vista do alto', path: '/retreats' },
      { img: 'tile-waterfall', caption: 'Cachoeira · 15–20 min', alt: 'Piscina natural na Cachoeira do Prumirim', path: '/retreats' },
      { img: 'tile-surf', caption: 'Surfe · aulas à parte', alt: 'Surfista numa onda', path: '/retreats' },
    ],
  },
  parcerias: {
    kicker: 'Parcerias',
    heroAlt: 'Café da manhã de hotel com vista para o mar',
    stripTitle: 'Onde nossos doces já moram',
    strip: [
      { img: 'tile-tray', caption: 'Café na cama (Airbnbs)', alt: 'Bandeja de café da manhã com doces', path: '/b2b/airbnbs' },
      { img: 'tile-pousada', caption: 'Pousadas', alt: 'Hóspedes na varanda de uma pousada', path: '/b2b/pousadas' },
      { img: 'tile-pecan', caption: 'Vitrines & cafés', alt: 'Doces de chocolate com pecã', path: '/b2b' },
    ],
  },
  equipe: {
    kicker: 'Trabalhe com a gente',
    heroAlt: 'Vitrine da padaria',
    stripTitle: 'O dia a dia na cozinha',
    strip: [
      { img: 'tile-chef', caption: 'Mão na massa', alt: 'Confeiteiras trabalhando juntas', path: '/trabalhe-conosco' },
      { img: 'tile-box', caption: 'Caixas montadas à mão', alt: 'Caixa de doces montada', path: '/trabalhe-conosco' },
      { img: 'tile-caramel', caption: 'Pequenos lotes', alt: 'Bolinhos com calda de caramelo', path: '/trabalhe-conosco' },
    ],
  },
  novidades: {
    kicker: 'Carta da padaria',
    heroAlt: 'Mesa de doces tropicais',
    stripTitle: 'Da nossa mesa',
    strip: [
      { img: 'tile-mango', caption: 'Caixa de Degustação', alt: 'Cheesecake vegano de manga', path: '/caixas' },
      { img: 'tile-event-night', caption: 'Menu de Eventos', alt: 'Jantar tropical à noite', path: '/menu' },
      { img: 'tile-island', caption: 'Retiros', alt: 'Ilha do Prumirim vista do alto', path: '/retreats' },
    ],
  },
};

/** A big number with a short line under it, shown in a row of up to three. */
export interface EmailFact {
  num: string;
  label: string;
}

export interface LayoutOptions {
  /** Hidden line Gmail shows next to the subject. */
  preheader: string;
  /** Big heading inside the card. */
  heading: string;
  /** Body HTML (paragraphs, lists — already escaped by the caller). */
  body: string;
  cta?: { label: string; href: string };
  /** Small print under the button. */
  note?: string;
  /** Up to three "100 m / da areia" tiles under the text. */
  facts?: EmailFact[];
  /** Picks the photo, kicker and photo strip. Defaults to 'novidades'. */
  theme?: EmailTheme;
  /** Where images load from. The admin preview passes its own origin so new images show before deploy. */
  assetBase?: string;
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
    .filter(p => p.trim())
    .map(p => `<p style="color:${TEXT};font-family:${BODY_FONT};font-size:16px;line-height:1.7;margin:0 0 16px;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

export const bulletList = (items: string[]) =>
  items.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 20px;">${items
        .map(
          i =>
            `<tr><td valign="top" style="color:${GOLD};font-size:14px;line-height:1.7;padding:0 10px 8px 0;">&#10022;</td>` +
            `<td style="color:${TEXT};font-family:${BODY_FONT};font-size:15px;line-height:1.7;padding:0 0 8px;">${esc(i)}</td></tr>`,
        )
        .join('')}</table>`
    : '';

/** "Oi, Ana!" at the top of the body, in the e-mail's own font. */
export const greeting = (firstName: string) =>
  `<p style="color:${COCOA};font-family:${BODY_FONT};font-size:17px;font-weight:bold;margin:0 0 12px;">Oi, ${esc(firstName)}!</p>`;

/** Small gold uppercase label above a list or section, the same one the site uses. */
export const kicker = (text: string) =>
  `<p style="color:${GOLD_DEEP};font-family:${BODY_FONT};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;margin:8px 0 10px;">${esc(text)}</p>`;

const FOOTER_LINKS: { label: string; path: string }[] = [
  { label: 'Caixa de Degustação', path: '/caixas' },
  { label: 'Assinatura', path: '/assinatura' },
  { label: 'Menu de Eventos', path: '/menu' },
  { label: 'Cursos', path: '/cursos' },
  { label: 'Retiros', path: '/retreats' },
];

const img = (base: string, name: string, ext = 'jpg') => `${base}/email/${name}.${ext}`;

function factsRow(facts: EmailFact[]): string {
  const list = facts.slice(0, 3);
  if (!list.length) return '';
  const w = Math.floor(100 / list.length);
  const cells = list.map(f => `
    <td class="tb-fact" width="${w}%" valign="top" style="padding:0 4px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td class="tb-fact-in" height="96" valign="middle" bgcolor="${SAND}" style="height:96px;background:${SAND};border:1px solid ${LINE};border-radius:14px;padding:12px 10px;text-align:center;">
          <div class="tb-fact-num${f.num.length > 7 ? " tb-fact-num--long" : ""}" style="font-family:${HEADING_FONT};font-weight:700;font-size:${f.num.length > 7 ? 16 : 22}px;line-height:1.15;color:${GOLD_DEEP};">${esc(f.num)}</div>
          <div class="tb-fact-lbl" style="font-family:${BODY_FONT};font-size:12px;line-height:1.4;color:${TEXT};margin-top:6px;">${esc(f.label)}</div>
        </td></tr>
      </table>
    </td>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 24px;table-layout:fixed;"><tr>${cells}</tr></table>`;
}

function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:6px auto 4px;">
      <tr><td bgcolor="${GOLD}" style="background:${GOLD};border-radius:999px;box-shadow:0 6px 16px rgba(166,131,43,0.35);">
        <a href="${href}" style="display:inline-block;padding:16px 36px;font-family:${BODY_FONT};font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${COCOA};text-decoration:none;border-radius:999px;">${esc(label)}&nbsp;&rarr;</a>
      </td></tr>
    </table>`;
}

function photoStrip(t: ThemeDef, base: string): string {
  const cells = t.strip.map(s => `
    <td class="tb-tile" width="33%" valign="top" style="padding:0 4px;">
      <a href="${SITE_URL}${s.path}" style="text-decoration:none;">
        <img src="${img(base, s.img)}" width="176" height="176" alt="${esc(s.alt)}"
          style="display:block;width:100%;max-width:176px;height:auto;border:0;border-radius:14px;background:${SAND};">
        <div style="font-family:${BODY_FONT};font-size:12px;line-height:1.35;color:${COCOA};font-weight:bold;margin-top:8px;">${esc(s.caption)}</div>
      </a>
    </td>`).join('');
  return `
    <tr><td style="padding:34px 0 0;">
      <p style="text-align:center;color:${GOLD_DEEP};font-family:${BODY_FONT};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;margin:0 0 14px;">&#10022;&nbsp; ${esc(t.stripTitle)} &nbsp;&#10022;</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;"><tr>${cells}</tr></table>
    </td></tr>`;
}

function originBand(base: string): string {
  return `
    <tr><td style="padding:30px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td bgcolor="${COCOA}" style="background:${COCOA};border-radius:18px;padding:26px 24px;text-align:center;">
          <img src="${img(base, 'flags', 'png')}" width="66" height="36" alt="Bélgica e Brasil" style="display:block;margin:0 auto 12px;border:0;">
          <p style="font-family:${BODY_FONT};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;color:${GOLD};margin:0 0 10px;">Maestria belga &middot; Natureza brasileira</p>
          <p style="font-family:${BODY_FONT};font-size:14px;line-height:1.7;color:#d9cfc4;margin:0;">
            Receitas de Elisabeth &ldquo;Dolly&rdquo; Van Dam, com cacau, castanhas e frutas da Mata Atlântica.
            Vegano, sem glúten, sem açúcar refinado, feito à mão em Itamambuca.
          </p>
        </td></tr>
      </table>
    </td></tr>`;
}

export function renderEmail(o: LayoutOptions): string {
  const base = (o.assetBase || SITE_URL).replace(/\/$/, '');
  const theme = THEMES[o.theme || 'novidades'];
  const themeName = o.theme || 'novidades';

  const note = o.note
    ? `<p style="color:${MUTED};font-family:${BODY_FONT};font-size:12px;line-height:1.6;text-align:center;margin:16px 0 0;">${o.note}</p>`
    : '';

  const manage = o.prefsUrl
    ? `<p style="color:${MUTED};font-family:${BODY_FONT};font-size:12px;line-height:1.7;margin:14px 0 0;">
         ${o.reason ? `${esc(o.reason)}<br>` : ''}
         <a href="${o.prefsUrl}" style="color:${MUTED};text-decoration:underline;">Escolher quais e-mails receber</a>
         &nbsp;·&nbsp;
         <a href="${o.unsubscribeUrl || o.prefsUrl}" style="color:${MUTED};text-decoration:underline;">Descadastrar de tudo</a>
       </p>`
    : '';

  // Stops the start of the body leaking into the inbox preview after the preheader.
  const preheaderPad = '&#847;&zwnj;&nbsp;'.repeat(60);

  return `<!doctype html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">
<title>${esc(o.heading)}</title>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&family=Unbounded:wght@700&display=swap" rel="stylesheet">
<style>
  :root { color-scheme: light; }
  a { color: ${GOLD_DEEP}; }
  @media (max-width: 480px) {
    .tb-card { padding: 26px 20px 28px !important; }
    .tb-h1 { font-size: 23px !important; }
    .tb-fact { padding: 0 3px !important; }
    .tb-fact-in { padding: 10px 5px !important; height: 88px !important; }
    .tb-fact-num { font-size: 17px !important; }
    .tb-fact-num--long { font-size: 12px !important; }
    .tb-fact-lbl { font-size: 11px !important; }
    .tb-tile div { font-size: 11px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${CREAM};-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${esc(o.preheader)}${preheaderPad}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${CREAM}" style="background:${CREAM};">
    <tr><td align="center" style="padding:28px 14px 36px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">

        <tr><td align="center" style="padding:0 0 18px;">
          <a href="${SITE_URL}" style="text-decoration:none;">
            <img src="${img(base, 'logo-pineapple', 'png')}" width="92" height="138" alt="The Tropical Bakery" style="display:block;margin:0 auto;border:0;">
          </a>
          <p style="font-family:${BODY_FONT};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${GOLD_DEEP};margin:12px 0 0;">Itamambuca &middot; Ubatuba</p>
        </td></tr>

        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff"
            style="background:#ffffff;border:1px solid ${LINE};border-radius:22px;border-collapse:separate;overflow:hidden;box-shadow:0 18px 40px rgba(60,42,33,0.10);">
            <tr><td bgcolor="${SAND}" style="background:${SAND};line-height:0;font-size:0;border-radius:22px 22px 0 0;overflow:hidden;">
              <img src="${img(base, `hero-${themeName}`)}" width="580" height="387" alt="${esc(theme.heroAlt)}"
                style="display:block;width:100%;max-width:580px;height:auto;border:0;border-radius:22px 22px 0 0;">
            </td></tr>
            <tr><td height="4" bgcolor="${GOLD}" style="background:${GOLD};line-height:4px;font-size:0;">&nbsp;</td></tr>
            <tr><td class="tb-card" style="padding:32px 36px 34px;">
              <p style="text-align:center;font-family:${BODY_FONT};font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;color:${GOLD_DEEP};margin:0 0 12px;">&#10022;&nbsp; ${esc(theme.kicker)} &nbsp;&#10022;</p>
              <h1 class="tb-h1" style="font-family:${HEADING_FONT};font-weight:700;color:${COCOA};font-size:27px;line-height:1.22;margin:0 0 22px;text-align:center;letter-spacing:-0.3px;">${esc(o.heading)}</h1>
              ${o.body}
              ${o.facts?.length ? factsRow(o.facts) : ''}
              ${o.cta ? button(o.cta.label, o.cta.href) : ''}
              ${note}
            </td></tr>
          </table>
        </td></tr>

        ${photoStrip(theme, base)}
        ${originBand(base)}

        <tr><td align="center" style="padding:26px 8px 0;">
          <p style="color:${TEXT};font-family:${BODY_FONT};font-size:13px;line-height:1.7;margin:0 0 16px;">
            Para ir mais fundo: <a href="${SUBSTACK_URL}" style="color:${GOLD_DEEP};font-weight:bold;text-decoration:underline;">Sunbaked Letters</a>,
            a newsletter da Dolly no Substack <span style="color:${MUTED};">(em inglês)</span>.
          </p>
          <p style="margin:0 0 12px;font-family:${BODY_FONT};line-height:2;">
            ${FOOTER_LINKS.map(
              l => `<a href="${SITE_URL}${l.path}" style="color:${TEXT};font-size:12px;text-decoration:none;margin:0 4px;white-space:nowrap;">${l.label}</a>`,
            ).join(`<span style="color:${GOLD};">&nbsp;&#10022;&nbsp;</span>`)}
          </p>
          <p style="color:${MUTED};font-family:${BODY_FONT};font-size:12px;line-height:1.7;margin:0;">
            The Tropical Bakery · Itamambuca, Ubatuba — SP<br>
            <a href="https://wa.me/${STORE_WHATSAPP}" style="color:${GOLD_DEEP};text-decoration:none;">Falar com a gente no WhatsApp</a>
            &nbsp;·&nbsp;
            <a href="${SITE_URL}" style="color:${GOLD_DEEP};text-decoration:none;">thetropicalbakery.com</a>
          </p>
          ${manage}
        </td></tr>

      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Same content as plain text, for clients that refuse HTML. */
export function plainTextFallback(o: LayoutOptions): string {
  const strip = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#10022;/g, '*').replace(/\s+/g, ' ').trim();
  return [
    o.heading,
    '',
    strip(o.body),
    o.facts?.length ? o.facts.map(f => `${f.num} — ${f.label}`).join('\n') : '',
    o.cta ? `\n${o.cta.label}: ${o.cta.href}` : '',
    '',
    `Para ir mais fundo: Sunbaked Letters, a newsletter da Dolly no Substack (em inglês): ${SUBSTACK_URL}`,
    '',
    `The Tropical Bakery — Itamambuca, Ubatuba/SP`,
    SITE_URL,
    o.prefsUrl ? `\nPreferências de e-mail: ${o.prefsUrl}` : '',
    o.unsubscribeUrl ? `Descadastrar: ${o.unsubscribeUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
