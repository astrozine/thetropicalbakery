'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  DeliverySchedule, fetchSchedule, selectableDates, dayState, overrideMap,
  toISODate, parseISODate, describeRule,
} from '@/lib/deliverySchedule';

const WEEKDAY = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTH_NAME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

interface Props {
  /** Selected day (YYYY-MM-DD). Leave onChange out for a look-only calendar. */
  value?: string;
  onChange?: (date: string) => void;
  /** Days to mark as "yours" (e.g. a subscriber's own deliveries). */
  highlight?: string[];
  title?: string;
  /** Only offer days inside this range (a box edition's delivery window, YYYY-MM-DD). */
  window?: { from?: string | null; until?: string | null };
}

const daysUntil = (iso: string) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((parseISODate(iso).getTime() - today.getTime()) / 86400000);
};

const countdown = (iso: string) => {
  const n = daysUntil(iso);
  if (n <= 0) return 'É hoje!';
  if (n === 1) return 'É amanhã!';
  return `Faltam ${n} dias`;
};

/**
 * The customer-facing delivery calendar for Degustation Boxes. Box days glow;
 * everything else recedes. Picking one turns it into a small celebration,
 * because the day the box arrives is the best day of the week.
 */
export default function DeliveryCalendar({ value, onChange, highlight = [], title = 'Dia da Caixa', window: range }: Props) {
  const [schedule, setSchedule] = useState<DeliverySchedule | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => { fetchSchedule().then(setSchedule); }, []);

  const from = range?.from || null;
  const until = range?.until || null;
  const selectable = useMemo(() => {
    if (!schedule) return new Set<string>();
    return new Set(selectableDates(schedule).filter(d => (!from || d >= from) && (!until || d <= until)));
  }, [schedule, from, until]);
  const overrides = useMemo(() => overrideMap(schedule?.overrides || []), [schedule]);
  const sortedSelectable = useMemo(() => Array.from(selectable).sort(), [selectable]);
  const nextBoxDay = sortedSelectable[0];

  // Open on the month of the first day that can be picked (an edition may deliver next month).
  const firstPick = value || nextBoxDay;
  const [jumped, setJumped] = useState(false);
  if (!jumped && firstPick) {
    const now = new Date();
    const d = parseISODate(firstPick);
    const offset = (d.getFullYear() - now.getFullYear()) * 12 + d.getMonth() - now.getMonth();
    setJumped(true);
    if (offset > 0) setMonthOffset(offset);
  }
  const mine = useMemo(() => new Set(highlight), [highlight]);
  const interactive = !!onChange;

  const view = new Date();
  view.setDate(1);
  view.setMonth(view.getMonth() + monthOffset);
  const year = view.getFullYear();
  const month = view.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, month, i + 1))),
  ];
  const today = toISODate(new Date());

  if (!schedule) {
    return <p style={{ color: '#7a6a61', fontSize: '0.9rem' }}>Carregando o calendário...</p>;
  }

  if (sortedSelectable.length === 0) {
    if (from || until) {
      return (
        <div style={{ padding: '1.25rem', background: '#fff4e5', border: '1px solid #f0d9b5', borderRadius: '14px', color: '#7a4a00', fontSize: '0.92rem', lineHeight: 1.7 }}>
          Não há mais dias de entrega disponíveis para esta edição. Fale com a gente no WhatsApp ou entre na lista da próxima caixa. 🌴
        </div>
      );
    }
    return (
      <div style={{ padding: '1.25rem', background: '#fff4e5', border: '1px solid #f0d9b5', borderRadius: '14px', color: '#7a4a00', fontSize: '0.92rem', lineHeight: 1.7 }}>
        Ainda não abrimos as próximas datas de entrega. Fale com a gente no WhatsApp para saber quando sai a próxima caixa. 🌴
      </div>
    );
  }

  const focus = value || nextBoxDay;
  const focusDate = focus ? parseISODate(focus) : null;

  return (
    <div className="dc" style={{ background: 'linear-gradient(160deg, #fffdf6 0%, #fdf1d6 100%)', border: '1px solid rgba(212,175,55,0.55)', borderRadius: '22px', padding: 'clamp(1rem, 3vw, 1.6rem)', boxShadow: '0 12px 34px rgba(212,175,55,0.18)' }}>
      <style>{`
        @keyframes dc-glow { 0%,100% { box-shadow: 0 0 0 0 rgba(255,159,28,0.5);} 50% { box-shadow: 0 0 0 7px rgba(255,159,28,0);} }
        @keyframes dc-pop { 0% { transform: scale(0.85); opacity: 0;} 60% { transform: scale(1.06);} 100% { transform: scale(1); opacity: 1;} }
        @keyframes dc-wiggle { 0%,100% { transform: rotate(0);} 25% { transform: rotate(-12deg);} 75% { transform: rotate(12deg);} }
        .dc-day { transition: transform 0.15s; }
        .dc-day:hover:not(:disabled) { transform: scale(1.12); }
        @media (prefers-reduced-motion: reduce) { .dc * { animation: none !important; } }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.9rem' }}>
        <div>
          <p style={{ fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: '#a6832b', fontWeight: 700 }}>
            {title} <span style={{ display: 'inline-block', animation: 'dc-wiggle 2.4s ease-in-out infinite' }}>📦</span>
          </p>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.15rem, 3vw, 1.5rem)', color: '#3c2a21', lineHeight: 1.2 }}>
            {MONTH_NAME[month]} {year}
          </h3>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <button type="button" aria-label="Mês anterior" disabled={monthOffset === 0} onClick={() => setMonthOffset(m => m - 1)}
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.6)', background: '#fff', color: '#3c2a21', cursor: monthOffset === 0 ? 'default' : 'pointer', opacity: monthOffset === 0 ? 0.35 : 1 }}>‹</button>
          <button type="button" aria-label="Próximo mês" disabled={monthOffset >= 3} onClick={() => setMonthOffset(m => m + 1)}
            style={{ width: '38px', height: '38px', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.6)', background: '#fff', color: '#3c2a21', cursor: monthOffset >= 3 ? 'default' : 'pointer', opacity: monthOffset >= 3 ? 0.35 : 1 }}>›</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'clamp(3px, 1vw, 8px)' }}>
        {WEEKDAY.map((w, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: '#b3a08a', paddingBottom: '0.2rem' }}>{w}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`b${i}`} />;
          const isSelectable = selectable.has(iso);
          const st = dayState(iso, schedule.rules, overrides).state;
          const isOpenButTooSoon = st === 'open' && !isSelectable && iso >= today;
          const isSelected = value === iso;
          const isMine = mine.has(iso);
          const day = Number(iso.slice(-2));

          let background = 'transparent';
          let color = '#c9baa5';
          let border = '1px solid transparent';
          let anim: string | undefined;
          if (isSelectable) {
            background = 'linear-gradient(135deg, #ffb703 0%, #fb8500 100%)';
            color = '#fff';
            anim = 'dc-glow 2.4s ease-in-out infinite';
          }
          if (isMine) { background = 'linear-gradient(135deg, #2a9d8f 0%, #1b7a6e 100%)'; color = '#fff'; }
          if (isSelected) { background = 'linear-gradient(135deg, #3c2a21 0%, #5a3d2e 100%)'; color = '#ffd166'; border = '2px solid #ffd166'; anim = undefined; }
          if (isOpenButTooSoon) { border = '1px dashed #d8c7a8'; color = '#b3a08a'; }
          if (iso === today && !isSelectable) border = '1px solid #3c2a21';

          return (
            <button
              key={iso}
              type="button"
              className="dc-day"
              disabled={!interactive || !isSelectable}
              onClick={() => onChange?.(iso)}
              title={isSelectable ? 'Dia de entrega das caixas' : isOpenButTooSoon ? 'Prazo de pedido encerrado para este dia' : undefined}
              style={{
                aspectRatio: '1', borderRadius: '50%', border, background, color, animation: anim,
                cursor: interactive && isSelectable ? 'pointer' : 'default',
                fontWeight: 800, fontSize: 'clamp(0.8rem, 2vw, 1rem)', position: 'relative', padding: 0,
              }}
            >
              {day}
              {(isSelectable || isMine) && (
                <span aria-hidden style={{ position: 'absolute', bottom: '-2px', right: '-1px', fontSize: 'clamp(0.55rem, 1.6vw, 0.75rem)' }}>{isMine ? '⭐' : '📦'}</span>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.9rem', fontSize: '0.75rem', color: '#7a6a61' }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#fb8500', marginRight: 6 }} />dia de entrega</span>
        {highlight.length > 0 && <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: '#2a9d8f', marginRight: 6 }} />sua caixa</span>}
      </div>

      {focusDate && (
        <div
          key={focus}
          style={{
            marginTop: '1.1rem', padding: '1rem 1.25rem', borderRadius: '16px',
            background: 'linear-gradient(135deg, #3c2a21 0%, #5a3d2e 100%)', color: '#fdfaf3',
            display: 'flex', alignItems: 'center', gap: '1rem', animation: 'dc-pop 0.45s ease-out',
          }}
        >
          <span style={{ fontSize: '2.2rem' }} aria-hidden>{value ? '🎉' : '🌴'}</span>
          <div>
            <p style={{ fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffd166', fontWeight: 700 }}>
              {value ? 'Sua caixa chega' : 'Próximo dia de caixa'}
            </p>
            <p style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.05rem, 3vw, 1.35rem)', lineHeight: 1.25 }}>
              {focusDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'rgba(253,250,243,0.8)' }}>
              {countdown(focus!)} — {value ? 'feita à mão, fresquinha, na sua porta.' : 'reserve a sua e receba fresquinha.'}
            </p>
          </div>
        </div>
      )}

      {schedule.rules.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: '#a89a90', marginTop: '0.8rem' }}>
          {schedule.rules.map(describeRule).join(' · ')}
        </p>
      )}
    </div>
  );
}
