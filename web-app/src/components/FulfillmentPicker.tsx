'use client';

import React from 'react';

export type Fulfillment = 'delivery' | 'pickup';

/** Remembered between the box page and the checkout, like the chosen day. */
export const FULFILLMENT_KEY = 'checkout_fulfillment';

export const readFulfillment = (): Fulfillment | null => {
  try {
    const v = localStorage.getItem(FULFILLMENT_KEY);
    return v === 'delivery' || v === 'pickup' ? v : null;
  } catch { return null; }
};

export const saveFulfillment = (v: Fulfillment) => {
  try { localStorage.setItem(FULFILLMENT_KEY, v); } catch { /* private mode */ }
};

const OPTIONS = [
  ['delivery', '🛵', 'Receber em casa', 'Entregamos no seu endereço'],
  ['pickup', '🛍️', 'Retirar no home bakery', 'Grátis · endereço liberado na sua conta'],
] as const;

/** "Receber em casa" or "Retirar": asked before the day, so the calendar can speak the right language. */
export default function FulfillmentPicker({ value, onChange }: { value: Fulfillment; onChange: (v: Fulfillment) => void }) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
      {OPTIONS.map(([v, emoji, title, hint]) => {
        const on = value === v;
        return (
          <button
            key={v}
            type="button"
            aria-pressed={on}
            onClick={() => { saveFulfillment(v); onChange(v); }}
            style={{ flex: '1 1 200px', textAlign: 'left', padding: '0.9rem 1rem', borderRadius: '12px', cursor: 'pointer', border: `2px solid ${on ? '#d4af37' : '#e8e1d7'}`, background: on ? 'rgba(212,175,55,0.14)' : 'rgba(255,255,255,0.7)', color: '#3c2a21' }}
          >
            <span style={{ fontSize: '1.4rem' }} aria-hidden>{emoji}</span>{' '}
            <strong>{title}</strong>
            <span style={{ display: 'block', fontSize: '0.8rem', color: '#7a6a61', marginTop: '0.2rem' }}>{hint}</span>
          </button>
        );
      })}
    </div>
  );
}
