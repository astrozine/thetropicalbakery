'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { brandConfirm } from '@/lib/brandDialog';

interface AdminRow {
  email: string;
  note: string | null;
  created_at: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AdministradoresPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [me, setMe] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe((data.user?.email || '').toLowerCase()));
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('admins').select('*').order('created_at');
    if (error) {
      setError('Não foi possível carregar a lista de administradores.');
    } else {
      setError('');
      setAdmins(data || []);
    }
    setLoading(false);
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setError('Digite um e-mail válido.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('admins').insert([{ email, note: form.note.trim() || null }]);
    setSaving(false);
    if (error) {
      setError(error.code === '23505'
        ? 'Esse e-mail já é administrador.'
        : 'Não foi possível adicionar. Confirme que a migration_11_manage_admins.sql foi executada.');
      return;
    }
    setForm({ email: '', note: '' });
    load();
  };

  const remove = async (email: string) => {
    if (!(await brandConfirm(`Remover o acesso de administrador de ${email}?`, { danger: true, confirmLabel: 'Sim, remover' }))) return;
    const { error } = await supabase.from('admins').delete().eq('email', email);
    if (error) {
      setError(error.message.includes('último') ? 'Não é possível remover o último administrador.' : 'Não foi possível remover.');
      return;
    }
    load();
  };

  const input: React.CSSProperties = { width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid rgba(212,175,55,0.4)', background: 'white', fontSize: '1rem', color: '#594a42' };

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', color: '#3c2a21' }}>
      <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', marginBottom: '1rem', color: '#d4af37' }}>Administradores</h1>
      <p style={{ fontSize: '1.05rem', color: '#594a42', marginBottom: '2rem', lineHeight: 1.7 }}>
        Quem está nesta lista vê o item <strong>Administração</strong> no menu do site depois de entrar, e acessa todo o painel.
        A pessoa precisa entrar no site com exatamente o e-mail cadastrado aqui (Google, link por e-mail, etc.).
      </p>

      {error && (
        <div style={{ padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a' }}>{error}</div>
      )}

      <form onSubmit={add} className="liquid-glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: '2 1 240px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.4rem' }}>E-mail</label>
          <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="pessoa@gmail.com" style={input} />
        </div>
        <div style={{ flex: '1 1 160px' }}>
          <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.4rem' }}>Nome / observação</label>
          <input type="text" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Ex.: gerente" style={input} />
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
          {saving ? 'Adicionando...' : 'Adicionar administrador'}
        </button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {admins.map(a => {
            const isMe = a.email.toLowerCase() === me;
            return (
              <div key={a.email} className="liquid-glass-card" style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <strong>{a.email}</strong>{isMe && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#8a6d1f' }}>(você)</span>}
                  {a.note && <div style={{ color: '#7a6a61', fontSize: '0.9rem' }}>{a.note}</div>}
                </div>
                {!isMe && (
                  <button type="button" onClick={() => remove(a.email)} className="btn btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
                    Remover
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
