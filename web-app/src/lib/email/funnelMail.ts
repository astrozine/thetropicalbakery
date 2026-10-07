import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SITE_URL, bulletList, kicker, paragraphs } from './layout';
import { deliver } from './send';
import { BOOK_OFFERS } from '@/lib/ebook';
import { LANG_PATH, fill, type EbookLang } from '@/lib/ebookCopy';
import { FUNNEL, freePdf } from '@/lib/funnel';

/**
 * "Here are your 2 recipes": sent the moment someone signs up on the free-recipes page. Transactional (topic
 * `pedido`, they just asked for it), once per address: signing up twice does not mail the PDF twice. In the four
 * languages the PDF comes in; Spanish and Dutch wear the English frame. The sequence that follows is marketing and
 * goes through sendCampaign (lib/email/funnelCampaigns.ts).
 */

const COPY: Record<EbookLang, { subject: string; preheader: string; heading: string; hi: string; text: string; inside: string; recipes: string[]; cta: string; ps: string; note: string }> = {
  en: {
    subject: 'Your 2 free recipes from Dolly 🍓',
    preheader: 'Red Berry Bliss Balls and Peanutty Banoffee Bars, no oven needed.',
    heading: 'Your recipes are here',
    hi: 'Hi, {name}!',
    text: 'Thank you for joining me. Here is my little gift: two of my favorite recipes from Sweet Escape, both without an oven and without refined sugar.',
    inside: 'Inside',
    recipes: ['Tangy Red Berry Bliss Balls (makes 12–14)', 'Peanutty Banoffee Bars (makes 8–10)'],
    cta: 'Download my recipes',
    ps: 'P.S. Loved them? The full book has five more colors, one for every day of the week: {book} ({price}).',
    note: 'With love, Dolly · Itamambuca beach, Brazil',
  },
  pt: {
    subject: 'Suas 2 receitas grátis da Dolly 🍓',
    preheader: 'Bliss Balls de Frutas Vermelhas e Barrinhas Banoffee, sem forno.',
    heading: 'Suas receitas chegaram',
    hi: 'Oi, {name}!',
    text: 'Obrigada por cozinhar comigo. Aqui está o meu presente: duas das minhas receitas favoritas do Sweet Escape, as duas sem forno e sem açúcar refinado.',
    inside: 'Dentro',
    recipes: ['Bliss Balls Azedinhas de Frutas Vermelhas (rende 12–14)', 'Barrinhas Banoffee de Amendoim (rende 8–10)'],
    cta: 'Baixar minhas receitas',
    ps: 'P.S. Gostou? O livro completo tem mais cinco cores, uma para cada dia da semana: {book} ({price}).',
    note: 'Com carinho, Dolly · Praia de Itamambuca, Ubatuba',
  },
  es: {
    subject: 'Tus 2 recetas gratis de Dolly 🍓',
    preheader: 'Bliss Balls de Frutos Rojos y Barritas Banoffee, sin horno.',
    heading: 'Aquí están tus recetas',
    hi: '¡Hola, {name}!',
    text: 'Gracias por cocinar conmigo. Aquí está mi regalo: dos de mis recetas favoritas de Sweet Escape, las dos sin horno y sin azúcar refinada.',
    inside: 'Dentro',
    recipes: ['Bliss Balls Aciditas de Frutos Rojos (salen 12–14)', 'Barritas Banoffee de Maní (salen 8–10)'],
    cta: 'Descargar mis recetas',
    ps: 'P.D. ¿Te gustaron? El libro completo tiene cinco colores más, uno para cada día de la semana: {book} ({price}).',
    note: 'Con cariño, Dolly · Playa de Itamambuca, Brasil',
  },
  nl: {
    subject: 'Je 2 gratis recepten van Dolly 🍓',
    preheader: 'Rode Bessen Bliss Balls en Pinda Banoffee Repen, zonder oven.',
    heading: 'Hier zijn je recepten',
    hi: 'Hoi {name}!',
    text: 'Dank je dat je met me meebakt. Hier is mijn cadeautje: twee van mijn favoriete recepten uit Sweet Escape, allebei zonder oven en zonder geraffineerde suiker.',
    inside: 'Erin',
    recipes: ['Frisse Rode Bessen Bliss Balls (voor 12–14)', 'Pinda Banoffee Repen (voor 8–10)'],
    cta: 'Download mijn recepten',
    ps: 'P.S. Lekker? Het hele boek heeft nog vijf kleuren, één voor elke dag van de week: {book} ({price}).',
    note: 'Liefs, Dolly · Itamambuca-strand, Brazilië',
  },
};

export async function sendFreeRecipes(db: SupabaseClient, o: { email: string; firstName: string; lang: EbookLang }) {
  const email = o.email.trim().toLowerCase();
  if (!email.includes('@')) return;
  const c = COPY[o.lang];
  const price = o.lang === 'pt' ? `R$ ${BOOK_OFFERS.full.brl}` : `US$ ${BOOK_OFFERS.full.usd}`;
  const book = `${SITE_URL}${LANG_PATH[o.lang]}?utm_source=email&utm_medium=funil&utm_campaign=receitas-d0`;
  const hello = o.firstName
    ? `<p style="color:#3c2a21;font-family:'Outfit',Helvetica,Arial,sans-serif;font-size:17px;font-weight:bold;margin:0 0 12px;">${fill(c.hi, { name: o.firstName.replace(/[<>&"]/g, '') })}</p>`
    : '';
  try {
    await deliver(db, {
      email, token: '', messageKey: `${FUNNEL.source}:pdf`, subject: c.subject, topic: 'pedido', template: 'receitas-d0', transactional: true,
      layout: {
        lang: o.lang === 'pt' ? 'pt' : 'en',
        theme: 'novidades',
        preheader: c.preheader,
        heading: c.heading,
        body: hello + paragraphs(c.text) + kicker(c.inside) + bulletList(c.recipes) + paragraphs(fill(c.ps, { book, price })),
        cta: { label: c.cta, href: `${SITE_URL}${freePdf(o.lang)}` },
        note: c.note,
      },
    });
  } catch (err) {
    console.error('free recipes e-mail failed for', email, err);
  }
}
