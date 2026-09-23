'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

interface Registration {
  id: string;
  customer_name: string | null;
  email: string | null;
  customer_whatsapp: string | null;
  interest_type: string | null;
  specific_interest: string | null;
  requested_date: string | null;
  focus_areas: string[] | null;
  created_at: string;
}

const digitsOnly = (v: string | null | undefined) => (v || '').replace(/\D/g, '');

const formatPhone = (v: string | null) => {
  const d = digitsOnly(v).replace(/^55/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v || '—';
};

const formatDate = (v: string | null) =>
  v ? new Date(v).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function CourseRegistrationsAdmin() {
  const [rows, setRows] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('course_registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      console.error('Error fetching registrations:', err);
      setError('Não foi possível carregar as inscrições.');
    } else {
      setRows((data || []) as Registration[]);
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
      [r.customer_name, r.email, r.customer_whatsapp, r.interest_type, r.specific_interest,
        ...(r.focus_areas || [])]
        .filter(Boolean)
        .some(v => String(v).toLowerCase().includes(q)),
    );
  }, [rows, search]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando inscrições...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Inscrições em Cursos</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        Todo mundo que preencheu o formulário de interesse em cursos, retiros ou experiências.
        Estes são seus contatos mais quentes — vale responder pelo WhatsApp.
      </p>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', color: '#a03027', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '2rem', lineHeight: 1.6 }}>
          {error} Confirme que seu e-mail está na lista de administradores (tabela <code>admins</code> no Supabase).
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'white', padding: '1.25rem 1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#2c3e50' }}>{rows.length}</div>
          <div style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px' }}>Inscrições</div>
        </div>
        <input
          type="search"
          placeholder="Buscar por nome, e-mail, interesse..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 260px', padding: '0.9rem 1rem', border: '1px solid #dfe4ea', borderRadius: '8px', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: 'white', padding: '3rem', borderRadius: '12px', textAlign: 'center', color: '#7f8c8d', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {rows.length === 0 ? 'Ainda não há inscrições.' : 'Nenhuma inscrição encontrada para essa busca.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {filtered.map(r => (
            <div key={r.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', gap: '2rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

              <div style={{ flex: '1 1 240px', minWidth: 0 }}>
                <h3 style={{ fontSize: '1.15rem', margin: '0 0 0.6rem', color: '#2c3e50' }}>
                  {r.customer_name || 'Sem nome'}
                </h3>
                <div style={{ color: '#7f8c8d', fontSize: '0.92rem', lineHeight: 1.9, wordBreak: 'break-word' }}>
                  <div>📱 {formatPhone(r.customer_whatsapp)}</div>
                  <div>✉️ {r.email || '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: '#b2bec3' }}>
                    Recebido em {formatDate(r.created_at)}
                  </div>
                </div>
              </div>

              <div style={{ flex: '1 1 260px' }}>
                <h4 style={{ fontSize: '0.8rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Interesse</h4>
                <div style={{ color: '#2c3e50', fontSize: '0.92rem', lineHeight: 1.8 }}>
                  {r.interest_type && <div><strong>{r.interest_type}</strong></div>}
                  {r.specific_interest && <div>{r.specific_interest}</div>}
                  {r.requested_date && <div style={{ color: '#7f8c8d' }}>📅 Data desejada: {formatDate(r.requested_date)}</div>}
                </div>
                {r.focus_areas && r.focus_areas.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.6rem' }}>
                    {r.focus_areas.map(a => (
                      <span key={a} style={{ background: '#fdf7ee', color: '#d4af37', border: '1px solid #e8e1d7', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold' }}>
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {digitsOnly(r.customer_whatsapp) && (
                <div style={{ flex: '0 0 auto' }}>
                  <a
                    href={`https://wa.me/${digitsOnly(r.customer_whatsapp).length <= 11 ? '55' + digitsOnly(r.customer_whatsapp) : digitsOnly(r.customer_whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#25D366', color: 'white', padding: '0.8rem 1.4rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}
                  >
                    Abrir WhatsApp
                  </a>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
