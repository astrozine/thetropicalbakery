'use client';

import React, { useState } from 'react';
import { estimatePay } from '@/lib/payEstimate';
import { formatBRL } from '@/lib/deliveryZones';

const chipStyle = (on: boolean): React.CSSProperties => ({
  padding: '0.55rem 1.1rem',
  borderRadius: '20px',
  border: '1px solid',
  borderColor: on ? '#d4af37' : '#e8e1d7',
  background: on ? 'rgba(212,175,55,0.15)' : 'transparent',
  color: on ? '#3c2a21' : '#7a6a61',
  fontWeight: on ? 700 : 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
});

export default function PayEstimator() {
  const [days, setDays] = useState(2);
  const [hours, setHours] = useState(5);

  const est = estimatePay(days, hours);

  return (
    <div style={{ background: '#fff', border: '1px solid #e8e1d7', borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem', textAlign: 'center' }}>
        Quanto você ganharia?
      </h3>
      <p style={{ color: '#7a6a61', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
        Uma estimativa com base na legislação trabalhista (CLT) — não é uma proposta fechada,
        é só para você ter uma ideia antes de conversar com a gente.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
            Quantos dias por semana
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[1, 2, 3, 4, 5].map(d => (
              <button key={d} type="button" onClick={() => setDays(d)} style={chipStyle(days === d)}>{d}</button>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
            Quantas horas por dia
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[3, 4, 5, 6, 8].map(h => (
              <button key={h} type="button" onClick={() => setHours(h)} style={chipStyle(hours === h)}>{h}h</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#fdf7ee', border: '1px solid rgba(212,175,55,0.4)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.78rem', color: '#7a6a61', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.35rem' }}>
          Estimativa por mês
        </p>
        <p style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)', fontWeight: 800, color: '#3c2a21', fontFamily: 'var(--font-heading)' }}>
          {formatBRL(est.monthlyPay)}
        </p>
        <p style={{ fontSize: '0.82rem', color: '#7a6a61', marginTop: '0.35rem' }}>
          ≈ {formatBRL(est.hourlyRate)}/hora · {formatBRL(est.weeklyPay)}/semana
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem', background: '#fdfaf3', borderRadius: '10px' }}>
          <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginBottom: '0.3rem' }}>13º salário (proporcional/mês)</p>
          <p style={{ fontWeight: 700, color: '#3c2a21' }}>{formatBRL(est.thirteenthPerMonth)}</p>
        </div>
        <div style={{ padding: '1rem', background: '#fdfaf3', borderRadius: '10px' }}>
          <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginBottom: '0.3rem' }}>Férias + 1/3 (proporcional/mês)</p>
          <p style={{ fontWeight: 700, color: '#3c2a21' }}>{formatBRL(est.vacationPerMonth)}</p>
        </div>
        <div style={{ padding: '1rem', background: '#fdfaf3', borderRadius: '10px' }}>
          <p style={{ fontSize: '0.75rem', color: '#7a6a61', marginBottom: '0.3rem' }}>FGTS depositado/mês</p>
          <p style={{ fontWeight: 700, color: '#3c2a21' }}>{formatBRL(est.fgtsPerMonth)}</p>
        </div>
      </div>

      <p style={{ fontSize: '0.75rem', color: '#a89a90', marginTop: '1.5rem', lineHeight: 1.6, textAlign: 'center' }}>
        Cálculo de referência com base no salário mínimo vigente. O valor combinado na contratação
        pode variar conforme a função, a experiência e o acordo entre as partes.
      </p>
    </div>
  );
}
