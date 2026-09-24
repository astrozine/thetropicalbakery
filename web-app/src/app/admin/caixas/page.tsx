'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ImagePicker from '@/components/ImagePicker';
import ToggleSwitch from '@/components/ToggleSwitch';
import BoxItemsEditor from '@/components/BoxItemsEditor';
import { BoxItem } from '@/lib/allergens';
import { uploadPublicImage } from '@/lib/imageUpload';
import { pushTreatDetails } from '@/lib/treatSync';

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

const input: React.CSSProperties = { width: '100%', padding: '0.8rem', border: '1px solid #ccc', borderRadius: '6px' };
const label: React.CSSProperties = { display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' };
const card: React.CSSProperties = { background: 'white', padding: 'clamp(1.25rem, 3vw, 2rem)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };

export default function AdminCaixas() {
  const [boxes, setBoxes] = useState<TastingBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      setImageUrl(await uploadPublicImage(e.target.files[0], 'boxes'));
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hint = (msg: string) =>
    /items|ingredients|contains|emoji/.test(msg) ? ' — Rode as migrations 13 e 14 no Supabase primeiro.' : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // 1. Treats ticked "also add to the Menu de Eventos" are created there first, so the box can point at them.
    const cleanItems: BoxItem[] = [];
    for (const it of items.filter(i => i.name.trim())) {
      let treatId = it.treat_id || null;
      if (it.add_to_menu && !treatId) {
        if (!it.menu_price || it.menu_price <= 0) {
          alert(`Informe o preço unitário de "${it.name}" para adicioná-lo ao Menu de Eventos.`);
          setSaving(false);
          return;
        }
        const { data, error } = await supabase.from('treats').insert([{
          name: it.name, description: it.description, image_url: it.image_url, emoji: it.emoji,
          ingredients: it.ingredients, contains: it.contains, may_contain: it.may_contain,
          price: it.menu_price, min_batch_size: it.menu_min_batch || 1, batch_multiplier: it.menu_batch_multiplier || 1,
          is_available: true,
        }]).select('id').single();
        if (error || !data) {
          alert(`Erro ao adicionar "${it.name}" ao Menu de Eventos: ${error?.message ?? ''}${hint(error?.message ?? '')}`);
          setSaving(false);
          return;
        }
        treatId = data.id;
      }
      // Editor-only fields never go into the stored box.
      const { add_to_menu, menu_price, menu_min_batch, menu_batch_multiplier, ...stored } = it;
      void add_to_menu; void menu_price; void menu_min_batch; void menu_batch_multiplier;
      cleanItems.push({ ...stored, treat_id: treatId });
    }

    // 2. Only one box is live at a time.
    if (isActive) {
      await supabase.from('tasting_boxes').update({ is_active: false }).neq('id', editingId || '00000000-0000-0000-0000-000000000000');
    }

    const payload = {
      title,
      // The treats build the description; the paragraph is just an optional intro.
      description: description.trim() || cleanItems.map(i => `${i.emoji} ${i.name}`).join(' · '),
      items: cleanItems,
      image_url: imageUrl,
      batch_date_label: batchDateLabel,
      total_quantity: totalQuantity,
      sold_quantity: soldQuantity,
      price,
      is_active: isActive,
    };

    const { error } = editingId
      ? await supabase.from('tasting_boxes').update(payload).eq('id', editingId)
      : await supabase.from('tasting_boxes').insert([payload]);
    if (error) {
      alert(`Erro ao salvar: ${error.message}${hint(error.message)}`);
      setSaving(false);
      return;
    }

    // 3. Treats shared with the Menu de Eventos: push the latest details to the menu and to every other box using them.
    for (const it of cleanItems) {
      if (!it.treat_id) continue;
      const res = await pushTreatDetails(it.treat_id, {
        name: it.name, description: it.description, image_url: it.image_url, emoji: it.emoji,
        ingredients: it.ingredients, contains: it.contains, may_contain: it.may_contain,
      });
      if (res.error) console.error('Sync to menu failed:', res.error);
    }

    setSaving(false);
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
    <div style={{ maxWidth: '1400px' }}>
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

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', color: '#2c3e50' }}>{editingId ? 'Editar Lote' : 'Novo Lote'}</h2>

      <form onSubmit={handleSubmit} style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))', alignItems: 'start' }}>

          {/* LEFT: the box itself */}
          <div style={{ ...card, display: 'grid', gap: '1.25rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#2c3e50' }}>📦 Dados da caixa</h3>

            <div>
              <label style={label}>Título</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Caixa Surpresa da Semana" style={input} />
            </div>

            <div>
              <label style={label}>Texto de abertura (opcional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Uma frase sobre o tema desta edição. Se ficar vazio, usamos a lista dos doces." style={input} />
            </div>

            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <label style={label}>Data do Lote</label>
                <input type="date" required min="2020-01-01" max="2100-12-31" value={batchDateLabel} onChange={e => setBatchDateLabel(e.target.value)} style={input} />
              </div>
              <div>
                <label style={label}>Preço (R$)</label>
                <input type="number" step="0.01" required value={price} onChange={e => setPrice(Number(e.target.value))} style={input} />
              </div>
              <div>
                <label style={label}>Qtd. Total Produzida</label>
                <input type="number" required value={totalQuantity} onChange={e => setTotalQuantity(Number(e.target.value))} style={input} />
              </div>
              <div>
                <label style={label}>Qtd. Vendida</label>
                <input type="number" required value={soldQuantity} onChange={e => setSoldQuantity(Number(e.target.value))} style={input} />
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '-0.5rem' }}>
              A quantidade vendida é calculada automaticamente pelos pedidos. Edite manualmente apenas se houver cancelamentos ou vendas externas.
            </p>

            <ImagePicker label="Imagem da Caixa" imageUrl={imageUrl} uploading={uploading} onChange={handleImageUpload} />

            <ToggleSwitch
              checked={isActive}
              onChange={setIsActive}
              label="Mostrar esta caixa no site"
              onText="Ativado — aparecendo no site"
              offText="Desativado — escondida do site"
              helper="Ao ativar, as outras caixas são desativadas automaticamente."
            />

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button type="submit" disabled={saving} style={{ background: '#d4af37', color: 'white', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: saving ? 'wait' : 'pointer', fontWeight: 'bold', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando…' : editingId ? 'Atualizar Lote' : 'Criar Lote'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} style={{ background: '#95a5a6', color: 'white', padding: '0.8rem 2rem', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Cancelar Edição
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: the treats inside */}
          <div style={card}>
            <h3 style={{ fontSize: '1.2rem', color: '#2c3e50', marginBottom: '0.25rem' }}>🍫 Doces desta caixa</h3>
            <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1rem', lineHeight: 1.6 }}>
              Um doce de cada vez: nome, descrição, foto, ingredientes e alérgenos. Você também pode repetir doces do Menu de Eventos
              ou mandar um doce novo para lá. O site monta tudo numa lista que abre e fecha.
            </p>
            <BoxItemsEditor items={items} onChange={setItems} />
          </div>
        </div>
      </form>

      <h2 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '1.5rem' }}>Lotes Anteriores</h2>

      {loading ? <p>Carregando...</p> : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 520px), 1fr))' }}>
          {boxes.map(box => (
            <div key={box.id} style={{ display: 'flex', gap: '1.25rem', background: 'white', padding: '1.25rem', borderRadius: '12px', borderLeft: box.is_active ? '5px solid #27ae60' : '5px solid #bdc3c7', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              {box.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={box.image_url} alt={box.title} style={{ width: '110px', height: '110px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem', color: box.is_active ? '#27ae60' : '#2c3e50' }}>{box.title} {box.is_active && '(Ativo)'}</h3>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => handleEdit(box)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Editar</button>
                    <button onClick={() => handleDelete(box.id)} style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer' }}>Excluir</button>
                  </div>
                </div>
                <p style={{ color: '#7f8c8d', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  <strong>Data:</strong> {box.batch_date_label} · <strong>{(box.items || []).length}</strong> doces
                </p>

                <div style={{ marginTop: '0.75rem' }}>
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
