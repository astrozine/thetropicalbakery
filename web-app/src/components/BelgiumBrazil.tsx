import React from 'react';

/*
 * "Belgian skill, Brazilian nature": the luxury story, told in small doses around the site.
 * The flags are drawn as SVG on purpose: Windows shows flag emoji as the letters "BE" / "BR".
 */

const BelgiumFlag = ({ size }: { size: number }) => (
  <svg viewBox="0 0 30 20" width={size * 1.5} height={size} aria-hidden="true" style={{ display: 'block', borderRadius: 3 }}>
    <rect width="10" height="20" fill="#1a1a1a" />
    <rect x="10" width="10" height="20" fill="#FDDA24" />
    <rect x="20" width="10" height="20" fill="#EF3340" />
  </svg>
);

const BrazilFlag = ({ size }: { size: number }) => (
  <svg viewBox="0 0 30 20" width={size * 1.5} height={size} aria-hidden="true" style={{ display: 'block', borderRadius: 3 }}>
    <rect width="30" height="20" fill="#009C3B" />
    <polygon points="15,2.2 27.6,10 15,17.8 2.4,10" fill="#FFDF00" />
    <circle cx="15" cy="10" r="4.6" fill="#002776" />
    <path d="M10.6 9.1 Q15 7.6 19.4 10.4" stroke="#fff" strokeWidth="0.9" fill="none" />
  </svg>
);

/** The two flags, slightly overlapping like two stamps on a parcel. */
export function Flags({ size = 14 }: { size?: number }) {
  const card: React.CSSProperties = { borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.6)', lineHeight: 0 };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }} aria-hidden="true">
      <span style={{ ...card, transform: 'rotate(-6deg)' }}><BelgiumFlag size={size} /></span>
      <span style={{ ...card, transform: 'rotate(5deg)', marginLeft: -size * 0.35 }}><BrazilFlag size={size} /></span>
    </span>
  );
}

/**
 * A small pill: flags + "Maestria belga · Natureza brasileira". Meant to sit under a heading or a
 * paragraph without taking over. `tone` follows the background it sits on.
 */
export function OriginSeal({ tone = 'light', text = 'Maestria belga · Natureza brasileira', style }: {
  tone?: 'light' | 'dark'; text?: string; style?: React.CSSProperties;
}) {
  const dark = tone === 'dark';
  return (
    <span
      title="Receitas de Elisabeth “Dolly” Van Dam, da Bélgica, com ingredientes da natureza brasileira"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.6rem', maxWidth: '100%',
        padding: '0.4rem 0.95rem 0.4rem 0.7rem', borderRadius: 999,
        background: dark ? 'rgba(212,175,55,0.12)' : '#fff',
        border: `1px solid ${dark ? 'rgba(212,175,55,0.55)' : 'rgba(212,175,55,0.6)'}`,
        color: dark ? '#f4d675' : '#7a5a14',
        fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.35,
        boxShadow: dark ? 'none' : '0 4px 14px rgba(60,42,33,0.08)',
        ...style,
      }}
    >
      <Flags size={13} />
      <span>{text}</span>
    </span>
  );
}

const PILLARS = [
  { icon: <BelgiumFlag size={18} />, title: 'Técnica belga', body: 'A escola do país que aperfeiçoou o chocolate (e a batata frita): temperagem, massas e recheios de confeitaria clássica.' },
  { icon: <BrazilFlag size={18} />, title: 'Natureza brasileira', body: 'Só o melhor da terra: cacau, castanhas, coco e frutas da Mata Atlântica, colhidos no auge.' },
  { icon: <span style={{ color: '#d4af37', fontSize: '1.3rem', lineHeight: 1 }}>✦</span>, title: 'Luxo que faz bem', body: 'Vegano, sem glúten, sem açúcar refinado. Feito à mão, em pequenos lotes, por uma única chef.' },
];

/**
 * The full story, once, on the home page: who Elisabeth "Dolly" Van Dam is, and why Belgian skill
 * plus Brazilian nature gives something dazzling.
 */
export function OriginStory() {
  return (
    <section className="bb-story" aria-labelledby="bb-story-title">
      <div className="bb-story__inner">
        <div className="bb-story__flags"><Flags size={30} /></div>
        <span className="bb-story__kicker">Da Bélgica para a Mata Atlântica</span>
        <h2 id="bb-story-title" className="bb-story__title">
          Maestria belga. Natureza brasileira.<br /><span>Um resultado deslumbrante.</span>
        </h2>
        <p className="bb-story__lead">
          <strong>Elisabeth “Dolly” Van Dam</strong> é fanática por saúde e, perigosamente, obcecada por bolos, cookies,
          doces de chá da tarde e todas as delícias da Bélgica. Ela trouxe na bagagem a técnica belga e encontrou no Brasil
          os ingredientes que nenhuma confeitaria da Europa tem. O tropical não é detalhe: é o coração de cada peça.
        </p>
        <div className="bb-story__pillars">
          {PILLARS.map(p => (
            <div key={p.title} className="bb-story__pillar">
              <span className="bb-story__icon">{p.icon}</span>
              <strong>{p.title}</strong>
              <p>{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .bb-story { background: #3c2a21; color: #fdfaf3; padding: clamp(3.5rem, 9vw, 6.5rem) 1.25rem; position: relative; overflow: hidden; }
        .bb-story::before { content: ''; position: absolute; inset: 0; pointer-events: none;
          background: radial-gradient(60% 50% at 15% 0%, rgba(212,175,55,0.18), transparent 70%), radial-gradient(50% 45% at 90% 100%, rgba(0,156,59,0.14), transparent 70%); }
        .bb-story__inner { position: relative; max-width: 960px; margin: 0 auto; text-align: center; }
        .bb-story__flags { display: flex; justify-content: center; margin-bottom: 1.25rem; }
        .bb-story__kicker { display: block; color: #d4af37; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; margin-bottom: 1rem; }
        .bb-story__title { font-family: var(--font-heading); font-size: clamp(1.6rem, 4.6vw, 2.9rem); line-height: 1.15; margin-bottom: 1.4rem; }
        .bb-story__title span { color: #d4af37; }
        .bb-story__lead { max-width: 680px; margin: 0 auto 2.75rem; color: rgba(253,250,243,0.85); line-height: 1.85; font-size: clamp(0.98rem, 2vw, 1.1rem); }
        .bb-story__lead strong { color: #fdfaf3; }
        .bb-story__pillars { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 1.25rem; text-align: left; }
        .bb-story__pillar { background: rgba(255,255,255,0.05); border: 1px solid rgba(212,175,55,0.3); border-radius: 16px; padding: 1.4rem 1.3rem; }
        .bb-story__pillar strong { display: block; font-family: var(--font-heading); font-size: 1.05rem; color: #f4d675; margin: 0.8rem 0 0.45rem; }
        .bb-story__pillar p { color: rgba(253,250,243,0.78); font-size: 0.93rem; line-height: 1.7; margin: 0; }
        .bb-story__icon { display: inline-flex; height: 24px; align-items: center; }
      ` }} />
    </section>
  );
}
