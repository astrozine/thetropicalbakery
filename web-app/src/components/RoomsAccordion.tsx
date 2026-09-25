'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RETREAT_ROOMS, RetreatRoomInfo } from '@/lib/retreatRooms';
import { optimizedSrc } from '@/lib/thumbs';

interface Props {
  onInquire: (roomName: string) => void;
}

function Gallery({ photos, alt }: { photos: string[]; alt: string }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI(cur => (cur + d + photos.length) % photos.length);

  return (
    <div>
      {/* Main viewer: the photo is never cropped — it sits "contained" over a blurred copy of itself */}
      <div style={{ position: 'relative', height: 'clamp(300px, 46vw, 540px)', borderRadius: '16px', overflow: 'hidden', background: '#2a1d16' }}>
        <div style={{ position: 'absolute', inset: '-20px', backgroundImage: `url("${photos[i]}")`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(28px) brightness(0.55)' }} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photos[i]}
          src={optimizedSrc(photos[i], 1080)}
          alt={`${alt} — foto ${i + 1}`}
          loading="lazy"
          style={{ position: 'relative', width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />
        {photos.length > 1 && (
          <>
            {(['prev', 'next'] as const).map(dir => (
              <button
                key={dir}
                type="button"
                aria-label={dir === 'prev' ? 'Foto anterior' : 'Próxima foto'}
                onClick={() => go(dir === 'prev' ? -1 : 1)}
                style={{ position: 'absolute', top: '50%', [dir === 'prev' ? 'left' : 'right']: '12px', transform: 'translateY(-50%)', width: '42px', height: '42px', borderRadius: '50%', border: 'none', background: 'rgba(253,250,243,0.92)', color: '#3c2a21', fontSize: '1.2rem', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
              >
                {dir === 'prev' ? '‹' : '›'}
              </button>
            ))}
            <span style={{ position: 'absolute', bottom: '12px', right: '14px', background: 'rgba(60,42,33,0.75)', color: '#fdfaf3', fontSize: '0.75rem', padding: '0.25rem 0.7rem', borderRadius: '20px' }}>
              {i + 1} / {photos.length}
            </span>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingTop: '10px', paddingBottom: '4px' }}>
          {photos.map((src, n) => (
            <button
              key={src}
              type="button"
              onClick={() => setI(n)}
              aria-label={`Ver foto ${n + 1}`}
              style={{ flex: '0 0 auto', width: '84px', height: '64px', borderRadius: '8px', overflow: 'hidden', padding: 0, cursor: 'pointer', border: n === i ? '2px solid #d4af37' : '2px solid transparent', opacity: n === i ? 1 : 0.65 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedSrc(src, 384)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoomsAccordion({ onInquire }: Props) {
  const [rooms, setRooms] = useState<RetreatRoomInfo[]>(RETREAT_ROOMS);
  const [openId, setOpenId] = useState<string | null>('house');

  // Photos added in /admin/retreats replace the defaults for that room.
  useEffect(() => {
    supabase
      .from('retreat_rooms')
      .select('id, gallery')
      .then(({ data, error }) => {
        if (error || !data) return;
        setRooms(prev => prev.map(r => {
          const row = data.find(d => d.id === r.dbId);
          return row?.gallery?.length ? { ...r, photos: row.gallery } : r;
        }));
      });
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
      {rooms.map(room => {
        const open = openId === room.id;
        return (
          <div key={room.id} style={{ background: '#fff', border: open ? '1px solid #d4af37' : '1px solid #e8e1d7', borderRadius: '20px', overflow: 'hidden', boxShadow: open ? '0 16px 40px rgba(60,42,33,0.12)' : '0 4px 14px rgba(60,42,33,0.05)', transition: 'box-shadow 0.3s, border-color 0.3s' }}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : room.id)}
              aria-expanded={open}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem 1.25rem', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={optimizedSrc(room.photos[0], 256)} alt="" loading="lazy" decoding="async" style={{ width: '104px', height: '78px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'inline-block', background: 'rgba(212,175,55,0.16)', color: '#8a6d1f', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0.2rem 0.65rem', borderRadius: '20px', marginBottom: '0.4rem' }}>
                  {room.capacity}
                </span>
                <h3 style={{ fontSize: 'clamp(1.05rem, 2.4vw, 1.4rem)', color: '#3c2a21', margin: 0, lineHeight: 1.2 }}>{room.name}</h3>
                <p style={{ color: '#7a6a61', fontSize: '0.9rem', margin: '0.3rem 0 0', lineHeight: 1.5 }}>{room.tagline}</p>
              </div>
              <span aria-hidden style={{ flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', background: open ? '#d4af37' : '#f5efe2', color: open ? '#fff' : '#3c2a21', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s' }}>+</span>
            </button>

            {open && (
              <div style={{ padding: '0.25rem 1.25rem 1.5rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', alignItems: 'start' }}>
                <Gallery photos={room.photos} alt={room.name} />
                <div>
                  <p style={{ color: '#594a42', lineHeight: 1.85, marginBottom: '1.25rem' }}>{room.description}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.25rem' }}>
                    {room.highlights.map(h => (
                      <li key={h} style={{ display: 'flex', gap: '0.6rem', color: '#3c2a21', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                        <span style={{ color: '#d4af37' }}>✦</span>{h}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.5rem' }}>
                    {room.amenities.map(a => (
                      <span key={a} style={{ background: '#f5efe2', color: '#594a42', fontSize: '0.78rem', padding: '0.3rem 0.75rem', borderRadius: '20px' }}>{a}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => onInquire(room.name)} className="btn btn-primary" style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem' }}>
                      Montar meu pacote
                    </button>
                    <a href={room.airbnbUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.85rem 1.6rem', fontSize: '0.95rem' }}>
                      Ver no Airbnb
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
