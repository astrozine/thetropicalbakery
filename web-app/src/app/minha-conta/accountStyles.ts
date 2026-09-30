/** Minha Conta's styles. Phone first; the desktop layout starts at 1024px. */
export const ACCOUNT_CSS = `
.acct-page { min-height: 100vh; padding: 0 0 7rem; background: var(--color-background); overflow-x: clip; }
.acct-page [hidden] { display: none !important; }

/* ------------------------------------------------------------------ hero */
.acct-hero {
  position: relative; isolation: isolate; overflow: hidden;
  padding: 2.5rem 1rem 4.25rem; color: #fdfaf3; text-align: center;
  border-radius: 0 0 32px 32px; background: #2b1e17;
}
.acct-hero-bg { object-fit: cover; z-index: -2; }
.acct-hero-shade {
  position: absolute; inset: 0; z-index: -1;
  background:
    radial-gradient(ellipse at 50% 30%, rgba(43,30,23,0.45) 0%, rgba(43,30,23,0.85) 70%),
    linear-gradient(180deg, rgba(43,30,23,0.35) 0%, rgba(43,30,23,0.9) 100%);
}
.acct-hero-inner { position: relative; max-width: 640px; margin: 0 auto; }

.acct-float {
  position: absolute; z-index: 0; border-radius: 16px; overflow: hidden;
  border: 5px solid #fdfaf3; box-shadow: 0 18px 40px rgba(0,0,0,0.45);
  animation: acctBob 7s ease-in-out infinite;
}
.acct-float img { display: block; width: 100%; height: 100%; object-fit: cover; }
.acct-float-1 { width: 84px; height: 112px; top: 1.1rem; left: -18px; --r: -10deg; transform: rotate(var(--r)); }
.acct-float-2 { width: 78px; height: 78px; top: 1.6rem; right: -14px; --r: 9deg; transform: rotate(var(--r)); animation-delay: -2s; }
.acct-float-3 { display: none; }
@keyframes acctBob { 0%,100% { transform: rotate(var(--r)) translateY(0); } 50% { transform: rotate(var(--r)) translateY(-8px); } }

.acct-avatar { position: relative; width: 112px; height: 112px; margin: 0 auto 1rem; }
.acct-avatar svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.acct-avatar img, .acct-avatar-initial {
  position: absolute; inset: 10px; width: calc(100% - 20px); height: calc(100% - 20px);
  border-radius: 50%; object-fit: cover;
}
.acct-avatar-initial {
  display: flex; align-items: center; justify-content: center; background: #d4af37; color: #3c2a21;
  font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800;
}
.acct-avatar-badge {
  position: absolute; right: -2px; bottom: 2px; width: 38px; height: 38px; border-radius: 50%;
  background: #fdfaf3; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
  box-shadow: 0 6px 16px rgba(0,0,0,0.35); border: 2px solid #d4af37;
}
.acct-eyebrow {
  margin: 0 0 0.4rem; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; color: #ffd166;
}
.acct-hello {
  font-family: var(--font-heading); font-size: clamp(2rem, 8vw, 3.4rem); line-height: 1.05; margin: 0 0 0.6rem;
  text-shadow: 0 4px 24px rgba(0,0,0,0.35);
}
.acct-hero-sub { font-size: 1rem; line-height: 1.6; color: rgba(253,250,243,0.88); margin: 0 auto 1.1rem; max-width: 30rem; }
.acct-hero-next { display: block; margin-top: 0.35rem; color: #ffd166; font-weight: 700; }
.acct-hero-alert {
  display: inline-block; margin: 0 0 1rem; padding: 0.55rem 1rem; border-radius: 999px;
  background: rgba(255,209,102,0.16); border: 1px solid rgba(255,209,102,0.5); color: #fff3cf; font-weight: 700; font-size: 0.9rem;
}
.acct-hero-actions { display: flex; flex-direction: column; gap: 0.65rem; align-items: stretch; max-width: 22rem; margin: 0 auto; }
.acct-hero-stats {
  list-style: none; padding: 0; margin: 1.25rem 0 0; display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center;
}
.acct-hero-stats li {
  font-size: 0.8rem; font-weight: 700; padding: 0.35rem 0.8rem; border-radius: 999px;
  background: rgba(253,250,243,0.12); border: 1px solid rgba(253,250,243,0.22); color: #fdfaf3;
}

/* --------------------------------------------------------------- buttons */
.acct-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; min-height: 48px;
  padding: 0.8rem 1.5rem; border-radius: 999px; font-family: var(--font-body); font-weight: 800; font-size: 0.95rem;
  text-decoration: none; cursor: pointer; border: 2px solid transparent; transition: transform .2s, box-shadow .2s, background .2s;
}
.acct-btn:hover { transform: translateY(-2px); }
.acct-btn-gold { background: linear-gradient(135deg, #ffd166, #d4af37); color: #3c2a21; box-shadow: 0 10px 26px rgba(212,175,55,0.4); }
.acct-btn-gold:hover { box-shadow: 0 14px 32px rgba(212,175,55,0.55); }
.acct-btn-ghost { background: rgba(253,250,243,0.08); color: #fdfaf3; border-color: rgba(253,250,243,0.5); }
.acct-btn-dark { background: #3c2a21; color: #fdfaf3; }
.acct-btn-soft { background: #fdf1d6; color: #3c2a21; border-color: rgba(212,175,55,0.45); font-size: 0.88rem; padding: 0.7rem 1.1rem; }

/* ------------------------------------------------------------------ tabs */
.acct-wrap { max-width: 1220px; margin: 0 auto; padding: 0 1rem; }
.acct-tabs {
  position: relative; z-index: 2; display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.25rem;
  max-width: 460px; margin: -1.75rem auto 1.75rem; padding: 0.35rem; border-radius: 999px;
  background: #fffdf8; box-shadow: 0 14px 34px rgba(60,42,33,0.18); border: 1px solid rgba(212,175,55,0.35);
}
.acct-tab {
  position: relative; min-height: 46px; border: none; border-radius: 999px; background: transparent; cursor: pointer;
  font-family: var(--font-body); font-weight: 800; font-size: 0.9rem; color: #7a6a61; transition: background .25s, color .25s;
}
.acct-tab.is-on { background: #3c2a21; color: #fdfaf3; }
.acct-tab-dot { position: absolute; top: 10px; right: 22px; width: 8px; height: 8px; border-radius: 50%; background: #e2792a; }
.acct-tab-count {
  display: inline-flex; min-width: 20px; height: 20px; padding: 0 5px; margin-left: 4px; border-radius: 999px;
  align-items: center; justify-content: center; font-size: 0.72rem; background: #d4af37; color: #3c2a21; vertical-align: 1px;
}

/* --------------------------------------------------------------- common */
.acct-kicker { margin: 0 0 0.3rem; font-size: 0.75rem; font-weight: 800; letter-spacing: 0.16em; text-transform: uppercase; color: #a6832b; }
.acct-h2 { font-family: var(--font-heading); font-size: clamp(1.25rem, 4vw, 1.55rem); line-height: 1.2; color: #3c2a21; margin: 0; }
.acct-h3 { font-family: var(--font-heading); font-size: 1.1rem; line-height: 1.3; color: #3c2a21; margin: 0; }
.acct-muted { color: #7a6a61; font-size: 0.92rem; line-height: 1.65; margin: 0.4rem 0 0; }
.acct-card {
  background: #fff; border-radius: 24px; padding: 1.4rem; border: 1px solid #efe6d8; box-shadow: 0 8px 24px rgba(60,42,33,0.06);
}
.acct-pill { display: inline-block; font-size: 0.75rem; font-weight: 800; padding: 0.22rem 0.65rem; border-radius: 999px; }

/* ------------------------------------------------- home: phone ordering */
.acct-home { display: flex; flex-direction: column; gap: 1.25rem; }
.acct-col-main, .acct-col-side { display: contents; }
.acct-live { order: 1; }
.acct-live:empty { display: none; }
.acct-live > :last-child { margin-bottom: 0 !important; }
.acct-o-stamps { order: 2; }
.acct-o-trail { order: 3; }
.acct-o-quest { order: 4; }
.acct-o-share { order: 5; }
.acct-o-letters { order: 6; }

/* ----------------------------------------------------------- stamp card */
.acct-stamps {
  position: relative; padding: 1.4rem; border-radius: 24px; color: #3c2a21;
  background:
    radial-gradient(circle at 12% 18%, rgba(255,255,255,0.35), transparent 40%),
    repeating-linear-gradient(45deg, rgba(60,42,33,0.025) 0 2px, transparent 2px 6px),
    #efd9ad;
  border: 2px dashed rgba(60,42,33,0.25); box-shadow: 0 12px 30px rgba(60,42,33,0.12);
}
.acct-stamps-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.1rem; }
.acct-stamps .acct-kicker { color: #7a5a17; }
.acct-stamps-count { font-family: var(--font-heading); font-size: 2.2rem; line-height: 1; color: #3c2a21; }
.acct-stamps-count small { font-size: 1rem; opacity: 0.6; }
.acct-stamp-row { list-style: none; padding: 0; margin: 0 0 1rem; display: grid; grid-template-columns: repeat(6, 1fr); gap: 0.45rem; }
.acct-stamp {
  aspect-ratio: 1; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  border: 2px dashed rgba(60,42,33,0.35); color: rgba(60,42,33,0.45); font-weight: 800; font-size: 0.9rem;
  background: rgba(255,255,255,0.35);
}
.acct-stamp.is-gift { border-style: solid; border-color: #d4af37; background: rgba(255,255,255,0.6); font-size: 1.1rem; }
.acct-stamp.is-filled {
  border: 3px double #a03027; background: radial-gradient(circle, #fff8ea 55%, #fbe3c4 100%); color: #a03027; font-size: 1.25rem;
  box-shadow: inset 0 0 0 2px rgba(160,48,39,0.15); animation: acctStamp .5s cubic-bezier(.2,1.6,.4,1) both;
}
.acct-stamp.is-next { border-color: #3c2a21; border-style: solid; animation: acctPulse 1.8s ease-in-out infinite; }
@keyframes acctStamp { from { transform: scale(1.8) rotate(0); opacity: 0; } }
@keyframes acctPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(60,42,33,0.35); } 50% { box-shadow: 0 0 0 7px rgba(60,42,33,0); } }
.acct-stamps-line { font-size: 0.92rem; line-height: 1.6; margin: 0 0 1rem; }
.acct-stamps .acct-btn { width: 100%; }

/* ----------------------------------------------------------------- trail */
.acct-trail { background: #fff; border-radius: 28px; padding: 1.4rem; border: 1px solid #efe6d8; box-shadow: 0 10px 30px rgba(60,42,33,0.07); }
.acct-trail-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; }
.acct-trail-count { flex-shrink: 0; font-size: 0.78rem; font-weight: 800; color: #8a6d1f; background: #fdf1d6; padding: 0.3rem 0.7rem; border-radius: 999px; }
.acct-trail-path {
  list-style: none; padding: 0.25rem 0.25rem 0.75rem; margin: 0 -0.25rem 1rem; display: flex; gap: 0.4rem;
  overflow-x: auto; scroll-snap-type: x proximity; position: relative;
}
.acct-trail-li { flex: 1 0 84px; scroll-snap-align: start; position: relative; }
.acct-trail-li:not(:last-child)::after {
  content: ''; position: absolute; top: 27px; left: calc(50% + 28px); right: calc(-50% + 28px);
  border-top: 3px dotted #e3d6bf;
}
.acct-node {
  width: 100%; background: none; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 0.35rem;
  font-family: var(--font-body); padding: 0; color: #3c2a21;
}
.acct-node-dot {
  width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;
  background: #f5efe4; border: 2px solid #eadfcd; transition: transform .2s, box-shadow .2s; filter: grayscale(0.4);
}
.acct-node.is-done .acct-node-dot { background: linear-gradient(135deg, #ffd166, #d4af37); border-color: #d4af37; color: #3c2a21; font-weight: 900; filter: none; }
.acct-node.is-next .acct-node-dot { background: #3c2a21; border-color: #3c2a21; filter: none; animation: acctPulse 1.8s ease-in-out infinite; }
.acct-node.is-shown .acct-node-dot { transform: scale(1.1); box-shadow: 0 0 0 4px #fdfaf3, 0 0 0 6px #d4af37; }
.acct-node-label { font-size: 0.75rem; font-weight: 700; line-height: 1.25; text-align: center; min-height: 2.5em; }
.acct-node-tag { font-size: 0.68rem; font-weight: 800; letter-spacing: 0.04em; color: #8a6d1f; }
.acct-node-tag.is-next { color: #fdfaf3; background: #e2792a; padding: 0.1rem 0.5rem; border-radius: 999px; }

.acct-spot { display: grid; grid-template-columns: 1fr; border-radius: 22px; overflow: hidden; background: #3c2a21; color: #fdfaf3; animation: acctFade .45s ease both; }
.acct-spot-img { position: relative; height: 180px; }
.acct-spot-body { padding: 1.25rem 1.3rem 1.4rem; }
.acct-spot-emoji { font-size: 1.6rem; margin: 0 0 0.2rem; }
.acct-spot-title { font-family: var(--font-heading); font-size: 1.3rem; line-height: 1.2; margin: 0 0 0.5rem; }
.acct-spot-pitch { color: rgba(253,250,243,0.85); line-height: 1.65; font-size: 0.95rem; margin: 0 0 1.1rem; }
.acct-spot .acct-btn { width: 100%; }
@keyframes acctFade { from { opacity: 0; transform: translateY(8px); } }

/* ------------------------------------------------------------- quest */
.acct-quest-head { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; }
.acct-quest-ring {
  flex-shrink: 0; width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  background: conic-gradient(#d4af37 var(--p), #f1e9da 0);
}
.acct-quest-ring span {
  width: 50px; height: 50px; border-radius: 50%; background: #fff; display: flex; align-items: center; justify-content: center;
  font-weight: 900; font-size: 0.85rem; color: #3c2a21;
}
.acct-quest-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.5rem; }
.acct-quest-list button {
  width: 100%; min-height: 48px; display: flex; align-items: center; gap: 0.7rem; padding: 0.65rem 0.9rem; border-radius: 14px;
  background: #fdf7ee; border: 1px solid #f1e4cc; cursor: pointer; font-family: var(--font-body); font-size: 0.92rem;
  font-weight: 700; color: #3c2a21; text-align: left;
}
.acct-quest-list button.is-done { background: #f3faf5; border-color: #d5ecdd; color: #2f5a3d; font-weight: 600; }
.acct-quest-list button:hover { border-color: #d4af37; }
.acct-quest-go { margin-left: auto; font-size: 0.78rem; color: #a6832b; font-weight: 800; }
.acct-quest-list button.is-done .acct-quest-go { color: #6b8d77; }

/* ------------------------------------------------------------- share */
.acct-share { background: linear-gradient(135deg, #fffaf0 0%, #fdeed2 100%); }
.acct-share-row { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
.acct-share-row .acct-btn { flex: 1 1 150px; }
.acct-letters {
  display: flex; gap: 0.75rem; align-items: center; padding: 0.9rem 1.1rem; border-radius: 18px;
  border: 1px dashed rgba(166,131,43,0.5); color: #594a42; font-size: 0.88rem; line-height: 1.5; text-decoration: none;
}
.acct-letters:hover { background: #fdf7ee; }

/* ---------------------------------------------------- orders + perfil */
.acct-panel-narrow { max-width: 760px; margin: 0 auto; min-width: 0; }
.acct-folds { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0.9rem; }
.acct-folds > div { min-width: 0; }
.acct-orders ul { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.75rem; }
.acct-order {
  display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; background: #fff; border: 1px solid #efe6d8;
  border-radius: 20px; padding: 1rem 1.1rem; box-shadow: 0 6px 18px rgba(60,42,33,0.05);
}
.acct-order-date {
  width: 58px; flex-shrink: 0; border-radius: 14px; overflow: hidden; text-align: center; background: #fdfaf3; border: 1px solid rgba(212,175,55,0.45);
}
.acct-order-date span { display: block; background: #d4af37; color: #3c2a21; font-size: 0.68rem; font-weight: 900; letter-spacing: 0.12em; padding: 0.15rem 0; }
.acct-order-date strong { display: block; font-family: var(--font-heading); font-size: 1.4rem; color: #3c2a21; padding: 0.15rem 0 0.25rem; }
.acct-order-body { flex: 1 1 180px; min-width: 0; }
.acct-order-kind { margin: 0; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #a6832b; }
.acct-order-summary { margin: 0.15rem 0 0.4rem; font-weight: 700; color: #3c2a21; line-height: 1.35; }
.acct-order-meta { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; font-size: 0.88rem; color: #594a42; }
.acct-order-again {
  margin-left: auto; font-weight: 800; font-size: 0.85rem; color: #3c2a21; background: #fdf1d6; border: 1px solid rgba(212,175,55,0.5);
  border-radius: 999px; padding: 0.55rem 1rem; text-decoration: none; min-height: 44px; display: inline-flex; align-items: center;
}
.acct-empty { text-align: center; padding: 2.5rem 1.25rem; background: #fff; border-radius: 28px; border: 1px dashed #e3d6bf; }
.acct-empty-emoji { font-size: 3rem; margin: 0 0 0.5rem; }
.acct-empty .acct-btn { margin-top: 1.25rem; }

.acct-perfil-head { margin-bottom: 1.25rem; }
.acct-bar { height: 8px; border-radius: 999px; background: #efe6d8; overflow: hidden; margin-top: 0.9rem; }
.acct-bar div { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #ffd166, #d4af37); transition: width .5s; }
.acct-save { width: 100%; margin-top: 1.5rem; }
.acct-dirty {
  position: fixed; left: 50%; bottom: 1.25rem; transform: translateX(-50%); z-index: 60; display: flex; align-items: center; gap: 1rem;
  padding: 0.6rem 0.6rem 0.6rem 1.25rem; background: #3c2a21; color: #fdfaf3; border-radius: 999px; box-shadow: 0 12px 32px rgba(0,0,0,0.3);
  max-width: calc(100vw - 2rem); font-size: 0.9rem; font-weight: 600; white-space: nowrap;
}
.acct-dirty button { background: #d4af37; color: #3c2a21; border: none; border-radius: 999px; padding: 0.6rem 1.2rem; min-height: 44px; font-weight: 800; font-size: 0.88rem; cursor: pointer; }
.acct-account { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px dashed #e3d6bf; color: #7a6a61; font-size: 0.88rem; line-height: 1.75; }
.acct-account p { margin: 0 0 0.6rem; }
.acct-account a { color: #8a6d1f; font-weight: 700; }
.acct-signout { margin-top: 0.5rem; background: none; border: 1px solid #d9cfc2; border-radius: 999px; padding: 0.6rem 1.3rem; min-height: 44px; color: #594a42; font-size: 0.9rem; font-weight: 700; cursor: pointer; }

/* =============================================================== wider */
@media (min-width: 640px) {
  .acct-hero-actions { flex-direction: row; justify-content: center; max-width: none; }
  .acct-float-1 { width: 120px; height: 160px; left: 4%; top: 2rem; }
  .acct-float-2 { width: 110px; height: 110px; right: 5%; top: 2.5rem; }
  .acct-spot { grid-template-columns: 240px 1fr; }
  .acct-spot-img { height: auto; min-height: 240px; }
  .acct-spot .acct-btn { width: auto; }
}

@media (min-width: 1024px) {
  .acct-hero {
    max-width: 1320px; margin: 1.25rem auto 0; border-radius: 36px; padding: 4rem 2rem 5rem;
  }
  .acct-hero-inner { max-width: 700px; }
  .acct-avatar { width: 128px; height: 128px; }
  .acct-float-1 { width: 170px; height: 228px; left: 5%; top: 3rem; }
  .acct-float-2 { width: 150px; height: 150px; right: 6%; top: 2.5rem; }
  .acct-float-3 { display: block; width: 150px; height: 200px; right: 12%; bottom: 2.5rem; --r: -6deg; transform: rotate(var(--r)); animation-delay: -4s; }
  .acct-wrap { padding: 0 1.5rem; }

  .acct-home { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); gap: 1.75rem; align-items: start; }
  .acct-col-main, .acct-col-side { display: flex; flex-direction: column; gap: 1.5rem; }
  .acct-trail { padding: 1.75rem; }
  .acct-trail-path { overflow: visible; }
}
`;
