'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MaintenanceContact {
  id: string;
  category: string;
  name: string;
  phone: string;
  notes: string | null;
  is_emergency: boolean;
  created_at: string;
}

const CATEGORIES = [
  'Encanamento',
  'Elétrica',
  'Geladeira/Freezer',
  'Forno',
  'Gás',
  'Internet/Wifi',
  'Gerador',
  'Outro',
];

const EMPTY_FORM = { category: CATEGORIES[0], name: '', phone: '', notes: '', is_emergency: false };

const digitsOnly = (v: string) => v.replace(/\D/g, '');

export default function MaintenanceContactsAdmin() {
  const [contacts, setContacts] = useState<MaintenanceContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('maintenance_contacts')
      .select('*')
      .order('category')
      .order('name');

    if (error) {
      console.error('Error fetching maintenance contacts:', error);
      setError('Não foi possível carregar a lista. Confirme que a migration_05_maintenance_contacts.sql foi executada.');
    } else {
      setError('');
      setContacts(data || []);
    }
    setLoading(false);
  };

  const startEdit = (c: MaintenanceContact) => {
    setEditingId(c.id);
    setForm({ category: c.category, name: c.name, phone: c.phone, notes: c.notes || '', is_emergency: c.is_emergency });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    setSaving(true);

    const payload = { ...form, updated_at: new Date().toISOString() };
    const { error } = editingId
      ? await supabase.from('maintenance_contacts').update(payload).eq('id', editingId)
      : await supabase.from('maintenance_contacts').insert([payload]);

    setSaving(false);
    if (error) {
      console.error('Error saving contact:', error);
      setError('Não foi possível salvar. Tente novamente.');
      return;
    }
    cancelEdit();
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remover este contato da lista?')) return;
    const { error } = await supabase.from('maintenance_contacts').delete().eq('id', id);
    if (error) {
      console.error('Error deleting contact:', error);
      setError('Não foi possível remover.');
      return;
    }
    load();
  };

  const grouped = CATEGORIES.map(cat => ({
    category: cat,
    items: contacts.filter(c => c.category === cat),
  })).filter(g => g.items.length > 0);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Manutenção &amp; Reparos</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Quem chamar quando algo quebra — encanador, eletricista, técnico de geladeira, forno, gás, wifi, gerador.
        Lista só para a administração; ninguém de fora do time consegue ver isso.
      </p>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', color: '#a03027', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '2rem', lineHeight: 1.6 }}>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '1.25rem' }}>
          {editingId ? 'Editar contato' : 'Adicionar novo contato'}
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.4rem' }}>Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dfe4ea', fontSize: '0.95rem' }}
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div style={{ flex: '2 1 220px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.4rem' }}>Nome / Empresa</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Seu João - Encanador"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dfe4ea', fontSize: '0.95rem' }}
            />
          </div>
          <div style={{ flex: '1 1 180px' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.4rem' }}>Telefone / WhatsApp</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="(12) 99123-4567"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dfe4ea', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.4rem' }}>Observações</label>
          <input
            type="text"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            placeholder="Ex: atende fins de semana, avisar 1 dia antes"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #dfe4ea', fontSize: '0.95rem' }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', cursor: 'pointer', fontSize: '0.92rem', color: '#2c3e50' }}>
          <input
            type="checkbox"
            checked={form.is_emergency}
            onChange={e => setForm({ ...form, is_emergency: e.target.checked })}
            style={{ width: '18px', height: '18px' }}
          />
          Contato de emergência (atende urgência)
        </label>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button type="submit" disabled={saving} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar contato'}
          </button>
          {editingId && (
            <button type="button" onClick={cancelEdit} style={{ background: 'transparent', color: '#7f8c8d', border: '1px solid #dfe4ea', padding: '0.8rem 1.5rem', borderRadius: '6px', cursor: 'pointer' }}>
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* List, grouped by category */}
      {grouped.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          Nenhum contato cadastrado ainda.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.75rem' }}>
          {grouped.map(g => (
            <div key={g.category}>
              <h4 style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                {g.category}
              </h4>
              <div style={{ display: 'grid', gap: '0.85rem' }}>
                {g.items.map(c => (
                  <div key={c.id} style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#2c3e50' }}>{c.name}</h3>
                        {c.is_emergency && (
                          <span style={{ background: '#fdecea', color: '#c0392b', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                            🚨 Emergência
                          </span>
                        )}
                      </div>
                      <div style={{ color: '#7f8c8d', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        📱 {c.phone}{c.notes ? ` · ${c.notes}` : ''}
                      </div>
                    </div>
                    <div style={{ flex: '0 0 auto', display: 'flex', gap: '0.6rem' }}>
                      {digitsOnly(c.phone).length >= 10 && (
                        <a
                          href={`https://wa.me/55${digitsOnly(c.phone)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ background: '#25D366', color: 'white', padding: '0.6rem 1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          WhatsApp
                        </a>
                      )}
                      <button onClick={() => startEdit(c)} style={{ background: '#f1f2f6', color: '#2c3e50', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        Editar
                      </button>
                      <button onClick={() => handleDelete(c.id)} style={{ background: 'transparent', color: '#c0392b', border: '1px solid #f5c6cb', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
