'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import RoomPhotoManager from './RoomPhotoManager';

interface RetreatRoom {
  id: string;
  name: string;
  image_url: string;
  airbnb_nightly_rate: number;
  max_guests: number;
  gallery: string[] | null;
  gallery_library?: string[] | null;
}

export default function AdminRetreatsPage() {
  const [rooms, setRooms] = useState<RetreatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // track saving state by room id
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('retreat_rooms')
      .select('*')
      .order('id');
    
    if (error) {
      console.error('Error fetching rooms:', error);
      setMessage({ type: 'error', text: `Erro ao carregar: ${error.message}` });
    } else {
      setRooms(data || []);
    }
    setLoading(false);
  };

  const notify = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), type === 'error' ? 6000 : 3500);
  };

  const handleUpdatePricing = async (roomId: string, nightlyRate: number, maxGuests: number) => {
    setSaving(roomId);
    setMessage(null);

    const { error } = await supabase
      .from('retreat_rooms')
      .update({ airbnb_nightly_rate: nightlyRate, max_guests: maxGuests, updated_at: new Date().toISOString() })
      .eq('id', roomId);

    if (error) {
      console.error('Error updating pricing:', error);
      setMessage({ type: 'error', text: `Erro ao atualizar o preço de ${roomId}` });
    } else {
      setMessage({ type: 'success', text: 'Preço atualizado com sucesso!' });
      setRooms(rooms.map(r => r.id === roomId ? { ...r, airbnb_nightly_rate: nightlyRate, max_guests: maxGuests } : r));
    }

    setSaving(null);
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return <div className="p-8 text-center text-[#594a42]">Carregando suítes...</div>;
  }

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto', color: '#3c2a21' }}>
      <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', marginBottom: '1rem', color: '#d4af37' }}>
        Gerenciar Imagens dos Retiros
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#594a42', marginBottom: '2rem' }}>
        Escolha quais fotos de cada quarto aparecem na página de Retiros, qual é a foto principal e em que ordem elas vêm.
      </p>

      {message && (
        <div style={{
          position: 'sticky', top: '1rem', zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', fontWeight: 700,
          padding: '1rem',
          borderRadius: '8px',
          marginBottom: '2rem',
          background: message.type === 'success' ? '#e8f5e9' : '#ffebee',
          color: message.type === 'success' ? '#2e7d32' : '#c62828',
          border: `1px solid ${message.type === 'success' ? '#a5d6a7' : '#ef9a9a'}`
        }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem' }}>
        {rooms.map((room) => (
          <div key={room.id} className="liquid-glass-card" style={{ padding: 'clamp(1.25rem, 3vw, 2rem)', display: 'grid', gap: '1.75rem' }}>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={room.image_url}
                alt={room.name}
                style={{ width: '120px', height: '90px', objectFit: 'cover', borderRadius: '10px', border: '1px solid rgba(212,175,55,0.4)' }}
                onError={(e) => { (e.target as HTMLImageElement).src = '/retreats/Room with open ripada door.jpg'; }}
              />
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#3c2a21', margin: 0 }}>
                {room.name}
              </h3>
            </div>

            <RoomPhotoManager
              room={room}
              notify={notify}
              onSaved={patch => setRooms(rs => rs.map(r => r.id === room.id ? { ...r, ...patch } : r))}
            />

            <div style={{ borderTop: '1px solid rgba(212,175,55,0.3)', paddingTop: '1.25rem' }}>
              <strong style={{ display: 'block', color: '#3c2a21', marginBottom: '0.75rem' }}>Preço e capacidade</strong>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: '1 1 160px', maxWidth: '220px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#594a42', marginBottom: '0.5rem' }}>
                    Diária no Airbnb (R$):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={room.airbnb_nightly_rate}
                    id={`rate-${room.id}`}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.4)', background: 'white', fontSize: '1rem', color: '#594a42' }}
                  />
                </div>
                <div style={{ flex: '1 1 140px', maxWidth: '180px' }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#594a42', marginBottom: '0.5rem' }}>
                    Máx. hóspedes:
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    defaultValue={room.max_guests}
                    id={`guests-${room.id}`}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.4)', background: 'white', fontSize: '1rem', color: '#594a42' }}
                  />
                </div>
                <button
                  onClick={() => {
                    const rateInput = document.getElementById(`rate-${room.id}`) as HTMLInputElement;
                    const guestsInput = document.getElementById(`guests-${room.id}`) as HTMLInputElement;
                    handleUpdatePricing(room.id, Number(rateInput.value) || 0, Number(guestsInput.value) || 1);
                  }}
                  disabled={saving === room.id}
                  className="btn btn-secondary"
                  style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                >
                  {saving === room.id ? 'Salvando...' : 'Salvar Preço'}
                </button>
              </div>
            </div>

          </div>
        ))}

        {rooms.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#594a42' }}>
            Nenhuma suíte encontrada. Por favor, execute o script SQL no Supabase.
          </div>
        )}
      </div>
    </div>
  );
}
