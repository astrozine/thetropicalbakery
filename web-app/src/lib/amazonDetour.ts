import type { EbookLang } from './ebookCopy';

/**
 * "Heading to Amazon?": the small sheet that opens the first time a visitor taps a Kindle / paperback / hardcover card
 * on a Sweet Escape page. It offers the 2 free recipes (and the free call with Dolly) for an e-mail, so the reader
 * lands in the CRM and the free-recipes e-mails before leaving for Amazon. Skipping is one tap and still opens Amazon.
 * Sign-ups go through the normal free-recipes sign-up (`/api/free-recipes/lead`) with utm_campaign `amazon-detour`,
 * so they show in Admin › Funil de Receitas. Every tap that leaves for Amazon is counted in `amazon_clicks` (migration 52).
 */

export const DETOUR = {
  /** Shown once per device; after a sign-up or a skip, Amazon cards open Amazon straight away. */
  seenKey: 'amz_detour_seen',
  utmSource: 'site',
  utmCampaign: 'amazon-detour',
};

/** How a tap on an Amazon card ended: straight through (sheet already seen), skipped the sheet, or left an e-mail. */
export type AmazonStep = 'direct' | 'skip' | 'signup';

export interface DetourCopy {
  title: string;
  text: string;
  /** Added after `text` while the free call is switched on (Admin › Ligação grátis). */
  callText: string;
  name: string; email: string; cta: string; busy: string; skip: string; fine: string;
  sent: string; errName: string; errEmail: string; close: string;
}

export const DETOUR_COPY: Record<EbookLang, DetourCopy> = {
  en: {
    title: 'Heading to Amazon?',
    text: 'Before you go, leave your e-mail and we’ll send you 2 free recipes from the book right now, so you can start tonight.',
    callText: 'Plus the link to book your free 30-minute call with Dolly.',
    name: 'First name', email: 'E-mail', cta: 'Send them + go to Amazon', busy: 'Sending…',
    skip: 'No thanks, just take me to Amazon', fine: 'No spam. Unsubscribe any time.',
    sent: 'Sent! Check your inbox. Amazon is open in a new tab.',
    errName: 'Your first name, please.', errEmail: 'That e-mail doesn’t look right.', close: 'Close',
  },
  pt: {
    title: 'Indo pra Amazon?',
    text: 'Antes de ir, deixa seu e-mail e a gente manda agora 2 receitas grátis do livro, pra você já começar hoje.',
    callText: 'E o link pra marcar sua ligação grátis de 30 minutos com a Dolly.',
    name: 'Seu nome', email: 'E-mail', cta: 'Enviar e ir pra Amazon', busy: 'Enviando…',
    skip: 'Não, obrigado, só quero ir pra Amazon', fine: 'Sem spam. Sai quando quiser.',
    sent: 'Enviado! Olha seu e-mail. A Amazon abriu em outra aba.',
    errName: 'Seu nome, por favor.', errEmail: 'Esse e-mail não parece certo.', close: 'Fechar',
  },
  es: {
    title: '¿Te vas a Amazon?',
    text: 'Antes de irte, déjanos tu e-mail y te mandamos ahora 2 recetas gratis del libro, para empezar hoy mismo.',
    callText: 'Y el enlace para reservar tu llamada gratis de 30 minutos con Dolly.',
    name: 'Tu nombre', email: 'E-mail', cta: 'Enviar e ir a Amazon', busy: 'Enviando…',
    skip: 'No, gracias, solo llévame a Amazon', fine: 'Sin spam. Te das de baja cuando quieras.',
    sent: '¡Enviado! Revisa tu correo. Amazon se abrió en otra pestaña.',
    errName: 'Tu nombre, por favor.', errEmail: 'Ese e-mail no parece correcto.', close: 'Cerrar',
  },
  nl: {
    title: 'Op weg naar Amazon?',
    text: 'Laat eerst je e-mail achter, dan sturen we je meteen 2 gratis recepten uit het boek, zodat je vandaag al kunt beginnen.',
    callText: 'Plus de link om je gratis gesprek van 30 minuten met Dolly te plannen.',
    name: 'Voornaam', email: 'E-mail', cta: 'Verstuur en ga naar Amazon', busy: 'Versturen…',
    skip: 'Nee, bedankt, gewoon naar Amazon', fine: 'Geen spam. Afmelden kan altijd.',
    sent: 'Verstuurd! Kijk in je inbox. Amazon staat open in een nieuw tabblad.',
    errName: 'Je voornaam graag.', errEmail: 'Dat e-mailadres klopt niet helemaal.', close: 'Sluiten',
  },
  de: {
    title: 'Auf dem Weg zu Amazon?',
    text: 'Lass vorher deine E-Mail da, dann schicken wir dir sofort 2 Gratis-Rezepte aus dem Buch, damit du heute schon loslegen kannst.',
    callText: 'Plus den Link für dein kostenloses 30-Minuten-Gespräch mit Dolly.',
    name: 'Vorname', email: 'E-Mail', cta: 'Schicken und zu Amazon', busy: 'Wird gesendet…',
    skip: 'Nein danke, einfach zu Amazon', fine: 'Kein Spam. Abmelden jederzeit.',
    sent: 'Verschickt! Schau in dein Postfach. Amazon ist in einem neuen Tab offen.',
    errName: 'Deinen Vornamen bitte.', errEmail: 'Diese E-Mail sieht nicht richtig aus.', close: 'Schließen',
  },
};
