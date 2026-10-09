'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import { RetreatRoom, quoteRetreatPackage, IMMERSION_FEE_PER_GUEST_PER_NIGHT } from '@/lib/retreatPricing';
import { getSiteSetting } from '@/lib/siteSettings';
import { useExchangeRates, formatForeign } from '@/lib/currency';
import WhatsAppGate from '@/components/WhatsAppGate';
import { COURSE_CONTENT } from '@/lib/courseContent';
import { courseIsShown, useShownCourses } from '@/lib/useShownCourses';
import {
  RAIN_PLAN, addDays, buildItinerary, classesOf, effectiveBusy, isFree, minNightsForClasses, nightsForClasses, todayBR,
  type NightsByRoom,
} from '@/lib/retreatPlan';

const DEFAULT_ROOMS: RetreatRoom[] = [
  { id: 'penthouse', name: 'Cobertura (Penthouse)', airbnb_nightly_rate: 0, max_guests: 6 },
  { id: 'big_suite', name: 'Suíte Master', airbnb_nightly_rate: 0, max_guests: 3 },
  { id: 'small_suite', name: 'Suíte Standard', airbnb_nightly_rate: 0, max_guests: 2 },
];
// What each course costs per person if the database can't be reached (the admin's prices win when it can).
const FALLBACK_COURSE_PRICE: Record<string, number> = { 'turismo-gastronomico': 350, 'saude-bem-estar': 850, 'capacitacao-profissional': 1200 };
const DEPOSIT_PERCENT = 30;
/** Earliest arrival: two days out, so there is time to shop and prepare the kitchen. */
const LEAD_DAYS = 2;

const WEEK = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAY_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const prettyDate = (iso: string) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return `${WEEKDAY_SHORT[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()].slice(0, 3)}`;
};

const chipStyle = (on: boolean, disabled = false): React.CSSProperties => ({
  padding: '0.55rem 1.1rem',
  borderRadius: '20px',
  border: '1px solid',
  borderColor: on ? '#d4af37' : 'rgba(255,255,255,0.25)',
  background: on ? 'rgba(212,175,55,0.2)' : 'transparent',
  color: on ? '#fdfaf3' : 'rgba(253,250,243,0.75)',
  fontWeight: on ? 700 : 500,
  fontSize: '0.9rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.35 : 1,
});
const stepLabel: React.CSSProperties = { fontSize: '0.75rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' };
const soft: React.CSSProperties = { color: 'rgba(253,250,243,0.55)', fontWeight: 500, textTransform: 'none', letterSpacing: 0 };
const line: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: '1rem', color: 'rgba(253,250,243,0.85)', fontSize: '0.92rem', marginBottom: '0.6rem' };

interface Props {
  whatsappNumber: string;
  /** English/Spanish visitors get an approximate USD/EUR line under the total. */
  locale?: 'pt' | 'en' | 'es';
}

export default function RetreatPricingCalculator({ whatsappNumber, locale = 'pt' }: Props) {
  const [rooms, setRooms] = useState<RetreatRoom[]>(DEFAULT_ROOMS);
  const [roomId, setRoomId] = useState('penthouse');
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);
  const [immersionFee, setImmersionFee] = useState(IMMERSION_FEE_PER_GUEST_PER_NIGHT);
  const [depositPct, setDepositPct] = useState(DEPOSIT_PERCENT);
  const [coursePrice, setCoursePrice] = useState<Record<string, number>>(FALLBACK_COURSE_PRICE);
  const [busyData, setBusyData] = useState<{ ical: NightsByRoom; booked: NightsByRoom; connected: boolean } | null>(null);
  const [arrival, setArrival] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);
  const [showPlan, setShowPlan] = useState(false);
  const { rates } = useExchangeRates();
  // Someone travelling in plans the stay and the classes together: the courses ride along in the same quote.
  const shownCourses = useShownCourses();
  const courseOptions = COURSE_CONTENT.filter(c => courseIsShown(shownCourses, c.slug));
  const [courseSlugs, setCourseSlugs] = useState<string[]>([]);
  // The classes decide the length: one class, then a day out, and again (see retreatPlan.ts).
  const pickCourses = (next: string[]) => {
    setCourseSlugs(next);
    const k = classesOf(next);
    if (k > 0) setNights(nightsForClasses(k));
  };
  const toggleCourse = (slug: string) => pickCourses(courseSlugs.includes(slug) ? courseSlugs.filter(x => x !== slug) : [...courseSlugs, slug]);
  const pickedCourses = courseOptions.filter(c => courseSlugs.includes(c.slug));
  const pickedSlugs = pickedCourses.map(c => c.slug);
  const classes = classesOf(pickedSlugs);

  useEffect(() => {
    supabase
      .from('retreat_rooms')
      .select('id, name, airbnb_nightly_rate, max_guests')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRooms(data.map(r => ({
            id: r.id,
            name: r.name,
            airbnb_nightly_rate: r.airbnb_nightly_rate || 0,
            max_guests: r.max_guests || 2,
          })));
        }
      });
    supabase.from('courses').select('slug, price').then(({ data }) => {
      if (data?.length) setCoursePrice(p => ({ ...p, ...Object.fromEntries(data.filter(c => c.price).map(c => [c.slug, Number(c.price)])) }));
    });
    getSiteSetting('retreat_immersion_fee_per_guest_per_night', IMMERSION_FEE_PER_GUEST_PER_NIGHT).then(setImmersionFee);
    getSiteSetting('retreat_deposit_percent', DEPOSIT_PERCENT).then(setDepositPct);
    fetch('/api/retreats/availability').then(r => (r.ok ? r.json() : null)).then(d => d && !d.error && setBusyData(d)).catch(() => {});
    // A course page can send people here with the course already picked: /retreats?curso=<slug>#pacote
    const pre = new URLSearchParams(window.location.search).get('curso');
    if (pre) pickCourses([pre]);
  }, []);

  const room = rooms.find(r => r.id === roomId) || rooms[0];
  const cappedGuests = Math.min(guests, room.max_guests);
  const busy = useMemo(
    () => (busyData ? effectiveBusy(rooms.map(r => r.id), busyData.ical, busyData.booked) : null),
    [busyData, rooms],
  );
  const roomBusy = busy?.[room.id];
  const earliest = addDays(todayBR(), LEAD_DAYS);
  const canArrive = (d: string) => d >= earliest && isFree(roomBusy, d, nights);

  // A date picked for another room or length may not fit any more.
  const checkIn = arrival && canArrive(arrival) ? arrival : null;

  const nightOptions = classes > 0
    ? [...new Set([minNightsForClasses(classes), nightsForClasses(classes), nightsForClasses(classes) + 2, nightsForClasses(classes) + 4])]
    : [2, 3, 4, 5, 7];

  const quote = quoteRetreatPackage(room, nights, cappedGuests, immersionFee);
  const coursesSubtotal = pickedCourses.reduce((s, c) => s + (coursePrice[c.slug] ?? 0), 0) * cappedGuests;
  const total = quote.total + coursesSubtotal;
  const deposit = Math.round(total * depositPct / 100);
  const foreignCurrency = locale === 'en' ? 'USD' : locale === 'es' ? 'EUR' : null;
  const foreignRate = foreignCurrency === 'USD' ? rates.usd : foreignCurrency === 'EUR' ? rates.eur : null;
  const foreignLine = foreignCurrency ? formatForeign(total, foreignRate, foreignCurrency) : '';
  const checkOut = checkIn ? addDays(checkIn, nights) : null;
  const plan = buildItinerary(pickedSlugs, nights, checkIn ?? undefined);

  // The month grid
  const base = new Date(`${todayBR().slice(0, 7)}-01T00:00:00Z`);
  base.setUTCMonth(base.getUTCMonth() + monthOffset);
  const year = base.getUTCFullYear(), month = base.getUTCMonth();
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: base.getUTCDay() }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i)),
  ];
  const inStay = (d: string) => !!checkIn && d >= checkIn && d < (checkOut as string);

  const message = encodeURIComponent(
    `Olá! Quero reservar um Retiro:\n` +
    `- Suíte: ${room.name}\n` +
    `- Datas: ${checkIn ? `${prettyDate(checkIn)} a ${prettyDate(checkOut as string)}` : 'a definir'} (${nights} noites)\n` +
    `- Pessoas: ${cappedGuests}\n` +
    `- Cursos: ${pickedCourses.length ? pickedCourses.map(c => c.title).join(', ') : 'nenhum'}\n` +
    `- Estimativa: ${formatBRL(total)} (sinal de ${depositPct}%: ${formatBRL(deposit)})\n` +
    `Podem me confirmar?`
  );

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: '20px', padding: 'clamp(1.25rem, 4vw, 2.5rem)', backdropFilter: 'blur(6px)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fdfaf3', marginBottom: '0.5rem', textAlign: 'center' }}>
        Monte Seu Pacote
      </h3>
      <p style={{ color: 'rgba(253,250,243,0.7)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem', lineHeight: 1.7 }}>
        Uma aula com a Dolly a cada dois dias, e no dia seguinte a região: cachoeira, ilha, trilha, Paraty.
        Escolha os cursos e a gente monta o tamanho certo da estadia.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem', marginBottom: '1.75rem' }}>
        {courseOptions.length > 0 && (
          <div>
            <p style={stepLabel}>1 · Cursos <span style={soft}>(escolha quantos quiser)</span></p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {courseOptions.map(c => (
                <button key={c.slug} type="button" aria-pressed={courseSlugs.includes(c.slug)} onClick={() => toggleCourse(c.slug)} style={chipStyle(courseSlugs.includes(c.slug))}>
                  {courseSlugs.includes(c.slug) ? '✓ ' : '+ '}{c.title}
                  <span style={{ opacity: 0.65, fontWeight: 500 }}> · {c.retreatClasses} {c.retreatClasses > 1 ? 'aulas' : 'aula'}</span>
                </button>
              ))}
            </div>
            <a href="/cursos" style={{ display: 'inline-block', marginTop: '0.6rem', fontSize: '0.82rem', color: '#d4af37', textDecoration: 'underline' }}>
              Ver o que cada curso ensina →
            </a>
          </div>
        )}

        <div>
          <p style={stepLabel}>2 · Onde dormir</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {rooms.map(r => (
              <button key={r.id} type="button" onClick={() => setRoomId(r.id)} style={chipStyle(roomId === r.id)}>
                {r.name} <span style={{ opacity: 0.65, fontWeight: 500 }}>· até {r.max_guests}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <p style={stepLabel}>3 · Pessoas</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Array.from({ length: room.max_guests }, (_, i) => i + 1).map(g => (
                <button key={g} type="button" onClick={() => setGuests(g)} style={chipStyle(cappedGuests === g)}>{g}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <p style={stepLabel}>4 · Noites {classes > 0 && <span style={soft}>({classes} {classes > 1 ? 'aulas' : 'aula'} → {nightsForClasses(classes)} noites)</span>}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {nightOptions.map(n => (
                <button key={n} type="button" onClick={() => setNights(n)} style={chipStyle(nights === n)}>
                  {n}{classes > 0 && n === nightsForClasses(classes) ? ' ★' : ''}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <p style={stepLabel}>5 · Chegada <span style={soft}>{checkIn ? `${prettyDate(checkIn)} → ${prettyDate(checkOut as string)}` : '(toque no dia em que você chega)'}</span></p>
          <div style={{ background: 'rgba(0,0,0,0.18)', borderRadius: '14px', padding: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem', color: '#fdfaf3' }}>
              <button type="button" aria-label="Mês anterior" disabled={monthOffset === 0} onClick={() => setMonthOffset(m => m - 1)} style={{ ...chipStyle(false, monthOffset === 0), padding: '0.3rem 0.8rem' }}>‹</button>
              <strong style={{ textTransform: 'capitalize' }}>{MONTHS[month]} {year}</strong>
              <button type="button" aria-label="Próximo mês" disabled={monthOffset >= 14} onClick={() => setMonthOffset(m => m + 1)} style={{ ...chipStyle(false, monthOffset >= 14), padding: '0.3rem 0.8rem' }}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
              {WEEK.map((w, i) => <span key={i} style={{ fontSize: '0.7rem', color: 'rgba(253,250,243,0.5)', paddingBottom: '0.2rem' }}>{w}</span>)}
              {cells.map((d, i) => {
                if (!d) return <span key={i} />;
                const ok = canArrive(d);
                const taken = d >= earliest && !!roomBusy?.has(d);
                const picked = d === checkIn, stay = inStay(d);
                return (
                  <button
                    key={d} type="button" disabled={!ok} onClick={() => setArrival(d)}
                    title={taken ? 'Ocupado' : ok ? 'Chegar neste dia' : `Não cabem ${nights} noites a partir deste dia`}
                    style={{
                      aspectRatio: '1', minHeight: '34px', borderRadius: '8px', fontSize: '0.85rem', border: '1px solid',
                      borderColor: picked ? '#d4af37' : 'transparent',
                      background: picked ? '#d4af37' : stay ? 'rgba(212,175,55,0.35)' : ok ? 'rgba(46,68,50,0.85)' : 'transparent',
                      color: picked ? '#3c2a21' : ok || stay ? '#fdfaf3' : 'rgba(253,250,243,0.28)',
                      textDecoration: taken ? 'line-through' : 'none',
                      fontWeight: picked || stay ? 800 : 500, cursor: ok ? 'pointer' : 'default',
                    }}>
                    {Number(d.slice(8))}
                  </button>
                );
              })}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'rgba(253,250,243,0.55)', marginTop: '0.6rem', lineHeight: 1.5 }}>
              <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'rgba(46,68,50,0.85)', marginRight: 5 }} />dá para chegar
              <span style={{ marginLeft: 12, textDecoration: 'line-through' }}>12</span> ocupado
              {busyData?.connected
                ? ' · calendário ligado ao Airbnb da casa'
                : ' · a disponibilidade final a gente confirma no WhatsApp'}
            </p>
          </div>
        </div>
      </div>

      {/* The itinerary, day by day */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button type="button" onClick={() => setShowPlan(s => !s)} style={{ ...chipStyle(showPlan), width: '100%', textAlign: 'left', borderRadius: '12px' }}>
          {showPlan ? '▾' : '▸'} Ver o roteiro dia a dia ({nights + 1} dias)
        </button>
        {showPlan && (
          <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
            {plan.map(d => (
              <div key={d.day} style={{ display: 'grid', gridTemplateColumns: '2.2rem 1fr', gap: '0.6rem', alignItems: 'start', padding: '0.6rem 0.75rem', borderRadius: '10px', background: d.kind === 'class' ? 'rgba(212,175,55,0.14)' : 'rgba(0,0,0,0.15)' }}>
                <span style={{ fontSize: '1.3rem', lineHeight: 1 }}>{d.emoji}</span>
                <div>
                  <div style={{ color: '#fdfaf3', fontWeight: 700, fontSize: '0.9rem' }}>
                    Dia {d.day}{d.date ? ` · ${prettyDate(d.date)}` : ''} · {d.title}
                  </div>
                  <div style={{ color: 'rgba(253,250,243,0.7)', fontSize: '0.82rem', lineHeight: 1.5 }}>{d.text}</div>
                </div>
              </div>
            ))}
            <div style={{ padding: '0.75rem', borderRadius: '10px', border: '1px dashed rgba(212,175,55,0.5)', color: 'rgba(253,250,243,0.8)', fontSize: '0.82rem', lineHeight: 1.6 }}>
              <strong style={{ color: '#fdfaf3' }}>☔ Choveu?</strong> A cozinha é coberta: a aula vem para o dia de chuva e o passeio vai para o
              dia seguinte. Se chover no último passeio: {RAIN_PLAN.join(' · ')}.
            </div>
          </div>
        )}
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={line}>
          <span>{room.name} ({nights} noites)</span>
          <span>{room.airbnb_nightly_rate ? formatBRL(quote.roomSubtotal) : 'a confirmar'}</span>
        </div>
        <div style={line}>
          <span>Hospitalidade Tropical: café, refeições plant-based e dias na região ({cappedGuests}p × {nights}n × {formatBRL(immersionFee)})</span>
          <span>{formatBRL(quote.immersionSubtotal)}</span>
        </div>
        {pickedCourses.map(c => (
          <div key={c.slug} style={line}>
            <span>{c.title} ({cappedGuests}p × {formatBRL(coursePrice[c.slug] ?? 0)})</span>
            <span>{formatBRL((coursePrice[c.slug] ?? 0) * cappedGuests)}</span>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.9rem', marginTop: '0.3rem', color: '#fdfaf3', fontWeight: 800, fontSize: '1.3rem' }}>
          <span>Total</span>
          <span>{formatBRL(total)}</span>
        </div>
        {foreignLine && (
          <div style={{ textAlign: 'right', color: 'rgba(253,250,243,0.6)', fontSize: '0.82rem', marginTop: '0.3rem' }}>
            {foreignLine} <span style={{ opacity: 0.7 }}>(aproximado)</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#d4af37', fontSize: '0.92rem', marginTop: '0.75rem', fontWeight: 700 }}>
          <span>Sinal para garantir as datas ({depositPct}%)</span>
          <span>{formatBRL(deposit)}</span>
        </div>
        <div style={{ color: 'rgba(253,250,243,0.55)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
          {cappedGuests > 0 && <>{formatBRL(total / cappedGuests)} por pessoa · </>}o restante até 30 dias antes da chegada
        </div>
      </div>

      <WhatsAppGate
        href={`https://wa.me/${whatsappNumber}?text=${message}`}
        topic={`Retiro: ${room.name}${checkIn ? ` ${checkIn}` : ''} (${nights}n)${pickedCourses.length ? ` + ${pickedCourses.map(c => c.title).join(', ')}` : ''}`}
        tags={pickedCourses.length ? ['retiros', 'cursos'] : ['retiros']}
        locale={locale}
        className="btn btn-secondary"
        style={{ width: '100%', textAlign: 'center', display: 'block', padding: '1rem', fontSize: '1.05rem' }}
      >
        {checkIn ? 'Reservar Estas Datas pelo WhatsApp' : 'Confirmar Pelo WhatsApp'}
      </WhatsAppGate>

      {room.airbnb_nightly_rate === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(253,250,243,0.5)', marginTop: '1rem', textAlign: 'center' }}>
          Diária de referência ainda não cadastrada para esta acomodação — confirme o valor exato pelo WhatsApp.
        </p>
      )}
    </div>
  );
}
