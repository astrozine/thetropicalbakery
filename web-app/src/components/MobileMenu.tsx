'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { optimizedSrc } from '@/lib/thumbs';
import { shellHref, type ShellLang } from '@/lib/shellCopy';
import { COACHING_PRICES } from '@/lib/coachingCopy';
import { WORKSHOP_PRICE_BRL, WORKSHOP_START, WORKSHOP_BREAK } from '@/lib/workshopDates';
import { STORE_INSTAGRAM_URL } from '@/lib/siteContact';

/*
 * The phone menu (Andrew, 2026-11-28: "follow best practices … gets people to what they want and spend money").
 *
 * - What people pay for leads, as photos: the daily workshop (the current target) big on top, then coaching, the
 *   retreat, the e-book and the recipe journal as four tiles. Free doors and the rest are a short list below.
 * - One language from top to bottom: our own words in pt/en/es/nl/de (Google kept off them), Google's for the rest.
 * - Account and admin sit at the very bottom in one quiet row, not on top of the offers.
 * - It slides in from the right over a dimmed page; the cards rise in one after another; it slides out on close.
 */

type Copy = {
  kicker: string; workshop: string; workshopSub: (p: number, t: string) => string; workshopBadge: string; book: string;
  coaching: string; coachingSub: (p: number) => string; retreat: string; retreatSub: string;
  ebookSub: string; journal: string; journalSub: string;
  more: string; free: string; call: string; game: string; events: string; dolly: string; partners: string; jobs: string;
  language: string; account: string; admin: string; partnerPortal: string; team: string; signOut: string; signIn: string;
  signInSub: string; close: string; open: string;
};

const COPY: Record<ShellLang, Copy> = {
  pt: {
    kicker: 'Com a Dolly', workshop: 'Aula de culinária com a Dolly', workshopSub: (p, t) => `Todo dia às ${t} · R$ ${p} por pessoa`,
    workshopBadge: 'Vagas abertas', book: 'Reservar',
    coaching: 'Coaching', coachingSub: p => `Reset de 4 semanas · R$ ${p}`, retreat: 'O Retiro', retreatSub: 'Fique com a nossa família',
    ebookSub: '7 dias, 7 doces', journal: 'Diário de Receitas', journalSub: 'Grátis e premium',
    more: 'Mais', free: '2 receitas grátis', call: 'Conversa grátis de 30 min com a Dolly', game: 'Bateu Vontade? O jogo',
    events: 'Eventos e catering', dolly: 'Conheça a Dolly', partners: 'Parcerias', jobs: 'Trabalhe conosco',
    language: 'Idioma', account: 'Minha conta', admin: 'Admin', partnerPortal: 'Parceiro', team: 'Equipe', signOut: 'Sair',
    signIn: 'Entrar', signInSub: 'Seus pedidos, aulas e receitas num lugar só', close: 'Fechar o menu', open: 'Abrir',
  },
  en: {
    kicker: 'With Dolly', workshop: 'Cooking class with Dolly', workshopSub: (p, t) => `Every day at ${t.replace('h', ':00')} · R$ ${p} per person`,
    workshopBadge: 'Booking now', book: 'Book',
    coaching: 'Coaching', coachingSub: p => `4-week Reset · R$ ${p}`, retreat: 'The Retreat', retreatSub: 'Stay with our family',
    ebookSub: '7 days, 7 treats', journal: 'Recipe Journal', journalSub: 'Free and premium',
    more: 'More', free: '2 free recipes', call: 'Free 30-min call with Dolly', game: 'Bateu Vontade? The game',
    events: 'Events and catering', dolly: 'Meet Dolly', partners: 'Partners', jobs: 'Work with us',
    language: 'Language', account: 'My account', admin: 'Admin', partnerPortal: 'Partner', team: 'Team', signOut: 'Log out',
    signIn: 'Log in', signInSub: 'Your orders, classes and recipes in one place', close: 'Close the menu', open: 'Open',
  },
  es: {
    kicker: 'Con Dolly', workshop: 'Clase de cocina con Dolly', workshopSub: (p, t) => `Todos los días a las ${t} · R$ ${p} por persona`,
    workshopBadge: 'Reservas abiertas', book: 'Reservar',
    coaching: 'Coaching', coachingSub: p => `Reset de 4 semanas · R$ ${p}`, retreat: 'El Retiro', retreatSub: 'Quédate con nuestra familia',
    ebookSub: '7 días, 7 dulces', journal: 'Diario de Recetas', journalSub: 'Gratis y premium',
    more: 'Más', free: '2 recetas gratis', call: 'Charla gratis de 30 min con Dolly', game: 'Bateu Vontade? El juego',
    events: 'Eventos y catering', dolly: 'Conoce a Dolly', partners: 'Alianzas', jobs: 'Trabaja con nosotros',
    language: 'Idioma', account: 'Mi cuenta', admin: 'Admin', partnerPortal: 'Socio', team: 'Equipo', signOut: 'Salir',
    signIn: 'Entrar', signInSub: 'Tus pedidos, clases y recetas en un solo lugar', close: 'Cerrar el menú', open: 'Abrir',
  },
  nl: {
    kicker: 'Met Dolly', workshop: 'Kookles met Dolly', workshopSub: (p, t) => `Elke dag om ${t.replace('h', ':00')} · R$ ${p} per persoon`,
    workshopBadge: 'Nu te boeken', book: 'Boeken',
    coaching: 'Coaching', coachingSub: p => `Reset van 4 weken · R$ ${p}`, retreat: 'De Retreat', retreatSub: 'Logeer bij ons gezin',
    ebookSub: '7 dagen, 7 lekkernijen', journal: 'Receptendagboek', journalSub: 'Gratis en premium',
    more: 'Meer', free: '2 gratis recepten', call: 'Gratis gesprek van 30 min met Dolly', game: 'Bateu Vontade? Het spel',
    events: 'Evenementen en catering', dolly: 'Maak kennis met Dolly', partners: 'Partners', jobs: 'Werken bij ons',
    language: 'Taal', account: 'Mijn account', admin: 'Admin', partnerPortal: 'Partner', team: 'Team', signOut: 'Uitloggen',
    signIn: 'Inloggen', signInSub: 'Je bestellingen, lessen en recepten op één plek', close: 'Menu sluiten', open: 'Openen',
  },
  de: {
    kicker: 'Mit Dolly', workshop: 'Kochkurs mit Dolly', workshopSub: (p, t) => `Jeden Tag um ${t.replace('h', ' Uhr')} · R$ ${p} pro Person`,
    workshopBadge: 'Jetzt buchbar', book: 'Buchen',
    coaching: 'Coaching', coachingSub: p => `4-Wochen-Reset · R$ ${p}`, retreat: 'Das Retreat', retreatSub: 'Wohn bei unserer Familie',
    ebookSub: '7 Tage, 7 Leckereien', journal: 'Rezept-Tagebuch', journalSub: 'Gratis und Premium',
    more: 'Mehr', free: '2 Gratis-Rezepte', call: 'Gratis 30-Min-Gespräch mit Dolly', game: 'Bateu Vontade? Das Spiel',
    events: 'Events und Catering', dolly: 'Lerne Dolly kennen', partners: 'Partner', jobs: 'Arbeite mit uns',
    language: 'Sprache', account: 'Mein Konto', admin: 'Admin', partnerPortal: 'Partner', team: 'Team', signOut: 'Abmelden',
    signIn: 'Anmelden', signInSub: 'Deine Bestellungen, Kurse und Rezepte an einem Ort', close: 'Menü schließen', open: 'Öffnen',
  },
};

const LANGS = [
  { code: 'pt', flag: '🇧🇷', name: 'Português' }, { code: 'en', flag: '🇬🇧', name: 'English' }, { code: 'es', flag: '🇪🇸', name: 'Español' },
  { code: 'nl', flag: '🇳🇱', name: 'Nederlands' }, { code: 'de', flag: '🇩🇪', name: 'Deutsch' }, { code: 'fr', flag: '🇫🇷', name: 'Français' }, { code: 'it', flag: '🇮🇹', name: 'Italiano' },
];

const IMG = {
  workshop: '/dolly/dolly-tray.jpg',
  coaching: '/coaching/people-table.webp',
  retreat: '/retreats/real-itamambuca-aerial.jpg',
  ebook: '/ebook/sweet-escape/purple.webp',
  journal: '/ebook/sweet-escape/red.webp',
};

/** Workshops can be booked today (the break before Feb is in workshopDates.ts). */
function workshopsOpen(): boolean {
  if (!WORKSHOP_BREAK) return true;
  const today = new Date().toISOString().slice(0, 10);
  return today <= WORKSHOP_BREAK.lastDayBefore || today >= WORKSHOP_BREAK.firstDayAfter;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** The language the shell speaks (page language, or Google's target when we wrote that one). */
  lang: ShellLang;
  /** Language the page is in, for links to hand-written pages. */
  pageLang: ShellLang;
  /** What the visitor is reading in now (pt, en, … including fr/it through Google). */
  currentLang: string;
  /** True when `lang` is our own words and Google should leave them alone. */
  own: boolean;
  onLanguage: (code: string) => void;
  onSignIn: () => void;
}

export default function MobileMenu({ open, onClose, lang, pageLang, currentLang, own, onLanguage, onSignIn }: Props) {
  const t = COPY[lang] ?? COPY.pt;
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  // Stay mounted for the closing slide, then go.
  const [shown, setShown] = useState(open);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (open) { setShown(true); setLeaving(false); return; }
    if (!shown) return;
    setLeaving(true);
    const id = setTimeout(() => { setShown(false); setLeaving(false); }, 280);
    return () => clearTimeout(id);
  }, [open, shown]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const [roles, setRoles] = useState({ admin: false, partner: false, worker: false });
  const userId = user?.id;
  useEffect(() => {
    if (!userId) { setRoles({ admin: false, partner: false, worker: false }); return; }
    let cancelled = false;
    Promise.all([supabase.rpc('is_admin'), supabase.rpc('my_portals')]).then(([a, p]) => {
      if (cancelled) return;
      const row = Array.isArray(p.data) ? p.data[0] : p.data;
      setRoles({ admin: !a.error && a.data === true, partner: !!row?.is_partner, worker: !!row?.is_worker });
    });
    return () => { cancelled = true; };
  }, [userId]);

  if (!shown) return null;

  // Our own words carry translate="no" so Google leaves them alone; the class list keeps the element's own class.
  const o = (cls?: string) => ({
    className: [cls, own ? 'notranslate' : ''].filter(Boolean).join(' ') || undefined,
    translate: own ? ('no' as const) : undefined,
  });
  // Links go to the hand-written page in the language the visitor reads, when we have one.
  const href = (p: string) => shellHref(p, pageLang !== 'pt' ? pageLang : lang);
  const isOpenNow = workshopsOpen();
  let i = 0;
  const rise = () => ({ ['--i' as string]: i++ } as React.CSSProperties);

  const tiles = [
    { title: t.coaching, sub: t.coachingSub(COACHING_PRICES.reset), img: IMG.coaching, path: href('/coaching') },
    { title: t.retreat, sub: t.retreatSub, img: IMG.retreat, path: href('/retreats') },
    { title: 'Sweet Escape', sub: t.ebookSub, img: IMG.ebook, path: href('/sweet-escape/pt'), brand: true },
    { title: t.journal, sub: t.journalSub, img: IMG.journal, path: href('/diario') },
  ];
  const more = [
    { label: t.call, path: href('/coaching') + '#conversa', icon: '☎️' },
    { label: t.free, path: href('/receitas'), icon: '🎁' },
    { label: t.game, path: '/vontade', icon: '🥊' },
    { label: t.events, path: '/menu', icon: '🍰' },
    { label: t.dolly, path: '/dolly', icon: '👩‍🍳' },
    { label: t.partners, path: '/b2b', icon: '🤝' },
    { label: t.jobs, path: '/trabalhe-conosco', icon: '💼' },
    { label: 'Instagram', path: STORE_INSTAGRAM_URL, icon: '📸', external: true },
  ];

  const displayName = (profile?.full_name || user?.email || '').split(' ')[0];
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <div className={`mm-root${leaving || !open ? ' is-leaving' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
      <style>{MM_CSS}</style>
      <div className="mm-scrim" onClick={onClose} />
      <div className="mm-sheet">
        <div className="mm-top">
          <Link href={href('/')} onClick={onClose} aria-label="The Tropical Bakery" className="mm-logo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-gold-sm.webp" alt="The Tropical Bakery" width={240} height={215} />
          </Link>
          <button type="button" className="mm-close" onClick={onClose} aria-label={t.close}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
          </button>
        </div>

        <div className="mm-body">
          <p style={rise()} {...o('mm-kicker')}>{t.kicker}</p>

          {/* The workshop: the thing to sell right now. */}
          {isOpenNow && (
            <Link href={href('/cursos')} onClick={onClose} className="mm-hero" style={rise()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedSrc(IMG.workshop, 828)} alt="" loading="eager" decoding="async" />
              <span {...o('mm-hero__badge')}>{t.workshopBadge}</span>
              <span className="mm-hero__text">
                <span {...o('mm-hero__title')}>{t.workshop}</span>
                <span {...o('mm-hero__sub')}>{t.workshopSub(WORKSHOP_PRICE_BRL, WORKSHOP_START)}</span>
              </span>
              <span {...o('mm-hero__cta')}>{t.book} →</span>
            </Link>
          )}

          <div className="mm-tiles">
            {tiles.map(tile => (
              <Link key={tile.path} href={tile.path} onClick={onClose} className={`mm-tile${pathname === tile.path ? ' is-here' : ''}`} style={rise()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizedSrc(tile.img, 384)} alt="" loading="eager" decoding="async" />
                <span className="mm-tile__text">
                  <span className={`mm-tile__title${tile.brand ? ' notranslate' : ''}`} translate={tile.brand || own ? 'no' : undefined}>{tile.title}</span>
                  <span {...o('mm-tile__sub')}>{tile.sub}</span>
                </span>
              </Link>
            ))}
          </div>

          <p style={rise()} {...o('mm-label')}>{t.more}</p>
          <ul className="mm-list" style={rise()}>
            {more.map(m => (
              <li key={m.path + m.label}>
                {m.external ? (
                  <a href={m.path} target="_blank" rel="noopener noreferrer" onClick={onClose} className="notranslate" translate="no">
                    <span className="mm-list__icon" aria-hidden>{m.icon}</span>{m.label}<span className="mm-list__go" aria-hidden>↗</span>
                  </a>
                ) : (
                  <Link href={m.path} onClick={onClose} className={pathname === m.path ? 'is-here' : undefined}>
                    <span className="mm-list__icon" aria-hidden>{m.icon}</span><span {...o()}>{m.label}</span><span className="mm-list__go" aria-hidden>›</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>

          <p className="mm-label notranslate" translate="no" style={rise()}>
            {own ? t.language : 'Idioma · Language'}
          </p>
          <div className="mm-langs notranslate" translate="no" style={rise()}>
            {LANGS.map(l => (
              <button key={l.code} type="button" className={currentLang === l.code ? 'is-on' : undefined}
                aria-pressed={currentLang === l.code} onClick={() => { onClose(); onLanguage(l.code); }}>
                <span className="mm-flag" aria-hidden>{l.flag}</span>{l.name}
              </button>
            ))}
          </div>

          <div className="mm-account" style={rise()}>
            {user ? (
              <>
                <Link href="/minha-conta" onClick={onClose} className="mm-account__me">
                  {avatarUrl
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={avatarUrl} alt="" />
                    : <span className="mm-account__initial">{(displayName[0] || '?').toUpperCase()}</span>}
                  <span>
                    <span className="mm-account__name notranslate" translate="no">{displayName}</span>
                    <span {...o('mm-account__link')}>{t.account}</span>
                  </span>
                </Link>
                <div className="mm-account__chips">
                  {roles.admin && <Link href="/admin" onClick={onClose} {...o()}>{t.admin}</Link>}
                  {roles.partner && <Link href="/parceiro" onClick={onClose} {...o()}>{t.partnerPortal}</Link>}
                  {roles.worker && <Link href="/equipe" onClick={onClose} {...o()}>{t.team}</Link>}
                  <button type="button" onClick={() => { onClose(); signOut(); }} {...o()}>{t.signOut}</button>
                </div>
              </>
            ) : (
              <button type="button" className="mm-account__signin" onClick={() => { onClose(); onSignIn(); }}>
                <span {...o('mm-account__name')}>{t.signIn}</span>
                <span {...o('mm-account__link')}>{t.signInSub}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const MM_CSS = `
.mm-root{position:fixed;inset:0;z-index:99999}
.mm-scrim{position:absolute;inset:0;background:rgba(24,14,9,0.5);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);animation:mm-fade .28s ease both}
.mm-sheet{position:absolute;top:0;right:0;bottom:0;width:min(100%,440px);background:#faf5ec;display:flex;flex-direction:column;
  box-shadow:-18px 0 50px rgba(24,14,9,0.25);animation:mm-slide .38s cubic-bezier(.16,1,.3,1) both}
.mm-root.is-leaving .mm-scrim{animation:mm-fade-out .26s ease both}
.mm-root.is-leaving .mm-sheet{animation:mm-slide-out .26s cubic-bezier(.4,0,1,1) both}
@keyframes mm-fade{from{opacity:0}to{opacity:1}}
@keyframes mm-fade-out{from{opacity:1}to{opacity:0}}
@keyframes mm-slide{from{transform:translateX(100%)}to{transform:none}}
@keyframes mm-slide-out{from{transform:none}to{transform:translateX(100%)}}
@keyframes mm-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.mm-top{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 0.9rem 0.6rem 1.1rem;padding-top:max(0.6rem,env(safe-area-inset-top));border-bottom:1px solid rgba(201,162,87,0.25);flex-shrink:0}
.mm-logo img{height:42px;width:auto;display:block}
.mm-close{width:44px;height:44px;border-radius:50%;border:1px solid rgba(42,26,18,0.12);background:#fff;color:#2a1a12;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s}
.mm-close:active{transform:scale(0.92)}
.mm-body{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;padding:1.1rem 1.1rem calc(2rem + env(safe-area-inset-bottom))}
.mm-body > *{animation:mm-rise .5s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(90ms + var(--i,0) * 45ms)}
.mm-tiles > *{animation:mm-rise .5s cubic-bezier(.16,1,.3,1) both;animation-delay:calc(90ms + var(--i,0) * 45ms)}
.mm-tiles{animation:none !important}
.mm-kicker{margin:0 0 0.6rem;font-size:0.72rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#a8842f}
.mm-label{margin:1.6rem 0 0.5rem;font-size:0.72rem;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:#8a7a6d}
.mm-hero{position:relative;display:block;border-radius:22px;overflow:hidden;aspect-ratio:5/4;text-decoration:none;color:#fff;box-shadow:0 14px 34px rgba(42,26,18,0.22);transition:transform .2s}
.mm-hero:active,.mm-tile:active{transform:scale(0.98)}
.mm-hero img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 30%}
.mm-hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,12,8,0) 35%,rgba(20,12,8,0.82) 100%)}
.mm-hero__badge{position:absolute;top:12px;left:12px;z-index:1;background:#e2c27a;color:#2a1a12;font-size:0.72rem;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;padding:0.32rem 0.7rem;border-radius:999px}
.mm-hero__text{position:absolute;left:16px;right:96px;bottom:16px;z-index:1;display:block}
.mm-hero__title{display:block;font-family:var(--font-heading,serif);font-size:1.45rem;line-height:1.12;font-weight:700}
.mm-hero__sub{display:block;margin-top:0.3rem;font-size:0.88rem;opacity:0.92}
.mm-hero__cta{position:absolute;right:14px;bottom:16px;z-index:1;background:#faf5ec;color:#2a1a12;font-weight:700;font-size:0.9rem;padding:0.6rem 0.95rem;border-radius:999px;white-space:nowrap}
.mm-tiles{display:grid;grid-template-columns:1fr 1fr;gap:0.7rem;margin-top:0.7rem}
.mm-tile{position:relative;display:block;aspect-ratio:1/1.08;border-radius:18px;overflow:hidden;text-decoration:none;color:#fff;box-shadow:0 8px 20px rgba(42,26,18,0.14);transition:transform .2s}
.mm-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mm-tile::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,12,8,0) 40%,rgba(20,12,8,0.8) 100%)}
.mm-tile.is-here{outline:2px solid #c9a257;outline-offset:2px}
.mm-tile__text{position:absolute;left:12px;right:10px;bottom:11px;z-index:1;display:block}
.mm-tile__title{display:block;font-family:var(--font-heading,serif);font-size:1.08rem;font-weight:700;line-height:1.15}
.mm-tile__sub{display:block;font-size:0.76rem;opacity:0.9;margin-top:0.15rem;line-height:1.3}
.mm-list{list-style:none;margin:0;padding:0;background:#fff;border-radius:18px;border:1px solid rgba(42,26,18,0.07);overflow:hidden}
.mm-list li + li{border-top:1px solid rgba(42,26,18,0.06)}
.mm-list a{display:flex;align-items:center;gap:0.8rem;min-height:52px;padding:0.4rem 1rem;color:#2a1a12;text-decoration:none;font-size:1rem}
.mm-list a:active{background:#f5efe2}
.mm-list a.is-here{color:#a8842f;font-weight:700}
.mm-list__icon{width:26px;text-align:center;font-size:1.15rem}
.mm-list__go{margin-left:auto;color:#b5a596;font-size:1.25rem}
.mm-langs{display:flex;flex-wrap:wrap;gap:0.45rem}
.mm-langs button{border:1px solid rgba(42,26,18,0.14);background:#fff;color:#2a1a12;border-radius:999px;padding:0.55rem 0.9rem;font-size:0.9rem;cursor:pointer;min-height:40px}
.mm-flag{margin-right:0.4rem;font-size:1.05em}
.mm-langs button.is-on{background:#2a1a12;color:#e2c27a;border-color:#2a1a12;font-weight:700}
.mm-account{margin-top:1.6rem;padding-top:1.1rem;border-top:1px solid rgba(201,162,87,0.3)}
.mm-account__me{display:flex;align-items:center;gap:0.75rem;text-decoration:none;color:#2a1a12}
.mm-account__me img,.mm-account__initial{width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0}
.mm-account__initial{background:#c9a257;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700}
.mm-account__name{display:block;font-weight:700;font-size:1rem}
.mm-account__link{display:block;font-size:0.85rem;color:#8a7a6d}
.mm-account__chips{display:flex;flex-wrap:wrap;gap:0.45rem;margin-top:0.8rem}
.mm-account__chips a,.mm-account__chips button{border:1px solid rgba(42,26,18,0.14);background:none;color:#594a42;border-radius:999px;padding:0.45rem 0.9rem;font-size:0.85rem;text-decoration:none;cursor:pointer;min-height:36px;display:inline-flex;align-items:center}
.mm-account__signin{width:100%;text-align:left;background:#fff;border:1px solid rgba(42,26,18,0.1);border-radius:16px;padding:0.9rem 1rem;cursor:pointer;color:#2a1a12}
@media (prefers-reduced-motion: reduce){
  .mm-scrim,.mm-sheet,.mm-body > *,.mm-tiles > *,.mm-root.is-leaving .mm-scrim,.mm-root.is-leaving .mm-sheet{animation:none !important}
}
`;
