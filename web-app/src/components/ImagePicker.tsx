'use client';

import React from 'react';

interface ImagePickerProps {
  label: string;
  imageUrl?: string;
  uploading?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * A clearly clickable "add a photo" area instead of the browser's bare
 * "Choose File / No file chosen" input. The whole card is the button.
 */
export default function ImagePicker({ label, imageUrl, uploading, onChange }: ImagePickerProps) {
  return (
    <div>
      <span style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>{label}</span>
      <label
        style={{
          display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.85rem 1.1rem', maxWidth: '460px',
          border: '2px dashed #d4af37', borderRadius: '14px', background: 'rgba(212,175,55,0.07)',
          cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
        ) : (
          <span aria-hidden style={{ width: '72px', height: '72px', borderRadius: '10px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0 }}>📷</span>
        )}
        <span>
          <strong style={{ display: 'block', color: '#8a6d1f', fontSize: '1rem' }}>
            {uploading ? 'Enviando a foto…' : imageUrl ? 'Trocar a foto' : 'Clique aqui para escolher uma foto'}
          </strong>
          <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
            {uploading ? 'Aguarde um instante' : imageUrl ? 'A foto atual aparece ao lado' : 'Do computador ou do celular (JPG, PNG)'}
          </span>
        </span>
        <input type="file" accept="image/*" onChange={onChange} disabled={uploading} style={{ display: 'none' }} />
      </label>
    </div>
  );
}
