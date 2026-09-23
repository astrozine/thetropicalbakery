'use client';

import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** What is being switched, e.g. "Mostrar esta caixa no site". */
  label: string;
  /** Status text while on / off. Say what IS happening, not what the box "means". */
  onText?: string;
  offText?: string;
  helper?: string;
  id?: string;
}

/**
 * A real on/off switch for the admin. The switch itself and the words beside it
 * say the same thing: green + "Ativado" when it's on, grey + "Desativado" when
 * it's off, and the label says what the switch controls — so nobody has to guess
 * whether "Inativo" is a state or a button.
 */
export default function ToggleSwitch({
  checked, onChange, label, onText = 'Ativado', offText = 'Desativado', helper, id,
}: ToggleSwitchProps) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          style={{
            position: 'relative', width: '62px', height: '34px', borderRadius: '34px', border: 'none', padding: 0, cursor: 'pointer',
            background: checked ? '#27ae60' : '#b8bfc6', transition: 'background 0.2s', flexShrink: 0,
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)',
          }}
        >
          <span style={{
            position: 'absolute', top: '3px', left: checked ? '31px' : '3px', width: '28px', height: '28px', borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }} />
        </button>
        <div>
          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1rem' }}>{label}</div>
          <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color: checked ? '#27ae60' : '#7f8c8d' }}>
            {checked ? `● ${onText}` : `○ ${offText}`}
          </div>
        </div>
      </div>
      {helper && <p style={{ fontSize: '0.82rem', color: '#7f8c8d', marginTop: '0.5rem', lineHeight: 1.5 }}>{helper}</p>}
    </div>
  );
}
