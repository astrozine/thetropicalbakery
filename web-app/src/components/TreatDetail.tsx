'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import TreatInfo, { hasTreatInfo } from '@/components/TreatInfo';
import { RAW, isRaw, treatTypeById } from '@/lib/treatTypes';
import { optimizedSrc, type OptimizedWidth } from '@/lib/thumbs';

export interface TreatDetailItem {
  id: string;
  name: string;
  price: string;
  image: string;
  description: string;
  min_batch_size?: number;
  batch_multiplier?: number;
  emoji?: string | null;
  ingredients?: string[] | null;
  contains?: string[] | null;
  may_contain?: string[] | null;
  treat_type?: string | null;
  is_raw?: boolean | null;
}

/**
 * The whole photo, never cropped: the picture sits on a blurred, zoomed copy of itself, so a
 * portrait, square or landscape photo all fill the same frame without cutting the treat off.
 */
export function WholePhoto({ src, alt, width = 750, children, style }: {
  src: string; alt: string; width?: OptimizedWidth; children?: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: '#efe6d4', ...style }}>
      <img aria-hidden src={optimizedSrc(src, 256)} alt="" loading="lazy" decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(18px) saturate(1.1)', transform: 'scale(1.2)', opacity: 0.85 }} />
      <img src={optimizedSrc(src, width)} alt={alt} loading="lazy" decoding="async"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }} />
      {children}
    </div>
  );
}

export function TreatTags({ item, size = 'sm' }: { item: TreatDetailItem; size?: 'sm' | 'md' }) {
  const kind = treatTypeById(item.treat_type);
  const raw = isRaw(item);
  if (!kind && !raw) return null;
  const pad = size === 'md' ? '0.3rem 0.75rem' : '0.25rem 0.65rem';
  const fs = size === 'md' ? '0.78rem' : '0.75rem';
  return (
    <div style={{ position: 'absolute', left: '8px', bottom: '8px', right: '8px', display: 'flex', flexWrap: 'wrap-reverse', gap: '0.3rem', pointerEvents: 'none' }}>
      {/* Raw first and in leaf green: it's the one guests scan the page for. */}
      {raw && (
        <span title={`${RAW.label}: ${RAW.hint}`} style={{ lineHeight: 1.25, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: RAW.accent, color: '#ffffff', padding: pad, borderRadius: '20px', fontSize: fs, fontWeight: 800, letterSpacing: '0.02em', boxShadow: '0 2px 6px rgba(0,0,0,0.25)' }}>
          <span aria-hidden>{RAW.emoji}</span>{RAW.label}
        </span>
      )}
      {kind && (
        <span style={{ maxWidth: '100%', lineHeight: 1.25, display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(60,42,33,0.85)', color: '#fdfaf3', padding: pad, borderRadius: '20px', fontSize: fs, fontWeight: 700, letterSpacing: '0.02em', backdropFilter: 'blur(2px)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span aria-hidden>{kind.emoji}</span>{kind.label}
        </span>
      )}
    </div>
  );
}

interface TreatDetailProps {
  item: TreatDetailItem;
  picked?: boolean;
  onTogglePick?: () => void;
  onAdd: () => void;
  onClose: () => void;
}

/**
 * One treat, full size: the whole photo on the left and everything about it in a column on the
 * right (stacked, photo first, on a phone). Opens from a tap on any Menu de Eventos card.
 */
export default function TreatDetail({ item, picked = false, onTogglePick, onAdd, onClose }: TreatDetailProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const raw = isRaw(item);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [onClose]);

  useEffect(() => { panelRef.current?.focus(); }, []);

  return createPortal(
    <div className="treat-detail" role="dialog" aria-modal="true" aria-label={item.name}>
      <div className="treat-detail-backdrop" onClick={onClose} />
      <div className="treat-detail-panel" ref={panelRef} tabIndex={-1}>
        <button type="button" className="treat-detail-close" onClick={onClose} aria-label="Fechar">✕</button>

        <WholePhoto src={item.image} alt={item.name} width={1200} style={{ height: '100%' }}>
          <TreatTags item={item} size="md" />
        </WholePhoto>

        <div className="treat-detail-info">
          <h3 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontFamily: 'var(--font-heading)', color: 'var(--color-primary)', lineHeight: 1.2, marginBottom: '1rem', paddingRight: '2.5rem' }}>
            {item.emoji ? `${item.emoji} ` : ''}{item.name}
          </h3>

          {raw && (
            <p style={{ background: '#eef5e8', color: '#3f5e2c', borderRadius: '10px', padding: '0.6rem 0.85rem', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '1rem' }}>
              <strong>{RAW.emoji} {RAW.label}:</strong> {RAW.hint}.
            </p>
          )}

          <p style={{ color: '#594a42', fontSize: '1rem', lineHeight: 1.65, marginBottom: '1.5rem', whiteSpace: 'pre-line' }}>
            {item.description}
          </p>

          {hasTreatInfo(item) && (
            <div style={{ marginBottom: '1.5rem' }}>
              <TreatInfo ingredients={item.ingredients} contains={item.contains} may_contain={item.may_contain} showEmptyNote={false} />
            </div>
          )}

          {(item.min_batch_size && item.min_batch_size > 1) ? (
            <div style={{ fontSize: '0.9rem', color: '#7f8c8d', background: '#f8f9fa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ marginBottom: '0.5rem' }}><strong>Pedido mínimo:</strong> {item.min_batch_size} unidades</div>
              <div><strong>Tamanho do lote:</strong> múltiplos de {item.batch_multiplier}</div>
            </div>
          ) : null}

          <div className="treat-detail-actions">
            {onTogglePick && (
              <button
                type="button"
                onClick={onTogglePick}
                aria-pressed={picked}
                style={{ width: '100%', minHeight: '48px', marginBottom: '1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', fontFamily: 'inherit',
                  border: '2px solid #d4af37', background: picked ? '#d4af37' : 'rgba(212,175,55,0.08)', color: picked ? '#3c2a21' : '#8a6d1f' }}
              >
                {picked ? '✓ Na sua escolha rápida (toque para tirar)' : '+ Incluir na escolha rápida'}
              </button>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.85rem', color: '#7a6a61' }}>Preço unitário</span>
                <span style={{ fontWeight: 'bold', color: '#3c2a21', fontSize: '1.3rem' }}>R$ {item.price}</span>
              </div>
              <button
                type="button"
                onClick={onAdd}
                style={{ background: '#d4af37', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(212,175,55,0.4)', cursor: 'pointer' }}
              >
                Adicionar +
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .treat-detail { position: fixed; inset: 0; z-index: 99990; display: flex; align-items: flex-end; justify-content: center; }
        .treat-detail-backdrop { position: absolute; inset: 0; background: rgba(30,20,15,0.6); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); animation: tdFade 0.2s ease-out; }
        .treat-detail-panel { position: relative; outline: none; background: #fff; width: 100%; max-height: 94vh; overflow-y: auto; overscroll-behavior: contain;
          border-radius: 24px 24px 0 0; box-shadow: 0 -10px 40px rgba(0,0,0,0.25); animation: tdUp 0.3s ease-out;
          display: grid; grid-template-rows: min(58vh, 100vw) auto; }
        .treat-detail-info { padding: 1.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom, 0px)); }
        .treat-detail-close { position: absolute; top: 12px; right: 12px; z-index: 2; width: 40px; height: 40px; border-radius: 50%; border: none; background: rgba(255,255,255,0.92);
          color: #3c2a21; font-size: 18px; font-weight: 700; cursor: pointer; box-shadow: 0 3px 10px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; }
        /* Wide screens: a centred card, the photo as tall as the card on the left, details scrolling on the right. */
        @media (min-width: 768px) {
          .treat-detail { align-items: center; padding: 2rem; }
          .treat-detail-panel { max-width: 1080px; height: min(86vh, 720px); max-height: none; overflow: hidden; border-radius: 20px; animation: tdPop 0.25s ease-out;
            grid-template-rows: none; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); box-shadow: 0 30px 70px rgba(0,0,0,0.35); }
          .treat-detail-info { overflow-y: auto; padding: 2.25rem 2rem 0; display: flex; flex-direction: column; }
          .treat-detail-actions { margin-top: auto; position: sticky; bottom: 0; background: #fff; padding: 1rem 0 1.5rem; border-top: 1px solid rgba(0,0,0,0.06); }
        }
        @keyframes tdFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tdUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes tdPop { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>,
    document.body
  );
}
