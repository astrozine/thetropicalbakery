'use client';

/**
 * /links: the one link in Dolly's Instagram bio (value-ladder plan, 2026-11-25).
 * The free recipes come first, because the e-mail list is where people actually buy; then each rung of the ladder.
 * Portuguese or English, picked from the phone's language and switchable. Every link carries utm_source=instagram.
 */

import { useEffect, useState } from 'react';

type Lang = 'pt' | 'en';

interface Item { img: string; title: string; text: string; href: string }

const COPY: Record<Lang, { hi: string; sub: string; lead: Item; items: Item[] }> = {
  pt: {
    hi: 'Oi, eu sou a Dolly',
    sub: 'Doces veganos de comida de verdade, da minha cozinha em Itamambuca.',
    lead: { img: '/ebook/sweet-escape/sm/red.webp', title: '2 receitas grátis', text: 'Duas receitas do meu livro Sweet Escape, direto no seu e-mail.', href: '/receitas' },
    items: [
      { img: '/dolly-course1.jpg', title: 'Aula de doces comigo', text: 'Uma tarde na minha cozinha em Itamambuca. Você faz, prova e leva as receitas.', href: '/cursos' },
      { img: '/dolly/dolly-portrait-sm.webp', title: 'Coaching de alimentação', text: 'Do café da manhã ao jantar, sem balança. Começa com uma conversa grátis de 30 min.', href: '/coaching' },
      { img: '/ebook/sweet-escape/pt/cover-sm.webp', title: 'O livro Sweet Escape', text: '7 doces, um para cada dia da semana, e uma conversa grátis comigo.', href: '/sweet-escape/pt' },
      { img: '/event_hero.jpg', title: 'Doces para a sua festa', text: 'Bandejas para aniversários, casamentos e eventos em Ubatuba e região.', href: '/menu' },
      { img: '/assets/retreats_beach_bg_1789884804918.jpg', title: 'Retiro na praia', text: 'Dias de praia, cachoeira e comida de verdade com a gente.', href: '/retreats' },
    ],
  },
  en: {
    hi: 'Hi, I’m Dolly',
    sub: 'Vegan treats made from real food, from my kitchen in Itamambuca, Brazil.',
    lead: { img: '/ebook/sweet-escape/sm/red.webp', title: '2 free recipes', text: 'Two recipes from my book Sweet Escape, straight to your inbox.', href: '/free-recipes' },
    items: [
      { img: '/dolly/dolly-portrait-sm.webp', title: 'Food coaching with me', text: 'Breakfast to dinner, no scale. It starts with a free 30-minute call, online.', href: '/coaching/en' },
      { img: '/ebook/sweet-escape/en/cover-sm.webp', title: 'The Sweet Escape book', text: '7 treats, one for every day of the week, plus a free call with me.', href: '/sweet-escape' },
      { img: '/dolly-course1.jpg', title: 'A treats class in my kitchen', text: 'One afternoon in Itamambuca. You make, taste and take the recipes home.', href: '/cursos' },
      { img: '/assets/retreats_beach_bg_1789884804918.jpg', title: 'A beach retreat', text: 'Days of beach, waterfalls and real food with us.', href: '/retreats' },
    ],
  },
};

const tag = (href: string) => `${href}${href.includes('?') ? '&' : '?'}utm_source=instagram&utm_medium=bio&utm_campaign=links`;

const COCOA = '#3c2a21';
const GOLD = '#d4af37';

function Card({ item, big }: { item: Item; big?: boolean }) {
  return (
    <a href={tag(item.href)} className={big ? 'lk-card lk-big' : 'lk-card'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.img} alt="" className="lk-img" />
      <span className="lk-words">
        <span className="lk-title">{item.title}</span>
        <span className="lk-text">{item.text}</span>
      </span>
      <span className="lk-arrow" aria-hidden>→</span>
    </a>
  );
}

export default function LinksPage() {
  const [lang, setLang] = useState<Lang>('pt');
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tb-links-lang');
      if (saved === 'pt' || saved === 'en') { setLang(saved); return; }
    } catch { /* private mode */ }
    if (!/^pt\b/i.test(navigator.language || 'pt')) setLang('en');
  }, []);
  const pick = (l: Lang) => {
    setLang(l);
    try { localStorage.setItem('tb-links-lang', l); } catch { /* private mode */ }
  };
  const c = COPY[lang];

  return (
    <main className="lk">
      <style>{CSS}</style>
      <div className="lk-langs" role="group" aria-label="Language">
        {(['pt', 'en'] as const).map(l => (
          <button key={l} type="button" onClick={() => pick(l)} className={l === lang ? 'on' : ''}>{l === 'pt' ? 'Português' : 'English'}</button>
        ))}
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/dolly/dolly-face.jpg" alt="Dolly" className="lk-face" />
      <h1>{c.hi}</h1>
      <p className="lk-sub">{c.sub}</p>
      <Card item={c.lead} big />
      <div className="lk-list">
        {c.items.map(i => <Card key={i.href} item={i} />)}
      </div>
      <p className="lk-foot">@_thetropicalbakery_ · thetropicalbakery.com</p>
    </main>
  );
}

const CSS = `
.lk { max-width: 520px; margin: 0 auto; padding: 24px 16px 48px; text-align: center; color: ${COCOA}; font-family: 'Outfit', Helvetica, Arial, sans-serif; }
.lk-langs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: #f4ecdf; margin-bottom: 18px; }
.lk-langs button { border: 0; background: transparent; padding: 6px 14px; border-radius: 999px; font: inherit; font-size: 14px; color: ${COCOA}; cursor: pointer; }
.lk-langs button.on { background: #fff; font-weight: 600; box-shadow: 0 1px 3px rgba(60,42,33,.15); }
.lk-face { width: 96px; height: 96px; border-radius: 50%; object-fit: cover; border: 3px solid ${GOLD}; display: block; margin: 0 auto 12px; }
.lk h1 { font-family: 'Yellowtail', cursive; font-weight: 400; font-size: 36px; margin: 0 0 6px; color: ${COCOA}; }
.lk-sub { margin: 0 auto 22px; max-width: 380px; font-size: 16px; line-height: 1.5; color: #594a42; }
.lk-card { display: flex; align-items: center; gap: 14px; text-align: left; text-decoration: none; color: ${COCOA}; background: #fff; border: 1px solid #eadfcd; border-radius: 16px; padding: 10px 14px 10px 10px; box-shadow: 0 2px 8px rgba(60,42,33,.06); }
.lk-card:active { transform: scale(.99); }
.lk-img { width: 64px; height: 64px; border-radius: 12px; object-fit: cover; flex: 0 0 auto; background: #f4ecdf; }
.lk-words { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
.lk-title { font-weight: 600; font-size: 17px; }
.lk-text { font-size: 14px; line-height: 1.4; color: #6b5a50; }
.lk-arrow { color: ${GOLD}; font-size: 20px; flex: 0 0 auto; }
.lk-big { background: #ff4f0a; border-color: #ff4f0a; color: #fff; padding: 12px 16px 12px 12px; margin-bottom: 14px; }
.lk-big .lk-img { width: 76px; height: 76px; }
.lk-big .lk-title { font-size: 20px; }
.lk-big .lk-text, .lk-big .lk-arrow { color: #fff; }
.lk-list { display: flex; flex-direction: column; gap: 10px; }
.lk-foot { margin-top: 26px; font-size: 13px; color: #8a7a70; }
`;
