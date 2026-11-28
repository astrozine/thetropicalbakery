'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/*
 * Every sideways carousel on a phone gets a gently blinking arrow at its right edge, so nobody misses that there is
 * more to swipe (Andrew, 2026-11-28). It finds the carousels by itself (anything that scrolls sideways), so new
 * pages get it too. The arrow scrolls the carousel on a tap, and goes away at the last card.
 * Opt out with data-no-swipe-hint on the scroller. Not on the admin.
 */

const MARK = 'data-swipe-hint';

function scrollers(): HTMLElement[] {
  const out: HTMLElement[] = [];
  document.querySelectorAll<HTMLElement>('main *').forEach(el => {
    if (el.hasAttribute('data-no-swipe-hint') || el.closest('[data-no-swipe-hint]')) return;
    if (el.clientWidth < 220 || el.clientHeight < 80) return;
    if (el.scrollWidth <= el.clientWidth + 24) return;
    const ox = getComputedStyle(el).overflowX;
    if (ox === 'auto' || ox === 'scroll') out.push(el);
  });
  return out;
}

function attach(sc: HTMLElement): () => void {
  sc.setAttribute(MARK, '1');
  const host = sc.parentElement;
  if (!host) return () => {};
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'swipe-hint';
  btn.setAttribute('aria-label', 'Mais');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  host.appendChild(btn);

  const place = () => {
    const top = sc.offsetTop + sc.clientHeight / 2;
    const right = host.clientWidth - (sc.offsetLeft + sc.clientWidth) + 10;
    btn.style.top = `${top}px`;
    btn.style.right = `${Math.max(6, right)}px`;
    const atEnd = sc.scrollLeft + sc.clientWidth >= sc.scrollWidth - 12;
    btn.classList.toggle('is-hidden', atEnd);
  };
  const onClick = () => sc.scrollBy({ left: sc.clientWidth * 0.8, behavior: 'smooth' });
  btn.addEventListener('click', onClick);
  sc.addEventListener('scroll', place, { passive: true });
  window.addEventListener('resize', place);
  place();

  return () => {
    btn.removeEventListener('click', onClick);
    sc.removeEventListener('scroll', place);
    window.removeEventListener('resize', place);
    btn.remove();
    sc.removeAttribute(MARK);
  };
}

export default function SwipeHint() {
  const pathname = usePathname();
  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    const cleanups = new Map<HTMLElement, () => void>();
    const scan = () => {
      if (window.innerWidth >= 768) {
        cleanups.forEach(c => c());
        cleanups.clear();
        return;
      }
      const found = new Set(scrollers());
      found.forEach(sc => { if (!cleanups.has(sc)) cleanups.set(sc, attach(sc)); });
      cleanups.forEach((c, sc) => { if (!found.has(sc) || !sc.isConnected) { c(); cleanups.delete(sc); } });
    };
    let t: ReturnType<typeof setTimeout> | undefined;
    const later = () => { clearTimeout(t); t = setTimeout(scan, 400); };
    later();
    const mo = new MutationObserver(muts => {
      // Our own arrows going in and out don't count as page changes.
      if (muts.every(m => [...m.addedNodes, ...m.removedNodes].every(n => (n as HTMLElement).classList?.contains('swipe-hint')))) return;
      later();
    });
    const main = document.querySelector('main');
    if (main) mo.observe(main, { childList: true, subtree: true });
    window.addEventListener('resize', later);
    return () => {
      clearTimeout(t);
      mo.disconnect();
      window.removeEventListener('resize', later);
      cleanups.forEach(c => c());
    };
  }, [pathname]);
  return null;
}
