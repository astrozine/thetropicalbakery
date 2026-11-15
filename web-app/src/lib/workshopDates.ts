/**
 * When Dolly and Andrew are away and no workshop (curso) can happen.
 *
 * TO CHANGE THE DATES, EDIT ONLY THE TWO LINES BELOW (year-month-day):
 *   lastDayBefore  = the last day a workshop can still be booked before the break
 *   firstDayAfter  = the first day workshops are possible again
 * To switch the break off, set WORKSHOP_BREAK to null.
 * The booking form (CrmRegistrationModal) reads everything from here, including the note it shows.
 */
export const WORKSHOP_BREAK: { lastDayBefore: string; firstDayAfter: string } | null = {
  lastDayBefore: '2026-12-22',
  firstDayAfter: '2027-02-18',
};

/**
 * When a workshop happens: every day, starting at 14h, for 3 hours. Change the hours here and every
 * course page and the booking form follow.
 */
export const WORKSHOP_START = '14h';
export const WORKSHOP_HOURS = 3;
/** 'Todos os dias às 14h · 3 horas' */
export const WORKSHOP_WHEN_SHORT = `Todos os dias às ${WORKSHOP_START} · ${WORKSHOP_HOURS} horas`;
/** A full sentence for FAQs and notes. */
export const WORKSHOP_WHEN_LONG = `As aulas acontecem todos os dias, a partir das ${WORKSHOP_START}, e duram ${WORKSHOP_HOURS} horas.`;

/** Today in the visitor's own time zone, as YYYY-MM-DD (what a date field uses). */
export function todayIso(now: Date = new Date()): string {
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

/** '2027-02-18' -> '18/02/2027' */
function br(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** True while the break still matters (it has not fully passed). */
function breakIsRelevant(today: string): boolean {
  return !!WORKSHOP_BREAK && today < WORKSHOP_BREAK.firstDayAfter;
}

/** The first day the date field should allow: today, or the return day once the break has begun. */
export function workshopMinDate(today: string = todayIso()): string {
  if (WORKSHOP_BREAK && today > WORKSHOP_BREAK.lastDayBefore && today < WORKSHOP_BREAK.firstDayAfter) {
    return WORKSHOP_BREAK.firstDayAfter;
  }
  return today;
}

/** The short note under the date field: the hours, plus the break while it is still ahead. */
export function workshopBreakNote(today: string = todayIso()): string {
  const when = `Aulas todos os dias, das ${WORKSHOP_START} às ${parseInt(WORKSHOP_START, 10) + WORKSHOP_HOURS}h.`;
  if (!WORKSHOP_BREAK || !breakIsRelevant(today)) return when;
  if (today > WORKSHOP_BREAK.lastDayBefore) {
    return `${when} Estamos fora agora: datas a partir de ${br(WORKSHOP_BREAK.firstDayAfter)}.`;
  }
  return `${when} Datas até ${br(WORKSHOP_BREAK.lastDayBefore)} ou a partir de ${br(WORKSHOP_BREAK.firstDayAfter)} (no intervalo estamos fora).`;
}

/** One line for the course pages about the break, or '' once it has passed. */
export function workshopBreakLine(today: string = todayIso()): string {
  if (!WORKSHOP_BREAK || !breakIsRelevant(today)) return '';
  return today > WORKSHOP_BREAK.lastDayBefore
    ? `Estamos fora até ${br(addDay(WORKSHOP_BREAK.firstDayAfter, -1))}. As aulas voltam em ${br(WORKSHOP_BREAK.firstDayAfter)}.`
    : `Aulas até ${br(WORKSHOP_BREAK.lastDayBefore)}. Depois fazemos uma pausa e voltamos em ${br(WORKSHOP_BREAK.firstDayAfter)}.`;
}

function addDay(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Why a chosen workshop date can't be used, or '' when it is fine. */
export function workshopDateError(date: string, today: string = todayIso()): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return 'Escolha a data que você prefere.';
  if (date < today) return 'Essa data já passou. Escolha uma data futura.';
  if (WORKSHOP_BREAK && date > WORKSHOP_BREAK.lastDayBefore && date < WORKSHOP_BREAK.firstDayAfter) {
    return today > WORKSHOP_BREAK.lastDayBefore
      ? `Estamos fora nesse período. Escolha a partir de ${br(WORKSHOP_BREAK.firstDayAfter)}.`
      : `Estamos fora nesse período. Escolha até ${br(WORKSHOP_BREAK.lastDayBefore)} ou a partir de ${br(WORKSHOP_BREAK.firstDayAfter)}.`;
  }
  return '';
}
