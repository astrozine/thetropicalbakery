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

// Wide screens: photo | text | plus in one row. Phones: the photo leads at full width
// (capacity badge on it), the name and the plus sit underneath, so nothing is squeezed
// into a narrow text column. Once a card is open the gallery shows the photo, so it hides.
const ROOM_CSS = `
.room-head{width:100%;display:flex;align-items:center;gap:1.25rem;padding:1rem 1.25rem;background:none;border:none;cursor:pointer;text-align:left;font:inherit}
.room-thumb{position:relative;flex:0 0 auto;width:104px;height:78px;border-radius:12px;overflow:hidden;display:block}
.room-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.room-cap,.room-count{display:none}
.room-text{flex:1;min-width:0;display:block}
.room-cap-inline{display:inline-block;background:rgba(212,175,55,0.16);color:#8a6d1f;font-size:0.8rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:0.2rem 0.65rem;border-radius:20px;margin-bottom:0.4rem}
.room-title{display:block;font-family:var(--font-heading,inherit);font-weight:700;font-size:clamp(1.05rem,2.4vw,1.4rem);color:#3c2a21;line-height:1.2}
.room-tag{display:block;color:#7a6a61;font-size:0.9rem;margin-top:0.3rem;line-height:1.5}
.room-plus{flex:0 0 auto;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.3rem;transition:transform .25s}
@media (max-width:640px){
  .room-head{display:grid;grid-template-columns:1fr auto;gap:0.85rem 0.75rem;padding:0 0 1rem;align-items:start}
  .room-thumb{grid-column:1 / -1;width:100%;height:auto;aspect-ratio:16/10;border-radius:0}
  .room-open .room-thumb{display:none}
  .room-open .room-head{padding-top:1rem}
  .room-cap{display:block;position:absolute;left:12px;bottom:12px;background:rgba(253,250,243,0.95);color:#6f5614;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:0.3rem 0.75rem;border-radius:20px;box-shadow:0 2px 8px rgba(0,0,0,0.2)}
  .room-count{display:block;position:absolute;right:12px;bottom:12px;background:rgba(60,42,33,0.75);color:#fdfaf3;font-size:0.75rem;padding:0.25rem 0.65rem;border-radius:20px}
  .room-cap-inline{display:none}
  .room-open .room-cap-inline{display:inline-block}
  .room-text{padding-left:1.1rem}
  .room-title{font-size:1.1rem}
  .room-tag{font-size:0.95rem;margin-top:0.4rem}
  .room-plus{margin-right:1.1rem;margin-top:0.1rem;width:44px;height:44px}
  .room-body{padding:0.25rem 1rem 1.25rem !important}
  .room-actions .btn{flex:1 1 100%;text-align:center;justify-content:center}
}
`;

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
      <style>{ROOM_CSS}</style>
      {rooms.map(room => {
        const open = openId === room.id;
        return (
          <div key={room.id} className={open ? 'room-card room-open' : 'room-card'} style={{ background: '#fff', border: open ? '1px solid #d4af37' : '1px solid #e8e1d7', borderRadius: '20px', overflow: 'hidden', boxShadow: open ? '0 16px 40px rgba(60,42,33,0.12)' : '0 4px 14px rgba(60,42,33,0.05)', transition: 'box-shadow 0.3s, border-color 0.3s' }}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : room.id)}
              aria-expanded={open}
              className="room-head"
            >
              <span className="room-thumb">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={optimizedSrc(room.photos[0], 750)} alt="" loading="lazy" decoding="async" />
                <span className="room-cap">{room.capacity}</span>
                <span className="room-count">{room.photos.length} fotos</span>
              </span>
              <span className="room-text">
                <span className="room-cap-inline">{room.capacity}</span>
                <span className="room-title">{room.name}</span>
                <span className="room-tag">{room.tagline}</span>
              </span>
              <span aria-hidden className="room-plus" style={{ background: open ? '#d4af37' : '#f5efe2', color: open ? '#fff' : '#3c2a21', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
            </button>

            {open && (
              <div className="room-body" style={{ padding: '0.25rem 1.25rem 1.5rem', display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', alignItems: 'start' }}>
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
                  <div className="room-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
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
