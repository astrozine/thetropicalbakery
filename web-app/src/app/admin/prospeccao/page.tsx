'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Prospecção: the businesses we reached out to (e-mail and WhatsApp) before they become partners.
 * One card per business, moved along a simple pipeline. Table: migration_42_partner_leads.sql.
 * Prospects live apart from `partners` because a partner row can sign in to the portal.
 */

type Stage = 'a_contatar' | 'contatado' | 'respondeu' | 'conversa' | 'parceiro' | 'sem_interesse';
type EmailStatus = 'nao_enviado' | 'enviado' | 'bounce' | 'sem_email';

interface Lead {
  id: string;
  business_name: string;
  category: string | null;
  segment: string | null;
  location: string | null;
  email: string | null;
  whatsapp: string | null;
  whatsapp_type: string | null;
  instagram: string | null;
  website: string | null;
  fit: string | null;
  research: string | null;
  whatsapp_message: string | null;
  email_status: EmailStatus;
  whatsapp_sent: boolean;
  stage: Stage;
  replied_via: string | null;
  follow_up_on: string | null;
  notes: string | null;
  updated_at: string;
}

const STAGES: { id: Stage; label: string; color: string; bg: string }[] = [
  { id: 'a_contatar', label: 'A contatar', color: '#7f8c8d', bg: '#f1f2f6' },
  { id: 'contatado', label: 'Contatado', color: '#2c6fa3', bg: '#e8f1fa' },
  { id: 'respondeu', label: 'Respondeu', color: '#8a5a00', bg: '#fff4e0' },
  { id: 'conversa', label: 'Conversa / café marcado', color: '#6b3fa0', bg: '#f3ecfb' },
  { id: 'parceiro', label: 'Virou parceiro', color: '#1e6b3c', bg: '#f0faf4' },
  { id: 'sem_interesse', label: 'Sem interesse', color: '#a33', bg: '#fbeeee' },
];
const stageOf = (id: Stage) => STAGES.find(s => s.id === id) ?? STAGES[0];

const EMAIL_LABEL: Record<EmailStatus, string> = {
  nao_enviado: '📧 e-mail não enviado',
  enviado: '📧 e-mail enviado',
  bounce: '📧 e-mail voltou (bounce)',
  sem_email: '📧 sem e-mail',
};

const REPLIED_VIA = ['whatsapp', 'email', 'instagram', 'pessoalmente'];

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const field: React.CSSProperties = { width: '100%', padding: '0.55rem 0.65rem', borderRadius: '8px', border: '1px solid #dfe4ea', fontSize: '0.9rem', background: 'white' };
const btn: React.CSSProperties = { border: 'none', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', color: 'white', textDecoration: 'none', display: 'inline-block' };

const waLink = (l: Lead) => {
  const digits = (l.whatsapp || '').replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}${l.whatsapp_message ? `?text=${encodeURIComponent(l.whatsapp_message)}` : ''}`;
};
const igLink = (handle: string | null) => {
  const h = (handle || '').trim().replace(/^@/, '');
  return h ? `https://instagram.com/${h}` : null;
};

export default function AdminProspectsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState('');
  const [stage, setStage] = useState<Stage | 'todos' | 'seguir'>('todos');
  const [segment, setSegment] = useState('todos');
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase.from('partner_leads').select('*').order('business_name');
    if (err) setMissing(true);
    else { setMissing(false); setLeads((data as Lead[]) || []); }
    setLoading(false);
  };

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, []);

  /** Saves at once on screen, then in the database; puts it back if the save fails. */
  const patch = async (l: Lead, changes: Partial<Lead>) => {
    const before = leads;
    setLeads(ls => ls.map(x => (x.id === l.id ? { ...x, ...changes } : x)));
    const { error: err } = await supabase.from('partner_leads')
      .update({ ...changes, updated_at: new Date().toISOString() }).eq('id', l.id);
    if (err) { setLeads(before); setError(`Não foi possível salvar: ${err.message}`); }
    else setError('');
  };

  const openWhatsApp = (l: Lead) => {
    // Opening the chat with the message is how Dolly sends it, so mark it sent.
    if (!l.whatsapp_sent || l.stage === 'a_contatar') {
      patch(l, { whatsapp_sent: true, stage: l.stage === 'a_contatar' ? 'contatado' : l.stage });
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const { error: err } = await supabase.from('partner_leads').insert([{ business_name: name }]);
    if (err) { setError(err.code === '23505' ? `${name} já está na lista.` : `Não foi possível adicionar: ${err.message}`); return; }
    setNewName('');
    setSearch(name);
    load();
  };

  const today = new Date().toISOString().slice(0, 10);
  const due = (l: Lead) => !!l.follow_up_on && l.follow_up_on <= today && l.stage !== 'parceiro' && l.stage !== 'sem_interesse';
  const segments = useMemo(() => Array.from(new Set(leads.map(l => l.segment).filter(Boolean))) as string[], [leads]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    return leads
      .filter(l => stage === 'todos' || (stage === 'seguir' ? due(l) : l.stage === stage))
      .filter(l => segment === 'todos' || l.segment === segment)
      .filter(l => !s || [l.business_name, l.category, l.location, l.instagram, l.notes].some(v => (v || '').toLowerCase().includes(s)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, stage, segment, search]);

  if (missing) {
    return (
      <div style={{ maxWidth: '900px' }}>
        <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '1rem' }}>Prospecção</h1>
        <div style={{ ...card, background: '#fff4e5', color: '#7a4a00', border: '1px solid #f0d9b5', lineHeight: 1.7 }}>
          ⚠️ Rode a <code>migration_42_partner_leads.sql</code> no Supabase e depois o arquivo de contatos
          (<code>seed_partner_leads.sql</code>) para ver aqui os negócios que já contatamos.
        </div>
      </div>
    );
  }

  const pill = (active: boolean): React.CSSProperties => ({
    padding: '0.4rem 0.9rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.82rem',
    border: active ? '2px solid #d4af37' : '1px solid #dfe4ea', background: active ? '#fdf6dd' : '#fff', color: '#2c3e50',
  });
  const dueCount = leads.filter(due).length;

  return (
    <div style={{ maxWidth: '1400px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Prospecção</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.25rem', lineHeight: 1.7, maxWidth: '820px' }}>
        Os hotéis, pousadas, restaurantes, barcos e estúdios que contatamos por e-mail e WhatsApp. Quando alguém responder,
        mude a etapa e anote o que foi combinado. Quem fechar parceria entra em <a href="/admin/parceiros">Parceiros</a>.
      </p>

      {error && <div style={{ padding: '0.9rem 1.1rem', borderRadius: '10px', marginBottom: '1rem', background: '#fff4e5', color: '#7a4a00', border: '1px solid #f0d9b5' }}>⚠️ {error}</div>}

      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
        <button type="button" onClick={() => setStage('todos')} style={pill(stage === 'todos')}>Todos ({leads.length})</button>
        {STAGES.map(s => (
          <button key={s.id} type="button" onClick={() => setStage(s.id)} style={pill(stage === s.id)}>
            {s.label} ({leads.filter(l => l.stage === s.id).length})
          </button>
        ))}
        {dueCount > 0 && <button type="button" onClick={() => setStage('seguir')} style={{ ...pill(stage === 'seguir'), color: '#e2792a' }}>⏰ Retomar hoje ({dueCount})</button>}
      </div>

      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <input type="search" placeholder="Buscar nome, lugar, Instagram, anotação…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...field, flex: '2 1 240px', width: 'auto' }} />
        <select value={segment} onChange={e => setSegment(e.target.value)} style={{ ...field, flex: '1 1 200px', width: 'auto' }}>
          <option value="todos">Todos os tipos</option>
          {segments.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <form onSubmit={add} style={{ display: 'flex', gap: '0.4rem', flex: '1 1 260px', minWidth: 0 }}>
          <input type="text" placeholder="Novo contato (nome do negócio)" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...field, minWidth: 0 }} />
          <button type="submit" style={{ ...btn, background: '#d4af37' }}>Adicionar</button>
        </form>
      </div>

      {loading ? <p>Carregando…</p> : shown.length === 0 ? <p style={{ color: '#95a5a6' }}>Ninguém aqui.</p> : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 380px), 1fr))' }}>
          {shown.map(l => <LeadCard key={l.id} l={l} due={due(l)} patch={patch} openWhatsApp={openWhatsApp} />)}
        </div>
      )}
    </div>
  );
}

function LeadCard({ l, due, patch, openWhatsApp }: {
  l: Lead; due: boolean;
  patch: (l: Lead, c: Partial<Lead>) => void;
  openWhatsApp: (l: Lead) => void;
}) {
  const [notes, setNotes] = useState(l.notes || '');
  const st = stageOf(l.stage);
  const wa = waLink(l);
  const ig = igLink(l.instagram);
  const replied = ['respondeu', 'conversa', 'parceiro', 'sem_interesse'].includes(l.stage);
  const landline = /fixo/i.test(l.whatsapp_type || '');

  return (
    <div style={{ ...card, borderLeft: `5px solid ${st.color}`, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: '1.05rem', color: '#2c3e50', overflowWrap: 'anywhere' }}>{l.business_name}</h3>
          <p style={{ color: '#7f8c8d', fontSize: '0.82rem', marginTop: '0.15rem' }}>
            {[l.category, l.location].filter(Boolean).join(' · ')}
            {l.fit ? ` · fit ${l.fit}` : ''}
          </p>
        </div>
        <span style={{ background: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.65rem', borderRadius: '20px', whiteSpace: 'nowrap' }}>{st.label}</span>
      </div>

      <p style={{ fontSize: '0.8rem', color: '#5d6d7e', marginTop: '0.6rem', display: 'flex', gap: '0.9rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ color: l.email_status === 'bounce' ? '#c0392b' : undefined }}>{EMAIL_LABEL[l.email_status]}</span>
        <label style={{ display: 'inline-flex', gap: '0.3rem', alignItems: 'center', cursor: 'pointer' }}>
          <input type="checkbox" checked={l.whatsapp_sent} onChange={e => patch(l, { whatsapp_sent: e.target.checked })} />
          💬 WhatsApp enviado
        </label>
        {due && <span style={{ color: '#e2792a', fontWeight: 700 }}>⏰ retomar</span>}
      </p>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => openWhatsApp(l)} style={{ ...btn, background: '#25D366' }}
            title={landline ? 'Número fixo: talvez não tenha WhatsApp' : undefined}>
            WhatsApp{l.whatsapp_message && !l.whatsapp_sent ? ' com a mensagem' : ''}{landline ? ' (fixo?)' : ''}
          </a>
        )}
        {ig && <a href={ig} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: '#c13584' }}>Instagram</a>}
        {l.email && l.email_status !== 'bounce' && <a href={`mailto:${l.email}`} style={{ ...btn, background: '#3498db' }}>E-mail</a>}
        {l.website && <a href={l.website} target="_blank" rel="noopener noreferrer" style={{ ...btn, background: '#95a5a6' }}>Site</a>}
      </div>

      {/* minmax(0, 1fr): a select or date input must never push the card past a phone's width. */}
      <div style={{ display: 'grid', gridTemplateColumns: replied ? 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))' : 'repeat(2, minmax(0, 1fr))', gap: '0.5rem', marginTop: '0.85rem' }}>
        <label style={{ fontSize: '0.72rem', color: '#7f8c8d', fontWeight: 700 }}>Etapa
          <select value={l.stage} onChange={e => patch(l, { stage: e.target.value as Stage })} style={{ ...field, marginTop: '0.2rem' }}>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        {replied && (
          <label style={{ fontSize: '0.72rem', color: '#7f8c8d', fontWeight: 700 }}>Respondeu por
            <select value={l.replied_via || ''} onChange={e => patch(l, { replied_via: e.target.value || null })} style={{ ...field, marginTop: '0.2rem' }}>
              <option value="">—</option>
              {REPLIED_VIA.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </label>
        )}
        <label style={{ fontSize: '0.72rem', color: '#7f8c8d', fontWeight: 700 }}>Retomar em
          <input type="date" value={l.follow_up_on || ''} onChange={e => patch(l, { follow_up_on: e.target.value || null })} style={{ ...field, marginTop: '0.2rem' }} />
        </label>
      </div>

      <textarea rows={2} placeholder="Anotações: o que responderam, o que combinamos…" value={notes}
        onChange={e => setNotes(e.target.value)}
        onBlur={() => { if (notes !== (l.notes || '')) patch(l, { notes: notes || null }); }}
        style={{ ...field, marginTop: '0.6rem', resize: 'vertical' }} />

      {(l.research || l.whatsapp_message) && (
        <details style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#7f8c8d', overflowWrap: 'anywhere' }}>
          <summary style={{ cursor: 'pointer' }}>Pesquisa e mensagem</summary>
          {l.research && <p style={{ marginTop: '0.4rem', lineHeight: 1.6 }}>{l.research}</p>}
          {l.whatsapp_message && <p style={{ marginTop: '0.4rem', lineHeight: 1.6, fontStyle: 'italic' }}>&ldquo;{l.whatsapp_message}&rdquo;</p>}
        </details>
      )}
    </div>
  );
}
