import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, button, esc, paragraphs, type BuiltEmail, type LayoutOptions } from './layout';
import { deliver } from './send';
import { BOOK_OFFERS } from '@/lib/ebook';
import { LANG_PATH, fill, isEbookLang, type EbookLang } from '@/lib/ebookCopy';
import { FUNNEL, freePdf } from '@/lib/funnel';

/**
 * "Here are your 2 recipes": sent the moment someone signs up on the free-recipes page. Transactional (topic
 * `pedido`, they just asked for it), once per address: signing up twice does not mail the PDF twice. In the five
 * languages the PDF comes in; Spanish, Dutch and German wear the English frame. The sequence that follows is marketing and
 * goes through sendCampaign (lib/email/funnelCampaigns.ts).
 */

interface MailCopy {
  subject: string; preheader: string; kicker: string; heading: string; hi: string; text: string;
  free: string; recipes: { name: string; makes: string }[]; cta: string;
  moreKicker: string; moreTitle: string; moreText: string; moreCta: string; heroAlt: string; note: string;
}

const COPY: Record<EbookLang, MailCopy> = {
  en: {
    subject: 'Your 2 free recipes from Dolly 🍓',
    preheader: 'Red Berry Bliss Balls and Peanutty Banoffee Bars. No oven, 20 minutes.',
    kicker: 'Sweet Escape · free recipes',
    heading: 'Your 2 recipes are here',
    hi: 'Hi, {name}!',
    text: 'Here they are: two treats from my book Sweet Escape that look like candy and are made of fruit, nuts and dates. No oven, about 20 minutes, and little hands can help roll them.',
    free: 'Free',
    recipes: [{ name: 'Tangy Red Berry Bliss Balls', makes: 'Day 3 · Red · makes 12–14' }, { name: 'Peanutty Banoffee Bars', makes: 'Day 6 · Caramel · makes 8–10' }],
    cta: 'Download my 2 recipes',
    moreKicker: 'Kids get bored fast',
    moreTitle: 'The full Sweet Escape',
    moreText: 'Two recipes won’t last long, and every kid has a different favorite. The full book has 7 different treats, from chocolate turtles to ice cream sandwiches, so you keep finding the one they ask for again.',
    moreCta: 'Get all 7 · {price}',
    heroAlt: 'Sweet Escape: 2 free recipes out of 7',
    note: 'With love, Dolly · Itamambuca beach, Brazil',
  },
  pt: {
    subject: 'Suas 2 receitas grátis da Dolly 🍓',
    preheader: 'Bliss Balls de Frutas Vermelhas e Barrinhas Banoffee. Sem forno, 20 minutos.',
    kicker: 'Sweet Escape · receitas grátis',
    heading: 'Suas 2 receitas chegaram',
    hi: 'Oi, {name}!',
    text: 'Aqui estão: dois docinhos do meu livro Sweet Escape que parecem bala e são feitos de frutas, castanhas e tâmaras. Sem forno, uns 20 minutos, e as mãozinhas das crianças podem ajudar a enrolar.',
    free: 'Grátis',
    recipes: [{ name: 'Bliss Balls Azedinhas de Frutas Vermelhas', makes: 'Dia 3 · Vermelho · rende 12–14' }, { name: 'Barrinhas Banoffee de Amendoim', makes: 'Dia 6 · Caramelo · rende 8–10' }],
    cta: 'Baixar minhas 2 receitas',
    moreKicker: 'Criança enjoa rápido',
    moreTitle: 'O Sweet Escape completo',
    moreText: 'Duas receitas não duram muito, e cada criança tem um favorito diferente. O livro completo tem 7 doces diferentes, de tartarugas de chocolate a sanduíche de sorvete, para você achar aquele que eles pedem de novo.',
    moreCta: 'Quero as 7 · {price}',
    heroAlt: 'Sweet Escape: 2 receitas grátis de 7',
    note: 'Com carinho, Dolly · Praia de Itamambuca, Ubatuba',
  },
  es: {
    subject: 'Tus 2 recetas gratis de Dolly 🍓',
    preheader: 'Bliss Balls de Frutos Rojos y Barritas Banoffee. Sin horno, 20 minutos.',
    kicker: 'Sweet Escape · recetas gratis',
    heading: 'Aquí están tus 2 recetas',
    hi: '¡Hola, {name}!',
    text: 'Aquí las tienes: dos dulces de mi libro Sweet Escape que parecen golosinas y están hechos de fruta, frutos secos y dátiles. Sin horno, unos 20 minutos, y las manos pequeñas pueden ayudar a hacer las bolitas.',
    free: 'Gratis',
    recipes: [{ name: 'Bliss Balls Aciditas de Frutos Rojos', makes: 'Día 3 · Rojo · salen 12–14' }, { name: 'Barritas Banoffee de Maní', makes: 'Día 6 · Caramelo · salen 8–10' }],
    cta: 'Descargar mis 2 recetas',
    moreKicker: 'Los niños se aburren rápido',
    moreTitle: 'El Sweet Escape completo',
    moreText: 'Dos recetas no duran mucho, y cada niño tiene un favorito distinto. El libro completo trae 7 dulces diferentes, de tortugas de chocolate a sándwiches de helado, para que encuentres el que te vuelven a pedir.',
    moreCta: 'Quiero las 7 · {price}',
    heroAlt: 'Sweet Escape: 2 recetas gratis de 7',
    note: 'Con cariño, Dolly · Playa de Itamambuca, Brasil',
  },
  nl: {
    subject: 'Je 2 gratis recepten van Dolly 🍓',
    preheader: 'Rode Bessen Bliss Balls en Pinda Banoffee Repen. Zonder oven, 20 minuten.',
    kicker: 'Sweet Escape · gratis recepten',
    heading: 'Hier zijn je 2 recepten',
    hi: 'Hoi {name}!',
    text: 'Hier zijn ze: twee lekkernijen uit mijn boek Sweet Escape die eruitzien als snoep en gemaakt zijn van fruit, noten en dadels. Zonder oven, zo’n 20 minuten, en kleine handjes kunnen helpen rollen.',
    free: 'Gratis',
    recipes: [{ name: 'Frisse Rode Bessen Bliss Balls', makes: 'Dag 3 · Rood · voor 12–14' }, { name: 'Pinda Banoffee Repen', makes: 'Dag 6 · Karamel · voor 8–10' }],
    cta: 'Download mijn 2 recepten',
    moreKicker: 'Kinderen raken snel verveeld',
    moreTitle: 'Het hele Sweet Escape',
    moreText: 'Twee recepten houden het niet lang vol, en elk kind heeft een ander favoriet. Het hele boek heeft 7 verschillende lekkernijen, van chocoladeschildpadjes tot ijssandwiches, zodat je blijft zoeken tot je die vindt waar ze weer om vragen.',
    moreCta: 'Alle 7 · {price}',
    heroAlt: 'Sweet Escape: 2 gratis recepten van 7',
    note: 'Liefs, Dolly · Itamambuca-strand, Brazilië',
  },
  de: {
    subject: 'Deine 2 Gratis-Rezepte von Dolly 🍓',
    preheader: 'Rote-Beeren-Bliss-Balls und Erdnuss-Banoffee-Schnitten. Ohne Ofen, 20 Minuten.',
    kicker: 'Sweet Escape · Gratis-Rezepte',
    heading: 'Hier sind deine 2 Rezepte',
    hi: 'Hallo {name}!',
    text: 'Hier sind sie: zwei Leckereien aus meinem Buch Sweet Escape, die wie Süßigkeiten aussehen und aus Obst, Nüssen und Datteln gemacht sind. Ohne Ofen, etwa 20 Minuten, und kleine Hände können beim Rollen helfen.',
    free: 'Gratis',
    recipes: [{ name: 'Spritzige Rote-Beeren-Bliss-Balls', makes: 'Tag 3 · Rot · für 12–14 Stück' }, { name: 'Erdnuss-Banoffee-Schnitten', makes: 'Tag 6 · Karamell · für 8–10 Stück' }],
    cta: 'Meine 2 Rezepte herunterladen',
    moreKicker: 'Kinder langweilen sich schnell',
    moreTitle: 'Das ganze Sweet Escape',
    moreText: 'Zwei Rezepte halten nicht lange, und jedes Kind hat einen anderen Liebling. Das ganze Buch hat 7 verschiedene Leckereien, von Schoko-Schildkröten bis Eis-Sandwiches, damit du die findest, nach der sie immer wieder fragen.',
    moreCta: 'Alle 7 · {price}',
    heroAlt: 'Sweet Escape: 2 von 7 Rezepten gratis',
    note: 'Alles Liebe, Dolly · Strand von Itamambuca, Brasilien',
  },
};

// The book's own colours (sweetEscape.css), so the e-mail looks like the page they signed up on.
const ORANGE = '#ff4f0a';
const COCOA = '#2a1a12';
const PAPER = '#fdf7ec';
const FONT = `'Outfit',Helvetica,Arial,sans-serif`;
const HEAD = `'Fraunces',Georgia,'Times New Roman',serif`;
const RECIPE_LOOK = [{ img: 'se-red.jpg', hex: '#e8364f' }, { img: 'se-caramel.jpg', hex: '#c9853c' }];

/** The two free recipes side by side, like the cards on the landing page: photo, colour bar, FREE tag, name. */
function recipeCards(c: MailCopy, base: string): string {
  const cells = c.recipes.map((r, i) => `
    <td width="50%" valign="top" style="padding:0 5px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#ffffff"
        style="background:#ffffff;border:1px solid #efdfc6;border-top:6px solid ${RECIPE_LOOK[i].hex};border-radius:14px;border-collapse:separate;overflow:hidden;">
        <tr><td style="line-height:0;font-size:0;">
          <img src="${base}/email/${RECIPE_LOOK[i].img}" width="250" height="188" alt="${esc(r.name)}"
            style="display:block;width:100%;max-width:250px;height:auto;border:0;background:${PAPER};">
        </td></tr>
        <tr><td style="padding:10px 12px 14px;">
          <span style="display:inline-block;padding:3px 9px;border-radius:999px;background:${ORANGE};color:#ffffff;font-family:${FONT};font-size:10px;font-weight:bold;letter-spacing:1.5px;text-transform:uppercase;">${esc(c.free)}</span>
          <p style="font-family:${HEAD};font-weight:700;font-size:15px;line-height:1.25;color:${COCOA};margin:8px 0 4px;">${esc(r.name)}</p>
          <p style="font-family:${FONT};font-size:12px;line-height:1.4;color:#8a7466;margin:0;">${esc(r.makes)}</p>
        </td></tr>
      </table>
    </td>`).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="table-layout:fixed;margin:6px 0 22px;"><tr>${cells}</tr></table>`;
}

/** The book: all 7 colours (the free two lit), the cover, one line and a button. */
function bookBlock(c: MailCopy, lang: EbookLang, base: string, href: string, price: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}"
      style="background:${PAPER};border:2px solid ${ORANGE};border-radius:18px;border-collapse:separate;margin:28px 0 0;">
      <tr><td style="padding:20px 18px 22px;">
        <p style="text-align:center;font-family:${FONT};font-size:11px;letter-spacing:2.5px;text-transform:uppercase;font-weight:bold;color:${ORANGE};margin:0 0 12px;">&#10022;&nbsp; ${esc(c.moreKicker)} &nbsp;&#10022;</p>
        <a href="${href}" style="text-decoration:none;"><img src="${base}/email/se-seven.jpg" width="500" height="67" alt="Sweet Escape: 7 colors"
          style="display:block;width:100%;max-width:500px;height:auto;border:0;margin:0 auto 16px;"></a>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
          <td width="34%" valign="middle" style="padding:0 14px 0 0;">
            <a href="${href}" style="text-decoration:none;"><img src="${base}/email/se-cover-${lang}.jpg" width="160" alt="Sweet Escape"
              style="display:block;width:100%;max-width:160px;height:auto;border:0;border-radius:4px 8px 8px 4px;box-shadow:0 10px 22px rgba(42,26,18,0.25);"></a>
          </td>
          <td valign="middle">
            <p style="font-family:${HEAD};font-weight:700;font-size:18px;line-height:1.2;color:${COCOA};margin:0 0 8px;">${esc(c.moreTitle)}</p>
            <p style="font-family:${FONT};font-size:14px;line-height:1.55;color:#594a42;margin:0;">${esc(c.moreText)}</p>
          </td>
        </tr></table>
        <div style="height:16px;line-height:16px;font-size:0;">&nbsp;</div>
        ${button(fill(c.moreCta, { price }), href, COCOA, '#ffd08a')}
      </td></tr>
    </table>`;
}

/** The e-mail itself, without sending: shared by the send and by previews. `base` is where images load from. */
export function freeRecipesLayout(o: { firstName: string; lang: EbookLang }, base = SITE_URL): LayoutOptions {
  const c = COPY[o.lang];
  const price = o.lang === 'pt' ? `R$ ${BOOK_OFFERS.full.brl}` : o.lang === 'de' ? `€ ${BOOK_OFFERS.full.eur}` : `US$ ${BOOK_OFFERS.full.usd}`;
  const book = `${SITE_URL}${LANG_PATH[o.lang]}?utm_source=email&utm_medium=funil&utm_campaign=receitas-d0`;
  const hello = o.firstName
    ? `<p style="color:${COCOA};font-family:${FONT};font-size:17px;font-weight:bold;margin:0 0 12px;">${fill(c.hi, { name: o.firstName.replace(/[<>&"]/g, '') })}</p>`
    : '';
  return {
    lang: o.lang,
    assetBase: base,
    look: { hero: `se-hero-${o.lang}.jpg`, heroAlt: c.heroAlt, heroHeight: 420, kicker: c.kicker, accent: ORANGE },
    preheader: c.preheader,
    heading: c.heading,
    body: hello + paragraphs(c.text) + recipeCards(c, base),
    cta: { label: c.cta, href: `${SITE_URL}${freePdf(o.lang)}` },
    afterCta: bookBlock(c, o.lang, base, book, price),
    note: c.note,
  };
}

/** The whole e-mail (key, subject, layout) for a sign-up: the send and the admin preview share it. */
export function freeRecipesEmail(o: { firstName: string; lang: EbookLang }, base = SITE_URL): BuiltEmail {
  return { messageKey: `${FUNNEL.source}:pdf`, subject: COPY[o.lang].subject, layout: freeRecipesLayout(o, base) };
}

export const FREE_RECIPES_KEY = `${FUNNEL.source}:pdf`;

/**
 * The 2-recipes PDF e-mail, once per address. A refused send (Resend down for a moment) is tried once more
 * right away; anything still missing is picked up by `resendMissingFreeRecipes` from the scheduler and the
 * team alert, so a sign-up never silently goes without their recipes (Judy, 2026-11-28).
 */
export async function sendFreeRecipes(db: SupabaseClient, o: { email: string; firstName: string; lang: EbookLang }): Promise<'sent' | 'failed' | 'claimed' | 'skipped'> {
  const email = o.email.trim().toLowerCase();
  if (!email.includes('@')) return 'skipped';
  const once = () => deliver(db, {
    email, token: '', messageKey: FREE_RECIPES_KEY, subject: COPY[o.lang].subject, topic: 'pedido', template: 'receitas-d0', transactional: true,
    layout: freeRecipesLayout(o),
  });
  try {
    let outcome = await once();
    if (outcome === 'failed') {
      await new Promise(r => setTimeout(r, 1500));
      outcome = await once();
    }
    if (outcome === 'failed') console.error('free recipes e-mail failed twice for', email);
    return outcome;
  } catch (err) {
    console.error('free recipes e-mail failed for', email, err);
    return 'failed';
  }
}

/**
 * Safety net: every free-recipes sign-up of the last `days` days whose address has no recipes e-mail on record
 * gets it now. Safe to run any number of times (the send claims the address first). Returns who was sent.
 */
export async function resendMissingFreeRecipes(db: SupabaseClient, days = 7, max = 25): Promise<{ sent: string[]; failed: string[] }> {
  const out = { sent: [] as string[], failed: [] as string[] };
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const { data: leads, error } = await db.from('funnel_leads').select('email, first_name, lang, created_at')
    .gte('created_at', since).order('created_at', { ascending: true }).limit(500);
  if (error || !leads?.length) return out;
  const { data: sends } = await db.from('email_sends').select('email').eq('message_key', FREE_RECIPES_KEY).limit(10000);
  const have = new Set((sends || []).map(r => String(r.email || '').trim().toLowerCase()));
  const seen = new Set<string>();
  for (const l of leads as { email: string | null; first_name: string | null; lang: string | null }[]) {
    const email = String(l.email || '').trim().toLowerCase();
    if (!email.includes('@') || have.has(email) || seen.has(email)) continue;
    seen.add(email);
    if (out.sent.length + out.failed.length >= max) break;
    const lang: EbookLang = isEbookLang(l.lang) ? l.lang : 'en';
    const r = await sendFreeRecipes(db, { email, firstName: (l.first_name || '').trim().split(' ')[0], lang });
    if (r === 'sent') out.sent.push(email); else if (r === 'failed') out.failed.push(email);
  }
  return out;
}
