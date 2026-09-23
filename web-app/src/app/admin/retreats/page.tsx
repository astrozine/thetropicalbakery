'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import ZoomableImage from '@/components/ZoomableImage';

interface RetreatRoom {
  id: string;
  name: string;
  image_url: string;
  airbnb_nightly_rate: number;
  max_guests: number;
  gallery: string[] | null;
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

  const handleUpdateImage = async (roomId: string, newImageUrl: string) => {
    setSaving(roomId);
    setMessage(null);

    const { error } = await supabase
      .from('retreat_rooms')
      .update({ image_url: newImageUrl, updated_at: new Date().toISOString() })
      .eq('id', roomId);

    if (error) {
      console.error('Error updating image:', error);
      setMessage({ type: 'error', text: `Erro ao atualizar a imagem de ${roomId}` });
    } else {
      setMessage({ type: 'success', text: 'Imagem atualizada com sucesso!' });
      // Update local state
      setRooms(rooms.map(r => r.id === roomId ? { ...r, image_url: newImageUrl } : r));
    }
    
    setSaving(null);

    // Clear message after 3 seconds
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateGallery = async (roomId: string, raw: string) => {
    const gallery = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    setSaving(roomId);
    setMessage(null);

    const { error } = await supabase
      .from('retreat_rooms')
      .update({ gallery, updated_at: new Date().toISOString() })
      .eq('id', roomId);

    if (error) {
      console.error('Error updating gallery:', error);
      setMessage({ type: 'error', text: `Erro ao salvar as fotos de ${roomId} (a migration_10 foi executada?)` });
    } else {
      setMessage({ type: 'success', text: gallery.length ? 'Galeria atualizada!' : 'Galeria vazia — voltando às fotos padrão.' });
      setRooms(rooms.map(r => r.id === roomId ? { ...r, gallery } : r));
    }

    setSaving(null);
    setTimeout(() => setMessage(null), 3000);
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
    <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', color: '#3c2a21' }}>
      <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', marginBottom: '1rem', color: '#d4af37' }}>
        Gerenciar Imagens dos Retiros
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#594a42', marginBottom: '2rem' }}>
        Cole o link (URL) da nova imagem para atualizar as fotos das suítes na página de Retiros.
      </p>

      {message && (
        <div style={{
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
          <div key={room.id} className="liquid-glass-card" style={{ padding: '2rem', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            
            <div style={{ flex: '1 1 300px' }}>
              <h3 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)', color: '#3c2a21', marginBottom: '1rem' }}>
                {room.name}
              </h3>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#594a42', marginBottom: '0.5rem' }}>
                  URL da Imagem:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="url" 
                    defaultValue={room.image_url}
                    id={`input-${room.id}`}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '4px',
                      border: '1px solid rgba(212,175,55,0.4)',
                      background: 'white',
                      fontSize: '1rem',
                      color: '#594a42'
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`input-${room.id}`) as HTMLInputElement;
                      if (input && input.value !== room.image_url) {
                        handleUpdateImage(room.id, input.value);
                      }
                    }}
                    disabled={saving === room.id}
                    className="btn btn-secondary"
                    style={{ padding: '0.75rem 1.5rem', whiteSpace: 'nowrap' }}
                  >
                    {saving === room.id ? 'Salvando...' : 'Salvar'}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 160px' }}>
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
                <div style={{ flex: '1 1 140px' }}>
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
                <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'flex-end' }}>
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
              <div style={{ marginTop: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#594a42', marginBottom: '0.5rem' }}>
                  Fotos da galeria (uma URL por linha, na ordem de exibição):
                </label>
                <textarea
                  id={`gallery-${room.id}`}
                  defaultValue={(room.gallery || []).join(String.fromCharCode(10))}
                  rows={4}
                  placeholder="Deixe vazio para usar as fotos padrão do site"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.4)', background: 'white', fontSize: '0.9rem', color: '#594a42', resize: 'vertical' }}
                />
                <button
                  onClick={() => handleUpdateGallery(room.id, (document.getElementById(`gallery-${room.id}`) as HTMLTextAreaElement).value)}
                  disabled={saving === room.id}
                  className="btn btn-secondary"
                  style={{ marginTop: '0.5rem', padding: '0.6rem 1.25rem' }}
                >
                  {saving === room.id ? 'Salvando...' : 'Salvar Galeria'}
                </button>
              </div>
            </div>

            <div style={{ width: '300px', flexShrink: 0 }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: '#594a42', marginBottom: '0.5rem' }}>
                Pré-visualização Atual:
              </label>
              <div style={{ width: '100%', height: '200px', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '8px', overflow: 'hidden' }}>
                <img 
                  src={room.image_url} 
                  alt={room.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/retreats/Room with open ripada door.jpg';
                  }}
                />
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
