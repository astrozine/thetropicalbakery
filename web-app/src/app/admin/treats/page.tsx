'use client';

import ToggleSwitch from '@/components/ToggleSwitch';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

interface Treat {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  is_available: boolean;
  min_batch_size: number;
  batch_multiplier: number;
}

export default function TreatsAdmin() {
  const [treats, setTreats] = useState<Treat[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Treat>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTreats();
  }, []);

  const fetchTreats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('treats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching treats:', error);
    else setTreats(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = e.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

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
      // Update
      const { error } = await supabase
        .from('treats')
        .update(formData)
        .eq('id', editingId);
        
      if (error) alert('Erro ao atualizar doce: ' + error.message);
    } else {
      // Insert
      const { error } = await supabase
        .from('treats')
        .insert([{
          ...formData,
          is_available: formData.is_available ?? true,
          min_batch_size: formData.min_batch_size ?? 1,
          batch_multiplier: formData.batch_multiplier ?? 1,
        }]);
        
      if (error) alert('Erro ao criar doce: ' + error.message);
    }

    setEditingId(null);
    setFormData({});
    fetchTreats();
  };

  const handleEdit = (treat: Treat) => {
    setEditingId(treat.id);
    setFormData(treat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;
    
    const { error } = await supabase
      .from('treats')
      .delete()
      .eq('id', id);
      
    if (error) alert('Erro ao deletar: ' + error.message);
    else fetchTreats();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  if (loading) return <div style={{ padding: '2rem' }}>Carregando doces...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '2rem' }}>Catálogo de Doces</h1>

      {/* Editor Form */}
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#3c2a21' }}>
          {editingId ? 'Editar Doce' : 'Adicionar Novo Doce'}
        </h2>
        
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: '1fr 1fr' }}>
          
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
            )}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Imagem</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <span style={{ fontSize: '0.8rem', color: '#7f8c8d', marginLeft: '1rem' }}>Fazendo upload...</span>}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Nome do Doce</label>
            <input 
              type="text" 
              required
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Preço Unitário (R$)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={formData.price || ''} 
              onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Descrição</label>
            <textarea 
              value={formData.description || ''} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc', minHeight: '100px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Pedido Mínimo (Unidades)</label>
            <input 
              type="number" 
              min="1"
              required
              value={formData.min_batch_size || ''} 
              onChange={e => setFormData({...formData, min_batch_size: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <small style={{ color: '#7f8c8d' }}>Ex: 10</small>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', fontSize: '0.9rem' }}>Multiplicador do Lote</label>
            <input 
              type="number" 
              min="1"
              required
              value={formData.batch_multiplier || ''} 
              onChange={e => setFormData({...formData, batch_multiplier: parseInt(e.target.value)})}
              style={{ width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <small style={{ color: '#7f8c8d' }}>Ex: 10 (se só puder pedir 10, 20, 30...)</small>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <ToggleSwitch
              checked={formData.is_available ?? true}
              onChange={v => setFormData({ ...formData, is_available: v })}
              label="Mostrar este doce no Menu"
              onText="Ativado — aparecendo no menu"
              offText="Desativado — escondido do menu"
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" style={{ padding: '0.8rem 2rem', background: '#d4af37', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {editingId ? 'Salvar Alterações' : 'Adicionar Doce'}
            </button>
            {editingId && (
              <button type="button" onClick={cancelEdit} style={{ padding: '0.8rem 2rem', background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            )}
          </div>

        </form>
      </div>

      {/* Treats List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {treats.map(treat => (
          <div key={treat.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'relative', height: '200px', background: '#f5f6fa' }}>
              {treat.image_url ? (
                <Image src={treat.image_url.startsWith('/') ? treat.image_url : treat.image_url} alt={treat.name} fill style={{ objectFit: 'cover' }} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bdc3c7' }}>Sem Foto</div>
              )}
              {!treat.is_available && (
                <div style={{ position: 'absolute', top: '10px', right: '10px', background: '#e74c3c', color: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  Esgotado
                </div>
              )}
            </div>
            
            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem', color: '#2c3e50' }}>{treat.name}</h3>
              <p style={{ color: '#d4af37', fontWeight: 'bold', fontSize: '1.2rem', margin: '0 0 1rem' }}>R$ {treat.price.toFixed(2).replace('.', ',')}</p>
              
              <div style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1.5rem', background: '#f8f9fa', padding: '0.5rem', borderRadius: '4px' }}>
                <div><strong>Min:</strong> {treat.min_batch_size} un.</div>
                <div><strong>Lote:</strong> múltiplos de {treat.batch_multiplier}</div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button 
                  onClick={() => handleEdit(treat)}
                  style={{ flex: 1, padding: '0.5rem', background: '#f1c40f', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDelete(treat.id)}
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
