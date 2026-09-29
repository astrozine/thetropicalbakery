'use client';

import React, { useState } from 'react';

/**
 * The one-tap "is this on the website?" switch on each card of an admin catalogue (treats, courses).
 * Dolly uses it to keep something she is still working on off the site without deleting it or opening
 * the edit form. It only flips the flag the public pages already read (`treats.is_available`,
 * `courses.is_active`); the caller does the write and reports failure by throwing.
 */
export default function ShowOnSiteSwitch({ shown, onChange, what = 'item' }: {
  shown: boolean;
  onChange: (next: boolean) => Promise<void>;
  /** For the screen-reader label: "doce", "curso"… */
  what?: string;
}) {
  const [busy, setBusy] = useState(false);

  const flip = async () => {
    if (busy) return;
    setBusy(true);
    try { await onChange(!shown); } finally { setBusy(false); }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={shown}
      aria-label={shown ? `Esconder este ${what} do site` : `Mostrar este ${what} no site`}
      title={shown ? 'Toque para esconder do site (fica guardado aqui)' : 'Toque para mostrar no site'}
      onClick={flip}
      disabled={busy}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', minHeight: '44px',
        padding: '0.45rem 0.75rem', borderRadius: '10px', cursor: busy ? 'wait' : 'pointer', textAlign: 'left',
        fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.25,
        border: `1px solid ${shown ? '#b9e4c9' : '#f3d19c'}`,
        background: shown ? '#effaf3' : '#fff7e8',
        color: shown ? '#1e7a46' : '#9a5b00',
        opacity: busy ? 0.7 : 1,
      }}
    >
      <span aria-hidden style={{
        position: 'relative', flex: 'none', width: '38px', height: '22px', borderRadius: '999px',
        background: shown ? '#27ae60' : '#d5d9de', transition: 'background .15s',
      }}>
        <span style={{
          position: 'absolute', top: '3px', left: shown ? '19px' : '3px', width: '16px', height: '16px',
          borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left .15s',
        }} />
      </span>
      <span>
        {shown ? '👁 Aparecendo no site' : '🙈 Escondido · em preparo'}
        <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 500, opacity: 0.8 }}>
          {busy ? 'Salvando…' : shown ? 'Toque para esconder' : 'Só você vê. Toque para mostrar'}
        </span>
      </span>
    </button>
  );
}
