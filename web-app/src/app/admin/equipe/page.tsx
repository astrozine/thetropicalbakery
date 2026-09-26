'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/deliveryZones';
import { MONTH_NAMES, SHIFT_STATUS, WORKER_ROLES, Worker, WorkShift, monthPay, shiftHours, workerRole } from '@/lib/portals';
import { brandConfirm } from '@/lib/brandDialog';

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 1.75rem)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const field: React.CSSProperties = { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #dfe4ea', fontSize: '0.95rem' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '0.3rem' };
const dark: React.CSSProperties = { background: '#2c3e50', color: 'white', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

const EMPTY_WORKER = { full_name: '', email: '', whatsapp: '', role: 'cozinha', hourly_rate: 0, monthly_wage: 0, notes: '', portal_message: '' };
const todayISO = () => new Date().toISOString().slice(0, 10);
const EMPTY_SHIFT = { worker_id: '', shift_date: todayISO(), start_time: '09:00', end_time: '14:00', task: '' };

export default function AdminTeamPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [worker, setWorker] = useState({ ...EMPTY_WORKER });
  const [shift, setShift] = useState({ ...EMPTY_SHIFT });
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [w, s] = await Promise.all([
      supabase.from('workers').select('*').order('full_name'),
      supabase.from('work_shifts').select('*').order('shift_date', { ascending: false }),
    ]);
    if (w.error) setError('Rode a migration_16_portals.sql no Supabase para ativar a área da equipe.');
    else { setError(''); setWorkers((w.data as Worker[]) || []); }
    setShifts((s.data as WorkShift[]) || []);
    setLoading(false);
  };

  const saveWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...worker,
      hourly_rate: Number(worker.hourly_rate) || 0,
      monthly_wage: Number(worker.monthly_wage) || 0,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = editingId
      ? await supabase.from('workers').update(payload).eq('id', editingId)
      : await supabase.from('workers').insert([payload]);
    setSaving(false);
    if (err) { setError(`Não foi possível salvar: ${err.message}`); return; }
    setWorker({ ...EMPTY_WORKER });
    setEditingId(null);
    load();
  };

  const editWorker = (w: Worker) => {
    setEditingId(w.id);
    setWorker({
      full_name: w.full_name, email: w.email, whatsapp: w.whatsapp || '', role: w.role,
      hourly_rate: w.hourly_rate, monthly_wage: w.monthly_wage, notes: w.notes || '', portal_message: w.portal_message || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleWorkerStatus = async (w: Worker) => {
    await supabase.from('workers').update({ status: w.status === 'ativo' ? 'inativo' : 'ativo' }).eq('id', w.id);
    load();
  };

  const removeWorker = async (w: Worker) => {
    if (!(await brandConfirm(`Remover ${w.full_name} da equipe? Os turnos dele também saem.`, { danger: true, confirmLabel: 'Sim, remover' }))) return;
    await supabase.from('workers').delete().eq('id', w.id);
    load();
  };

  const addShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift.worker_id) { setError('Escolha de quem é o turno.'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('work_shifts').insert([{
      worker_id: shift.worker_id, shift_date: shift.shift_date,
      start_time: shift.start_time || null, end_time: shift.end_time || null, task: shift.task || null,
    }]);
    setSaving(false);
    if (err) { setError(`Não foi possível criar o turno: ${err.message}`); return; }
    setError('');
    setShift({ ...EMPTY_SHIFT, worker_id: shift.worker_id, shift_date: shift.shift_date });
    load();
  };

  const setShiftStatus = async (s: WorkShift, status: WorkShift['status']) => {
    await supabase.from('work_shifts').update({ status }).eq('id', s.id);
    load();
  };

  const togglePaid = async (s: WorkShift) => {
    await supabase.from('work_shifts').update({ paid: !s.paid }).eq('id', s.id);
    load();
  };

  const removeShift = async (s: WorkShift) => {
    await supabase.from('work_shifts').delete().eq('id', s.id);
    load();
  };

  const view = useMemo(() => {
    const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + monthOffset); return d;
  }, [monthOffset]);
  const monthPrefix = `${view.getFullYear()}-${String(view.getMonth() + 1).padStart(2, '0')}`;
  const monthShifts = shifts.filter(s => s.shift_date.startsWith(monthPrefix));

  const totalMonth = workers.reduce((sum, w) => {
    const p = monthPay(w, monthShifts.filter(s => s.worker_id === w.id));
    return sum + p.pay;
  }, 0);

  return (
    <div style={{ maxWidth: '1400px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Equipe</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: '820px' }}>
        Quem trabalha com a gente, a escala e o que cada turno paga. Cada pessoa entra em <code>/equipe</code> com
        o e-mail cadastrado e vê só os próprios turnos e valores.
      </p>

      {error && <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', background: '#fff4e5', color: '#7a4a00', border: '1px solid #f0d9b5' }}>⚠️ {error}</div>}

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', alignItems: 'start' }}>
        {/* Worker form */}
        <form onSubmit={saveWorker} style={{ ...card, display: 'grid', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#2c3e50' }}>{editingId ? 'Editar pessoa' : '➕ Nova pessoa na equipe'}</h2>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
            <div><label style={lbl}>Nome completo *</label>
              <input required type="text" value={worker.full_name} onChange={e => setWorker({ ...worker, full_name: e.target.value })} style={field} /></div>
            <div><label style={lbl}>Função</label>
              <select value={worker.role} onChange={e => setWorker({ ...worker, role: e.target.value })} style={field}>
                {WORKER_ROLES.map(r => <option key={r.id} value={r.id}>{r.emoji} {r.label}</option>)}
              </select></div>
            <div><label style={lbl}>E-mail de acesso *</label>
              <input required type="email" value={worker.email} onChange={e => setWorker({ ...worker, email: e.target.value })} style={field} />
              <small style={{ color: '#95a5a6' }}>É com este e-mail que a pessoa entra.</small></div>
            <div><label style={lbl}>WhatsApp</label>
              <input type="tel" value={worker.whatsapp} onChange={e => setWorker({ ...worker, whatsapp: e.target.value })} style={field} /></div>
            <div><label style={lbl}>Valor por hora (R$)</label>
              <input type="number" step="0.5" min="0" value={worker.hourly_rate} onChange={e => setWorker({ ...worker, hourly_rate: Number(e.target.value) })} style={field} /></div>
            <div><label style={lbl}>Ou salário fixo do mês (R$)</label>
              <input type="number" step="0.01" min="0" value={worker.monthly_wage} onChange={e => setWorker({ ...worker, monthly_wage: Number(e.target.value) })} style={field} />
              <small style={{ color: '#95a5a6' }}>Preencha só um dos dois.</small></div>
          </div>
          <div><label style={lbl}>Recado para a pessoa (aparece na área dela)</label>
            <textarea rows={2} value={worker.portal_message} onChange={e => setWorker({ ...worker, portal_message: e.target.value })} style={{ ...field, resize: 'vertical' }} /></div>
          <div><label style={lbl}>Anotações internas (ela não vê)</label>
            <textarea rows={2} value={worker.notes} onChange={e => setWorker({ ...worker, notes: e.target.value })} style={{ ...field, resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button type="submit" disabled={saving} style={{ ...dark, background: '#d4af37' }}>{saving ? 'Salvando…' : editingId ? 'Salvar' : 'Adicionar'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setWorker({ ...EMPTY_WORKER }); }} style={{ ...dark, background: '#95a5a6' }}>Cancelar</button>}
          </div>
        </form>

        {/* Shift form */}
        <form onSubmit={addShift} style={{ ...card, display: 'grid', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#2c3e50' }}>📅 Marcar um turno</h2>
          {workers.length === 0 ? (
            <p style={{ color: '#95a5a6' }}>Cadastre alguém na equipe primeiro.</p>
          ) : (
            <>
              <div><label style={lbl}>Quem</label>
                <select value={shift.worker_id} onChange={e => setShift({ ...shift, worker_id: e.target.value })} style={field}>
                  <option value="">Escolha…</option>
                  {workers.filter(w => w.status === 'ativo').map(w => <option key={w.id} value={w.id}>{w.full_name}</option>)}
                </select></div>
              <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
                <div><label style={lbl}>Dia</label>
                  <input type="date" value={shift.shift_date} onChange={e => setShift({ ...shift, shift_date: e.target.value })} style={field} /></div>
                <div><label style={lbl}>Começa</label>
                  <input type="time" value={shift.start_time} onChange={e => setShift({ ...shift, start_time: e.target.value })} style={field} /></div>
                <div><label style={lbl}>Termina</label>
                  <input type="time" value={shift.end_time} onChange={e => setShift({ ...shift, end_time: e.target.value })} style={field} /></div>
              </div>
              <div><label style={lbl}>O que vai fazer</label>
                <input type="text" value={shift.task} onChange={e => setShift({ ...shift, task: e.target.value })} placeholder="Ex: produção das caixas, entregas em Itamambuca" style={field} /></div>
              <button type="submit" disabled={saving} style={{ ...dark, background: '#27ae60', justifySelf: 'start' }}>
                {saving ? 'Salvando…' : 'Marcar turno'}
              </button>
              <p style={{ fontSize: '0.8rem', color: '#95a5a6', lineHeight: 1.6 }}>
                A pessoa vê o turno na hora. As horas saem do começo e do fim.
              </p>
            </>
          )}
        </form>
      </div>

      {/* Month */}
      <div style={{ ...card, marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: '1.15rem', color: '#2c3e50', flex: 1, textTransform: 'capitalize' }}>
            Escala de {MONTH_NAMES[view.getMonth()]} de {view.getFullYear()}
          </h2>
          <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>Total do mês: {formatBRL(totalMonth)}</span>
          <button onClick={() => setMonthOffset(m => m - 1)} style={{ ...dark, background: '#f1f2f6', color: '#2c3e50' }}>←</button>
          <button onClick={() => setMonthOffset(m => m + 1)} style={{ ...dark, background: '#f1f2f6', color: '#2c3e50' }}>→</button>
        </div>

        {loading ? <p>Carregando…</p> : workers.length === 0 ? (
          <p style={{ color: '#95a5a6' }}>Ninguém na equipe ainda.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {workers.map(w => {
              const mine = monthShifts.filter(s => s.worker_id === w.id);
              const p = monthPay(w, mine);
              const r = workerRole(w.role);
              return (
                <div key={w.id} style={{ border: '1px solid #eef1f4', borderRadius: '12px', padding: '1rem 1.15rem', opacity: w.status === 'ativo' ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <strong style={{ color: '#2c3e50', fontSize: '1.05rem' }}>{r.emoji} {w.full_name}</strong>
                    <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>{w.email}</span>
                    {w.status !== 'ativo' && <span style={{ background: '#f1f2f6', color: '#7f8c8d', fontSize: '0.72rem', padding: '0.15rem 0.6rem', borderRadius: '20px', fontWeight: 700 }}>inativo</span>}
                    <span style={{ marginLeft: 'auto', color: '#2c3e50', fontWeight: 'bold' }}>
                      {p.shifts} turnos · {p.hours}h · {formatBRL(p.pay)}
                      {!p.isMonthly && p.pending > 0 && <span style={{ color: '#e2792a' }}> ({formatBRL(p.pending)} a pagar)</span>}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                    <button onClick={() => editWorker(w)} style={{ ...dark, background: '#3498db', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>Editar</button>
                    <button onClick={() => toggleWorkerStatus(w)} style={{ ...dark, background: '#95a5a6', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>{w.status === 'ativo' ? 'Desativar' : 'Reativar'}</button>
                    <button onClick={() => removeWorker(w)} style={{ ...dark, background: '#e74c3c', padding: '0.4rem 0.9rem', fontSize: '0.82rem' }}>Excluir</button>
                    {w.whatsapp && <a href={`https://wa.me/${w.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ ...dark, background: '#25D366', padding: '0.4rem 0.9rem', fontSize: '0.82rem', textDecoration: 'none' }}>WhatsApp</a>}
                  </div>

                  {mine.length === 0 ? (
                    <p style={{ color: '#95a5a6', fontSize: '0.88rem' }}>Nenhum turno neste mês.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      {mine.sort((a, b) => a.shift_date.localeCompare(b.shift_date)).map(s => {
                        const st = SHIFT_STATUS[s.status];
                        return (
                          <div key={s.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.88rem', padding: '0.4rem 0', borderBottom: '1px solid #f7f8f9' }}>
                            <span style={{ color: '#2c3e50', minWidth: '90px' }}>{new Date(s.shift_date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                            <span style={{ color: '#7f8c8d', minWidth: '110px' }}>
                              {s.start_time && s.end_time ? `${s.start_time.slice(0, 5)}–${s.end_time.slice(0, 5)}` : '—'}
                              {shiftHours(s) ? ` (${shiftHours(s)}h)` : ''}
                            </span>
                            <span style={{ color: '#7f8c8d', flex: 1, minWidth: '120px' }}>{s.task || ''}</span>
                            <span style={{ background: st.bg, color: st.color, fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.6rem', borderRadius: '20px' }}>{st.label}</span>
                            {s.status === 'agendado' && (
                              <>
                                <button onClick={() => setShiftStatus(s, 'feito')} style={{ ...dark, background: '#27ae60', padding: '0.25rem 0.7rem', fontSize: '0.75rem' }}>Feito</button>
                                <button onClick={() => setShiftStatus(s, 'faltou')} style={{ ...dark, background: '#e67e22', padding: '0.25rem 0.7rem', fontSize: '0.75rem' }}>Faltou</button>
                              </>
                            )}
                            {s.status === 'feito' && !p.isMonthly && (
                              <button onClick={() => togglePaid(s)} style={{ ...dark, background: s.paid ? '#95a5a6' : '#2980b9', padding: '0.25rem 0.7rem', fontSize: '0.75rem' }}>
                                {s.paid ? 'pago ✓' : 'marcar pago'}
                              </button>
                            )}
                            <button onClick={() => removeShift(s)} aria-label="Excluir turno" style={{ border: 'none', background: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '0.9rem' }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '1.25rem', lineHeight: 1.7 }}>
          Os valores aqui são o combinado bruto (hora × horas, ou o salário fixo). Encargos de CLT e descontos não entram nesta conta —
          para estimar o custo total de uma contratação, use a calculadora em <code>/trabalhe-conosco</code>.
        </p>
      </div>
    </div>
  );
}
