'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';

const SECTION_ID = 'announcement';

export default function AnnouncementAdmin() {
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('site_content')
      .select('*')
      .eq('section_id', SECTION_ID)
      .maybeSingle();

    if (data) {
      setMessage(data.title || '');
      setLink(data.image_url || '');
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('site_content')
      .upsert({ section_id: SECTION_ID, title: message, image_url: link }, { onConflict: 'section_id' });

    setSaving(false);
    if (error) {
      console.error('Error saving announcement:', error);
      brandAlert('Não foi possível salvar o anúncio.');
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = async () => {
    if (!(await brandConfirm('Remover o anúncio da página inicial?', { danger: true, confirmLabel: 'Sim, remover' }))) return;
    setMessage('');
    setLink('');
    setSaving(true);
    await supabase
      .from('site_content')
      .upsert({ section_id: SECTION_ID, title: '', image_url: '' }, { onConflict: 'section_id' });
    setSaving(false);
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div style={{ maxWidth: '640px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Anúncio Especial</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Uma faixinha discreta no canto da página inicial para avisos rápidos — &ldquo;Fechado no feriado&rdquo;,
        &ldquo;Vagas abertas para o retiro de outubro&rdquo;, uma promoção do mês. Deixe a mensagem em branco
        para esconder o anúncio do site.
      </p>

      <form onSubmit={handleSave} style={{ background: 'white', padding: '1.75rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.5rem' }}>
            Mensagem do anúncio
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Ex: 🎉 Vagas abertas para o Retiro de Outubro!"
            style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #dfe4ea', fontSize: '1rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.5rem' }}>
            Link ao clicar <span style={{ fontWeight: 400, color: '#bdc3c7' }}>(opcional — ex: /assinatura)</span>
          </label>
          <input
            type="text"
            value={link}
            onChange={e => setLink(e.target.value)}
            placeholder="/assinatura"
            style={{ width: '100%', padding: '0.85rem', borderRadius: '8px', border: '1px solid #dfe4ea', fontSize: '1rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type="submit" disabled={saving} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.8rem 1.75rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {saving ? 'Salvando...' : saved ? '✓ Publicado' : 'Publicar Anúncio'}
          </button>
          <button type="button" onClick={handleClear} disabled={saving} style={{ background: 'transparent', color: '#c0392b', border: '1px solid #f5c6cb', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}>
            Remover anúncio
          </button>
        </div>
      </form>

      {message && (
        <div style={{ marginTop: '2rem' }}>
          <p style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>Pré-visualização</p>
          <div style={{ display: 'inline-block', background: '#3c2a21', color: '#fdfaf3', padding: '0.7rem 1.25rem', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 600, border: '1px solid #d4af37' }}>
            {message}
          </div>
        </div>
      )}
    </div>
  );
}
