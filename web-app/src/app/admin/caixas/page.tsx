'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface TastingBox {
  id: string;
  title: string;
  description: string;
  image_url: string;
  batch_date_label: string;
  total_quantity: number;
  sold_quantity: number;
  price: number;
  is_active: boolean;
  items?: BoxItem[] | null;
}

import Link from 'next/link';
import ToggleSwitch from '@/components/ToggleSwitch';
import BoxItemsEditor from '@/components/BoxItemsEditor';
import { BoxItem } from '@/lib/allergens';

export default function AdminCaixas() {
  const [boxes, setBoxes] = useState<TastingBox[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [batchDateLabel, setBatchDateLabel] = useState('');
  const [totalQuantity, setTotalQuantity] = useState(30);
  const [soldQuantity, setSoldQuantity] = useState(0);
  const [price, setPrice] = useState(99);
  const [isActive, setIsActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [items, setItems] = useState<BoxItem[]>([]);

  useEffect(() => {
    fetchBoxes();
  }, []);

  const fetchBoxes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasting_boxes')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (error) console.error(error);
    else setBoxes(data || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) return;
      
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `boxes/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('uploads').getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (error) {
      alert('Error uploading image!');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setImageUrl('');
    setBatchDateLabel('');
    setTotalQuantity(30);
    setSoldQuantity(0);
    setPrice(99);
    setIsActive(false);
    setItems([]);
  };

  const handleEdit = (box: TastingBox) => {
    setEditingId(box.id);
    setTitle(box.title);
    setDescription(box.description);
    setImageUrl(box.image_url);
    setBatchDateLabel(box.batch_date_label);
    setTotalQuantity(box.total_quantity);
    setSoldQuantity(box.sold_quantity);
    setPrice(box.price);
    setIsActive(box.is_active);
    setItems(box.items || []);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If setting to active, we might want to deactivate others
    if (isActive) {
      await supabase.from('tasting_boxes').update({ is_active: false }).neq('id', editingId || '00000000-0000-0000-0000-000000000000');
    }

    // The treats build the box's description; the paragraph is just an optional intro.
    const cleanItems = items.filter(i => i.name.trim());
    const payload = {
      title,
      description: description.trim() || cleanItems.map(i => `${i.emoji} ${i.name}`).join(' · '),
      items: cleanItems,
      image_url: imageUrl,
      batch_date_label: batchDateLabel,
      total_quantity: totalQuantity,
      sold_quantity: soldQuantity,
      price,
      is_active: isActive
    };

    if (editingId) {
      const { error } = await supabase.from('tasting_boxes').update(payload).eq('id', editingId);
      if (error) alert('Erro ao atualizar: ' + error.message + (/items/.test(error.message) ? ' — Rode a migration_13_box_items.sql no Supabase primeiro.' : ''));
    } else {
      const { error } = await supabase.from('tasting_boxes').insert([payload]);
      if (error) alert('Erro ao criar: ' + error.message + (/items/.test(error.message) ? ' — Rode a migration_13_box_items.sql no Supabase primeiro.' : ''));
    }

    resetForm();
    fetchBoxes();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este lote?')) return;
    const { error } = await supabase.from('tasting_boxes').delete().eq('id', id);
    if (error) alert('Erro ao deletar: ' + error.message);
    else fetchBoxes();
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '1rem' }}>Gerenciar Caixas de Degustação</h1>
      
      <div style={{ background: '#f8f9fa', padding: '1rem 1.5rem', borderRadius: '8px', borderLeft: '4px solid #d4af37', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: '#2c3e50' }}>Gerenciar Fila de Espera</h3>
          <p style={{ margin: '0.5rem 0 0 0', color: '#7f8c8d', fontSize: '0.9rem' }}>Veja e gerencie todos que estão aguardando o próximo lote.</p>
        </div>
        <Link href="/admin/waitlist" style={{ background: '#d4af37', color: 'white', padding: '0.6rem 1.2rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
          Ver Fila de Espera
        </Link>
      </div>
      
      <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingId ? 'Editar Lote' : 'Novo Lote'}</h2>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Título</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Caixa Surpresa da Semana" style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Texto de abertura (opcional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Uma frase sobre o tema desta edição. Se ficar vazio, usamos a lista dos doces." style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#2c3e50', marginBottom: '0.25rem' }}>🍫 Doces desta caixa</h3>
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1rem', lineHeight: 1.6 }}>
              Adicione um doce de cada vez: nome, descrição, foto, ingredientes e alérgenos. O site monta tudo isso numa lista que abre e fecha,
              com o resumo de alérgenos da caixa inteira.
            </p>
            <BoxItemsEditor items={items} onChange={setItems} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Data do Lote</label>
            <input type="date" required value={batchDateLabel} onChange={e => setBatchDateLabel(e.target.value)} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Preço (R$)</label>
            <input type="number" step="0.01" required value={price} onChange={e => setPrice(Number(e.target.value))} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Quantidade Total Produzida</label>
            <input type="number" required value={totalQuantity} onChange={e => setTotalQuantity(Number(e.target.value))} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Quantidade Vendida</label>
            <input type="number" required value={soldQuantity} onChange={e => setSoldQuantity(Number(e.target.value))} style={{ width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px' }} />
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '0.2rem' }}>(Calculado automaticamente pelas compras no WhatsApp. Edite manualmente apenas se houver cancelamentos ou vendas externas)</p>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Imagem da Caixa</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              {uploading && <span> Enviando...</span>}
            </div>
            {imageUrl && <img src={imageUrl} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <ToggleSwitch
              checked={isActive}
              onChange={setIsActive}
              label="Mostrar esta caixa no site"
              onText="Ativado — aparecendo no site"
              offText="Desativado — escondida do site"
              helper="Ao ativar, as outras caixas são desativadas automaticamente."
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="submit" style={{ background: '#d4af37', color: 'white', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {editingId ? 'Atualizar Lote' : 'Criar Lote'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} style={{ background: '#95a5a6', color: 'white', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                Cancelar Edição
              </button>
            )}
          </div>
        </form>
      </div>

      <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '1.5rem' }}>Lotes Anteriores</h2>
      
      {loading ? <p>Carregando...</p> : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {boxes.map(box => (
            <div key={box.id} style={{ display: 'flex', gap: '1.5rem', background: 'white', padding: '1.5rem', borderRadius: '12px', borderLeft: box.is_active ? '5px solid #27ae60' : '5px solid #bdc3c7', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              {box.image_url && (
                <img src={box.image_url} alt={box.title} style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '8px' }} />
              )}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: box.is_active ? '#27ae60' : '#2c3e50' }}>{box.title} {box.is_active && '(Ativo)'}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(box)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => handleDelete(box.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
                  </div>
                </div>
                <p style={{ color: '#7f8c8d', marginBottom: '0.5rem' }}><strong>Data:</strong> {box.batch_date_label}</p>
                
                {/* Progress Bar for Sold vs Total */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem', fontWeight: 'bold' }}>
                    <span>Vendidas: {box.sold_quantity}</span>
                    <span>Total: {box.total_quantity}</span>
                  </div>
                  <div style={{ width: '100%', height: '10px', background: '#ecf0f1', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(100, (box.sold_quantity / box.total_quantity) * 100)}%`, height: '100%', background: box.sold_quantity >= box.total_quantity ? '#e74c3c' : '#f1c40f', transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
