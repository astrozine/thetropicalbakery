'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { registerBrandDialog, type BrandDialogRequest } from '@/lib/brandDialog';

type FormField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/** The visible name of a form field, for messages like "Preencha o campo «WhatsApp»". */
function fieldName(el: FormField): string {
  const clean = (t: string | null | undefined) => (t || '').replace(/[*:]/g, '').replace(/\s+/g, ' ').trim();
  const aria = clean(el.getAttribute('aria-label'));
  if (aria) return aria;
  const linked = el.labels && el.labels[0] ? clean(el.labels[0].textContent) : '';
  if (linked) return linked;
  // Most forms here put a plain <label> just before the input inside the same wrapper.
  const wrapper = el.parentElement;
  const near = wrapper?.querySelector('label');
  const nearText = near && !near.contains(el) ? clean(near.textContent) : '';
  if (nearText && nearText.length <= 60) return nearText;
  const ph = clean((el as HTMLInputElement).placeholder);
  if (ph && ph.length <= 40) return ph;
  return '';
}

/** A friendly Portuguese sentence for whatever the browser was about to complain about. */
function validationSentence(el: FormField): string {
  const name = fieldName(el);
  const q = name ? `«${name}»` : '';
  const v = el.validity;
  const type = (el as HTMLInputElement).type;

  if (v.customError && el.validationMessage) return el.validationMessage;
  if (v.valueMissing) {
    if (type === 'checkbox') return q ? `Marque ${q} para continuar.` : 'Marque esta opção para continuar.';
    if (type === 'radio') return q ? `Escolha uma opção em ${q} para continuar.` : 'Escolha uma opção para continuar.';
    if (el.tagName === 'SELECT') return q ? `Escolha uma opção em ${q} para continuar.` : 'Escolha uma opção para continuar.';
    if (type === 'file') return q ? `Escolha um arquivo em ${q} para continuar.` : 'Escolha um arquivo para continuar.';
    return q ? `Preencha o campo ${q} para continuar.` : 'Falta preencher este campo para continuar.';
  }
  if (v.typeMismatch) {
    if (type === 'email') return `Esse e-mail parece incompleto${q ? ` em ${q}` : ''}. Use o formato nome@email.com.`;
    if (type === 'url') return `Esse endereço parece incompleto${q ? ` em ${q}` : ''}. Comece com https://`;
    return q ? `Confira o campo ${q}: o formato não está certo.` : 'Confira este campo: o formato não está certo.';
  }
  if (v.patternMismatch) return el.title || (q ? `Confira o campo ${q}: o formato não está certo.` : 'Confira este campo: o formato não está certo.');
  if (v.tooShort) return `${q || 'Este campo'} precisa ter pelo menos ${(el as HTMLInputElement).minLength} caracteres.`;
  if (v.tooLong) return `${q || 'Este campo'} aceita no máximo ${(el as HTMLInputElement).maxLength} caracteres.`;
  if (v.rangeUnderflow) return `${q || 'Este valor'} precisa ser ${(el as HTMLInputElement).min} ou mais.`;
  if (v.rangeOverflow) return `${q || 'Este valor'} precisa ser ${(el as HTMLInputElement).max} ou menos.`;
  if (v.stepMismatch || v.badInput) return q ? `Confira o valor de ${q}.` : 'Confira este valor.';
  return q ? `Confira o campo ${q}.` : 'Confira este campo.';
}

export default function BrandDialogHost() {
  const [queue, setQueue] = useState<BrandDialogRequest[]>([]);
  const current = queue[0];
  const returnFocus = useRef<HTMLElement | null>(null);
  const focusAfter = useRef<FormField | null>(null);
  const primaryRef = useRef<HTMLButtonElement | null>(null);
  const lastFieldShownAt = useRef(0);

  const push = useCallback((req: BrandDialogRequest) => {
    setQueue(q => [...q, req]);
  }, []);

  // Let brandAlert/brandConfirm reach us from anywhere in the app.
  useEffect(() => {
    registerBrandDialog(push);
    return () => registerBrandDialog(null);
  }, [push]);

  // Replace the browser's own "Please fill out this field" bubble, on every form of the site.
  useEffect(() => {
    const onInvalid = (e: Event) => {
      const el = e.target as FormField | null;
      if (!el || !('validity' in el)) return;
      e.preventDefault(); // no native bubble
      // A submit with several missing fields fires one event per field: only speak up about the first.
      const now = Date.now();
      if (now - lastFieldShownAt.current < 400) return;
      lastFieldShownAt.current = now;
      focusAfter.current = el;
      el.classList.add('bd-flag');
      const clear = () => { el.classList.remove('bd-flag'); el.removeEventListener('input', clear); el.removeEventListener('change', clear); };
      el.addEventListener('input', clear);
      el.addEventListener('change', clear);
      push({
        kind: 'alert',
        title: 'Falta um detalhe',
        icon: '✦',
        confirmLabel: 'Entendi',
        message: validationSentence(el),
        resolve: () => {},
      });
    };
    document.addEventListener('invalid', onInvalid, true);
    return () => document.removeEventListener('invalid', onInvalid, true);
  }, [push]);

  // Remember where focus was, and give it to the button while the popup is open.
  useEffect(() => {
    if (!current) return;
    returnFocus.current = (document.activeElement as HTMLElement) || null;
    const t = window.setTimeout(() => primaryRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [current]);

  const close = useCallback((ok: boolean) => {
    if (!current) return;
    current.resolve(ok);
    setQueue(q => q.slice(1));
    const field = focusAfter.current;
    focusAfter.current = null;
    window.setTimeout(() => {
      if (field && document.contains(field)) {
        field.scrollIntoView({ block: 'center', behavior: 'smooth' });
        field.focus({ preventScroll: true });
      } else if (returnFocus.current && document.contains(returnFocus.current)) {
        returnFocus.current.focus({ preventScroll: true });
      }
    }, 40);
  }, [current]);

  useEffect(() => {
    if (!current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(false); }
      if (e.key === 'Tab') {
        // Keep Tab inside the popup.
        const box = document.getElementById('bd-card');
        const btns = box ? Array.from(box.querySelectorAll('button')) : [];
        if (!btns.length) return;
        const first = btns[0], last = btns[btns.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [current, close]);

  return (
    <>
      <style>{`
        .bd-flag { outline: 3px solid #d4af37 !important; outline-offset: 2px; border-color: #d4af37 !important; }
        .bd-overlay { position: fixed; inset: 0; z-index: 2000000; display: flex; align-items: center; justify-content: center; padding: 1.25rem;
          background: rgba(60, 42, 33, 0.55); backdrop-filter: blur(4px); animation: bd-fade 0.18s ease-out; }
        .bd-card { width: 100%; max-width: 420px; background: linear-gradient(160deg, #fffaf0 0%, #fdf1d6 100%); color: #3c2a21; border-radius: 22px;
          border: 1px solid rgba(212, 175, 55, 0.55); box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35); padding: 1.75rem 1.5rem 1.4rem; text-align: center;
          animation: bd-pop 0.24s cubic-bezier(0.2, 1.2, 0.4, 1); }
        .bd-star { width: 3.2rem; height: 3.2rem; margin: 0 auto 0.85rem; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-size: 1.6rem; background: #fdf1d6; color: #d4a017; text-shadow: 0 0 14px rgba(212, 175, 55, 0.7); box-shadow: 0 0 0 6px rgba(212, 175, 55, 0.14); }
        .bd-card h2 { font-family: var(--font-heading); font-size: 1.35rem; line-height: 1.2; margin: 0 0 0.6rem; color: #3c2a21; }
        .bd-card p { margin: 0 0 1.35rem; font-size: 1rem; line-height: 1.6; color: #594a42; white-space: pre-line; }
        .bd-actions { display: flex; gap: 0.6rem; justify-content: center; flex-wrap: wrap; }
        .bd-btn { flex: 1 1 130px; min-height: 46px; padding: 0.7rem 1.2rem; border-radius: 999px; font-weight: 700; font-size: 0.95rem; cursor: pointer; border: 2px solid transparent; }
        .bd-btn:focus-visible { outline: 3px solid #d4af37; outline-offset: 2px; }
        .bd-primary { background: #3c2a21; color: #fdfaf3; }
        .bd-primary.bd-danger { background: #a63d2f; }
        .bd-ghost { background: transparent; color: #3c2a21; border-color: rgba(60, 42, 33, 0.3); }
        @keyframes bd-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bd-pop { from { opacity: 0; transform: translateY(12px) scale(0.96); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .bd-overlay, .bd-card { animation: none; } }
      `}</style>
      {current && (
        <div className="bd-overlay" onMouseDown={e => { if (e.target === e.currentTarget && current.kind === 'alert') close(false); }}>
          <div id="bd-card" className="bd-card" role="alertdialog" aria-modal="true" aria-labelledby="bd-title" aria-describedby="bd-msg">
            <div className="bd-star" aria-hidden>{current.icon ?? (current.danger ? '🗑️' : current.kind === 'confirm' ? '❔' : '✦')}</div>
            <h2 id="bd-title">{current.title ?? (current.kind === 'confirm' ? 'Só para confirmar' : 'Um aviso')}</h2>
            <p id="bd-msg">{current.message}</p>
            <div className="bd-actions">
              {current.kind === 'confirm' && (
                <button type="button" className="bd-btn bd-ghost" onClick={() => close(false)}>{current.cancelLabel ?? 'Cancelar'}</button>
              )}
              <button type="button" ref={primaryRef} className={`bd-btn bd-primary${current.danger ? ' bd-danger' : ''}`} onClick={() => close(true)}>
                {current.confirmLabel ?? (current.kind === 'confirm' ? 'Confirmar' : 'Ok')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
