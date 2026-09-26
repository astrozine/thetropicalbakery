'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { PARTNER_KINDS, PARTNER_STATUS, Partner, RESTOCK_STATUS, RestockRequest, partnerKind } from '@/lib/portals';
import { brandConfirm } from '@/lib/brandDialog';

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 1.75rem)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const field: React.CSSProperties = { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #dfe4ea', fontSize: '0.95rem' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '0.3rem' };
const dark: React.CSSProperties = { background: '#2c3e50', color: 'white', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

const EMPTY = {
  business_name: '', kind: 'hotel', contact_name: '', email: '', whatsapp: '',
  address: '', neighborhood: '', commission_pct: 0, affiliate_code: '', monthly_goal: 0,
  notes: '', portal_message: '',
};

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [requests, setRequests] = useState<RestockRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof EMPTY>({ ...EMPTY });
  const [filter, setFilter] = useState<'todos' | 'pendente' | 'ativo' | 'pausado'>('todos');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [p, r] = await Promise.all([
      supabase.from('partners').select('*').order('created_at', { ascending: false }),
      supabase.from('partner_restock_requests').select('*').order('created_at', { ascending: false }),
    ]);
    if (p.error) setError('Rode a migration_16_portals.sql no Supabase para ativar o portal dos parceiros.');
    else { setError(''); setPartners((p.data as Partner[]) || []); }
    setRequests((r.data as RestockRequest[]) || []);
    setLoading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      commission_pct: Number(form.commission_pct) || 0,
      monthly_goal: Number(form.monthly_goal) || 0,
      affiliate_code: form.affiliate_code.trim() || null,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = editingId
      ? await supabase.from('partners').update(payload).eq('id', editingId)
      : await supabase.from('partners').insert([{ ...payload, status: 'ativo' }]);
    setSaving(false);
    if (err) { setError(`Não foi possível salvar: ${err.message}`); return; }
    setForm({ ...EMPTY });
    setEditingId(null);
    load();
  };

  const edit = (p: Partner) => {
    setEditingId(p.id);
    setForm({
      business_name: p.business_name, kind: p.kind, contact_name: p.contact_name || '', email: p.email,
      whatsapp: p.whatsapp || '', address: p.address || '', neighborhood: p.neighborhood || '',
      commission_pct: p.commission_pct, affiliate_code: p.affiliate_code || '', monthly_goal: p.monthly_goal,
      notes: p.notes || '', portal_message: p.portal_message || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setStatus = async (p: Partner, status: Partner['status']) => {
    const { error: err } = await supabase.from('partners').update({ status, updated_at: new Date().toISOString() }).eq('id', p.id);
    if (err) setError(`Não foi possível mudar o status: ${err.message}`);
    load();
  };

  const remove = async (p: Partner) => {
    if (!(await brandConfirm(`Remover ${p.business_name} dos parceiros? Os pedidos de reposição dele também saem.`, { danger: true, confirmLabel: 'Sim, remover' }))) return;
    await supabase.from('partners').delete().eq('id', p.id);
    load();
  };

  const advanceRequest = async (r: RestockRequest) => {
    const next: Record<RestockRequest['status'], RestockRequest['status']> = { novo: 'confirmado', confirmado: 'entregue', entregue: 'entregue', cancelado: 'novo' };
    await supabase.from('partner_restock_requests').update({ status: next[r.status] }).eq('id', r.id);
    load();
  };

  const shown = useMemo(() => partners.filter(p => filter === 'todos' || p.status === filter), [partners, filter]);
  const pendingCount = partners.filter(p => p.status === 'pendente').length;
  const openRequests = requests.filter(r => r.status === 'novo' || r.status === 'confirmado');
  const byId = useMemo(() => new Map(partners.map(p => [p.id, p])), [partners]);

  return (
    <div style={{ maxWidth: '1400px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Parceiros</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: '820px' }}>
        Hotéis, pousadas, Airbnbs, restaurantes, padarias e afiliados. Quem está aqui entra em{' '}
        <code>/parceiro</code> com o e-mail cadastrado e vê a própria parceria, pede reposição e acompanha a meta.
      </p>

      {error && <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', background: '#fff4e5', color: '#7a4a00', border: '1px solid #f0d9b5' }}>⚠️ {error}</div>}

      {/* Restock requests first: they're the thing that needs an answer today. */}
      {openRequests.length > 0 && (
        <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '5px solid #e2792a' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#2c3e50', marginBottom: '1rem' }}>🛒 Pedidos de reposição em aberto</h2>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {openRequests.map(r => {
              const p = byId.get(r.partner_id);
              const st = RESTOCK_STATUS[r.status];
              return (
                <div key={r.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', border: '1px solid #eef1f4', borderRadius: '10px', padding: '0.8rem 1rem' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <strong style={{ color: '#2c3e50' }}>{p?.business_name || 'Parceiro'}</strong>
                    <span style={{ display: 'block', color: '#2c3e50', lineHeight: 1.6 }}>{r.items}</span>
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#95a5a6' }}>
                      {r.wanted_date ? `para ${new Date(r.wanted_date + 'T00:00:00').toLocaleDateString('pt-BR')} · ` : ''}
                      pedido em {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      {r.notes ? ` · ${r.notes}` : ''}
                    </span>
                  </div>
                  <span style={{ background: st.bg, color: st.color, fontSize: '0.78rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '20px' }}>{st.label}</span>
                  <button onClick={() => advanceRequest(r)} style={dark}>
                    {r.status === 'novo' ? 'Confirmar' : 'Marcar entregue'}
                  </button>
                  {p?.whatsapp && (
                    <a href={`https://wa.me/${p.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ ...dark, background: '#25D366', textDecoration: 'none' }}>WhatsApp</a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wide screens: the form on the left, the partner list beside it, so a new partner shows up without scrolling */}
      <style dangerouslySetInnerHTML={{ __html: `
        .partners-split { display: grid; gap: 1.5rem; grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 1280px) { .partners-split { grid-template-columns: minmax(440px, 5fr) minmax(0, 6fr); align-items: start; } }
      ` }} />
      <div className="partners-split">
      {/* Add / edit */}
      <form onSubmit={save} style={{ ...card, minWidth: 0 }}>
        <h2 style={{ fontSize: '1.15rem', color: '#2c3e50', marginBottom: '1.25rem' }}>
          {editingId ? 'Editar parceiro' : 'Novo parceiro'}
        </h2>

        {/* 2 columns on desktop, 1 on mobile */}
        <div className="partner-form-grid">
          {/* Row 1: business name + type */}
          <div><label style={lbl}>Nome do negócio *</label>
            <input required type="text" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} style={field} /></div>
          <div><label style={lbl}>Tipo</label>
            <select value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value })} style={field}>
              {PARTNER_KINDS.map(k => <option key={k.id} value={k.id}>{k.emoji} {k.label}</option>)}
            </select></div>

          {/* Row 2: contact person + email */}
          <div><label style={lbl}>Pessoa de contato</label>
            <input type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} style={field} /></div>
          <div><label style={lbl}>E-mail de acesso *</label>
            <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={field} />
            <small style={{ color: '#95a5a6' }}>É com este e-mail que a pessoa entra no portal.</small></div>

          {/* Row 3: whatsapp + address */}
          <div><label style={lbl}>WhatsApp</label>
            <input type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} style={field} /></div>
          <div><label style={lbl}>Endereço</label>
            <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} style={field} /></div>

          {/* Row 4: neighbourhood + commission */}
          <div><label style={lbl}>Bairro / praia</label>
            <input type="text" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="Itamambuca" style={field} /></div>
          <div><label style={lbl}>Comissão / margem (%)</label>
            <input type="number" step="0.5" min="0" value={form.commission_pct} onChange={e => setForm({ ...form, commission_pct: Number(e.target.value) })} style={field} /></div>

          {/* Row 5: affiliate code + monthly goal */}
          <div><label style={lbl}>Código de afiliado</label>
            <input type="text" value={form.affiliate_code} onChange={e => setForm({ ...form, affiliate_code: e.target.value.toUpperCase().replace(/\s/g, '') })} placeholder="POUSADADOSOL" style={field} />
            <small style={{ color: '#95a5a6' }}>Só para afiliados. O cliente digita no checkout.</small></div>
          <div><label style={lbl}>Meta de reposições no mês</label>
            <input type="number" min="0" value={form.monthly_goal} onChange={e => setForm({ ...form, monthly_goal: Number(e.target.value) })} style={field} /></div>
        </div>

        {/* Textareas side by side (same 2-col grid) */}
        <div className="partner-form-grid" style={{ marginTop: '1rem' }}>
          <div><label style={lbl}>Recado para o parceiro (aparece no portal dele)</label>
            <textarea rows={3} value={form.portal_message} onChange={e => setForm({ ...form, portal_message: e.target.value })} style={{ ...field, resize: 'vertical' }} /></div>
          <div><label style={lbl}>Anotações internas (o parceiro não vê)</label>
            <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} style={{ ...field, resize: 'vertical' }} /></div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button type="submit" disabled={saving} style={{ ...dark, background: '#d4af37' }}>{saving ? 'Salvando…' : editingId ? 'Salvar alterações' : 'Adicionar parceiro'}</button>
          {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ ...EMPTY }); }} style={{ ...dark, background: '#95a5a6' }}>Cancelar</button>}
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .partner-form-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
          @media (min-width: 640px) { .partner-form-grid { grid-template-columns: 1fr 1fr; } }
        ` }} />
      </form>

      {/* List */}
      <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {(['todos', 'pendente', 'ativo', 'pausado'] as const).map(f => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            style={{ padding: '0.45rem 1rem', borderRadius: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem',
              border: filter === f ? '2px solid #d4af37' : '1px solid #dfe4ea', background: filter === f ? '#fdf6dd' : '#fff', color: '#2c3e50' }}>
            {f === 'todos' ? `Todos (${partners.length})` : `${PARTNER_STATUS[f].label} (${partners.filter(p => p.status === f).length})`}
          </button>
        ))}
        {pendingCount > 0 && <span style={{ color: '#e2792a', fontWeight: 'bold', fontSize: '0.9rem' }}>⚠️ {pendingCount} esperando aprovação</span>}
      </div>

      {loading ? <p>Carregando…</p> : shown.length === 0 ? (
        <p style={{ color: '#95a5a6' }}>Nenhum parceiro aqui ainda.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' }}>
          {shown.map(p => {
            const st = PARTNER_STATUS[p.status];
            const k = partnerKind(p.kind);
            const theirRequests = requests.filter(r => r.partner_id === p.id);
            return (
              <div key={p.id} style={{ ...card, borderLeft: `5px solid ${p.status === 'ativo' ? '#27ae60' : p.status === 'pendente' ? '#e2792a' : '#bdc3c7'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', color: '#2c3e50' }}>{k.emoji} {p.business_name}</h3>
                  <span style={{ background: st.bg, color: st.color, fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.7rem', borderRadius: '20px' }}>{st.label}</span>
                </div>
                <p style={{ color: '#7f8c8d', fontSize: '0.88rem', lineHeight: 1.7 }}>
                  {p.contact_name ? `${p.contact_name} · ` : ''}{p.email}
                  {p.whatsapp ? ` · ${p.whatsapp}` : ''}
                  {p.neighborhood ? ` · ${p.neighborhood}` : ''}
                </p>
                <p style={{ color: '#7f8c8d', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                  {p.commission_pct > 0 && <>Comissão {p.commission_pct}% · </>}
                  {p.affiliate_code && <>Código <strong>{p.affiliate_code}</strong> · </>}
                  {p.monthly_goal > 0 && <>Meta {p.monthly_goal}/mês · </>}
                  {theirRequests.length} pedido(s)
                </p>
                {p.notes && <p style={{ color: '#95a5a6', fontSize: '0.82rem', marginTop: '0.5rem', fontStyle: 'italic' }}>{p.notes}</p>}

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <button onClick={() => edit(p)} style={{ ...dark, background: '#3498db' }}>Editar</button>
                  {p.status !== 'ativo' && <button onClick={() => setStatus(p, 'ativo')} style={{ ...dark, background: '#27ae60' }}>Ativar</button>}
                  {p.status === 'ativo' && <button onClick={() => setStatus(p, 'pausado')} style={{ ...dark, background: '#95a5a6' }}>Pausar</button>}
                  <button onClick={() => remove(p)} style={{ ...dark, background: '#e74c3c' }}>Excluir</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>
      </div>

      {/* Affiliate note */}
      <div style={{ ...card, marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.05rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Como a comissão dos afiliados é contada</h2>
        <p style={{ color: '#7f8c8d', fontSize: '0.9rem', lineHeight: 1.7 }}>
          O cliente digita o código do afiliado no checkout. Cada pedido com aquele código entra na conta do afiliado,
          e o portal dele mostra o total de vendas e a comissão (vendas × comissão %).
          O pagamento em si você combina com ele — o site não transfere dinheiro.
        </p>
      </div>
    </div>
  );
}
