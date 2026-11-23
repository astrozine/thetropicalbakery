/**
 * The book's bonus: everyone who buys Sweet Escape (the PDF on this site, or a Kindle, paperback or hardcover on
 * Amazon) gets a free 30-minute call with Dolly. It is a get-to-know-you call: what they eat now, what they crave,
 * their first steps, and, if they want more, her coaching. Asked for by Andrew on 2026-11-23 ("we want more people
 * engaging with Dolly so she can loop them into the coaching").
 *
 * Dolly's time is protected by ONE number, site_settings `bonus_call_weekly` (migration_51_bonus_call.sql, editable in
 * Admin › Ligação grátis): how many of these calls she takes per week. Claims are never refused (a buyer was promised
 * the call); when a week is full, the claim page tells them she will message them for the following week.
 * 0 = the bonus is switched off: the pop-ups, the cards and the e-mail lines disappear (the claim page still works for
 * people who bought while it was on).
 *
 * Claims are saved as `contact_leads` rows whose topic starts with CLAIM_TOPIC, so they show up in the inbox and the
 * team alert e-mail like any coaching request, with no new table.
 *
 * Every word and number lives here. No server-only imports: pages, e-mails and admin all read it.
 */

import type { EbookLang } from './ebookCopy';

export const BONUS_CALL = {
  minutes: 30,
  /** Used until migration 51 runs, or if the row is missing. */
  defaultWeekly: 5,
  settingKey: 'bonus_call_weekly',
  /** A claim must come within this many days of buying (said on the page, checked for site orders). */
  claimDays: 60,
  path: '/sweet-escape/call',
} as const;

/** Every claim's contact_leads.topic starts with this (the admin page and the weekly count look for it). */
export const CLAIM_TOPIC = 'Free coaching call (Sweet Escape)';

/** Amazon order numbers look like 113-1234567-1234567 on every Amazon store. */
export const AMAZON_ORDER = /^\d{3}-\d{7}-\d{7}$/;
export const normalizeAmazonOrder = (v: string) => {
  const d = String(v || '').replace(/\D/g, '');
  return d.length === 17 ? `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}` : String(v || '').trim();
};

/** Monday 00:00 in Brasília of the week holding `now`, as an ISO instant: the cap counts claims since then. */
export function weekStart(now = new Date()): Date {
  const br = new Date(now.getTime() - 3 * 3600_000); // Brasília has no daylight saving time since 2019
  const dow = (br.getUTCDay() + 6) % 7; // Monday = 0
  const monday = Date.UTC(br.getUTCFullYear(), br.getUTCMonth(), br.getUTCDate() - dow);
  return new Date(monday + 3 * 3600_000);
}

export type AmazonEdition = 'kindle' | 'paperback' | 'hardcover';

interface Copy {
  /** Short badge on the book's order card and the one-time offer. */
  badge: string;
  /** The pop-up. */
  popTitle: string;
  popText: string;
  popPoints: string[];
  popCta: string;
  popAmazon: string;
  popClose: string;
  /** The card on the "your book is ready" pages, and the e-mail block. */
  paidTitle: string;
  paidText: string;
  paidCta: string;
  /** One line for the selling e-mails and the Amazon row. */
  line: string;
  amazonLine: string;
  amazonCta: string;
  /** The claim page. */
  claim: {
    title: string;
    intro: string;
    siteBuyer: string;
    amazonIntro: string;
    name: string;
    email: string;
    whatsapp: string;
    whatsappHint: string;
    edition: string;
    editions: Record<AmazonEdition, string>;
    order: string;
    orderHint: string;
    goal: string;
    goalHint: string;
    when: string;
    whenHint: string;
    submit: string;
    busy: string;
    doneTitle: string;
    doneText: string;
    doneLater: string;
    errGeneric: string;
    errOrder: string;
    errUsed: string;
    errNotPaid: string;
    errOld: string;
    off: string;
    privacy: string;
  };
}

const EN: Copy = {
  badge: 'Free bonus: a 30-minute call with Dolly',
  popTitle: 'The book comes with a free call with me',
  popText: 'Buy Sweet Escape and we get on a 30-minute video call, just you and me. Tell me what you eat now and what you crave, and I’ll give you your first easy steps.',
  popPoints: ['30 minutes, one to one, on WhatsApp video or Google Meet', 'Works with the PDF here or any Amazon edition', 'Book it any time in the first 60 days'],
  popCta: 'Get the book',
  popAmazon: 'Bought it on Amazon? Claim your call',
  popClose: 'Close',
  paidTitle: 'Your free 30-minute call with me',
  paidText: 'Your book comes with a call with me, Dolly. We talk about what you eat now, what you crave and your first easy steps. Tell me a little about you and I’ll message you on WhatsApp to pick a time.',
  paidCta: 'Book my free call',
  line: 'And the book comes with a free 30-minute call with me, to talk about you and your first steps.',
  amazonLine: 'Every edition comes with a free 30-minute call with Dolly.',
  amazonCta: 'Bought on Amazon? Claim your call',
  claim: {
    title: 'Your free call with Dolly',
    intro: '30 minutes, just you and me, on WhatsApp video or Google Meet. We talk about what you eat now, what you crave and your first easy steps. If you’d like more help after that, I’ll tell you how my coaching works. No pressure.',
    siteBuyer: 'We found your order. Just tell me how to reach you.',
    amazonIntro: 'Bought Sweet Escape on Amazon? Type your order number (it’s in your Amazon order e-mail and under Your Orders).',
    name: 'Your name',
    email: 'E-mail',
    whatsapp: 'WhatsApp (with country code)',
    whatsappHint: 'I’ll message you here to pick a time.',
    edition: 'Which edition?',
    editions: { kindle: 'Kindle', paperback: 'Paperback', hardcover: 'Hardcover' },
    order: 'Amazon order number',
    orderHint: 'Looks like 113-1234567-1234567',
    goal: 'What would you love help with?',
    goalHint: 'Cravings, kids and sweets, more energy… one line is enough.',
    when: 'Best days and times for you (and your time zone)',
    whenHint: 'For example: weekday mornings, New York time.',
    submit: 'Book my free call',
    busy: 'Sending…',
    doneTitle: 'Got it!',
    doneText: 'I’ll message you on WhatsApp within 2 days to pick a time. Talk soon! Dolly',
    doneLater: 'My calls for this week are full, so I’ll message you within a few days to pick a time next week. Talk soon! Dolly',
    errGeneric: 'Something went wrong. Please try again, or write to thetropbakery@gmail.com.',
    errOrder: 'That doesn’t look like an Amazon order number (113-1234567-1234567).',
    errUsed: 'This order already has its call booked. If that wasn’t you, write to thetropbakery@gmail.com.',
    errNotPaid: 'Your payment hasn’t been confirmed yet. Come back to this page once your book is ready.',
    errOld: 'The free call is for the first 60 days after buying the book.',
    off: 'The free call isn’t available right now. Write to thetropbakery@gmail.com and we’ll sort it out.',
    privacy: 'We only use your details to set up the call.',
  },
};

export const BONUS_CALL_COPY: Record<EbookLang, Copy> = {
  en: EN,
  pt: {
    badge: 'Bônus grátis: uma conversa de 30 minutos com a Dolly',
    popTitle: 'O livro vem com uma conversa grátis comigo',
    popText: 'Comprando o Sweet Escape, a gente marca uma videochamada de 30 minutos, só eu e você. Você me conta o que come hoje e do que sente vontade, e eu te passo os primeiros passos, bem simples.',
    popPoints: ['30 minutos, só eu e você, por vídeo no WhatsApp ou Google Meet', 'Vale para o PDF daqui ou qualquer edição da Amazon', 'Marque quando quiser nos primeiros 60 dias'],
    popCta: 'Quero o livro',
    popAmazon: 'Comprou na Amazon? Peça sua conversa',
    popClose: 'Fechar',
    paidTitle: 'Sua conversa grátis de 30 minutos comigo',
    paidText: 'Seu livro vem com uma conversa comigo, a Dolly. Falamos do que você come hoje, das suas vontades e dos seus primeiros passos. Me conte um pouquinho de você e eu te chamo no WhatsApp para marcar o horário.',
    paidCta: 'Marcar minha conversa grátis',
    line: 'E o livro vem com uma conversa grátis de 30 minutos comigo, para falar de você e dos seus primeiros passos.',
    amazonLine: 'Toda edição vem com uma conversa grátis de 30 minutos com a Dolly.',
    amazonCta: 'Comprou na Amazon? Peça sua conversa',
    claim: {
      title: 'Sua conversa grátis com a Dolly',
      intro: '30 minutos, só eu e você, por vídeo no WhatsApp ou Google Meet. Falamos do que você come hoje, das suas vontades e dos seus primeiros passos. Se depois quiser mais ajuda, eu te conto como funciona o meu acompanhamento. Sem pressão.',
      siteBuyer: 'Encontramos o seu pedido. Só me diga como falar com você.',
      amazonIntro: 'Comprou o Sweet Escape na Amazon? Digite o número do pedido (está no e-mail da Amazon e em Seus Pedidos).',
      name: 'Seu nome',
      email: 'E-mail',
      whatsapp: 'WhatsApp (com DDD)',
      whatsappHint: 'Vou te chamar aqui para marcar o horário.',
      edition: 'Qual edição?',
      editions: { kindle: 'Kindle', paperback: 'Capa comum', hardcover: 'Capa dura' },
      order: 'Número do pedido na Amazon',
      orderHint: 'Parece com 113-1234567-1234567',
      goal: 'Com o que você adoraria ajuda?',
      goalHint: 'Vontade de doce, crianças e doces, mais energia… uma linha basta.',
      when: 'Melhores dias e horários para você',
      whenHint: 'Por exemplo: manhãs de semana.',
      submit: 'Marcar minha conversa grátis',
      busy: 'Enviando…',
      doneTitle: 'Recebido!',
      doneText: 'Te chamo no WhatsApp em até 2 dias para marcar o horário. Até já! Dolly',
      doneLater: 'Minhas conversas desta semana já estão cheias, então te chamo nos próximos dias para marcar na semana que vem. Até já! Dolly',
      errGeneric: 'Algo deu errado. Tente de novo ou escreva para thetropbakery@gmail.com.',
      errOrder: 'Isso não parece um número de pedido da Amazon (113-1234567-1234567).',
      errUsed: 'Este pedido já tem a conversa marcada. Se não foi você, escreva para thetropbakery@gmail.com.',
      errNotPaid: 'Seu pagamento ainda não foi confirmado. Volte a esta página quando o livro estiver liberado.',
      errOld: 'A conversa grátis vale nos primeiros 60 dias depois da compra do livro.',
      off: 'A conversa grátis não está disponível agora. Escreva para thetropbakery@gmail.com que a gente resolve.',
      privacy: 'Usamos seus dados só para marcar a conversa.',
    },
  },
  es: {
    badge: 'Bono gratis: una llamada de 30 minutos con Dolly',
    popTitle: 'El libro viene con una llamada gratis conmigo',
    popText: 'Compra Sweet Escape y hacemos una videollamada de 30 minutos, solo tú y yo. Me cuentas qué comes hoy y qué se te antoja, y te doy tus primeros pasos, bien sencillos.',
    popPoints: ['30 minutos, a solas, por video en WhatsApp o Google Meet (en inglés o portugués)', 'Vale para el PDF de aquí o cualquier edición de Amazon', 'Resérvala cuando quieras en los primeros 60 días'],
    popCta: 'Quiero el libro',
    popAmazon: '¿Lo compraste en Amazon? Pide tu llamada',
    popClose: 'Cerrar',
    paidTitle: 'Tu llamada gratis de 30 minutos conmigo',
    paidText: 'Tu libro viene con una llamada conmigo, Dolly (en inglés o portugués). Hablamos de lo que comes hoy, tus antojos y tus primeros pasos. Cuéntame un poco de ti y te escribo por WhatsApp para elegir la hora.',
    paidCta: 'Reservar mi llamada gratis',
    line: 'Y el libro viene con una llamada gratis de 30 minutos conmigo, para hablar de ti y de tus primeros pasos.',
    amazonLine: 'Cada edición viene con una llamada gratis de 30 minutos con Dolly.',
    amazonCta: '¿Compraste en Amazon? Pide tu llamada',
    claim: {
      title: 'Tu llamada gratis con Dolly',
      intro: '30 minutos, solo tú y yo, por video en WhatsApp o Google Meet, en inglés o portugués. Hablamos de lo que comes hoy, tus antojos y tus primeros pasos. Si después quieres más ayuda, te cuento cómo funciona mi acompañamiento. Sin presión.',
      siteBuyer: 'Encontramos tu pedido. Solo dime cómo contactarte.',
      amazonIntro: '¿Compraste Sweet Escape en Amazon? Escribe tu número de pedido (está en el e-mail de Amazon y en Mis pedidos).',
      name: 'Tu nombre',
      email: 'E-mail',
      whatsapp: 'WhatsApp (con código de país)',
      whatsappHint: 'Te escribo aquí para elegir la hora.',
      edition: '¿Qué edición?',
      editions: { kindle: 'Kindle', paperback: 'Tapa blanda', hardcover: 'Tapa dura' },
      order: 'Número de pedido de Amazon',
      orderHint: 'Se parece a 113-1234567-1234567',
      goal: '¿Con qué te encantaría ayuda?',
      goalHint: 'Antojos de dulce, niños y golosinas, más energía… una línea basta.',
      when: 'Mejores días y horas para ti (y tu zona horaria)',
      whenHint: 'Por ejemplo: mañanas entre semana, hora de Madrid.',
      submit: 'Reservar mi llamada gratis',
      busy: 'Enviando…',
      doneTitle: '¡Recibido!',
      doneText: 'Te escribo por WhatsApp en 2 días como máximo para elegir la hora. ¡Hasta pronto! Dolly',
      doneLater: 'Mis llamadas de esta semana ya están completas, así que te escribo en unos días para reservar la semana que viene. ¡Hasta pronto! Dolly',
      errGeneric: 'Algo salió mal. Inténtalo de nuevo o escribe a thetropbakery@gmail.com.',
      errOrder: 'Eso no parece un número de pedido de Amazon (113-1234567-1234567).',
      errUsed: 'Este pedido ya tiene su llamada reservada. Si no fuiste tú, escribe a thetropbakery@gmail.com.',
      errNotPaid: 'Tu pago aún no está confirmado. Vuelve a esta página cuando tu libro esté listo.',
      errOld: 'La llamada gratis es para los primeros 60 días después de comprar el libro.',
      off: 'La llamada gratis no está disponible ahora. Escribe a thetropbakery@gmail.com y lo resolvemos.',
      privacy: 'Usamos tus datos solo para organizar la llamada.',
    },
  },
  nl: {
    badge: 'Gratis bonus: een gesprek van 30 minuten met Dolly',
    popTitle: 'Bij het boek hoort een gratis gesprek met mij',
    popText: 'Koop Sweet Escape en we doen een videogesprek van 30 minuten, alleen jij en ik. Vertel me wat je nu eet en waar je trek in hebt, en ik geef je je eerste makkelijke stappen.',
    popPoints: ['30 minuten, één op één, via WhatsApp-video of Google Meet', 'Geldt voor de pdf hier en elke Amazon-editie', 'Plan het wanneer je wilt in de eerste 60 dagen'],
    popCta: 'Ik wil het boek',
    popAmazon: 'Via Amazon gekocht? Vraag je gesprek aan',
    popClose: 'Sluiten',
    paidTitle: 'Je gratis gesprek van 30 minuten met mij',
    paidText: 'Bij je boek hoort een gesprek met mij, Dolly. We praten over wat je nu eet, waar je trek in hebt en je eerste makkelijke stappen. Vertel me iets over jezelf en ik stuur je een WhatsApp om een tijd te kiezen.',
    paidCta: 'Plan mijn gratis gesprek',
    line: 'En bij het boek hoort een gratis gesprek van 30 minuten met mij, over jou en je eerste stappen.',
    amazonLine: 'Bij elke editie hoort een gratis gesprek van 30 minuten met Dolly.',
    amazonCta: 'Via Amazon gekocht? Vraag je gesprek aan',
    claim: {
      title: 'Je gratis gesprek met Dolly',
      intro: '30 minuten, alleen jij en ik, via WhatsApp-video of Google Meet. We praten over wat je nu eet, waar je trek in hebt en je eerste makkelijke stappen. Wil je daarna meer hulp, dan vertel ik hoe mijn coaching werkt. Geen druk.',
      siteBuyer: 'We hebben je bestelling gevonden. Vertel me alleen hoe ik je bereik.',
      amazonIntro: 'Sweet Escape via Amazon gekocht? Vul je bestelnummer in (staat in de bevestigingsmail van Amazon en bij Mijn bestellingen).',
      name: 'Je naam',
      email: 'E-mail',
      whatsapp: 'WhatsApp (met landcode)',
      whatsappHint: 'Hier stuur ik je een bericht om een tijd te kiezen.',
      edition: 'Welke editie?',
      editions: { kindle: 'Kindle', paperback: 'Paperback', hardcover: 'Gebonden' },
      order: 'Amazon-bestelnummer',
      orderHint: 'Ziet eruit als 113-1234567-1234567',
      goal: 'Waar zou je graag hulp bij willen?',
      goalHint: 'Zoetbehoefte, kinderen en snoep, meer energie… één regel is genoeg.',
      when: 'Beste dagen en tijden voor jou (en je tijdzone)',
      whenHint: 'Bijvoorbeeld: doordeweekse ochtenden, Nederlandse tijd.',
      submit: 'Plan mijn gratis gesprek',
      busy: 'Versturen…',
      doneTitle: 'Ontvangen!',
      doneText: 'Ik stuur je binnen 2 dagen een WhatsApp om een tijd te kiezen. Tot snel! Dolly',
      doneLater: 'Mijn gesprekken voor deze week zitten vol, dus ik stuur je over een paar dagen een bericht om volgende week te plannen. Tot snel! Dolly',
      errGeneric: 'Er ging iets mis. Probeer het opnieuw of mail naar thetropbakery@gmail.com.',
      errOrder: 'Dat lijkt geen Amazon-bestelnummer (113-1234567-1234567).',
      errUsed: 'Voor deze bestelling is het gesprek al aangevraagd. Was jij dat niet? Mail naar thetropbakery@gmail.com.',
      errNotPaid: 'Je betaling is nog niet bevestigd. Kom terug naar deze pagina zodra je boek klaarstaat.',
      errOld: 'Het gratis gesprek geldt de eerste 60 dagen na aankoop van het boek.',
      off: 'Het gratis gesprek is nu niet beschikbaar. Mail naar thetropbakery@gmail.com, dan lossen we het op.',
      privacy: 'We gebruiken je gegevens alleen om het gesprek te plannen.',
    },
  },
  de: {
    badge: 'Gratis-Bonus: ein 30-Minuten-Gespräch mit Dolly',
    popTitle: 'Zum Buch gehört ein kostenloses Gespräch mit mir',
    popText: 'Kauf Sweet Escape und wir machen einen 30-minütigen Videocall, nur du und ich (auf Englisch oder Niederländisch). Erzähl mir, was du heute isst und worauf du Lust hast, und ich gebe dir deine ersten einfachen Schritte.',
    popPoints: ['30 Minuten, unter vier Augen, per WhatsApp-Video oder Google Meet', 'Gilt für das PDF hier und jede Amazon-Ausgabe', 'Buch es, wann du willst, in den ersten 60 Tagen'],
    popCta: 'Ich will das Buch',
    popAmazon: 'Bei Amazon gekauft? Gespräch anfordern',
    popClose: 'Schließen',
    paidTitle: 'Dein kostenloses 30-Minuten-Gespräch mit mir',
    paidText: 'Zu deinem Buch gehört ein Gespräch mit mir, Dolly (auf Englisch oder Niederländisch). Wir sprechen darüber, was du heute isst, worauf du Lust hast und über deine ersten Schritte. Erzähl mir kurz von dir, und ich schreibe dir auf WhatsApp, um einen Termin zu finden.',
    paidCta: 'Mein Gratis-Gespräch buchen',
    line: 'Und zum Buch gehört ein kostenloses 30-Minuten-Gespräch mit mir, über dich und deine ersten Schritte.',
    amazonLine: 'Zu jeder Ausgabe gehört ein kostenloses 30-Minuten-Gespräch mit Dolly.',
    amazonCta: 'Bei Amazon gekauft? Gespräch anfordern',
    claim: {
      title: 'Dein kostenloses Gespräch mit Dolly',
      intro: '30 Minuten, nur du und ich, per WhatsApp-Video oder Google Meet, auf Englisch oder Niederländisch. Wir sprechen darüber, was du heute isst, worauf du Lust hast und über deine ersten einfachen Schritte. Wenn du danach mehr Hilfe möchtest, erzähle ich dir, wie mein Coaching funktioniert. Ohne Druck.',
      siteBuyer: 'Wir haben deine Bestellung gefunden. Sag mir nur, wie ich dich erreiche.',
      amazonIntro: 'Sweet Escape bei Amazon gekauft? Gib deine Bestellnummer ein (sie steht in der Amazon-Bestätigung und unter Meine Bestellungen).',
      name: 'Dein Name',
      email: 'E-Mail',
      whatsapp: 'WhatsApp (mit Ländervorwahl)',
      whatsappHint: 'Hier schreibe ich dir, um einen Termin zu finden.',
      edition: 'Welche Ausgabe?',
      editions: { kindle: 'Kindle', paperback: 'Taschenbuch', hardcover: 'Gebundene Ausgabe' },
      order: 'Amazon-Bestellnummer',
      orderHint: 'Sieht aus wie 302-1234567-1234567',
      goal: 'Wobei hättest du gern Hilfe?',
      goalHint: 'Heißhunger auf Süßes, Kinder und Naschen, mehr Energie… eine Zeile reicht.',
      when: 'Beste Tage und Uhrzeiten für dich (und deine Zeitzone)',
      whenHint: 'Zum Beispiel: vormittags unter der Woche, deutsche Zeit.',
      submit: 'Mein Gratis-Gespräch buchen',
      busy: 'Wird gesendet…',
      doneTitle: 'Angekommen!',
      doneText: 'Ich schreibe dir innerhalb von 2 Tagen auf WhatsApp, um einen Termin zu finden. Bis bald! Dolly',
      doneLater: 'Meine Gespräche für diese Woche sind voll, deshalb schreibe ich dir in ein paar Tagen, um nächste Woche einen Termin zu finden. Bis bald! Dolly',
      errGeneric: 'Etwas ist schiefgelaufen. Versuch es noch einmal oder schreib an thetropbakery@gmail.com.',
      errOrder: 'Das sieht nicht wie eine Amazon-Bestellnummer aus (302-1234567-1234567).',
      errUsed: 'Für diese Bestellung ist das Gespräch schon angefragt. Warst du das nicht? Schreib an thetropbakery@gmail.com.',
      errNotPaid: 'Deine Zahlung ist noch nicht bestätigt. Komm auf diese Seite zurück, sobald dein Buch bereitsteht.',
      errOld: 'Das kostenlose Gespräch gilt in den ersten 60 Tagen nach dem Kauf des Buchs.',
      off: 'Das kostenlose Gespräch ist gerade nicht verfügbar. Schreib an thetropbakery@gmail.com, dann klären wir das.',
      privacy: 'Wir nutzen deine Daten nur, um das Gespräch zu planen.',
    },
  },
};

/** The claim page for a site buyer (prefilled from their order) or for anyone (Amazon). */
export const claimPath = (lang: EbookLang, ref?: string, k?: string) =>
  `${BONUS_CALL.path}?lang=${lang}${ref && k ? `&ref=${encodeURIComponent(ref)}&k=${encodeURIComponent(k)}` : ''}`;
