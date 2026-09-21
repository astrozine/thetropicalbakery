'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Highlight {
  id: string;
  title: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

export default function HighlightsAdmin() {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Highlight>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchHighlights();
  }, []);

  const fetchHighlights = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching highlights:', error);
    else setHighlights(data || []);
    setLoading(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, title: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `highlights/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Erro ao fazer upload da imagem.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      const { error } = await supabase
        .from('highlights')
        .update(formData)
        .eq('id', editingId);
        
      if (error) alert('Erro ao atualizar destaque: ' + error.message);
    } else {
      const { error } = await supabase
        .from('highlights')
        .insert([{
          ...formData,
          is_active: formData.is_active ?? true,
        }]);
        
      if (error) alert('Erro ao criar destaque: ' + error.message);
    }

    setEditingId(null);
    setFormData({});
    fetchHighlights();
  };

  const handleEdit = (highlight: Highlight) => {
    setEditingId(highlight.id);
    setFormData(highlight);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este destaque?')) return;
    
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id);
      
    if (error) alert('Erro ao deletar: ' + error.message);
    else fetchHighlights();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando destaques...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem' }}>Destaques Anteriores (Home)</h1>

      {/* Editor Form */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#3c2a21' }}>
          {editingId ? 'Editar Destaque' : 'Adicionar Novo Destaque'}
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Imagem da Caixa</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <span style={{ fontSize: '0.8rem', color: '#7f8c8d', marginLeft: '1rem' }}>Fazendo upload...</span>}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Título do Destaque</label>
            <input 
              type="text" 
              required
              value={formData.title || ''} 
              onChange={handleTitleChange}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="checkbox" 
              id="is_active"
              checked={formData.is_active ?? true}
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
              style={{ width: '1.2rem', height: '1.2rem' }}
            />
            <label htmlFor="is_active" style={{ fontWeight: 'bold' }}>Destaque Ativo (Visível na Home)</label>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Descrição Curta</label>
            <textarea 
              required
              value={formData.description || ''} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', minHeight: '120px' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" style={{ padding: '0.8rem 2rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingId ? 'Salvar Alterações' : 'Adicionar Destaque'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ padding: '0.8rem 2rem', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Highlights List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {highlights.map(highlight => (
          <div key={highlight.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '220px', background: '#f5f6fa' }}>
              {highlight.image_url ? (
                <img src={highlight.image_url} alt={highlight.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bdc3c7' }}>Sem Foto</div>
              )}
              {!highlight.is_active && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#e74c3c', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Inativo
                </div>
              )}
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem', color: '#2c3e50' }}>{highlight.title}</h3>
              <p style={{ color: '#7a6a61', fontSize: '0.9rem', margin: '0 0 1rem', flex: 1 }}>{highlight.description}</p>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button 
                  onClick={() => handleEdit(highlight)}
                  style={{ flex: 1, padding: '0.5rem', background: '#f1c40f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(highlight.id)}
                  style={{ flex: 1, padding: '0.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
