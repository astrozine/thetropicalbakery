'use client';

import React, { useState } from 'react';

export interface AddressValue {
  address_postal_code: string;
  address_street: string;
  address_number: string;
  address_complement: string;
  address_neighborhood: string;
  address_city: string;
  address_reference: string;
}

export const EMPTY_ADDRESS: AddressValue = {
  address_postal_code: '',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_reference: '',
};

/** Assembles the separate fields into the one-line form used in WhatsApp messages. */
export function addressToOneLine(a: AddressValue): string {
  const streetAndNumber = [a.address_street, a.address_number].filter(Boolean).join(' ');
  return [
    streetAndNumber,
    a.address_complement,
    a.address_neighborhood,
    a.address_city,
    a.address_postal_code,
  ].map(s => (s || '').trim()).filter(Boolean).join(', ');
}

export const formatCEP = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--color-primary)',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.85rem 1rem',
  border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px',
  background: 'rgba(255,255,255,0.85)',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  outline: 'none',
};

interface AddressFieldsProps {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  /** Marks street, number and neighbourhood as required. */
  required?: boolean;
}

/**
 * A Brazilian delivery address, CEP first.
 *
 * Typing a CEP fills in the street, neighbourhood and city from ViaCEP, so on a
 * phone most people only type their CEP and house number. Everything stays
 * editable, and the lookup failing is never blocking — Itamambuca has plenty of
 * addresses the postal database has never heard of, which is exactly why the
 * reference-point field at the bottom matters.
 */
export default function AddressFields({ value, onChange, required = false }: AddressFieldsProps) {
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle');

  const set = (patch: Partial<AddressValue>) => onChange({ ...value, ...patch });

  const handleCEP = async (raw: string) => {
    const masked = formatCEP(raw);
    set({ address_postal_code: masked });

    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8) {
      setLookupState('idle');
      return;
    }

    setLookupState('loading');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data?.erro) {
        setLookupState('notfound');
        return;
      }

      // Never overwrite something the customer already typed themselves.
      onChange({
        ...value,
        address_postal_code: masked,
        address_street: value.address_street || data.logradouro || '',
        address_neighborhood: value.address_neighborhood || data.bairro || '',
        address_city: value.address_city || data.localidade || '',
      });
      setLookupState('found');
    } catch {
      setLookupState('notfound');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* On a phone this row becomes: CEP + Número side by side, then Rua full width (see globals.css). */}
      <div className="addr-row" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div className="addr-cep" style={{ flex: '0 1 180px' }}>
          <label style={labelStyle}>CEP</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="11680-000"
            value={value.address_postal_code}
            onChange={e => handleCEP(e.target.value)}
            style={inputStyle}
          />
          <p style={{ fontSize: '0.8rem', marginTop: '0.35rem', minHeight: '1rem', color: lookupState === 'notfound' ? '#b9770e' : '#7a6a61' }}>
            {lookupState === 'loading' && 'Buscando endereço...'}
            {lookupState === 'found' && '✓ Endereço encontrado'}
            {lookupState === 'notfound' && 'CEP não encontrado — preencha abaixo'}
            {lookupState === 'idle' && 'Preenchemos o resto para você'}
          </p>
        </div>

        <div className="addr-street" style={{ flex: '3 1 240px' }}>
          <label style={labelStyle}>Rua / Avenida</label>
          <input
            type="text"
            autoComplete="address-line1"
            required={required}
            placeholder="Ex: Rua das Palmeiras"
            value={value.address_street}
            onChange={e => set({ address_street: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div className="addr-num" style={{ flex: '0 1 120px' }}>
          <label style={labelStyle}>Número</label>
          <input
            type="text"
            required={required}
            placeholder="114"
            value={value.address_number}
            onChange={e => set({ address_number: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 180px' }}>
          <label style={labelStyle}>Bairro / Praia</label>
          <input
            type="text"
            required={required}
            placeholder="Ex: Praia do Itamambuca"
            value={value.address_neighborhood}
            onChange={e => set({ address_neighborhood: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: '1 1 180px' }}>
          <label style={labelStyle}>Complemento <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>(opcional)</span></label>
          <input
            type="text"
            autoComplete="address-line2"
            placeholder="Casa, apto, bloco..."
            value={value.address_complement}
            onChange={e => set({ address_complement: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ flex: '1 1 160px' }}>
          <label style={labelStyle}>Cidade</label>
          <input
            type="text"
            autoComplete="address-level2"
            placeholder="Ubatuba"
            value={value.address_city}
            onChange={e => set({ address_city: e.target.value })}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>
          Ponto de referência{' '}
          <span style={{ textTransform: 'none', fontWeight: 400, color: '#a89a90' }}>
            (ajuda muito na entrega)
          </span>
        </label>
        <input
          type="text"
          placeholder="Ex: portão de madeira depois da pousada, casa dos cachorros"
          value={value.address_reference}
          onChange={e => set({ address_reference: e.target.value })}
          style={inputStyle}
        />
      </div>
    </div>
  );
}
