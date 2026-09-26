'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PickupInfoAdmin from '@/components/PickupInfoAdmin';
import {
  ScheduleRule, DateOverride, WEEKDAY_NAMES, describeRule, dayState, overrideMap,
  openDatesBetween, toISODate, parseISODate,
} from '@/lib/deliverySchedule';
import { brandConfirm } from '@/lib/brandDialog';

const WEEKDAY = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_NAME = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '1.5rem' };
const field: React.CSSProperties = { padding: '0.65rem', borderRadius: '8px', border: '1px solid #dfe4ea', background: 'white', fontSize: '0.95rem' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.78rem', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '0.3rem' };
const dark: React.CSSProperties = { background: '#2c3e50', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

const EMPTY_RULE = { frequency: 'weekly' as 'weekly' | 'monthly', weekday: 5, interval_weeks: 1, month_nth: 1, start_date: toISODate(new Date()), end_date: '', notes: '' };

export default function DeliveryCalendarAdmin() {
  const [monthOffset, setMonthOffset] = useState(0);
  const [rules, setRules] = useState<ScheduleRule[]>([]);
  const [overrides, setOverrides] = useState<DateOverride[]>([]);
  const [notifiedSet, setNotifiedSet] = useState<Set<string>>(new Set());
  const [leadDays, setLeadDays] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [problems, setProblems] = useState<string[]>([]);
  const [dayMessage, setDayMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notifyResult, setNotifyResult] = useState('');
  const [selectedNote, setSelectedNote] = useState<{ date: string; text: string } | null>(null);
  const [rule, setRule] = useState(EMPTY_RULE);
  const [savingRule, setSavingRule] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [rulesRes, datesRes, notifRes, leadRes] = await Promise.all([
      supabase.from('delivery_schedule_rules').select('*').order('created_at'),
      supabase.from('delivery_dates').select('*'),
      supabase.from('delivery_notifications').select('delivery_date'),
      supabase.from('site_settings').select('value').eq('key', 'delivery_lead_days').maybeSingle(),
    ]);
    // Which database steps are missing? Say so plainly instead of failing silently.
    const missing: string[] = [];
    if (rulesRes.error) missing.push('Regras de entrega — rode a migration_12_delivery_schedule.sql');
    if (datesRes.error) missing.push('Dias do calendário — rode a migration_08_delivery_calendar.sql');
    if (notifRes.error) missing.push('Registro de avisos — rode a migration_12_delivery_schedule.sql');
    setProblems(missing);
    if (!rulesRes.error) setRules((rulesRes.data as ScheduleRule[]) || []);
    const dates = (datesRes.data as DateOverride[]) || [];
    setOverrides(dates);
    setNotifiedSet(new Set([
      ...((notifRes.data || []) as { delivery_date: string }[]).map(n => n.delivery_date),
      ...dates.filter(d => d.notified_at).map(d => d.delivery_date),
    ]));
    if (leadRes.data) setLeadDays(Number(leadRes.data.value));
    setLoading(false);
  };

  const activeRules = rules.filter(r => r.is_active);
  const map = useMemo(() => overrideMap(overrides), [overrides]);

  // ---------------------------------------------------------------- per-day toggle
  const toggleDate = async (iso: string) => {
    const { state, fromRule, override } = dayState(iso, activeRules, map);
    setSaving(iso);
    setDayMessage(null);
    let err: { message: string } | null = null;
    let result = '';
    if (state === 'open') {
      // Close it: block if a rule would otherwise produce it, else just drop the manual opening.
      ({ error: err } = fromRule
        ? await supabase.from('delivery_dates').upsert({ delivery_date: iso, is_open: false, notes: override?.notes || null }, { onConflict: 'delivery_date' })
        : await supabase.from('delivery_dates').delete().eq('delivery_date', iso));
      result = fromRule ? 'bloqueado' : 'fechado';
    } else if (state === 'blocked' && fromRule) {
      // Un-block: go back to whatever the rule says.
      ({ error: err } = await supabase.from('delivery_dates').delete().eq('delivery_date', iso));
      result = 'liberado de novo (volta a seguir a regra)';
    } else {
      ({ error: err } = await supabase.from('delivery_dates').upsert({ delivery_date: iso, is_open: true, notes: override?.notes || null }, { onConflict: 'delivery_date' }));
      result = 'aberto para entrega';
    }
    const label = parseISODate(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    if (err) {
      console.error('Calendar save failed:', err);
      setDayMessage({ ok: false, text: `Não foi possível salvar ${label}: ${err.message}` });
    } else {
      setDayMessage({ ok: true, text: `${label} — ${result} ✓` });
    }
    await load();
    setSaving(null);
  };

  const saveNote = async () => {
    if (!selectedNote) return;
    const { error: err } = await supabase.from('delivery_dates').upsert(
      { delivery_date: selectedNote.date, is_open: true, notes: selectedNote.text || null },
      { onConflict: 'delivery_date' },
    );
    if (err) setError(`Não foi possível salvar a nota: ${err.message}`);
    setSelectedNote(null);
    load();
  };

  // ---------------------------------------------------------------- rules
  const addRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRule(true);
    const { error: err } = await supabase.from('delivery_schedule_rules').insert([{
      frequency: rule.frequency,
      weekday: rule.weekday,
      interval_weeks: rule.frequency === 'weekly' ? rule.interval_weeks : 1,
      month_nth: rule.frequency === 'monthly' ? rule.month_nth : null,
      start_date: rule.start_date,
      end_date: rule.end_date || null,
      notes: rule.notes || null,
    }]);
    setSavingRule(false);
    if (err) {
      setError(`Não foi possível criar a regra: ${err.message}. Confirme que a migration_12_delivery_schedule.sql foi executada.`);
      return;
    }
    setRule({ ...EMPTY_RULE });
    load();
  };

  const toggleRule = async (r: ScheduleRule) => {
    const { error: err } = await supabase.from('delivery_schedule_rules').update({ is_active: !r.is_active }).eq('id', r.id);
    if (err) setError(`Não foi possível ${r.is_active ? 'pausar' : 'reativar'} a regra: ${err.message}`);
    load();
  };

  const removeRule = async (r: ScheduleRule) => {
    if (!(await brandConfirm(`Apagar a regra "${describeRule(r)}"? Os dias que ela gerava deixam de estar abertos.`, { danger: true, confirmLabel: 'Sim, remover' }))) return;
    const { error: err } = await supabase.from('delivery_schedule_rules').delete().eq('id', r.id);
    if (err) setError(`Não foi possível apagar a regra: ${err.message}`);
    load();
  };

  const endRuleToday = async (r: ScheduleRule) => {
    const { error: err } = await supabase.from('delivery_schedule_rules').update({ end_date: toISODate(new Date()) }).eq('id', r.id);
    if (err) setError(`Não foi possível encerrar a regra: ${err.message}`);
    load();
  };

  const saveLead = async () => {
    const { error: err } = await supabase.from('site_settings').update({ value: leadDays, updated_at: new Date().toISOString() }).eq('key', 'delivery_lead_days');
    if (err) { setError(`Não foi possível salvar: ${err.message}`); return; }
    setLeadSaved(true);
    setTimeout(() => setLeadSaved(false), 2000);
  };

  // ---------------------------------------------------------------- notify
  const today = toISODate(new Date());
  const horizon = toISODate(new Date(Date.now() + 56 * 86400000));
  const upcomingOpen = useMemo(() => openDatesBetween(activeRules, overrides, today, horizon), [activeRules, overrides, today, horizon]);
  const unnotified = upcomingOpen.filter(d => !notifiedSet.has(d));
  const fmtShort = (iso: string) => parseISODate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

  const notifyCustomers = async () => {
    setNotifying(true);
    setNotifyResult('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ campaignId: 'delivery-dates', values: { dates: unnotified.join(',') } }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Falha ao enviar');

      // Remember which dates have been announced, so the list above doesn't offer them again.
      await supabase.from('delivery_notifications').upsert(
        unnotified.map(d => ({ delivery_date: d, notified_at: new Date().toISOString() })),
        { onConflict: 'delivery_date' },
      );

      setNotifyResult(
        `✅ E-mail enviado para ${json.sent} cliente(s).` +
        (json.skipped ? ` ${json.skipped} já tinham recebido este aviso.` : '') +
        (json.remaining ? ` Faltam ${json.remaining} — clique de novo para continuar.` : ''),
      );
      load();
    } catch (err) {
      setNotifyResult(`❌ ${err instanceof Error ? err.message : 'Falha ao enviar'}`);
    }
    setNotifying(false);
  };

  const whatsappMessage = unnotified.length > 0
    ? `Oi! 🌴 Já temos as próximas datas de entrega da Caixa de Degustação: ${unnotified.slice(0, 6).map(fmtShort).join(', ')}. Garanta a sua: https://thetropicalbakery.com/caixas`
    : '';

  // ---------------------------------------------------------------- render
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(year, month, i + 1)))];

  return (
    <div style={{ maxWidth: '1500px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Calendário de Entregas das Caixas</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: '900px' }}>
        Vale só para a <strong>Caixa de Degustação</strong> (pedido avulso e assinatura). Os itens do Menu de Eventos
        têm a data combinada por fora e não usam este calendário. Defina uma regra (ex.: toda sexta) e ajuste
        dias soltos no calendário abaixo.
      </p>

      {error && (
        <div role="alert" style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 10000, maxWidth: '420px', padding: '1rem 1.25rem', borderRadius: '10px', background: '#ffebee', color: '#c62828', border: '1px solid #ef9a9a', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ flex: 1, lineHeight: 1.5 }}>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Fechar" style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1 }}>✕</button>
        </div>
      )}
      {problems.length > 0 && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', background: '#fff4e5', color: '#7a4a00', border: '1px solid #f0d9b5', lineHeight: 1.7 }}>
          <strong>⚠️ Falta uma etapa no banco de dados, por isso alguns botões não salvam:</strong>
          <ul style={{ margin: '0.5rem 0 0 1.1rem', padding: 0 }}>
            {problems.map(p => <li key={p}>{p}</li>)}
          </ul>
          <span style={{ fontSize: '0.85rem' }}>No Supabase: SQL Editor → cole o conteúdo do arquivo → Run.</span>
        </div>
      )}

      <style>{`
        .cal-cols { display: grid; grid-template-columns: minmax(0, 1fr); gap: 0 1.75rem; align-items: start; }
        .cal-col-right { order: -1; }
        @media (min-width: 1100px) {
          .cal-cols { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
          .cal-col-right { order: 0; }
        }
      `}</style>

      <div className="cal-cols">
      <div className="cal-col">
      {/* ---------- Rules */}
      <div style={card}>
        <h2 style={{ fontSize: '1.15rem', color: '#2c3e50', marginBottom: '1rem' }}>Regras de entrega</h2>

        {rules.length === 0 ? (
          <p style={{ color: '#95a5a6', fontSize: '0.9rem', marginBottom: '1rem' }}>Nenhuma regra ainda. Crie uma abaixo — por exemplo, “toda sexta, a partir de hoje”.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.6rem', marginBottom: '1.25rem' }}>
            {rules.map(r => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', padding: '0.75rem 1rem', borderRadius: '10px', background: r.is_active ? '#f0faf4' : '#f5f5f5', border: '1px solid #e0e6ea', opacity: r.is_active ? 1 : 0.6 }}>
                <div>
                  <strong style={{ color: '#2c3e50' }}>{describeRule(r)}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>
                    a partir de {parseISODate(r.start_date).toLocaleDateString('pt-BR')}
                    {r.end_date ? ` até ${parseISODate(r.end_date).toLocaleDateString('pt-BR')}` : ' · sem data final'}
                    {r.notes ? ` · ${r.notes}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button onClick={() => toggleRule(r)} style={{ ...field, cursor: 'pointer' }}>{r.is_active ? 'Pausar' : 'Reativar'}</button>
                  {!r.end_date && <button onClick={() => endRuleToday(r)} style={{ ...field, cursor: 'pointer' }}>Encerrar hoje</button>}
                  <button onClick={() => removeRule(r)} style={{ ...field, cursor: 'pointer', color: '#c0392b' }}>Apagar</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addRule} style={{ borderTop: '1px solid #eef1f4', paddingTop: '1.25rem' }}>
          <p style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.95rem', marginBottom: '0.9rem' }}>Nova regra</p>
          <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <label style={lbl}>Repetição</label>
              <select style={field} value={rule.frequency} onChange={e => setRule({ ...rule, frequency: e.target.value as 'weekly' | 'monthly' })}>
                <option value="weekly">Toda semana / a cada N semanas</option>
                <option value="monthly">Uma vez por mês</option>
              </select>
            </div>
            {rule.frequency === 'monthly' && (
              <div>
                <label style={lbl}>Qual</label>
                <select style={field} value={rule.month_nth} onChange={e => setRule({ ...rule, month_nth: Number(e.target.value) })}>
                  <option value={1}>1º</option><option value={2}>2º</option><option value={3}>3º</option><option value={4}>4º</option><option value={-1}>Último</option>
                </select>
              </div>
            )}
            <div>
              <label style={lbl}>Dia da semana</label>
              <select style={field} value={rule.weekday} onChange={e => setRule({ ...rule, weekday: Number(e.target.value) })}>
                {WEEKDAY_NAMES.map((n, i) => <option key={i} value={i}>{n[0].toUpperCase() + n.slice(1)}</option>)}
              </select>
            </div>
            {rule.frequency === 'weekly' && (
              <div>
                <label style={lbl}>Frequência</label>
                <select style={field} value={rule.interval_weeks} onChange={e => setRule({ ...rule, interval_weeks: Number(e.target.value) })}>
                  <option value={1}>Toda semana</option>
                  <option value={2}>A cada 2 semanas</option>
                  <option value={3}>A cada 3 semanas</option>
                  <option value={4}>A cada 4 semanas</option>
                </select>
              </div>
            )}
            <div>
              <label style={lbl}>A partir de</label>
              <input type="date" style={field} value={rule.start_date} onChange={e => setRule({ ...rule, start_date: e.target.value })} required />
            </div>
            <div>
              <label style={lbl}>Até (vazio = para sempre)</label>
              <input type="date" style={field} value={rule.end_date} min={rule.start_date} onChange={e => setRule({ ...rule, end_date: e.target.value })} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label style={lbl}>Nota (opcional)</label>
              <input type="text" style={{ ...field, width: '100%' }} value={rule.notes} placeholder="Ex: Edição Outono" onChange={e => setRule({ ...rule, notes: e.target.value })} />
            </div>
            <button type="submit" disabled={savingRule} style={dark}>{savingRule ? 'Salvando...' : 'Adicionar regra'}</button>
          </div>
          <p style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '0.8rem', lineHeight: 1.6 }}>
            “A cada 2 semanas” conta a partir do primeiro dia da semana escolhido depois da data inicial.
            Para entregar em mais de um dia (ex.: terça e sexta), crie uma regra para cada.
          </p>
        </form>
      </div>

      {/* ---------- Lead time */}
      <div style={{ ...card, display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={lbl}>Antecedência mínima do pedido (dias)</label>
          <input type="number" min={0} max={30} style={{ ...field, width: '110px' }} value={leadDays} onChange={e => setLeadDays(Number(e.target.value))} />
        </div>
        <button onClick={saveLead} style={dark}>{leadSaved ? 'Salvo ✓' : 'Salvar'}</button>
        <p style={{ fontSize: '0.8rem', color: '#95a5a6', flex: '1 1 240px', lineHeight: 1.6 }}>
          O cliente não consegue escolher uma data mais próxima que isso (a caixa precisa ser feita). Ex.: com 2, um pedido feito na quarta só pode ser entregue de sexta em diante.
        </p>
      </div>

      {/* ---------- Pickup address (private) */}
      <PickupInfoAdmin />

      </div>

      <div className="cal-col cal-col-right">
      {/* ---------- Calendar */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button onClick={() => setMonthOffset(m => m - 1)} style={{ background: '#f1f2f6', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>←</button>
          <h2 style={{ fontSize: '1.2rem', color: '#2c3e50' }}>{MONTH_NAME[month]} {year}</h2>
          <button onClick={() => setMonthOffset(m => m + 1)} style={{ background: '#f1f2f6', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}>→</button>
        </div>
        <p style={{ fontSize: '0.8rem', color: '#95a5a6', marginBottom: '1rem', lineHeight: 1.6 }}>
          Clique num dia para abrir ou bloquear só aquele dia (feriado, viagem…). Isso não muda a regra.
        </p>
        {dayMessage && (
          <div role="status" style={{ padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', fontWeight: 'bold', background: dayMessage.ok ? '#e8f5e9' : '#ffebee', color: dayMessage.ok ? '#2e7d32' : '#c62828', border: `1px solid ${dayMessage.ok ? '#a5d6a7' : '#ef9a9a'}` }}>
            {dayMessage.text}
          </div>
        )}

        {loading ? <p style={{ color: '#7f8c8d' }}>Carregando...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0.4rem' }}>
            {WEEKDAY.map(w => (
              <div key={w} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#95a5a6', fontWeight: 'bold', paddingBottom: '0.4rem' }}>{w}</div>
            ))}
            {cells.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const info = dayState(iso, activeRules, map);
              const isPast = iso < today;
              const extra = info.state === 'open' && !info.fromRule;
              let bg = '#fdf7ee', color = '#3c2a21';
              if (isPast) { bg = '#f1f2f6'; color = '#bdc3c7'; }
              else if (info.state === 'open') { bg = extra ? '#2a9d8f' : '#0b6b3a'; color = 'white'; }
              else if (info.state === 'blocked') { bg = '#fdecea'; color = '#c0392b'; }
              return (
                <div key={iso} style={{ position: 'relative' }}>
                  <button
                    onClick={() => !isPast && toggleDate(iso)}
                    disabled={isPast || saving === iso}
                    style={{
                      width: '100%', aspectRatio: '1.15', borderRadius: '10px', border: 'none', cursor: isPast ? 'default' : 'pointer',
                      background: bg, color, fontWeight: 700, fontSize: '0.95rem', opacity: saving === iso ? 0.5 : 1,
                      textDecoration: info.state === 'blocked' ? 'line-through' : 'none',
                    }}
                  >
                    {Number(iso.slice(-2))}
                  </button>
                  {info.state === 'open' && !isPast && (
                    <button
                      onClick={() => setSelectedNote({ date: iso, text: info.override?.notes || '' })}
                      title="Adicionar nota"
                      style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', borderRadius: '50%', border: 'none', background: '#d4af37', color: 'white', fontSize: '0.6rem', cursor: 'pointer', lineHeight: '18px' }}
                    >✎</button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', gap: '1.1rem', flexWrap: 'wrap', marginTop: '1.1rem', fontSize: '0.78rem', color: '#7f8c8d' }}>
          <span><b style={{ color: '#0b6b3a' }}>■</b> pela regra</span>
          <span><b style={{ color: '#2a9d8f' }}>■</b> dia extra (aberto à mão)</span>
          <span><b style={{ color: '#c0392b' }}>■</b> bloqueado</span>
        </div>
      </div>

      {selectedNote && (
        <div style={card}>
          <label style={lbl}>Nota para {parseISODate(selectedNote.date).toLocaleDateString('pt-BR')}</label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input type="text" value={selectedNote.text} onChange={e => setSelectedNote({ ...selectedNote, text: e.target.value })} placeholder="Ex: Edição Outono, só até 15h" style={{ ...field, flex: 1, minWidth: '200px' }} />
            <button onClick={saveNote} style={dark}>Salvar</button>
            <button onClick={() => setSelectedNote(null)} style={{ ...field, cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ---------- Notify */}
      <div style={card}>
        <h3 style={{ fontSize: '1.05rem', color: '#2c3e50', marginBottom: '0.75rem' }}>Avisar clientes</h3>
        {unnotified.length === 0 ? (
          <p style={{ color: '#95a5a6', fontSize: '0.9rem' }}>Todas as datas das próximas 8 semanas já foram avisadas (ou não há nenhuma aberta).</p>
        ) : (
          <>
            <p style={{ color: '#7f8c8d', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.7 }}>
              Datas ainda não avisadas (próximas 8 semanas): <strong style={{ color: '#3c2a21' }}>{unnotified.map(fmtShort).join(', ')}</strong>
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button onClick={notifyCustomers} disabled={notifying} style={dark}>{notifying ? 'Enviando...' : '✉️ Enviar e-mail para clientes'}</button>
              <button onClick={() => navigator.clipboard.writeText(whatsappMessage)} style={{ ...dark, background: '#25D366' }}>📋 Copiar mensagem para WhatsApp</button>
            </div>
            <p style={{ color: '#95a5a6', fontSize: '0.8rem', lineHeight: 1.6 }}>
              Só recebe quem aceita e-mails sobre a Caixa de Degustação, e ninguém recebe o mesmo aviso duas vezes.
              Outros tipos de e-mail ficam em <strong>Divulgação → E-mails</strong>.
              O envio automático por WhatsApp ainda não está disponível (aguardando o registro da empresa no Twilio);
              por enquanto, copie a mensagem acima e envie pela sua lista de transmissão.
            </p>
          </>
        )}
        {notifyResult && <p style={{ marginTop: '1rem', fontWeight: 'bold', color: notifyResult.startsWith('✅') ? '#0b6b3a' : '#c0392b' }}>{notifyResult}</p>}
      </div>
      </div>
      </div>
    </div>
  );
}
