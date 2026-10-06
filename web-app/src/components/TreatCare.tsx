import React from 'react';
import Link from 'next/link';
import { CARE_EN, CARE_PATH, CARE_PATH_EN, CARE_PT, CareStep, KITCHEN_FACTS_EN } from '@/lib/treatCare';
import { KitchenFacts } from '@/components/TreatInfo';

/**
 * How to keep and serve the treats (wording in src/lib/treatCare.ts).
 * - <TreatCarePage />: the whole note, for /cuidados and /en/care (the QR code on the box card).
 * - <TreatCareCard />: the short version beside the box contents, on /assinatura and in Minha Conta.
 */

const brown = '#3c2a21';
const body = '#594a42';
const gold = '#a6832b';

function Steps({ steps }: { steps: CareStep[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))', gap: '0.85rem' }}>
      {steps.map(s => (
        <div key={s.title} style={{ background: '#fff', border: '1px solid #e8e1d7', borderRadius: '18px', padding: '1.1rem 1.2rem', boxShadow: '0 4px 14px rgba(60,42,33,0.05)' }}>
          <div aria-hidden style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>{s.emoji}</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem', color: brown, lineHeight: 1.25, marginBottom: '0.35rem' }}>{s.title}</h3>
          <p style={{ color: body, lineHeight: 1.65, fontSize: '0.92rem', margin: 0 }}>{s.text}</p>
        </div>
      ))}
    </div>
  );
}

const h2: React.CSSProperties = { fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 4vw, 2.1rem)', color: brown, margin: '2.5rem 0 1rem' };

export function TreatCarePage({ locale = 'pt' }: { locale?: 'pt' | 'en' }) {
  const c = locale === 'en' ? CARE_EN : CARE_PT;
  return (
    <main style={{ minHeight: '100vh', paddingTop: 'clamp(6rem, 14vw, 8rem)', paddingBottom: '5rem', background: 'var(--color-background)' }}>
      <div style={{ maxWidth: '880px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{ color: gold, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.8rem' }}>{c.eyebrow}</span>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 6vw, 3.2rem)', color: brown, lineHeight: 1.1, marginBottom: '1rem' }}>{c.title}</h1>
          <p style={{ color: body, lineHeight: 1.8, maxWidth: '600px', margin: '0 auto' }}>{c.intro}</p>
        </div>

        <h2 style={h2}>{c.storeTitle}</h2>
        <Steps steps={c.store} />

        <h2 style={h2}>{c.serveTitle}</h2>
        <Steps steps={c.serve} />

        <h2 style={h2}>{c.ingredientsTitle}</h2>
        <div style={{ background: '#fbf6ee', border: '1px dashed #d8c7ad', borderRadius: '18px', padding: '1.2rem 1.3rem' }}>
          {locale === 'en' ? (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.45rem' }}>
              {KITCHEN_FACTS_EN.map(f => (
                <li key={f.text} style={{ display: 'flex', gap: '0.55rem', alignItems: 'baseline', color: body, fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <span aria-hidden style={{ flexShrink: 0 }}>{f.emoji}</span><span>{f.text}</span>
                </li>
              ))}
            </ul>
          ) : (
            <KitchenFacts style={{ fontSize: '0.9rem' }} />
          )}
        </div>

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-heading)', fontStyle: 'italic', color: brown, fontSize: '1.15rem', lineHeight: 1.6, margin: '2.5rem auto 0', maxWidth: '520px' }}>
          {c.closing}
        </p>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.85rem' }}>
          {locale === 'en'
            ? <Link href={CARE_PATH} style={{ color: gold }}>Ler em português</Link>
            : <Link href={CARE_PATH_EN} style={{ color: gold }}>Read in English</Link>}
        </p>
      </div>
    </main>
  );
}

/** The short version: two storage steps and two serving steps, with a link to the whole note. */
export function TreatCareCard({ tone = 'light', style }: { tone?: 'light' | 'dark'; style?: React.CSSProperties }) {
  const dark = tone === 'dark';
  const text = dark ? 'rgba(253,250,243,0.88)' : body;
  const steps = [CARE_PT.store[0], CARE_PT.store[1], CARE_PT.serve[0], CARE_PT.serve[2]];
  return (
    <div style={{ background: dark ? 'rgba(255,255,255,0.06)' : '#fbf6ee', border: dark ? '1px solid rgba(253,250,243,0.2)' : '1px dashed #d8c7ad', borderRadius: '18px', padding: '1.1rem 1.2rem', ...style }}>
      <div style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, color: dark ? '#e8c872' : gold, marginBottom: '0.6rem' }}>
        🧊 Como guardar
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem' }}>
        {steps.map(s => (
          <li key={s.title} style={{ display: 'flex', gap: '0.55rem', alignItems: 'baseline', color: text, fontSize: '0.88rem', lineHeight: 1.55 }}>
            <span aria-hidden style={{ flexShrink: 0 }}>{s.emoji}</span>
            <span><strong>{s.title}.</strong> {s.text}</span>
          </li>
        ))}
      </ul>
      <Link href={CARE_PATH} style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.85rem', fontWeight: 600, color: dark ? '#e8c872' : gold }}>
        Ver todos os cuidados →
      </Link>
    </div>
  );
}
