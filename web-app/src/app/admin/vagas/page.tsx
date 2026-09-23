'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface Application {
  id: string;
  role: string;
  full_name: string;
  whatsapp: string;
  email: string | null;
  city: string | null;
  experience: string | null;
  availability: string | null;
  has_transport: boolean;
  motivation: string | null;
  status: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  confeitaria: { label: 'Confeitaria', color: '#a03027', bg: '#fdecea' },
  entrega:     { label: 'Entregas',    color: '#1a73e8', bg: '#e8f0fe' },
  compras:     { label: 'Compras',     color: '#0b6b3a', bg: '#e6f4ec' },
  outro:       { label: 'Outro',       color: '#576574', bg: '#f1f2f6' },
};

const STATUSES = [
  { id: 'new', label: 'Novo' },
  { id: 'contacted', label: 'Contatado' },
  { id: 'interviewing', label: 'Entrevistando' },
  { id: 'hired', label: 'Contratado' },
  { id: 'archived', label: 'Arquivado' },
];

const digitsOnly = (v: string | null | undefined) => (v || '').replace(/\D/g, '');
const waLink = (n: string | null | undefined) => {
  const d = digitsOnly(n);
  return `https://wa.me/${d.length <= 11 ? '55' + d : d}`;
};

const formatPhone = (v: string | null) => {
  const d = digitsOnly(v).replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v || '—';
};

export default function ApplicationsAdmin() {
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('job_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      console.error(err);
      setError('Não foi possível carregar as candidaturas.');
    } else {
      setRows((data || []) as Application[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string) => {
    const { error: err } = await supabase.from('job_applications').update({ status }).eq('id', id);
    if (err) { console.error(err); return; }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, status } : r)));
  };

  const filtered = useMemo(
    () => (roleFilter === 'all' ? rows : rows.filter(r => r.role === roleFilter)),
    [rows, roleFilter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) c[r.role] = (c[r.role] || 0) + 1;
    return c;
  }, [rows]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando candidaturas...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Candidaturas</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Quem se candidatou pelo site em <strong>/trabalhe-conosco</strong> — confeitaria, entregas
        e compras de ingredientes.
      </p>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', color: '#a03027', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error} Confirme que seu e-mail está na tabela <code>admins</code> no Supabase.
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {[{ id: 'all', label: `Todas (${rows.length})` },
          ...Object.keys(ROLE_LABELS).map(r => ({ id: r, label: `${ROLE_LABELS[r].label} (${counts[r] || 0})` }))
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setRoleFilter(f.id)}
            style={{
              padding: '0.6rem 1.1rem', borderRadius: '8px', cursor: 'pointer',
              border: '1px solid', borderColor: roleFilter === f.id ? '#2c3e50' : '#dfe4ea',
              background: roleFilter === f.id ? '#2c3e50' : 'white',
              color: roleFilter === f.id ? 'white' : '#7f8c8d', fontWeight: 600, fontSize: '0.88rem',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {rows.length === 0 ? 'Ainda não há candidaturas.' : 'Nenhuma candidatura nesta categoria.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filtered.map(r => {
            const role = ROLE_LABELS[r.role] ?? ROLE_LABELS.outro;
            return (
              <div key={r.id} style={{
                background: 'white', padding: '1.5rem', borderRadius: '12px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                opacity: r.status === 'archived' ? 0.55 : 1,
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#2c3e50' }}>{r.full_name}</h3>
                      <span style={{ background: role.bg, color: role.color, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {role.label}
                      </span>
                      {r.has_transport && (
                        <span style={{ background: '#e6f4ec', color: '#0b6b3a', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                          🛵 Transporte próprio
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#7f8c8d', fontSize: '0.9rem', lineHeight: 1.9, wordBreak: 'break-word' }}>
                      <div>📱 {formatPhone(r.whatsapp)}</div>
                      {r.email && <div>✉️ {r.email}</div>}
                      {r.city && <div>📍 {r.city}</div>}
                      {r.availability && <div>🕐 {r.availability}</div>}
                      <div style={{ fontSize: '0.8rem', color: '#b2bec3' }}>
                        Recebida em {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  <div style={{ flex: '2 1 320px', minWidth: 0 }}>
                    {r.experience && (
                      <div style={{ marginBottom: '0.9rem' }}>
                        <p style={{ fontSize: '0.72rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Experiência</p>
                        <p style={{ color: '#2c3e50', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>{r.experience}</p>
                      </div>
                    )}
                    {r.motivation && (
                      <div>
                        <p style={{ fontSize: '0.72rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Motivação</p>
                        <p style={{ color: '#2c3e50', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>“{r.motivation}”</p>
                      </div>
                    )}
                  </div>

                  <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <a
                      href={waLink(r.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: '#25D366', color: 'white', padding: '0.7rem 1.2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', textAlign: 'center', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
                    >
                      WhatsApp
                    </a>
                    <select
                      value={r.status}
                      onChange={e => setStatus(r.id, e.target.value)}
                      style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid #dfe4ea', cursor: 'pointer', fontSize: '0.88rem', color: '#2c3e50' }}
                    >
                      {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
