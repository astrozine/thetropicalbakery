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
/**
 * Kicker colour stand-in: kicker() is a pure helper with no idea which e-mail it is in, so it writes this and
 * renderEmail() swaps in the e-mail's accent (orange on a Sweet Escape e-mail, gold everywhere else).
 */
const KICKER_MARK = '#a6832c';

const HEADING_FONT = `'Unbounded','Outfit',Helvetica,Arial,sans-serif`;
const BODY_FONT = `'Outfit',Helvetica,Arial,sans-serif`;

/**
 * The shell speaks Portuguese; an e-mail written for an English reader (the free-recipes funnel) passes lang: 'en'
 * and gets the frame in English too. Only the frame's own words live here; the message itself is the caller's.
 */
export type EmailLang = 'pt' | 'en' | 'es' | 'nl' | 'de';
const isEmailLang = (l: unknown): l is EmailLang => l === 'pt' || l === 'en' || l === 'es' || l === 'nl' || l === 'de';

const UI = {
  pt: {
    html: 'pt-BR', choose: 'Escolher quais e-mails receber', leave: 'Descadastrar de tudo', hi: 'Oi',
    originKicker: 'Maestria belga &middot; Natureza brasileira',
    origin: 'Receitas de Elisabeth &ldquo;Dolly&rdquo; Van Dam, com cacau, castanhas e frutas da Mata Atlântica. Vegano, sem trigo, feito à mão em Itamambuca.',
    flagsAlt: 'Bélgica e Brasil',
    deeper: 'Para ir mais fundo:', newsletter: 'a newsletter da Dolly no Substack', inEnglish: '(em inglês)',
    whatsapp: 'Falar com a gente no WhatsApp', prefs: 'Preferências de e-mail', unsub: 'Descadastrar',
  },
  en: {
    html: 'en', choose: 'Choose which e-mails you get', leave: 'Unsubscribe from everything', hi: 'Hi',
    originKicker: 'Belgian craft &middot; Brazilian nature',
    origin: 'Recipes by Elisabeth &ldquo;Dolly&rdquo; Van Dam, with cacao, nuts and fruit from the “Mata Atlântica” jungle. Vegan, wheat-free, handmade on Itamambuca beach.',
    flagsAlt: 'Belgium and Brazil',
    deeper: 'To go deeper:', newsletter: 'Dolly’s newsletter on Substack', inEnglish: '',
    whatsapp: 'Talk to us on WhatsApp', prefs: 'E-mail preferences', unsub: 'Unsubscribe',
  },
  // Spanish, Dutch and German readers of the free-recipes funnel (2026-11-16: their e-mails had an English frame).
  es: {
    html: 'es', choose: 'Elegir qué e-mails recibir', leave: 'Darse de baja de todo', hi: 'Hola',
    originKicker: 'Oficio belga &middot; Naturaleza brasileña',
    origin: 'Recetas de Elisabeth &ldquo;Dolly&rdquo; Van Dam, con cacao, frutos secos y frutas de la selva, la “Mata Atlântica”. Vegano, sin trigo, hecho a mano en la playa de Itamambuca.',
    flagsAlt: 'Bélgica y Brasil',
    deeper: 'Para ir más a fondo:', newsletter: 'el newsletter de Dolly en Substack', inEnglish: '(en inglés)',
    whatsapp: 'Hablar con nosotros por WhatsApp', prefs: 'Preferencias de e-mail', unsub: 'Darse de baja',
  },
  nl: {
    html: 'nl', choose: 'Kies welke e-mails je krijgt', leave: 'Uitschrijven voor alles', hi: 'Hoi',
    originKicker: 'Belgisch vakmanschap &middot; Braziliaanse natuur',
    origin: 'Recepten van Elisabeth &ldquo;Dolly&rdquo; Van Dam, met cacao, noten en fruit uit de jungle van de “Mata Atlântica”. Vegan, tarwevrij, met de hand gemaakt aan het strand van Itamambuca.',
    flagsAlt: 'België en Brazilië',
    deeper: 'Verder lezen:', newsletter: 'Dolly’s nieuwsbrief op Substack', inEnglish: '(in het Engels)',
    whatsapp: 'Stuur ons een WhatsApp', prefs: 'E-mailvoorkeuren', unsub: 'Uitschrijven',
  },
  de: {
    html: 'de', choose: 'Wähle, welche E-Mails du bekommst', leave: 'Von allem abmelden', hi: 'Hallo',
    originKicker: 'Belgisches Handwerk &middot; Brasilianische Natur',
    origin: 'Rezepte von Elisabeth &bdquo;Dolly&ldquo; Van Dam, mit Kakao, Nüssen und Früchten aus dem Dschungel der &bdquo;Mata Atlântica&ldquo;. Vegan, weizenfrei, von Hand gemacht am Strand von Itamambuca.',
    flagsAlt: 'Belgien und Brasilien',
    deeper: 'Mehr dazu:', newsletter: 'Dollys Newsletter auf Substack', inEnglish: '(auf Englisch)',
    whatsapp: 'Schreib uns auf WhatsApp', prefs: 'E-Mail-Einstellungen', unsub: 'Abmelden',
  },
} as const;

/** Which page an e-mail belongs to. Picks the top photo, the kicker and the photo strip. */
export type EmailTheme = 'caixa' | 'assinatura' | 'eventos' | 'cursos' | 'retiros' | 'parcerias' | 'equipe' | 'novidades' | 'brunch';

interface ThemeDef {
  kicker: string;
  /** Height of the top photo at 580px wide (the photos are captures of each landing page's own header). */
  heroHeight?: number;
  heroAlt: string;
  stripTitle: string;
  strip: { img: string; caption: string; alt: string; path: string }[];
}

const THEMES: Record<EmailTheme, ThemeDef> = {
  caixa: {
    kicker: 'Caixa de Degustação', heroHeight: 380,
    heroAlt: 'Caixa de Degustação aberta, com doces da Dolly',
    stripTitle: 'Saído da nossa cozinha',
    strip: [
      { img: 'tile-pitaya', caption: 'Pitaya & cacau', alt: 'Doce de pitaya em prato dourado', path: '/caixas' },
      { img: 'tile-bundt', caption: 'Bundt de chocolate', alt: 'Mini bundt coberto de chocolate', path: '/caixas' },
      { img: 'tile-truffles', caption: 'Trufas de morango', alt: 'Trufas cobertas de morango', path: '/caixas' },
    ],
  },
  assinatura: {
    kicker: 'Sua assinatura', heroHeight: 380,
    heroAlt: 'Caixa de Degustação com doces da semana',
    stripTitle: 'O que anda saindo da cozinha',
    strip: [
      { img: 'tile-truffles', caption: 'Trufas de morango', alt: 'Trufas cobertas de morango', path: '/assinatura' },
      { img: 'tile-caramel', caption: 'Bundt de caramelo', alt: 'Bolinhos com calda de caramelo', path: '/assinatura' },
      { img: 'tile-pecan', caption: 'Chocolate & pecã', alt: 'Doces de chocolate com pecã', path: '/assinatura' },
    ],
  },
  eventos: {
    kicker: 'Menu de Eventos', heroHeight: 380,
    heroAlt: 'Convidados provando os doces da Dolly numa festa',
    stripTitle: 'Do Menu de Eventos',
    strip: [
      { img: 'tile-glasses', caption: 'Taças individuais', alt: 'Taças de açaí com creme', path: '/menu' },
      { img: 'tile-pecan', caption: 'Chocolate & pecã', alt: 'Doces de chocolate com pecã', path: '/menu' },
      { img: 'tile-pistachio', caption: 'Torta de pistache', alt: 'Fatia de torta de pistache', path: '/menu' },
    ],
  },
  cursos: {
    kicker: 'Cursos com a Chef Dolly', heroHeight: 386,
    heroAlt: 'Uma turma provando doces na cozinha da Dolly',
    stripTitle: 'O que se aprende na bancada',
    strip: [
      { img: 'tile-dolly-tray', caption: 'Com a Dolly', alt: 'Dolly segurando uma tábua de doces', path: '/cursos' },
      { img: 'tile-pistachio', caption: 'Torta de pistache', alt: 'Fatia de torta de pistache', path: '/cursos' },
      { img: 'tile-caramel', caption: 'Bundt de caramelo', alt: 'Bolinhos com calda de caramelo', path: '/cursos' },
    ],
  },
  retiros: {
    kicker: 'Retiros em Itamambuca', heroHeight: 416,
    heroAlt: 'Praia de Itamambuca vista do alto',
    stripTitle: 'Pertinho da casa',
    strip: [
      { img: 'tile-island', caption: 'Ilha do Prumirim · 15–20 min', alt: 'Ilha do Prumirim vista do alto', path: '/retreats' },
      { img: 'tile-waterfall', caption: 'Cachoeira · 15–20 min', alt: 'Piscina natural na Cachoeira do Prumirim', path: '/retreats' },
      { img: 'tile-dolly-tray', caption: 'Cozinhando com a Dolly', alt: 'Dolly segurando uma tábua de doces', path: '/retreats' },
    ],
  },
  parcerias: {
    kicker: 'Parcerias', heroHeight: 380,
    heroAlt: 'Caixa de doces da Dolly para hotéis, pousadas e cafés',
    stripTitle: 'O que vai para a sua vitrine',
    strip: [
      { img: 'tile-box', caption: 'Caixas de boas-vindas', alt: 'Caixa de doces montada', path: '/b2b' },
      { img: 'tile-glasses', caption: 'Taças para servir', alt: 'Taças de açaí com creme', path: '/b2b' },
      { img: 'tile-pecan', caption: 'Vitrines & cafés', alt: 'Doces de chocolate com pecã', path: '/b2b' },
    ],
  },
  equipe: {
    kicker: 'Trabalhe com a gente', heroHeight: 380,
    heroAlt: 'Dolly na cozinha, com espátula e doces',
    stripTitle: 'O que sai das nossas mãos',
    strip: [
      { img: 'tile-box', caption: 'Caixas montadas à mão', alt: 'Caixa de doces montada', path: '/trabalhe-conosco' },
      { img: 'tile-bundt', caption: 'Pequenos lotes', alt: 'Mini bundt coberto de chocolate', path: '/trabalhe-conosco' },
      { img: 'tile-truffles', caption: 'Detalhe em tudo', alt: 'Trufas cobertas de morango', path: '/trabalhe-conosco' },
    ],
  },
  brunch: {
    kicker: 'Brunch Tropical', heroHeight: 418,
    heroAlt: 'Mulheres em volta de uma mesa de brunch tropical com doces e chá',
    stripTitle: 'Como é um brunch com a Dolly',
    strip: [
      { img: 'tile-brunch-box', caption: 'A mesa de doces', alt: 'Mesa com doces saudáveis, frutas e chá', path: '/brunch' },
      { img: 'tile-brunch-talk', caption: 'A roda de conversa', alt: 'Convidadas conversando à mesa', path: '/brunch' },
      { img: 'tile-brunch-toast', caption: 'Gente boa por perto', alt: 'Convidadas brindando no jardim', path: '/brunch' },
    ],
  },
  novidades: {
    kicker: 'Da cozinha da Dolly', heroHeight: 448,
    heroAlt: 'O abacaxi da The Tropical Bakery sobre quatro doces da Dolly',
    stripTitle: 'Da nossa mesa',
    strip: [
      { img: 'tile-yellow', caption: 'Sweet Escape', alt: 'Doce amarelo do livro Sweet Escape', path: '/sweet-escape/pt' },
      { img: 'tile-dolly-tray', caption: 'Cursos com a Dolly', alt: 'Dolly segurando uma tábua de doces', path: '/cursos' },
      { img: 'tile-island', caption: 'Retiros', alt: 'Ilha do Prumirim vista do alto', path: '/retreats' },
    ],
  },
};

/** A big number with a short line under it, shown in a row of up to three. */
export interface EmailFact {
  num: string;
  label: string;
  /** Ignored (no emoji in e-mails). Kept so old callers compile. */
  icon?: string;
}

export interface LayoutOptions {
  /** Hidden line Gmail shows next to the subject. */
  preheader: string;
  /** Big heading inside the card. */
  heading: string;
  /** Body HTML (paragraphs, lists — already escaped by the caller). */
  body: string;
  cta?: { label: string; href: string };
  /** More body HTML under the button (an upsell after the main action). */
  afterCta?: string;
  /** Small print under the button. */
  note?: string;
  /** Up to three "100 m / da areia" tiles under the text. */
  facts?: EmailFact[];
  /** Picks the photo, kicker and photo strip. Defaults to 'novidades'. */
  theme?: EmailTheme;
  /** Ignored since 2026-11-23 (no more emoji tiles; Andrew called them AI slop). Kept so old callers still compile. */
  icon?: string;
  /** Where images load from. The admin preview passes its own origin so new images show before deploy. */
  assetBase?: string;
  /** Manage-preferences link; omitted for transactional mail. */
  prefsUrl?: string;
  unsubscribeUrl?: string;
  /** Why this person is getting it, e.g. "Você recebe este e-mail porque assina a Caixa de Degustação." */
  reason?: string;
  /** The frame's language. Default Portuguese. */
  lang?: EmailLang;
  /**
   * Dress the e-mail as a product page instead of the bakery's theme (the Sweet Escape e-mails wear the book's look):
   * its own top image (a path under public/email/), its own kicker, an accent colour for the bar under the photo, the
   * kicker and the button, no emoji tile, and no bakery photo strip.
   */
  look?: { hero: string; heroAlt: string; heroHeight?: number; kicker: string; accent: string; accentInk?: string };
  /**
   * A real photo as the top image instead of the theme's (Dolly's Sunday letter uses her first photo). Any https URL;
   * its height follows the photo. The theme's kicker and photo strip stay.
   */
  heroPhoto?: { src: string; alt: string };
}

/**
 * One e-mail, built but not sent: what a send hands to deliver(), and what Admin › E-mails › "Todos os e-mails"
 * previews (catalog.ts). Every automatic e-mail exports a builder that returns this, so the preview is the real thing.
 */
export interface BuiltEmail { messageKey: string; subject: string; layout: LayoutOptions }

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

/** "Oi, Ana!" (or "Hi, Ana!") at the top of the body, in the e-mail's own font. */
export const greeting = (firstName: string, lang: EmailLang = 'pt') =>
  `<p style="color:${COCOA};font-family:${BODY_FONT};font-size:17px;font-weight:bold;margin:0 0 12px;">${UI[lang].hi}, ${esc(firstName)}!</p>`;

/** Small gold uppercase label above a list or section, the same one the site uses. With an emoji, it gets the signpost tile. */
export const kicker = (text: string, _icon?: string) =>
  `<p style="color:${KICKER_MARK};font-family:${BODY_FONT};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;margin:14px 0 10px;">${esc(text)}</p>`;

export interface OrderLine {
  label: string;
  /** Already formatted, e.g. "R$ 99,00". Blank for a line with no price. */
  amount: string;
  /** Sets it apart as the amount that matters. */
  strong?: boolean;
}

/**
 * The "what you ordered" table on a receipt. Right-aligned amounts, a rule above
 * the total, and no colspan tricks — Outlook renders this one the same as Gmail.
 */
export const orderTable = (lines: OrderLine[]) =>
  lines.length
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:4px 0 22px;border-collapse:collapse;">${lines
        .map(l => {
          const weight = l.strong ? 'bold' : 'normal';
          const size = l.strong ? '17px' : '15px';
          const colour = l.strong ? COCOA : TEXT;
          const top = l.strong ? `border-top:1px solid ${LINE};padding-top:10px;` : '';
          return `<tr>` +
            `<td style="color:${colour};font-family:${BODY_FONT};font-size:${size};font-weight:${weight};line-height:1.6;padding:0 8px 8px 0;${top}">${esc(l.label)}</td>` +
            `<td align="right" style="color:${colour};font-family:${BODY_FONT};font-size:${size};font-weight:${weight};line-height:1.6;padding:0 0 8px;white-space:nowrap;${top}">${esc(l.amount)}</td>` +
            `</tr>`;
        })
        .join('')}</table>`
    : '';

/**
 * A code the reader has to copy by hand — a Pix "copia e cola" string. Monospace,
 * breaks anywhere, and on a background so it reads as a field rather than prose.
 */
export const copyBox = (label: string, code: string) =>
  `${kicker(label)}<div style="margin:0 0 20px;padding:12px 14px;border-radius:10px;background:${SAND};border:1px solid ${LINE};color:${COCOA};font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.6;word-break:break-all;">${esc(code)}</div>`;

/** The English words for a theme's frame, where an English e-mail uses that theme. */
const THEMES_EN: Partial<Record<EmailTheme, Partial<ThemeDef>>> = {
  novidades: {
    kicker: 'From Dolly’s kitchen',
    heroAlt: 'The Tropical Bakery pineapple over four of Dolly’s treats',
    stripTitle: 'From our table',
    strip: [
      { img: 'tile-yellow', caption: 'Sweet Escape', alt: 'A yellow treat from the Sweet Escape book', path: '/sweet-escape' },
      { img: 'tile-dolly-tray', caption: 'Cook with Dolly', alt: 'Dolly holding a board of treats', path: '/cursos' },
      { img: 'tile-island', caption: 'Retreats', alt: 'Prumirim island from above', path: '/en/retreats' },
    ],
  },
};

/** The same, in the other languages the free-recipes funnel writes in. */
const THEMES_INTL: Record<'es' | 'nl' | 'de', Partial<Record<EmailTheme, Partial<ThemeDef>>>> = {
  es: { novidades: {
    kicker: 'Desde la cocina de Dolly', heroAlt: 'La piña de The Tropical Bakery sobre cuatro dulces de Dolly', stripTitle: 'De nuestra mesa',
    strip: [
      { img: 'tile-yellow', caption: 'Sweet Escape', alt: 'Un dulce amarillo del libro Sweet Escape', path: '/sweet-escape/es' },
      { img: 'tile-dolly-tray', caption: 'Cocina con Dolly', alt: 'Dolly con una tabla de dulces', path: '/cursos' },
      { img: 'tile-island', caption: 'Retiros', alt: 'La isla de Prumirim desde arriba', path: '/es/retiros' },
    ],
  } },
  nl: { novidades: {
    kicker: 'Uit Dolly’s keuken', heroAlt: 'De ananas van The Tropical Bakery boven vier lekkernijen van Dolly', stripTitle: 'Van onze tafel',
    strip: [
      { img: 'tile-yellow', caption: 'Sweet Escape', alt: 'Een geel snoepje uit het boek Sweet Escape', path: '/sweet-escape/nl' },
      { img: 'tile-dolly-tray', caption: 'Kook met Dolly', alt: 'Dolly met een plank vol lekkers', path: '/cursos' },
      { img: 'tile-island', caption: 'Retreats', alt: 'Het eiland Prumirim van bovenaf', path: '/en/retreats' },
    ],
  } },
  de: { novidades: {
    kicker: 'Aus Dollys Küche', heroAlt: 'Die Ananas von The Tropical Bakery über vier Leckereien von Dolly', stripTitle: 'Von unserem Tisch',
    strip: [
      { img: 'tile-yellow', caption: 'Sweet Escape', alt: 'Eine gelbe Leckerei aus dem Buch Sweet Escape', path: '/sweet-escape/de' },
      { img: 'tile-dolly-tray', caption: 'Koch mit Dolly', alt: 'Dolly mit einem Brett voller Leckereien', path: '/cursos' },
      { img: 'tile-island', caption: 'Retreats', alt: 'Die Insel Prumirim von oben', path: '/en/retreats' },
    ],
  } },
};

const FOOTER_LINKS_EN: { label: string; path: string }[] = [
  { label: 'Sweet Escape', path: '/sweet-escape' },
  { label: 'Cook with Dolly', path: '/cursos' },
  { label: 'Events Menu', path: '/menu' },
  { label: 'Retreats', path: '/en/retreats' },
];

const FOOTER_LINKS_INTL: Record<'es' | 'nl' | 'de', { label: string; path: string }[]> = {
  es: [
    { label: 'Sweet Escape', path: '/sweet-escape/es' },
    { label: 'Menú de Eventos', path: '/menu' },
    { label: 'Retiros', path: '/es/retiros' },
  ],
  nl: [
    { label: 'Sweet Escape', path: '/sweet-escape/nl' },
    { label: 'Evenementenmenu', path: '/menu' },
    { label: 'Retreats', path: '/en/retreats' },
  ],
  de: [
    { label: 'Sweet Escape', path: '/sweet-escape/de' },
    { label: 'Event-Menü', path: '/menu' },
    { label: 'Retreats', path: '/en/retreats' },
  ],
};

const FOOTER_LINKS: { label: string; path: string }[] = [
  { label: 'Sweet Escape', path: '/sweet-escape/pt' },
  { label: 'Cursos', path: '/cursos' },
  { label: 'Coaching', path: '/coaching' },
  { label: 'Menu de Eventos', path: '/menu' },
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

export function button(label: string, href: string, bg = GOLD, ink = COCOA): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:6px auto 4px;">
      <tr><td bgcolor="${bg}" style="background:${bg};border-radius:999px;box-shadow:0 6px 16px rgba(60,42,33,0.25);">
        <a href="${href}" style="display:inline-block;padding:16px 32px;font-family:${BODY_FONT};font-size:14px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;color:${ink};text-decoration:none;border-radius:999px;">${esc(label)}&nbsp;&rarr;</a>
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

function originBand(base: string, t: (typeof UI)[EmailLang]): string {
  return `
    <tr><td style="padding:30px 0 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr><td bgcolor="${COCOA}" style="background:${COCOA};border-radius:18px;padding:26px 24px;text-align:center;">
          <img src="${img(base, 'flags', 'png')}" width="66" height="36" alt="${t.flagsAlt}" style="display:block;margin:0 auto 12px;border:0;">
          <p style="font-family:${BODY_FONT};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;color:${GOLD};margin:0 0 10px;">${t.originKicker}</p>
          <p style="font-family:${BODY_FONT};font-size:14px;line-height:1.7;color:#d9cfc4;margin:0;">
            ${t.origin}
          </p>
        </td></tr>
      </table>
    </td></tr>`;
}

export function renderEmail(o: LayoutOptions): string {
  const base = (o.assetBase || SITE_URL).replace(/\/$/, '');
  const themeName = o.theme || 'novidades';
  const lang: EmailLang = isEmailLang(o.lang) ? o.lang : 'pt';
  const t = UI[lang];
  const local = lang === 'pt' ? undefined : lang === 'en' ? THEMES_EN[themeName] : THEMES_INTL[lang][themeName] ?? THEMES_EN[themeName];
  const theme: ThemeDef = local ? { ...THEMES[themeName], ...local } : THEMES[themeName];
  const look = o.look;
  const accent = look?.accent || GOLD;
  const heroSrc = o.heroPhoto ? o.heroPhoto.src : look ? `${base}/email/${look.hero}` : img(base, `hero-${themeName}`);
  const heroAlt = o.heroPhoto ? o.heroPhoto.alt : look ? look.heroAlt : theme.heroAlt;
  const heroSize = o.heroPhoto ? '' : `height="${look?.heroHeight || theme.heroHeight || 387}"`;
  const footerLinks = lang === 'pt' ? FOOTER_LINKS : lang === 'en' ? FOOTER_LINKS_EN : FOOTER_LINKS_INTL[lang];

  const note = o.note
    ? `<p style="color:${MUTED};font-family:${BODY_FONT};font-size:12px;line-height:1.6;text-align:center;margin:16px 0 0;">${o.note}</p>`
    : '';

  const manage = o.prefsUrl
    ? `<p style="color:${MUTED};font-family:${BODY_FONT};font-size:12px;line-height:1.7;margin:14px 0 0;">
         ${o.reason ? `${esc(o.reason)}<br>` : ''}
         <a href="${o.prefsUrl}" style="color:${MUTED};text-decoration:underline;">${t.choose}</a>
         &nbsp;·&nbsp;
         <a href="${o.unsubscribeUrl || o.prefsUrl}" style="color:${MUTED};text-decoration:underline;">${t.leave}</a>
       </p>`
    : '';

  // Stops the start of the body leaking into the inbox preview after the preheader.
  const preheaderPad = '&#847;&zwnj;&nbsp;'.repeat(60);

  return `<!doctype html>
<html lang="${t.html}" xmlns="http://www.w3.org/1999/xhtml"><head>
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
              <img src="${esc(heroSrc)}" width="580" ${heroSize} alt="${esc(heroAlt)}"
                style="display:block;width:100%;max-width:580px;height:auto;border:0;border-radius:22px 22px 0 0;">
            </td></tr>
            <tr><td height="${look ? 6 : 4}" bgcolor="${accent}" style="background:${accent};line-height:${look ? 6 : 4}px;font-size:0;">&nbsp;</td></tr>
            <tr><td class="tb-card" style="padding:32px 36px 34px;">
              <p style="text-align:center;font-family:${BODY_FONT};font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;color:${look ? accent : GOLD_DEEP};margin:0 0 12px;">&#10022;&nbsp; ${esc(look ? look.kicker : theme.kicker)} &nbsp;&#10022;</p>
              <h1 class="tb-h1" style="font-family:${HEADING_FONT};font-weight:700;color:${COCOA};font-size:27px;line-height:1.22;margin:0 0 22px;text-align:center;letter-spacing:-0.3px;">${esc(o.heading)}</h1>
              ${o.body.split(KICKER_MARK).join(look ? accent : GOLD_DEEP)}
              ${o.facts?.length ? factsRow(o.facts) : ''}
              ${o.cta ? button(o.cta.label, o.cta.href, accent, look ? look.accentInk || '#ffffff' : COCOA) : ''}
              ${o.afterCta || ''}
              ${note}
            </td></tr>
          </table>
        </td></tr>

        ${look ? '' : photoStrip(theme, base)}
        ${originBand(base, t)}

        <tr><td align="center" style="padding:26px 8px 0;">
          <p style="color:${TEXT};font-family:${BODY_FONT};font-size:13px;line-height:1.7;margin:0 0 16px;">
            ${t.deeper} <a href="${SUBSTACK_URL}" style="color:${GOLD_DEEP};font-weight:bold;text-decoration:underline;">Sunbaked Letters</a>,
            ${t.newsletter}${t.inEnglish ? ` <span style="color:${MUTED};">${t.inEnglish}</span>` : ''}.
          </p>
          <p style="margin:0 0 12px;font-family:${BODY_FONT};line-height:2;">
            ${footerLinks.map(
              l => `<a href="${SITE_URL}${l.path}" style="color:${TEXT};font-size:12px;text-decoration:none;margin:0 4px;white-space:nowrap;">${l.label}</a>`,
            ).join(`<span style="color:${GOLD};">&nbsp;&#10022;</span> `)}
          </p>
          <p style="color:${MUTED};font-family:${BODY_FONT};font-size:12px;line-height:1.7;margin:0;">
            The Tropical Bakery · Itamambuca, Ubatuba — SP<br>
            <a href="https://wa.me/${STORE_WHATSAPP}" style="color:${GOLD_DEEP};text-decoration:none;">${t.whatsapp}</a>
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
    o.afterCta ? `\n${strip(o.afterCta)}` : '',
    '',
    `${UI[isEmailLang(o.lang) ? o.lang : 'pt'].deeper} Sunbaked Letters, ${UI[isEmailLang(o.lang) ? o.lang : 'pt'].newsletter}${UI[isEmailLang(o.lang) ? o.lang : 'pt'].inEnglish ? ' ' + UI[isEmailLang(o.lang) ? o.lang : 'pt'].inEnglish : ''}: ${SUBSTACK_URL}`,
    '',
    `The Tropical Bakery — Itamambuca, Ubatuba/SP`,
    SITE_URL,
    o.prefsUrl ? `\n${UI[isEmailLang(o.lang) ? o.lang : 'pt'].prefs}: ${o.prefsUrl}` : '',
    o.unsubscribeUrl ? `${UI[isEmailLang(o.lang) ? o.lang : 'pt'].unsub}: ${o.unsubscribeUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
