import React from 'react';

/**
 * The parts of the boats / charters / marinas page that the other partner pages don't have:
 * who it is for, why it pays, where we deliver on the water, the three steps and the gluten note.
 * The copy lives in the page (pt in /b2b/barcos, en in /en/b2b/boats) so each language is written by hand.
 */
export interface BoatCopy {
  forWhoTitle: string;
  forWho: { icon: string; text: string }[];
  whyTitle: string;
  why: string[];
  whereTitle: string;
  places: { name: string; text: string }[];
  rules: string[];
  howTitle: string;
  steps: string[];
  note: string;
}

const h2: React.CSSProperties = {
  textAlign: 'center', fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.6rem, 4vw, 2rem)', color: '#3c2a21', marginBottom: '2rem',
};

// "Para quem é" and "Por que vale a pena" sit in the hero beside the tall photo on wide screens
// (BoatHeroExtra); there the page copies hide, so nothing is said twice. 1880px matches SplitHero's .sh-extra: below it the photo is shorter than the text would be.
const HIDE_WIDE = `@media (min-width: 1880px) { .boat-hide-wide { display: none; } }`;

const kicker: React.CSSProperties = {
  display: 'block', color: '#d4af37', letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.9rem',
};

export function BoatHeroExtra({ c }: { c: BoatCopy }) {
  return (
    <div style={{ display: 'grid', gap: '1.75rem', maxWidth: '560px' }}>
      <div>
        <span style={kicker}>{c.forWhoTitle}</span>
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {c.forWho.map(w => (
            <div key={w.text} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(253,250,243,0.05)', borderRadius: '12px', padding: '0.8rem 1rem' }}>
              <span aria-hidden style={{ fontSize: '1.5rem', lineHeight: 1 }}>{w.icon}</span>
              <span style={{ color: '#fdfaf3', lineHeight: 1.45 }}>{w.text}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <span style={kicker}>{c.whyTitle}</span>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.55rem', color: 'rgba(253,250,243,0.85)', lineHeight: 1.55 }}>
          {c.why.map(line => <li key={line}><span style={{ color: '#d4af37' }}>✦</span> {line}</li>)}
        </ul>
      </div>
    </div>
  );
}

export function BoatForWho({ c }: { c: BoatCopy }) {
  return (
    <section className="container px-4 max-w-5xl mx-auto boat-hide-wide" style={{ paddingTop: 'clamp(3rem, 7vw, 5rem)' }}>
      <style>{HIDE_WIDE}</style>
      <h2 style={h2}>{c.forWhoTitle}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {c.forWho.map(w => (
          <div key={w.text} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', background: '#fff', border: '1px solid #efe4c8', borderRadius: '16px', padding: '1.1rem 1.25rem' }}>
            <span aria-hidden style={{ fontSize: '1.9rem', lineHeight: 1 }}>{w.icon}</span>
            <span style={{ color: '#3c2a21', lineHeight: 1.5, fontWeight: 600 }}>{w.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function BoatDetails({ c }: { c: BoatCopy }) {
  return (
    <>
      {/* Why it pays */}
      <style>{HIDE_WIDE}</style>
      <section className="container px-4 max-w-4xl mx-auto text-center boat-hide-wide" style={{ paddingBottom: 'clamp(3rem, 7vw, 4.5rem)' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#d4af37', fontFamily: 'var(--font-heading)' }}>{c.whyTitle}</h3>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#594a42', lineHeight: 2, fontSize: '1.05rem' }}>
          {c.why.map(line => <li key={line}>✦ {line}</li>)}
        </ul>
      </section>

      {/* Where we deliver */}
      <section style={{ background: '#fdf7ee', padding: 'clamp(3rem, 7vw, 4.5rem) 0' }}>
        <div className="container px-4 max-w-5xl mx-auto">
          <h2 style={h2}>⚓ {c.whereTitle}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            {c.places.map(p => (
              <div key={p.name} className="liquid-glass-card" style={{ padding: '1.6rem' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: '#8a6d1f', marginBottom: '0.5rem' }}>📍 {p.name}</h3>
                <p style={{ color: '#594a42', lineHeight: 1.7 }}>{p.text}</p>
              </div>
            ))}
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '0.5rem', color: '#594a42', lineHeight: 1.6 }}>
            {c.rules.map(r => <li key={r}>⏱ {r}</li>)}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section className="container px-4 max-w-5xl mx-auto" style={{ paddingTop: 'clamp(3rem, 7vw, 4.5rem)', paddingBottom: '2.5rem' }}>
        <h2 style={h2}>{c.howTitle}</h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          {c.steps.map((s, i) => (
            <li key={s} style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', background: '#fff', border: '1px solid #efe4c8', borderRadius: '16px', padding: '1.25rem' }}>
              <b style={{ flexShrink: 0, width: '2.2rem', height: '2.2rem', borderRadius: '50%', background: '#d4af37', color: '#3c2a21', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.05rem' }}>{i + 1}</b>
              <span style={{ color: '#3c2a21', lineHeight: 1.55 }}>{s}</span>
            </li>
          ))}
        </ol>
        <p style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#7a6a61', lineHeight: 1.7, textAlign: 'center', maxWidth: '640px', marginInline: 'auto' }}>
          {c.note}
        </p>
      </section>
    </>
  );
}
