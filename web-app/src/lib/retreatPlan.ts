import { COURSE_CONTENT, type CourseContent } from '@/lib/courseContent';

/**
 * How a retreat is laid out, and which nights a room can still be sold for.
 *
 * The rhythm: one class day, then one day out in the region, and again. People come from far away, so a day in
 * the kitchen is followed by a day at the waterfall, on the island or in Paraty, and nobody is "in class" all week.
 *
 *   day 1            arrive in the afternoon, welcome tasting
 *   day 2, 4, 6 ...  class with Dolly (afternoon in the kitchen: 14h, 3 hours; see workshopDates.ts)
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

/* ------------------------------------------------------------------ the same plan in English and Spanish (/en/retreats, /es/retiros) */

export type PlanLocale = 'pt' | 'en' | 'es';

const REGION_DAYS_I18N: Record<'en' | 'es', typeof REGION_DAYS> = {
  en: [
    { emoji: '💧', title: 'Prumirim Waterfall and Island', text: 'The waterfall pool in the morning, a boat to the island in the afternoon.' },
    { emoji: '🥾', title: 'Seven Beaches Trail', text: 'A hike through the Atlantic Forest, from one empty beach to the next.' },
    { emoji: '🏄', title: 'Surf and sea in Itamambuca', text: 'A surf lesson or just the sea, 100 m from the house, and the sunset on the sand.' },
    { emoji: '🏘️', title: 'Paraty', text: 'The old town, the market and a schooner trip around the islands.' },
    { emoji: '🌿', title: 'Picinguaba and the Casa da Farinha', text: 'The caiçara village inside the state park, and cassava flour made the old way.' },
  ],
  es: [
    { emoji: '💧', title: 'Cascada e Isla de Prumirim', text: 'La poza de la cascada en la mañana, y en barco hasta la isla en la tarde.' },
    { emoji: '🥾', title: 'Sendero de las Siete Playas', text: 'Un sendero por la Mata Atlántica, de playa desierta en playa desierta.' },
    { emoji: '🏄', title: 'Surf y mar en Itamambuca', text: 'Clase de surf o solo el mar, a 100 m de la casa, y el atardecer en la arena.' },
    { emoji: '🏘️', title: 'Paraty', text: 'El centro histórico, el mercado y un paseo en goleta por las islas.' },
    { emoji: '🌿', title: 'Picinguaba y la Casa da Farinha', text: 'La aldea caiçara dentro del parque estatal y la harina de yuca hecha como antes.' },
  ],
};

const RAIN_PLAN_I18N: Record<'en' | 'es', string[]> = {
  en: [
    'A cacao and chocolate tasting, with your eyes closed',
    'Projeto Tamar and the Ubatuba Aquarium',
    'An extra family class in the kitchen, for anyone who wants it',
    'A massage, a book and tea on the veranda',
  ],
  es: [
    'Degustación de cacao y chocolate, con los ojos cerrados',
    'El Projeto Tamar y el Acuario de Ubatuba',
    'Una clase extra en familia en la cocina, para quien quiera',
    'Masaje, un libro y té en la terraza de la casa',
  ],
};

/** The course names and their steps, by slug. A course missing here keeps its Portuguese words. */
const COURSE_I18N: Record<'en' | 'es', Record<string, { title: string; steps: string[] }>> = {
  en: {
    'turismo-gastronomico': { title: 'Culinary Tourism', steps: ['Tropical welcome', 'The flavor workshop', 'Hands-on', 'Tasting and photos'] },
    'capacitacao-profissional': { title: 'Professional Training', steps: ['Basics and assessment', 'Swaps and technique', 'The flavor tricks', 'The week’s menu'] },
    'saude-bem-estar': { title: 'Health, Flavor and Wellbeing', steps: ['Understanding cravings', 'The right ingredients', 'The magic of flavor', 'For real life'] },
  },
  es: {
    'turismo-gastronomico': { title: 'Turismo Gastronómico', steps: ['Bienvenida tropical', 'El taller de sabores', 'Manos a la masa', 'Degustación y fotos'] },
    'capacitacao-profissional': { title: 'Capacitación Profesional', steps: ['Base y diagnóstico', 'Sustituciones y técnica', 'Los trucos de sabor', 'El menú de la semana'] },
    'saude-bem-estar': { title: 'Salud, Sabores y Bienestar', steps: ['Entender el antojo', 'Los ingredientes correctos', 'La magia de los sabores', 'Para la vida real'] },
  },
};

/** A course's name in the visitor's language. */
export const courseTitleFor = (c: Pick<CourseContent, 'slug' | 'title'>, locale: PlanLocale = 'pt') =>
  (locale === 'pt' ? null : COURSE_I18N[locale][c.slug]?.title) ?? c.title;

/** RAIN_PLAN in the visitor's language. */
export const rainPlanFor = (locale: PlanLocale = 'pt') => (locale === 'pt' ? RAIN_PLAN : RAIN_PLAN_I18N[locale]);

const PLAN_WORDS = {
  pt: {
    classOf: (i: number, n: number) => `aula ${i} de ${n}`,
    arrive: { title: 'Chegada', text: 'Check-in à tarde e degustação de boas-vindas com a Dolly.' },
    leave: { title: 'Partida', text: 'Café da manhã e check-out.' },
  },
  en: {
    classOf: (i: number, n: number) => `class ${i} of ${n}`,
    arrive: { title: 'Arrival', text: 'Check-in in the afternoon and a welcome tasting with Dolly.' },
    leave: { title: 'Departure', text: 'Breakfast and check-out.' },
  },
  es: {
    classOf: (i: number, n: number) => `clase ${i} de ${n}`,
    arrive: { title: 'Llegada', text: 'Check-in en la tarde y degustación de bienvenida con Dolly.' },
    leave: { title: 'Salida', text: 'Desayuno y check-out.' },
  },
};

export type DayKind = 'arrive' | 'class' | 'region' | 'free' | 'leave';
export interface PlanDay { day: number; date?: string; kind: DayKind; title: string; text: string; emoji: string }

/** Each course split into its class days, its journey steps shared out between them. */
function classDays(courses: CourseContent[], locale: PlanLocale) {
  return courses.flatMap(c => {
    const n = c.retreatClasses;
    const per = Math.ceil(c.journey.length / n);
    const words = locale === 'pt' ? undefined : COURSE_I18N[locale][c.slug];
    const title = courseTitleFor(c, locale);
    return Array.from({ length: n }, (_, i) => ({
      title: n > 1 ? `${title} · ${PLAN_WORDS[locale].classOf(i + 1, n)}` : title,
      text: c.journey.slice(i * per, (i + 1) * per).map((j, k) => words?.steps[i * per + k] ?? j.title).join(' · '),
    }));
  });
}

/** The day-by-day plan. `locale` only changes the words (Portuguese by default). */
export function buildItinerary(slugs: string[], nights: number, checkIn?: string, locale: PlanLocale = 'pt'): PlanDay[] {
  const courses = COURSE_CONTENT.filter(c => slugs.includes(c.slug));
  const classes = classDays(courses, locale);
  const regionDays = locale === 'pt' ? REGION_DAYS : REGION_DAYS_I18N[locale];
  const words = PLAN_WORDS[locale];
  const days: PlanDay[] = [];
  const at = (i: number) => (checkIn ? addDays(checkIn, i) : undefined);
  days.push({ day: 1, date: at(0), kind: 'arrive', emoji: '🌴', ...words.arrive });
  let c = 0, r = 0;
  for (let d = 2; d <= nights; d++) {
    const classTurn = d % 2 === 0;
    if (classTurn && c < classes.length) {
      days.push({ day: d, date: at(d - 1), kind: 'class', emoji: '👩‍🍳', ...classes[c++] });
    } else {
      const place = regionDays[r++ % regionDays.length];
      days.push({ day: d, date: at(d - 1), kind: classes.length ? 'region' : 'free', emoji: place.emoji, title: place.title, text: place.text });
    }
  }
  days.push({ day: nights + 1, date: at(nights), kind: 'leave', emoji: '☕', ...words.leave });
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
