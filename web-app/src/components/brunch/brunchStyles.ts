/**
 * Brunch Tropical styles, shared by /brunch, /brunch/<slug>, the room and the Minha Conta card. Phone first
 * (412px is the truth), desktop from 900px. Everything is prefixed bn-.
 */
export const BRUNCH_CSS = `
.bn { --bn-cocoa: #3c2a21; --bn-gold: #d4af37; --bn-gold-deep: #a6832b; --bn-cream: #fdfaf3; --bn-sand: #f3ead8;
  --bn-line: #eadfca; --bn-text: #594a42; --bn-muted: #7a6a61; --bn-green: #2e4432; --bn-rose: #c8577a;
  background: var(--bn-cream); color: var(--bn-text); overflow-x: clip; }
.bn *, .bn *::before, .bn *::after { box-sizing: border-box; }
.bn img { max-width: 100%; }
.bn [hidden] { display: none !important; }

.bn-wrap { width: min(1120px, 100%); margin: 0 auto; padding: 0 16px; }
.bn-section { padding: 3.5rem 0; }
.bn-kicker { color: var(--bn-gold-deep); font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; font-size: 0.78rem; margin: 0 0 0.6rem; }
.bn-h2 { font-family: var(--font-heading); color: var(--bn-cocoa); font-size: clamp(1.45rem, 5vw, 2.3rem); line-height: 1.2; margin: 0 0 0.9rem; }
.bn-h3 { font-family: var(--font-heading); color: var(--bn-cocoa); font-size: 1.1rem; line-height: 1.3; margin: 0 0 0.4rem; }
.bn-lead { font-size: 1.05rem; line-height: 1.75; color: var(--bn-text); max-width: 640px; margin: 0 0 1.5rem; }
.bn-muted { color: var(--bn-muted); font-size: 0.92rem; line-height: 1.6; margin: 0; }
.bn-center { text-align: center; }
.bn-center .bn-lead { margin-left: auto; margin-right: auto; }

.bn-btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; min-height: 48px; padding: 0.8rem 1.5rem;
  border-radius: 999px; border: 0; font-weight: 700; font-size: 1rem; cursor: pointer; text-decoration: none; font-family: var(--font-body);
  transition: transform 0.15s, box-shadow 0.15s, background 0.15s; text-align: center; }
.bn-btn:active { transform: scale(0.97); }
.bn-btn--gold { background: linear-gradient(135deg, #e6c454, #c99a1e); color: #2b1e17; box-shadow: 0 8px 22px rgba(201,154,30,0.38); }
.bn-btn--dark { background: var(--bn-cocoa); color: #fff; }
.bn-btn--ghost { background: #fff; color: var(--bn-cocoa); border: 1px solid var(--bn-line); }
.bn-btn--light { background: rgba(255,255,255,0.14); color: #fff; border: 1px solid rgba(255,255,255,0.45); }
.bn-btn--block { width: 100%; }
.bn-btn:disabled { opacity: 0.55; cursor: not-allowed; }

.bn-chip { display: inline-flex; align-items: center; gap: 0.35rem; border-radius: 999px; padding: 0.3rem 0.75rem; font-size: 0.8rem; font-weight: 700;
  background: #fff; color: var(--bn-cocoa); border: 1px solid var(--bn-line); }
.bn-chip--gold { background: #fdf1d6; border-color: #f0d79a; color: #7a5a10; }
.bn-chip--green { background: #e6f4ec; border-color: #c3e6cf; color: #0b6b3a; }
.bn-chip--rose { background: #fdecf1; border-color: #f4c6d4; color: #9b2c4e; }

.bn-card { background: #fff; border: 1px solid var(--bn-line); border-radius: 22px; padding: 1.25rem; box-shadow: 0 10px 30px rgba(60,42,33,0.06); }

/* ------------------------------------------------------------------ hero */
.bn-hero { position: relative; isolation: isolate; overflow: hidden; background: #1d1511; color: #fff; padding: 1rem 0 3rem; }
.bn-hero__bg { position: absolute; inset: 0; z-index: -2; background-size: cover; background-position: center; filter: brightness(0.42) saturate(1.1); transform: scale(1.06); }
.bn-hero__shade { position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, rgba(29,21,17,0.2) 0%, rgba(29,21,17,0.75) 100%); }
.bn-hero__photos { position: relative; width: min(92%, 440px); margin: 0 auto 1.2rem; padding: 0.4rem 0 0.4rem; }
.bn-polaroid { position: relative; display: block; margin: 0; padding: 6px 6px 0; background: var(--bn-cream); border: 1px solid rgba(212,175,55,0.55); border-radius: 16px;
  box-shadow: 0 18px 36px rgba(0,0,0,0.5); color: var(--bn-cocoa); }
.bn-polaroid img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 11px; }
.bn-polaroid figcaption { padding: 0.45rem 0.4rem 0.55rem; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; text-align: center; }
.bn-polaroid--a { width: 58%; transform: rotate(-3deg); z-index: 2; }
.bn-polaroid--b { width: 54%; margin: -4.4rem 0 0 auto; transform: rotate(3.5deg); z-index: 3; }
.bn-float { position: absolute; z-index: 4; border-radius: 50%; overflow: hidden; border: 4px solid var(--bn-cream); box-shadow: 0 12px 26px rgba(0,0,0,0.5); }
.bn-float img { width: 100%; height: 100%; object-fit: cover; display: block; }
.bn-float--dolly { width: 24%; aspect-ratio: 1; top: -2%; right: 2%; transform: rotate(6deg); }
.bn-float--treat { width: 24%; aspect-ratio: 1; bottom: 6%; left: 6%; transform: rotate(-8deg); border-radius: 14px; }
.bn-hero__content { position: relative; z-index: 5; text-align: center; padding: 0 16px; max-width: 760px; margin: 0 auto; }
.bn-hero__eyebrow { display: inline-block; color: var(--bn-gold); letter-spacing: 0.22em; text-transform: uppercase; font-size: 0.78rem; font-weight: 700;
  border-bottom: 1px solid rgba(212,175,55,0.45); padding-bottom: 0.45rem; margin-bottom: 1rem; }
.bn-hero__title { font-family: var(--font-heading); font-size: clamp(1.85rem, 8vw, 4.2rem); line-height: 1.1; margin: 0 0 1rem; text-shadow: 0 4px 30px rgba(0,0,0,0.5); color: #fff; }
.bn-hero__text { font-size: clamp(1rem, 3.6vw, 1.22rem); line-height: 1.75; color: rgba(255,255,255,0.88); margin: 0 auto 1.6rem; max-width: 600px; font-weight: 300; }
.bn-hero__ctas { display: flex; gap: 0.7rem; justify-content: center; flex-wrap: wrap; }
.bn-hero__proof { margin-top: 1.2rem; display: flex; gap: 0.4rem 1.2rem; justify-content: center; flex-wrap: wrap; font-size: 0.85rem; color: rgba(255,255,255,0.8); }
@media (min-width: 900px) {
  .bn-hero { min-height: min(88vh, 820px); display: flex; align-items: center; padding: 5rem 0; }
  .bn-hero__photos { position: absolute; top: 0; bottom: 0; left: 50%; width: min(1180px, 100%); transform: translateX(-50%); margin: 0; padding: 0; pointer-events: none; }
  .bn-polaroid--a { position: absolute; top: 14%; left: 1%; width: clamp(200px, 22vw, 300px); transform: rotate(-5deg); }
  .bn-polaroid--b { position: absolute; bottom: 12%; right: 1%; width: clamp(200px, 22vw, 300px); margin: 0; transform: rotate(4deg); }
  .bn-float--dolly { width: 110px; top: 16%; right: 14%; }
  .bn-float--treat { width: 100px; bottom: 16%; left: 14%; }
  .bn-hero__content { max-width: 540px; }
  .bn-hero__title { font-size: clamp(2rem, 3.6vw, 3.3rem); }
}

/* --------------------------------------------------------------- agenda */
.bn-agenda { display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 760px) { .bn-agenda { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.bn-event { display: grid; grid-template-columns: minmax(0, 1fr); background: #fff; border: 1px solid var(--bn-line); border-radius: 24px; overflow: hidden;
  box-shadow: 0 12px 32px rgba(60,42,33,0.08); text-decoration: none; color: inherit; transition: transform 0.2s, box-shadow 0.2s; }
.bn-event:hover { transform: translateY(-3px); box-shadow: 0 18px 40px rgba(60,42,33,0.14); }
.bn-event__photo { position: relative; aspect-ratio: 16 / 10; background: var(--bn-sand); }
.bn-event__photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bn-date { position: absolute; top: 12px; left: 12px; background: var(--bn-cream); border-radius: 14px; padding: 0.35rem 0.7rem 0.45rem; text-align: center;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25); color: var(--bn-cocoa); min-width: 62px; }
.bn-date b { display: block; font-family: var(--font-heading); font-size: 1.5rem; line-height: 1.1; }
.bn-date span { display: block; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
.bn-event__tag { position: absolute; top: 12px; right: 12px; }
.bn-event__body { padding: 1.1rem 1.2rem 1.3rem; display: grid; gap: 0.6rem; }
.bn-event__title { font-family: var(--font-heading); color: var(--bn-cocoa); font-size: 1.15rem; line-height: 1.3; margin: 0; overflow-wrap: anywhere; }
.bn-event__meta { display: flex; flex-wrap: wrap; gap: 0.3rem 0.9rem; font-size: 0.9rem; color: var(--bn-muted); }
.bn-event__foot { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; }
.bn-price { font-family: var(--font-heading); color: var(--bn-cocoa); font-size: 1.2rem; }

.bn-seats { display: grid; gap: 0.35rem; }
.bn-seats__bar { height: 9px; border-radius: 999px; background: #efe6d6; overflow: hidden; }
.bn-seats__bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #e6c454, #c99a1e); }
.bn-seats__txt { font-size: 0.85rem; font-weight: 700; color: var(--bn-cocoa); }
.bn-seats__txt--hot { color: #b23a48; }
.bn-seat-dots { display: flex; flex-wrap: wrap; gap: 5px; }
.bn-seat-dots i { width: 14px; height: 14px; border-radius: 50%; background: #efe6d6; border: 1px solid #e2d4bb; }
.bn-seat-dots i.on { background: var(--bn-gold); border-color: var(--bn-gold-deep); }

.bn-empty { text-align: center; padding: 2.2rem 1.25rem; border: 2px dashed var(--bn-line); border-radius: 24px; background: #fffdf8; }
.bn-empty__icon { font-size: 2.4rem; margin: 0 0 0.4rem; }
.bn-notify { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-top: 1rem; }
.bn-input { width: 100%; min-height: 48px; padding: 0.8rem 1rem; border: 1px solid #e0d2b8; border-radius: 14px; background: #fff; font: inherit; font-size: 1rem; color: var(--bn-cocoa); }
.bn-input:focus { outline: 2px solid rgba(212,175,55,0.6); border-color: var(--bn-gold); }
textarea.bn-input { min-height: 96px; resize: vertical; line-height: 1.55; }
.bn-notify .bn-input { flex: 1 1 220px; max-width: 320px; }
.bn-label { display: block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--bn-cocoa); margin: 0 0 0.35rem; }
.bn-field { display: block; margin-bottom: 0.9rem; }
.bn-help { font-size: 0.8rem; color: var(--bn-muted); margin: 0.3rem 0 0; }

/* --------------------------------------------------------- moments, perks */
.bn-moments { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 760px) { .bn-moments { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.bn-moment { background: #fff; border: 1px solid var(--bn-line); border-radius: 20px; overflow: hidden; }
.bn-moment img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; }
.bn-moment div { padding: 0.9rem 1rem 1.1rem; }
.bn-moment b { display: block; color: var(--bn-cocoa); font-size: 1rem; margin-bottom: 0.25rem; }
.bn-moment p { margin: 0; font-size: 0.92rem; line-height: 1.55; }
.bn-step { display: inline-flex; width: 28px; height: 28px; border-radius: 50%; background: var(--bn-gold); color: #2b1e17; font-weight: 800; align-items: center; justify-content: center; font-size: 0.85rem; margin-right: 0.4rem; }

.bn-stack { display: grid; gap: 0.6rem; margin: 0; padding: 0; list-style: none; }
.bn-stack li { position: relative; background: #fff; border: 1px solid var(--bn-line); border-radius: 16px; padding: 0.8rem 0.95rem 0.8rem 2.6rem; line-height: 1.55; }
.bn-stack li::before { content: '✦'; position: absolute; left: 0.95rem; top: 0.8rem; color: var(--bn-gold); font-size: 1.05rem; line-height: 1.5; }

.bn-perks { display: grid; gap: 1rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 760px) { .bn-perks { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.bn-perk { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 0.9rem; align-items: start; background: linear-gradient(180deg, #fff, #fffaf0);
  border: 1px solid #eedcae; border-radius: 20px; padding: 1.1rem; }
.bn-perk__icon { width: 52px; height: 52px; border-radius: 16px; background: #fdf1d6; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
.bn-perk b { display: block; color: var(--bn-cocoa); margin-bottom: 0.2rem; }
.bn-perk p { margin: 0; font-size: 0.92rem; line-height: 1.55; }

.bn-dark { background: #2b1e17; color: rgba(255,255,255,0.86); }
.bn-dark .bn-h2, .bn-dark .bn-h3 { color: #fff; }
.bn-dark .bn-lead { color: rgba(255,255,255,0.82); }
.bn-dark .bn-kicker { color: var(--bn-gold); }

.bn-host { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 1fr); align-items: center; }
@media (min-width: 860px) { .bn-host { grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr); } }
.bn-host__photo { position: relative; width: min(320px, 80%); margin: 0 auto; }
.bn-host__photo img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 28px; border: 6px solid var(--bn-cream); box-shadow: 0 24px 50px rgba(0,0,0,0.45); transform: rotate(-3deg); }
.bn-host__sig { position: absolute; bottom: -14px; right: -6px; background: var(--bn-gold); color: #2b1e17; font-weight: 800; border-radius: 999px; padding: 0.4rem 0.9rem; font-size: 0.85rem; transform: rotate(4deg); }

.bn-who { display: flex; flex-wrap: wrap; gap: 0.5rem; }

.bn-venues { display: grid; gap: 0.8rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
@media (min-width: 760px) { .bn-venues { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.bn-venue { background: #fff; border: 1px solid var(--bn-line); border-radius: 18px; padding: 1rem; }
.bn-venue span { font-size: 1.6rem; display: block; margin-bottom: 0.3rem; }
.bn-venue b { display: block; color: var(--bn-cocoa); font-size: 0.95rem; }
.bn-venue p { margin: 0.2rem 0 0; font-size: 0.85rem; line-height: 1.45; }

.bn-faq { display: grid; gap: 0.6rem; }
.bn-faq details { background: #fff; border: 1px solid var(--bn-line); border-radius: 16px; padding: 0.2rem 1rem; }
.bn-faq summary { cursor: pointer; font-weight: 700; color: var(--bn-cocoa); min-height: 48px; display: flex; align-items: center; list-style: none; }
.bn-faq summary::-webkit-details-marker { display: none; }
.bn-faq summary::after { content: '+'; margin-left: auto; padding-left: 0.8rem; color: var(--bn-gold-deep); font-size: 1.3rem; }
.bn-faq details[open] summary::after { content: '–'; }
.bn-faq p { margin: 0 0 0.9rem; line-height: 1.65; }

/* ----------------------------------------------------------- event page */
.bn-ev-layout { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 960px) { .bn-ev-layout { grid-template-columns: minmax(0, 1fr) 380px; align-items: start; } .bn-buy { position: sticky; top: 100px; } }
.bn-ev-hero { position: relative; isolation: isolate; overflow: hidden; color: #fff; background: #1d1511; padding: 2rem 0 2.5rem; }
.bn-ev-hero .bn-hero__bg { filter: brightness(0.4); }
.bn-ev-hero__title { font-family: var(--font-heading); font-size: clamp(1.6rem, 7vw, 3.2rem); line-height: 1.15; margin: 0.6rem 0 0.6rem; color: #fff; overflow-wrap: anywhere; }
.bn-ev-hero__sub { font-size: 1.05rem; line-height: 1.6; color: rgba(255,255,255,0.85); margin: 0 0 1rem; max-width: 640px; }
.bn-ev-facts { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.bn-ev-facts .bn-chip { background: rgba(255,255,255,0.12); color: #fff; border-color: rgba(255,255,255,0.3); }
.bn-ev-cover { margin-top: 1.25rem; border-radius: 22px; overflow: hidden; border: 5px solid var(--bn-cream); box-shadow: 0 20px 44px rgba(0,0,0,0.45); transform: rotate(-1deg); }
.bn-ev-cover img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; }
@media (min-width: 960px) { .bn-ev-hero__grid { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr); gap: 2.5rem; align-items: center; } .bn-ev-cover { margin-top: 0; transform: rotate(2deg); } }
.bn-block { margin-bottom: 2rem; }
.bn-gallery { display: grid; gap: 0.6rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.bn-gallery img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 14px; display: block; }
.bn-venue-card { display: grid; grid-template-columns: minmax(0, 1fr); overflow: hidden; padding: 0; }
.bn-venue-card img { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; display: block; }
.bn-venue-card div { padding: 1.1rem 1.2rem 1.25rem; }
.bn-sponsors { display: grid; gap: 0.7rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 200px), 1fr)); }
.bn-sponsor { display: flex; gap: 0.75rem; align-items: center; background: #fff; border: 1px solid var(--bn-line); border-radius: 16px; padding: 0.75rem; text-decoration: none; color: inherit; min-height: 64px; }
.bn-sponsor img { width: 46px; height: 46px; object-fit: contain; border-radius: 10px; background: var(--bn-sand); flex-shrink: 0; }
.bn-sponsor b { display: block; color: var(--bn-cocoa); font-size: 0.95rem; overflow-wrap: anywhere; }
.bn-sponsor small { font-size: 0.78rem; color: var(--bn-muted); }

/* ------------------------------------------------------------ buy panel */
.bn-buy { background: #fff; border: 1px solid #eedcae; border-radius: 24px; padding: 1.25rem; box-shadow: 0 16px 40px rgba(60,42,33,0.12); }
.bn-buy__price { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.75rem; }
.bn-buy__price b { font-family: var(--font-heading); font-size: 1.8rem; color: var(--bn-cocoa); }
.bn-methods { display: grid; gap: 0.5rem; margin: 0.4rem 0 1rem; }
.bn-method { display: flex; align-items: center; gap: 0.6rem; min-height: 52px; padding: 0.6rem 0.9rem; border: 1px solid var(--bn-line); border-radius: 14px; cursor: pointer; background: #fff; font-weight: 600; color: var(--bn-cocoa); text-align: left; width: 100%; font: inherit; }
.bn-method.is-on { border: 2px solid var(--bn-gold); background: #fffaf0; }
.bn-error { background: #fdecea; color: #a5281b; border-radius: 12px; padding: 0.75rem 0.9rem; font-size: 0.92rem; margin: 0.6rem 0; line-height: 1.5; }
.bn-ok { background: #ecf7f0; color: #1e6b3c; border-radius: 12px; padding: 0.75rem 0.9rem; font-size: 0.92rem; margin: 0.6rem 0; line-height: 1.5; }
.bn-pix { text-align: center; }
.bn-pix img { width: 220px; height: 220px; margin: 0.5rem auto; display: block; }
.bn-copy { display: flex; gap: 0.4rem; }
.bn-copy input { flex: 1; min-width: 0; font-size: 0.8rem; }
.bn-guarantee { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 0.85rem; line-height: 1.5; color: var(--bn-muted); margin-top: 0.9rem; }

/* ---------------------------------------------------------------- room */
.bn-room-top { background: #2b1e17; color: #fff; padding: 1.5rem 0 1.75rem; border-radius: 0 0 28px 28px; }
.bn-room-top h1 { font-family: var(--font-heading); color: #fff; font-size: clamp(1.35rem, 6vw, 2.2rem); line-height: 1.2; margin: 0.5rem 0 0.4rem; overflow-wrap: anywhere; }
.bn-countdown { display: flex; gap: 0.5rem; margin: 0.9rem 0 0; flex-wrap: wrap; }
.bn-countdown div { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.22); border-radius: 14px; padding: 0.45rem 0.7rem; text-align: center; min-width: 64px; }
.bn-countdown b { display: block; font-family: var(--font-heading); font-size: 1.3rem; color: var(--bn-gold); }
.bn-countdown span { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; }
.bn-room-tabs { display: flex; gap: 0.4rem; margin: 1.25rem 0 1rem; overflow-x: auto; padding-bottom: 0.2rem; }
.bn-room-tab { flex: 0 0 auto; min-height: 44px; padding: 0.55rem 1rem; border-radius: 999px; border: 1px solid var(--bn-line); background: #fff; font-weight: 700; color: var(--bn-cocoa); cursor: pointer; font: inherit; font-weight: 700; }
.bn-room-tab.is-on { background: var(--bn-cocoa); color: #fff; border-color: var(--bn-cocoa); }
.bn-room-grid { display: grid; gap: 1.25rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 980px) { .bn-room-grid { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); align-items: start; } .bn-room-tabs { display: none; } .bn-room-grid > [hidden] { display: block !important; } }

.bn-chat { display: flex; flex-direction: column; height: min(70vh, 640px); min-height: 420px; background: #fff; border: 1px solid var(--bn-line); border-radius: 22px; overflow: hidden; }
.bn-chat__pin { background: #fdf6e3; border-bottom: 1px solid #f0e0b2; padding: 0.75rem 0.95rem; font-size: 0.9rem; line-height: 1.5; display: flex; gap: 0.6rem; }
.bn-chat__pin img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.bn-chat__list { flex: 1; overflow-y: auto; padding: 0.9rem; display: flex; flex-direction: column; gap: 0.7rem; background: linear-gradient(180deg, #fffdf8, #fbf6ec); }
.bn-msg { display: grid; grid-template-columns: 36px minmax(0, 1fr); gap: 0.55rem; align-items: end; max-width: 92%; }
.bn-msg--me { margin-left: auto; grid-template-columns: minmax(0, 1fr); }
.bn-msg--me .bn-ava { display: none; }
.bn-ava { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; background: #fdf1d6; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; position: relative; }
.bn-ava img { width: 100%; height: 100%; object-fit: cover; }
.bn-ava em { position: absolute; right: -2px; bottom: -2px; font-style: normal; font-size: 0.75rem; background: #fff; border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
.bn-bubble { background: #fff; border: 1px solid var(--bn-line); border-radius: 18px 18px 18px 6px; padding: 0.55rem 0.8rem; line-height: 1.5; font-size: 0.95rem; color: var(--bn-cocoa); overflow-wrap: anywhere; white-space: pre-wrap; }
.bn-msg--me .bn-bubble { background: var(--bn-cocoa); color: #fff; border-color: var(--bn-cocoa); border-radius: 18px 18px 6px 18px; }
.bn-msg--host .bn-bubble { background: #fdf1d6; border-color: #f0d79a; }
.bn-bubble__who { display: block; font-size: 0.75rem; font-weight: 800; color: var(--bn-gold-deep); margin-bottom: 0.1rem; }
.bn-msg--me .bn-bubble__who { color: #f0d79a; }
.bn-bubble__time { display: block; font-size: 0.75rem; opacity: 0.6; margin-top: 0.2rem; text-align: right; }
.bn-bubble__del { background: none; border: 0; color: inherit; opacity: 0.6; font-size: 0.75rem; cursor: pointer; padding: 0 0 0 0.5rem; text-decoration: underline; }
.bn-chat__form { display: flex; gap: 0.5rem; padding: 0.7rem; border-top: 1px solid var(--bn-line); background: #fff; }
.bn-chat__form textarea { flex: 1; min-height: 48px; max-height: 140px; resize: none; }
.bn-chat__send { flex-shrink: 0; width: 52px; min-height: 48px; border-radius: 14px; border: 0; background: var(--bn-gold); color: #2b1e17; font-size: 1.2rem; cursor: pointer; }
.bn-chat__empty { margin: auto; text-align: center; color: var(--bn-muted); padding: 1rem; }

.bn-people { display: grid; gap: 0.8rem; grid-template-columns: minmax(0, 1fr); }
@media (min-width: 560px) { .bn-people { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 980px) { .bn-people { grid-template-columns: minmax(0, 1fr); } }
.bn-person { background: #fff; border: 1px solid var(--bn-line); border-radius: 20px; padding: 1rem; display: grid; grid-template-columns: 64px minmax(0, 1fr); gap: 0.8rem; align-items: start; }
.bn-person--me { border: 2px solid var(--bn-gold); }
.bn-person .bn-ava { width: 64px; height: 64px; font-size: 1.8rem; }
.bn-person .bn-ava em { width: 24px; height: 24px; font-size: 0.95rem; }
.bn-person b { color: var(--bn-cocoa); display: block; overflow-wrap: anywhere; }
.bn-person__head { font-size: 0.85rem; color: var(--bn-gold-deep); font-weight: 700; margin: 0.1rem 0 0.35rem; }
.bn-person p { margin: 0 0 0.4rem; font-size: 0.9rem; line-height: 1.5; overflow-wrap: anywhere; }
.bn-person__tags { display: grid; gap: 0.3rem; font-size: 0.85rem; }
.bn-person__tags span { background: var(--bn-sand); border-radius: 10px; padding: 0.35rem 0.6rem; line-height: 1.4; overflow-wrap: anywhere; }
.bn-person a { color: var(--bn-gold-deep); font-weight: 700; font-size: 0.85rem; }

.bn-emojis { display: flex; flex-wrap: wrap; gap: 0.35rem; }
.bn-emojis button { width: 44px; height: 44px; border-radius: 12px; border: 1px solid var(--bn-line); background: #fff; font-size: 1.3rem; cursor: pointer; }
.bn-emojis button.is-on { border: 2px solid var(--bn-gold); background: #fdf1d6; }
.bn-photo-pick { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1rem; }
.bn-photo-pick .bn-ava { width: 76px; height: 76px; font-size: 2rem; }

/* --------------------------------------------------- Minha Conta card */
.bn-mine { display: grid; gap: 0.9rem; margin-bottom: 1rem; }
.bn-ticket { display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 0; background: #fff; border: 1px solid #eedcae; border-radius: 22px; overflow: hidden; box-shadow: 0 10px 28px rgba(60,42,33,0.08); }
.bn-ticket__photo { position: relative; background: var(--bn-sand); }
.bn-ticket__photo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.bn-ticket__body { padding: 0.9rem 1rem 1rem; display: grid; gap: 0.45rem; border-left: 2px dashed #eedcae; }
.bn-ticket__title { font-family: var(--font-heading); color: var(--bn-cocoa); font-size: 1rem; line-height: 1.3; margin: 0; overflow-wrap: anywhere; }
.bn-ticket__row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
.bn-ticket .bn-btn { min-height: 44px; padding: 0.55rem 1rem; font-size: 0.92rem; }
/* ---------------------------------------------------------------- vote */
.bn-vote__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.6rem; flex-wrap: wrap; }
.bn-vote__tabs { display: flex; gap: 0.4rem; margin: 0.9rem 0 0.6rem; }
.bn-seeds { display: flex; align-items: center; gap: 0.3rem; flex-wrap: wrap; font-size: 0.85rem; font-weight: 700; color: var(--bn-cocoa); margin-bottom: 0.6rem; }
.bn-seeds i { font-style: normal; font-size: 1.15rem; filter: grayscale(1); opacity: 0.35; transition: all 0.2s; }
.bn-seeds i.on { filter: none; opacity: 1; }
.bn-seeds small { color: var(--bn-muted); font-weight: 600; margin-left: 0.2rem; }
.bn-options { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.55rem; }
.bn-option { border: 1px solid var(--bn-line); border-radius: 16px; background: #fff; overflow: hidden; }
.bn-option.is-mine { border: 2px solid var(--bn-gold); background: #fffaf0; }
.bn-option.is-chosen { border-color: #8fd0a8; background: #f1faf4; }
.bn-option__main { display: flex; align-items: center; gap: 0.7rem; width: 100%; min-height: 56px; padding: 0.65rem 0.8rem; background: none; border: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; }
.bn-option__main:disabled { cursor: default; }
.bn-option__img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; flex-shrink: 0; }
.bn-option__text { flex: 1; min-width: 0; display: grid; gap: 0.35rem; }
.bn-option__label { font-weight: 700; color: var(--bn-cocoa); display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; overflow-wrap: anywhere; }
.bn-option__label .bn-chip { font-size: 0.75rem; padding: 0.15rem 0.5rem; }
.bn-option__bar { height: 8px; border-radius: 999px; background: #f1e8d8; overflow: hidden; }
.bn-option__bar span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, #e6c454, #c99a1e); transition: width 0.5s cubic-bezier(.2,.8,.2,1); }
.bn-option.is-chosen .bn-option__bar span { background: linear-gradient(90deg, #6fcf97, #2e8b57); }
.bn-option__who { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
.bn-option__who small { font-size: 0.78rem; color: var(--bn-muted); }
.bn-faces { display: inline-flex; }
.bn-faces .bn-ava { border: 2px solid #fff; margin-left: -6px; }
.bn-faces .bn-ava:first-child { margin-left: 0; }
.bn-faces .bn-ava em { display: none; }
.bn-option__seed { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; background: var(--bn-sand); color: var(--bn-gold-deep); flex-shrink: 0; font-weight: 800; }
.bn-option.is-mine .bn-option__seed { background: #fdf1d6; }
.bn-option__admin { display: flex; gap: 0.8rem; padding: 0 0.8rem 0.6rem; }
.bn-suggest { display: flex; gap: 0.5rem; margin-top: 0.75rem; }
.bn-suggest .bn-input { flex: 1; min-width: 0; }
.bn-menu-pick { display: grid; gap: 0.5rem; grid-template-columns: repeat(auto-fill, minmax(min(100%, 120px), 1fr)); margin-top: 0.6rem; max-height: 380px; overflow-y: auto; padding: 0.2rem; }
.bn-menu-pick__item { display: grid; gap: 0.3rem; border: 1px solid var(--bn-line); border-radius: 14px; background: #fff; padding: 0.4rem; font: inherit; font-size: 0.82rem; font-weight: 600; color: var(--bn-cocoa); cursor: pointer; text-align: center; line-height: 1.3; }
.bn-menu-pick__item img, .bn-menu-pick__ph { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; display: flex; align-items: center; justify-content: center; background: var(--bn-sand); font-size: 1.8rem; }
.bn-menu-pick__item small { color: var(--bn-gold-deep); font-size: 0.75rem; }
`;
