'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface SiteContent {
  id: string;
  section_id: string;
  title: string;
  text_content: string;
  image_url: string;
}

export default function SiteContentAdmin() {
  const [contents, setContents] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<SiteContent>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_content')
      .select('*')
      .order('section_id', { ascending: true });

    if (error) console.error('Error fetching site content:', error);
    else setContents(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `site/${fileName}`;

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
        .from('site_content')
        .update(formData)
        .eq('id', editingId);
        
      if (error) alert('Erro ao atualizar conteúdo: ' + error.message);
    } else {
      const { error } = await supabase
        .from('site_content')
        .insert([formData]);
        
      if (error) alert('Erro ao criar conteúdo: ' + error.message);
    }

    setEditingId(null);
    setFormData({});
    fetchContent();
  };

  const handleEdit = (content: SiteContent) => {
    setEditingId(content.id);
    setFormData(content);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando conteúdo...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem' }}>Conteúdo do Site</h1>
      <p style={{ marginBottom: '2rem', color: '#7f8c8d' }}>
        Gerencie as imagens, títulos e textos de diferentes seções do site público.
        Para criar uma nova seção, insira um ID único (ex: <code>home-hero</code>).
      </p>

      {/* Editor Form */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#3c2a21' }}>
          {editingId ? 'Editar Seção' : 'Adicionar Nova Seção'}
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Imagem da Seção</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <span style={{ fontSize: '0.8rem', color: '#7f8c8d', marginLeft: '1rem' }}>Fazendo upload...</span>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>ID da Seção (Não mude se não souber o que é)</label>
            <input 
              type="text" 
              required
              value={formData.section_id || ''} 
              onChange={e => setFormData({...formData, section_id: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', background: editingId ? '#ecf0f1' : 'white' }}
              readOnly={!!editingId}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Título Opcional</label>
            <input 
              type="text" 
              value={formData.title || ''} 
              onChange={e => setFormData({...formData, title: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Texto Principal</label>
            <textarea 
              value={formData.text_content || ''} 
              onChange={e => setFormData({...formData, text_content: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', minHeight: '120px' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" style={{ padding: '0.8rem 2rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingId ? 'Salvar Alterações' : 'Adicionar Seção'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ padding: '0.8rem 2rem', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Content List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {contents.map(content => (
          <div key={content.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
            
            {content.image_url ? (
              <img src={content.image_url} alt={content.section_id} style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '150px', height: '150px', background: '#f5f6fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdc3c7' }}>
                Sem Imagem
              </div>
            )}
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'inline-block', background: '#3c2a21', color: 'white', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>
                ID: {content.section_id}
              </div>
              
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 0.5rem', color: '#2c3e50' }}>{content.title || 'Sem título'}</h3>
              <p style={{ color: '#7f8c8d', margin: 0, whiteSpace: 'pre-line', fontSize: '0.95rem' }}>
                {content.text_content || 'Sem texto'}
              </p>
            </div>

            <button 
              onClick={() => handleEdit(content)}
              style={{ padding: '0.6rem 1.2rem', background: '#f1c40f', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Editar
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}
