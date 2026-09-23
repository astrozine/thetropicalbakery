'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import { RetreatRoom, quoteRetreatPackage, IMMERSION_FEE_PER_GUEST_PER_NIGHT } from '@/lib/retreatPricing';

const DEFAULT_ROOMS: RetreatRoom[] = [
  { id: 'penthouse', name: 'Cobertura (Penthouse)', airbnb_nightly_rate: 0, max_guests: 6 },
  { id: 'big_suite', name: 'Suíte Master', airbnb_nightly_rate: 0, max_guests: 3 },
  { id: 'small_suite', name: 'Suíte Standard', airbnb_nightly_rate: 0, max_guests: 2 },
];

const chipStyle = (on: boolean): React.CSSProperties => ({
  padding: '0.55rem 1.1rem',
  borderRadius: '20px',
  border: '1px solid',
  borderColor: on ? '#d4af37' : 'rgba(255,255,255,0.25)',
  background: on ? 'rgba(212,175,55,0.2)' : 'transparent',
  color: on ? '#fdfaf3' : 'rgba(253,250,243,0.75)',
  fontWeight: on ? 700 : 500,
  fontSize: '0.9rem',
  cursor: 'pointer',
});

interface Props {
  whatsappNumber: string;
}

export default function RetreatPricingCalculator({ whatsappNumber }: Props) {
  const [rooms, setRooms] = useState<RetreatRoom[]>(DEFAULT_ROOMS);
  const [roomId, setRoomId] = useState('penthouse');
  const [nights, setNights] = useState(3);
  const [guests, setGuests] = useState(2);

  useEffect(() => {
    supabase
      .from('retreat_rooms')
      .select('id, name, airbnb_nightly_rate, max_guests')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setRooms(data.map(r => ({
            id: r.id,
            name: r.name,
            airbnb_nightly_rate: r.airbnb_nightly_rate || 0,
            max_guests: r.max_guests || 2,
          })));
        }
      });
  }, []);

  const room = rooms.find(r => r.id === roomId) || rooms[0];
  const cappedGuests = Math.min(guests, room.max_guests);
  const quote = quoteRetreatPackage(room, nights, cappedGuests);

  const message = encodeURIComponent(
    `Olá! Tenho interesse no Pacote de Retiro:\n` +
    `- Suíte: ${room.name}\n` +
    `- Noites: ${nights}\n` +
    `- Pessoas: ${cappedGuests}\n` +
    `- Estimativa: ${formatBRL(quote.total)}\n` +
    `Podem me confirmar disponibilidade?`
  );

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(212,175,55,0.35)', borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', backdropFilter: 'blur(6px)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', color: '#fdfaf3', marginBottom: '0.5rem', textAlign: 'center' }}>
        Monte Seu Pacote
      </h3>
      <p style={{ color: 'rgba(253,250,243,0.7)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem', lineHeight: 1.7 }}>
        A diária da suíte é a mesma do Airbnb — o que muda é a imersão Tropical Bakery
        (workshop de confeitaria, refeições e atividades) somada por pessoa, por noite.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
            Suíte
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {rooms.map(r => (
              <button key={r.id} type="button" onClick={() => setRoomId(r.id)} style={chipStyle(roomId === r.id)}>
                {r.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
              Noites
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[2, 3, 4, 5, 7].map(n => (
                <button key={n} type="button" onClick={() => setNights(n)} style={chipStyle(nights === n)}>{n}</button>
              ))}
            </div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#d4af37', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.6rem' }}>
              Pessoas (máx. {room.max_guests})
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {Array.from({ length: room.max_guests }, (_, i) => i + 1).map(g => (
                <button key={g} type="button" onClick={() => setGuests(g)} style={chipStyle(cappedGuests === g)}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(253,250,243,0.85)', fontSize: '0.92rem', marginBottom: '0.6rem' }}>
          <span>Suíte ({nights} noites)</span>
          <span>{formatBRL(quote.roomSubtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(253,250,243,0.85)', fontSize: '0.92rem', marginBottom: '0.9rem' }}>
          <span>Imersão Tropical Bakery ({cappedGuests}p × {nights}n × {formatBRL(IMMERSION_FEE_PER_GUEST_PER_NIGHT)})</span>
          <span>{formatBRL(quote.immersionSubtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '0.9rem', color: '#fdfaf3', fontWeight: 800, fontSize: '1.3rem' }}>
          <span>Total</span>
          <span>{formatBRL(quote.total)}</span>
        </div>
      </div>

      <a
        href={`https://wa.me/${whatsappNumber}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-secondary"
        style={{ width: '100%', textAlign: 'center', display: 'block', padding: '1rem', fontSize: '1.05rem' }}
      >
        Confirmar Pelo WhatsApp
      </a>

      {room.airbnb_nightly_rate === 0 && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(253,250,243,0.5)', marginTop: '1rem', textAlign: 'center' }}>
          Diária de referência ainda não cadastrada para esta suíte — confirme o valor exato pelo WhatsApp.
        </p>
      )}
    </div>
  );
}
