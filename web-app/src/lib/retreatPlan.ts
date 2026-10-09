import { COURSE_CONTENT, type CourseContent } from '@/lib/courseContent';

/**
 * How a retreat is laid out, and which nights a room can still be sold for.
 *
 * The rhythm: one class day, then one day out in the region, and again. People come from far away, so a day in
 * the kitchen is followed by a day at the waterfall, on the island or in Paraty, and nobody is "in class" all week.
 *
 *   day 1            arrive in the afternoon, welcome tasting
 *   day 2, 4, 6 ...  class with Dolly (morning in the kitchen, lunch made together)
 *   day 3, 5, 7 ...  out in the region
 *   last day         breakfast and leave
 *
 * So k class days take 2k + 1 nights: 1 class = 3 nights (a long weekend), 2 = 5 nights, 3 = 7 nights (a week).
 *
 * Rain: the kitchen is covered, so a class never needs sun. When a region day is rainy the next class comes forward
 * into it and the outing moves to the class's day; when the last outing is rained out there is a rainy-day plan
 * (RAIN_PLAN). That swap is why every class is followed by a free day: it is also the weather buffer.
 */

export const nightsForClasses = (classes: number) => (classes > 0 ? 2 * classes + 1 : 0);
/** Fewest nights that still fit every class with a day out after it (the last outing may be the leaving day's morning). */
export const minNightsForClasses = (classes: number) => (classes > 0 ? 2 * classes : 0);

export const classesOf = (slugs: string[]) =>
  COURSE_CONTENT.filter(c => slugs.includes(c.slug)).reduce((n, c) => n + c.retreatClasses, 0);

/** Days out, in the order a retreat uses them. All within about an hour of Itamambuca. */
export const REGION_DAYS = [
  { emoji: '💧', title: 'Cachoeira e Ilha do Prumirim', text: 'Poço da cachoeira de manhã, barco até a ilha à tarde.' },
  { emoji: '🥾', title: 'Trilha das Sete Praias', text: 'Uma trilha pela Mata Atlântica, de praia deserta em praia deserta.' },
  { emoji: '🏄', title: 'Surf e mar em Itamambuca', text: 'Aula de surf ou só o mar, a 100 m da casa, e o pôr do sol na areia.' },
  { emoji: '🏘️', title: 'Paraty', text: 'O centro histórico, o mercado e um passeio de escuna pelas ilhas.' },
  { emoji: '🌿', title: 'Picinguaba e a Casa da Farinha', text: 'A vila caiçara no parque estadual e a farinha feita como antigamente.' },
];

/** What a rained-out day out becomes. */
export const RAIN_PLAN = [
  'Degustação de cacau e chocolate, de olhos fechados',
  'Projeto Tamar e o Aquário de Ubatuba',
  'Uma aula extra de família na cozinha, para quem quiser',
  'Massagem, livro e chá na varanda da casa',
];

export type DayKind = 'arrive' | 'class' | 'region' | 'free' | 'leave';
export interface PlanDay { day: number; date?: string; kind: DayKind; title: string; text: string; emoji: string }

/** Each course split into its class days, its journey steps shared out between them. */
function classDays(courses: CourseContent[]) {
  return courses.flatMap(c => {
    const n = c.retreatClasses;
    const per = Math.ceil(c.journey.length / n);
    return Array.from({ length: n }, (_, i) => ({
      title: n > 1 ? `${c.title} · aula ${i + 1} de ${n}` : c.title,
      text: c.journey.slice(i * per, (i + 1) * per).map(j => j.title).join(' · '),
    }));
  });
}

export function buildItinerary(slugs: string[], nights: number, checkIn?: string): PlanDay[] {
  const courses = COURSE_CONTENT.filter(c => slugs.includes(c.slug));
  const classes = classDays(courses);
  const days: PlanDay[] = [];
  const at = (i: number) => (checkIn ? addDays(checkIn, i) : undefined);
  days.push({ day: 1, date: at(0), kind: 'arrive', emoji: '🌴', title: 'Chegada', text: 'Check-in à tarde e degustação de boas-vindas com a Dolly.' });
  let c = 0, r = 0;
  for (let d = 2; d <= nights; d++) {
    const classTurn = d % 2 === 0;
    if (classTurn && c < classes.length) {
      days.push({ day: d, date: at(d - 1), kind: 'class', emoji: '👩‍🍳', ...classes[c++] });
    } else {
      const place = REGION_DAYS[r++ % REGION_DAYS.length];
      days.push({ day: d, date: at(d - 1), kind: classes.length ? 'region' : 'free', emoji: place.emoji, title: place.title, text: place.text });
    }
  }
  days.push({ day: nights + 1, date: at(nights), kind: 'leave', emoji: '☕', title: 'Partida', text: 'Café da manhã e check-out.' });
  return days;
}

/* ------------------------------------------------------------------ dates (all ISO yyyy-mm-dd, in UTC so no DST drift) */

export const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const nightsOf = (checkIn: string, nights: number) => Array.from({ length: nights }, (_, i) => addDays(checkIn, i));
/** Today in Brazil (UTC-3). */
export const todayBR = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);

/* ------------------------------------------------------------------ which nights are taken */

/** A Casa Toda is the three suites together: renting it takes all of them, and any suite taken means the house is. */
export const HOUSE_ID = 'house';

export type NightsByRoom = Record<string, string[]>;

/**
 * Nights a room cannot be sold.
 *   ical    = a guest's reservation on Airbnb ("Reserved")
 *   blocked = the platform's "Not available" days (closed by hand, or blocked by a linked listing)
 *   booked  = our own retreat reservations
 *
 * Any suite taken means the whole house can't be sold. The other way round, only a REAL booking of the house blocks
 * the suites: Airbnb marks A Casa Toda "Not available" whenever one suite is booked, and passing that back to the
 * suites would make one kitnet guest close the whole building.
 */
export function effectiveBusy(roomIds: string[], ical: NightsByRoom, booked: NightsByRoom, blocked: NightsByRoom = {}): Record<string, Set<string>> {
  const own = (id: string) => [...(ical[id] ?? []), ...(blocked[id] ?? []), ...(booked[id] ?? [])];
  const houseSold = [...(ical[HOUSE_ID] ?? []), ...(booked[HOUSE_ID] ?? [])];
  const suites = roomIds.filter(id => id !== HOUSE_ID);
  const out: Record<string, Set<string>> = {};
  for (const id of roomIds) {
    out[id] = new Set(id === HOUSE_ID ? [...own(HOUSE_ID), ...suites.flatMap(own)] : [...own(id), ...houseSold]);
  }
  return out;
}

export const isFree = (busy: Set<string> | undefined, checkIn: string, nights: number) =>
  !busy || nightsOf(checkIn, nights).every(n => !busy.has(n));
