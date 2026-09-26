'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Subscription, SubscriptionStatus, STATUS_LABELS, DIETARY_FIELDS } from '@/lib/subscriptions';
import { getZone, formatBRL } from '@/lib/deliveryZones';

interface DeliveryRow {
  id: string;
  subscription_id: string;
  delivery_date: string;
  status: string;
  boxes: number;
  notes: string | null;
  subscriptions: Subscription | null;
}

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

const formatDate = (v: string | null) =>
  v ? new Date(v + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Boxes go out on Saturdays. */
function nextSaturday(): string {
  const d = new Date();
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

const restrictionsOf = (s: Subscription) =>
  DIETARY_FIELDS.filter(f => s[f.key]).map(f => f.label);

const card: React.CSSProperties = {
  background: 'white', padding: '1.5rem', borderRadius: '12px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
};

export default function SubscriptionsAdmin() {
  const [tab, setTab] = useState<'subscribers' | 'roster'>('subscribers');
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [rosterDate, setRosterDate] = useState(nextSaturday());
  const [roster, setRoster] = useState<DeliveryRow[]>([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterMsg, setRosterMsg] = useState('');

  const loadSubs = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) {
      console.error(err);
      setError('Não foi possível carregar as assinaturas.');
    } else {
      setSubs((data || []) as Subscription[]);
    }
    setLoading(false);
  }, []);

  const loadRoster = useCallback(async (date: string) => {
    setRosterLoading(true);
    const { data, error: err } = await supabase
      .from('subscription_deliveries')
      .select('*, subscriptions(*)')
      .eq('delivery_date', date);

    if (err) console.error(err);
    setRoster(((data || []) as DeliveryRow[]).filter(r => r.subscriptions));
    setRosterLoading(false);
  }, []);

  useEffect(() => { loadSubs(); }, [loadSubs]);
  useEffect(() => { if (tab === 'roster') loadRoster(rosterDate); }, [tab, rosterDate, loadRoster]);

  const setStatus = async (id: string, status: SubscriptionStatus) => {
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'active') patch.started_on = new Date().toISOString().slice(0, 10);
    if (status === 'cancelled') patch.cancelled_on = new Date().toISOString().slice(0, 10);

    const { error: err } = await supabase.from('subscriptions').update(patch).eq('id', id);
    if (err) {
      console.error(err);
      setError('Não foi possível atualizar. Tente de novo.');
      return;
    }
    loadSubs();
  };

  const buildRoster = async () => {
    setRosterMsg('');
    const { data, error: err } = await supabase.rpc('generate_delivery_roster', { p_date: rosterDate });
    if (err) {
      console.error(err);
      setRosterMsg('Não foi possível gerar o roteiro.');
      return;
    }
    setRosterMsg(`${data ?? 0} entrega(s) adicionada(s) ao roteiro.`);
    loadRoster(rosterDate);
  };

  const markDelivery = async (id: string, status: string) => {
    const { error: err } = await supabase.from('subscription_deliveries').update({ status }).eq('id', id);
    if (err) { console.error(err); return; }
    loadRoster(rosterDate);
  };

  const stats = useMemo(() => {
    const active = subs.filter(s => s.status === 'active');
    return {
      pending: subs.filter(s => s.status === 'pending').length,
      active: active.length,
      paused: subs.filter(s => s.status === 'paused').length,
      boxesPerWeek: active.reduce((n, s) => n + (s.boxes_per_week || 1), 0),
      mrr: active.reduce((n, s) => n + Number(s.monthly_price || 0), 0),
    };
  }, [subs]);

  /** Everything the kitchen and the shopper need for one Saturday. */
  const rosterSummary = useMemo(() => {
    const totalBoxes = roster.reduce((n, r) => n + (r.boxes || 1), 0);
    const counts: Record<string, number> = {};
    const allergyNotes: string[] = [];

    for (const r of roster) {
      const s = r.subscriptions!;
      for (const label of restrictionsOf(s)) {
        counts[label] = (counts[label] || 0) + (r.boxes || 1);
      }
      if (s.allergies) allergyNotes.push(`${s.full_name}: ${s.allergies}`);
    }
    return { totalBoxes, counts, allergyNotes };
  }, [roster]);

  /** Group the route by delivery area so nobody drives the coast twice. */
  const rosterByZone = useMemo(() => {
    const groups = new Map<string, DeliveryRow[]>();
    for (const r of roster) {
      const label = getZone(r.subscriptions?.delivery_zone)?.label ?? 'Região não informada';
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(r);
    }
    return [...groups.entries()];
  }, [roster]);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando assinaturas...</div>;

  return (
    <div>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Assinaturas 📦🧁</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '2rem', lineHeight: 1.7 }}>
        A Caixa de Degustação Semanal. Assinantes novos entram como{' '}
        <strong>aguardando pagamento</strong> — confirme o Pix pelo WhatsApp e marque como ativa.
      </p>

      {error && (
        <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', color: '#a03027', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Headline numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Ativas', value: String(stats.active) },
          { label: 'Aguardando', value: String(stats.pending) },
          { label: 'Pausadas', value: String(stats.paused) },
          { label: 'Caixas/semana', value: String(stats.boxesPerWeek) },
          { label: 'Receita/mês', value: formatBRL(stats.mrr) },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: '1.25rem' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#2c3e50' }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        {([['subscribers', 'Assinantes'], ['roster', 'Roteiro da Semana']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{
              padding: '0.7rem 1.4rem', borderRadius: '8px', cursor: 'pointer',
              border: '1px solid', borderColor: tab === key ? '#2c3e50' : '#dfe4ea',
              background: tab === key ? '#2c3e50' : 'white',
              color: tab === key ? 'white' : '#7f8c8d', fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ----------------------------------------------------- SUBSCRIBERS */}
      {tab === 'subscribers' && (
        subs.length === 0 ? (
          <div style={{ ...card, padding: '3rem', textAlign: 'center', color: '#7f8c8d' }}>
            Ainda não há assinaturas. Elas aparecem aqui assim que alguém reservar em /assinatura.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {subs.map(s => {
              const badge = STATUS_LABELS[s.status] ?? STATUS_LABELS.pending;
              const zone = getZone(s.delivery_zone);
              const restrictions = restrictionsOf(s);

              return (
                <div key={s.id} style={{ ...card, display: 'flex', gap: '1.75rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ flex: '1 1 250px', minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      <h3 style={{ fontSize: '1.15rem', margin: 0, color: '#2c3e50' }}>{s.full_name}</h3>
                      <span style={{ background: badge.bg, color: badge.color, padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {badge.label}
                      </span>
                      <span style={{ background: '#f1f2f6', color: '#576574', padding: '0.15rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {s.plan_id}
                      </span>
                    </div>
                    <div style={{ color: '#7f8c8d', fontSize: '0.9rem', lineHeight: 1.9, wordBreak: 'break-word' }}>
                      <div>📱 {formatPhone(s.whatsapp_number)}</div>
                      {s.email && <div>✉️ {s.email}</div>}
                      <div>📍 {s.address_oneline || '—'}</div>
                      {s.address_reference && <div style={{ fontStyle: 'italic' }}>🧭 {s.address_reference}</div>}
                      <div>🚚 {zone?.label ?? '—'}</div>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 210px' }}>
                    <div style={{ fontSize: '0.9rem', color: '#2c3e50', lineHeight: 1.9 }}>
                      <div><strong>{s.boxes_per_week}</strong> caixa(s)/semana</div>
                      <div>{formatBRL(Number(s.monthly_price || 0))}/mês</div>
                      <div style={{ color: '#7f8c8d' }}>Próxima: {formatDate(s.next_delivery_on)}</div>
                      {s.committed_until && <div style={{ color: '#7f8c8d', fontSize: '0.82rem' }}>Compromisso até {formatDate(s.committed_until)}</div>}
                      {s.paused_until && <div style={{ color: '#b9770e', fontSize: '0.82rem' }}>Pausada até {formatDate(s.paused_until)}</div>}
                    </div>

                    {(restrictions.length > 0 || s.allergies) && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {restrictions.map(t => (
                          <span key={t} style={{ background: '#fdf7ee', color: '#d4af37', border: '1px solid #e8e1d7', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 'bold' }}>{t}</span>
                        ))}
                      </div>
                    )}
                    {s.allergies && (
                      <p style={{ marginTop: '0.6rem', background: '#fdecea', color: '#a03027', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600 }}>
                        ⚠ Alergias: {s.allergies}
                      </p>
                    )}
                    {s.customer_message && (
                      <p style={{ marginTop: '0.6rem', color: '#576574', fontSize: '0.82rem', fontStyle: 'italic' }}>
                        “{s.customer_message}”
                      </p>
                    )}
                  </div>

                  <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <a
                      href={waLink(s.whatsapp_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: '#25D366', color: 'white', padding: '0.7rem 1.2rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold', textAlign: 'center', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
                    >
                      WhatsApp
                    </a>
                    {s.status !== 'active' && (
                      <button onClick={() => setStatus(s.id, 'active')} style={{ background: '#10ac84', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                        Marcar ativa
                      </button>
                    )}
                    {s.status === 'active' && (
                      <button onClick={() => setStatus(s.id, 'paused')} style={{ background: 'white', color: '#576574', border: '1px solid #dfe4ea', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                        Pausar
                      </button>
                    )}
                    {s.status !== 'cancelled' && (
                      <button onClick={() => setStatus(s.id, 'cancelled')} style={{ background: 'none', color: '#a03027', border: 'none', padding: '0.3rem', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* --------------------------------------------------------- ROSTER */}
      {tab === 'roster' && (
        <div>
          <div style={{ ...card, marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>
                Data da entrega
              </label>
              <input
                type="date"
                value={rosterDate}
                onChange={e => setRosterDate(e.target.value)}
                style={{ padding: '0.7rem', border: '1px solid #dfe4ea', borderRadius: '8px', fontSize: '1rem' }}
              />
            </div>
            <button onClick={buildRoster} style={{ background: '#2c3e50', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}>
              Gerar roteiro desta data
            </button>
            {rosterMsg && <span style={{ color: '#10ac84', fontSize: '0.9rem' }}>{rosterMsg}</span>}
          </div>

          {rosterLoading ? (
            <div style={{ ...card }}>Carregando roteiro...</div>
          ) : roster.length === 0 ? (
            <div style={{ ...card, padding: '3rem', textAlign: 'center', color: '#7f8c8d' }}>
              Nenhuma entrega para esta data. Clique em <strong>Gerar roteiro desta data</strong> para
              montar a lista a partir das assinaturas ativas.
            </div>
          ) : (
            <>
              {/* The shopping brief */}
              <div style={{ ...card, marginBottom: '1.5rem', borderLeft: '5px solid #d4af37' }}>
                <h3 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '1rem' }}>
                  Resumo da produção — {formatDate(rosterDate)}
                </h3>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2c3e50', margin: 0 }}>
                  {rosterSummary.totalBoxes} caixas
                </p>
                <p style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  para {roster.length} assinante(s)
                </p>

                {Object.keys(rosterSummary.counts).length > 0 && (
                  <>
                    <p style={{ fontSize: '0.75rem', color: '#95a5a6', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
                      Restrições a respeitar
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                      {Object.entries(rosterSummary.counts).map(([label, n]) => (
                        <span key={label} style={{ background: '#fdf7ee', color: '#b9870e', border: '1px solid #e8e1d7', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                          {label}: {n}
                        </span>
                      ))}
                    </div>
                  </>
                )}

                {rosterSummary.allergyNotes.length > 0 && (
                  <div style={{ background: '#fdecea', border: '1px solid #f5c6cb', borderRadius: '8px', padding: '1rem' }}>
                    <p style={{ color: '#a03027', fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                      ⚠ Alergias — confira antes de comprar e antes de embalar
                    </p>
                    {rosterSummary.allergyNotes.map(n => (
                      <div key={n} style={{ color: '#a03027', fontSize: '0.88rem', lineHeight: 1.7 }}>• {n}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Route, grouped by area */}
              {rosterByZone.map(([zoneLabel, rows]) => (
                <div key={zoneLabel} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', color: '#2c3e50', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                    {zoneLabel} · {rows.reduce((n, r) => n + (r.boxes || 1), 0)} caixa(s)
                  </h3>
                  <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {rows.map(r => {
                      const s = r.subscriptions!;
                      const restrictions = restrictionsOf(s);
                      return (
                        <div key={r.id} style={{ ...card, padding: '1.1rem 1.25rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap', alignItems: 'center', opacity: r.status === 'delivered' ? 0.6 : 1 }}>
                          <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                              {s.full_name} <span style={{ color: '#7f8c8d', fontWeight: 400 }}>· {r.boxes} caixa(s)</span>
                            </div>
                            <div style={{ color: '#7f8c8d', fontSize: '0.86rem', lineHeight: 1.6 }}>
                              {s.address_oneline}
                              {s.address_reference && <div style={{ fontStyle: 'italic' }}>🧭 {s.address_reference}</div>}
                            </div>
                            {(restrictions.length > 0 || s.allergies) && (
                              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem' }}>
                                {restrictions.length > 0 && <span style={{ color: '#b9870e', fontWeight: 600 }}>{restrictions.join(' · ')}</span>}
                                {s.allergies && <span style={{ color: '#a03027', fontWeight: 700 }}>{restrictions.length ? ' · ' : ''}⚠ {s.allergies}</span>}
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <a href={waLink(s.whatsapp_number)} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366', color: 'white', padding: '0.5rem 0.9rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem' }}>
                              WhatsApp
                            </a>
                            {r.status !== 'prepared' && r.status !== 'delivered' && (
                              <button onClick={() => markDelivery(r.id, 'prepared')} style={{ background: '#fdf7ee', color: '#b9870e', border: '1px solid #e8e1d7', padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                                Pronta
                              </button>
                            )}
                            {r.status !== 'delivered' && (
                              <button onClick={() => markDelivery(r.id, 'delivered')} style={{ background: '#10ac84', color: 'white', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                                Entregue
                              </button>
                            )}
                            {r.status === 'delivered' && (
                              <span style={{ color: '#10ac84', fontWeight: 700, fontSize: '0.85rem', alignSelf: 'center' }}>✓ Entregue</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
