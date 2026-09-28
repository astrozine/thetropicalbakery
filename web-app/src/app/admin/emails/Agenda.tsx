'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CAMPAIGNS, CampaignValues, campaignById } from '@/lib/email/campaigns';
import { AUTOMATIONS, type AutomationKnob, type AutomationRow } from '@/lib/email/automationDefs';
import { brandConfirm } from '@/lib/brandDialog';
import type { DietTargetingValue } from './DietTargeting';

/**
 * The scheduler, as Dolly sees it: "mande isso na sexta às 9h" and "avise sozinho
 * quando uma caixa nova entrar no ar".
 *
 * Everything here only writes rows. The sending is done by /api/email/cron, which
 * goes through the same engine as the Enviar button — so a scheduled e-mail obeys
 * the same descadastros and the same "ninguém recebe duas vezes".
 */

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 1.75rem)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const field: React.CSSProperties = { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #dfe4ea', fontSize: '0.95rem' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '0.35rem' };
const dark: React.CSSProperties = { background: '#2c3e50', color: 'white', border: 'none', padding: '0.8rem 1.4rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

interface ScheduleRow {
  id: string;
  campaign_id: string;
  label: string | null;
  run_at: string;
  status: string;
  sent: number;
  failed: number;
  skipped: number;
  last_error: string | null;
  last_run_at: string | null;
}

interface CronRun {
  ran_at: string;
  due: number;
  sent: number;
  failed: number;
  ok: boolean;
  detail: { what: string; result: string }[] | null;
}

const STATUS_LOOK: Record<string, { label: string; bg: string; fg: string }> = {
  pending: { label: 'agendado', bg: '#eaf4fd', fg: '#1b6ca8' },
  sending: { label: 'enviando…', bg: '#fdf6dd', fg: '#8a6d1f' },
  done: { label: 'enviado', bg: '#e8f5e9', fg: '#2e7d32' },
  error: { label: 'erro', bg: '#ffebee', fg: '#c62828' },
  canceled: { label: 'cancelado', bg: '#f1f2f6', fg: '#7f8c8d' },
};

/** "sex, 2 de out, 09:00" — enough to be sure, short enough to scan. */
const whenText = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** "há 4 minutos" / "há 2 horas" — the only thing that answers "o robô está vivo?". */
function sinceText(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} minuto(s)`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `há ${hours} hora(s)`;
  return `há ${Math.round(hours / 24)} dia(s)`;
}

/** The soonest sensible default: tomorrow at 9am, in the browser's own clock. */
function defaultWhen(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface Props {
  /** The campaign currently being composed upstairs, so "agendar este" needs no retyping. */
  campaignId: string;
  values: CampaignValues;
  diet: DietTargetingValue;
}

export default function Agenda({ campaignId, values, diet }: Props) {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [autos, setAutos] = useState<AutomationRow[]>([]);
  const [lastRun, setLastRun] = useState<CronRun | null>(null);
  const [when, setWhen] = useState(defaultWhen);
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [missing, setMissing] = useState(false);

  const campaign = campaignById(campaignId);

  const load = useCallback(async () => {
    const [s, a, c] = await Promise.all([
      supabase.from('email_schedule')
        .select('id, campaign_id, label, run_at, status, sent, failed, skipped, last_error, last_run_at')
        .order('run_at', { ascending: false }).limit(50),
      supabase.from('email_automations').select('id, enabled, threshold, offset_days, send_hour, last_run_at, last_result'),
      supabase.from('email_cron_runs').select('ran_at, due, sent, failed, ok, detail').order('ran_at', { ascending: false }).limit(1),
    ]);

    // Migration 26 not run yet: say so plainly instead of showing empty cards.
    if (s.error && /email_schedule|email_automations/.test(s.error.message)) {
      setMissing(true);
      return;
    }
    setMissing(false);
    setRows((s.data as ScheduleRow[]) || []);
    setAutos((a.data as AutomationRow[]) || []);
    setLastRun(((c.data as CronRun[]) || [])[0] || null);
  }, []);

  useEffect(() => { load(); }, [load]);

  const schedule = async () => {
    if (!campaign) return;
    const runAt = new Date(when);
    if (isNaN(runAt.getTime())) { setNote({ ok: false, text: 'Escolha uma data e hora.' }); return; }
    if (runAt.getTime() < Date.now()) { setNote({ ok: false, text: 'Essa hora já passou. Escolha uma no futuro.' }); return; }

    const empty = campaign.fields.filter(f => f.required && !String(values[f.name] || '').trim());
    if (empty.length) {
      setNote({ ok: false, text: `Preencha antes de agendar: ${empty.map(f => f.label).join(', ')}.` });
      return;
    }

    setBusy('schedule'); setNote(null);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('email_schedule').insert([{
      campaign_id: campaignId,
      field_values: values,
      diet,
      run_at: runAt.toISOString(),
      label: label.trim() || campaign.subject(values) || campaign.name,
      created_by: user?.id ?? null,
    }]);
    setBusy('');

    if (error) { setNote({ ok: false, text: `Não deu para agendar: ${error.message}` }); return; }
    setNote({ ok: true, text: `Agendado para ${whenText(runAt.toISOString())}. Você pode cancelar até essa hora.` });
    setLabel('');
    load();
  };

  const cancel = async (row: ScheduleRow) => {
    if (!(await brandConfirm(`Cancelar "${row.label || row.campaign_id}"?\n\nEle não será enviado.`))) return;
    const { error } = await supabase.from('email_schedule').update({ status: 'canceled' }).eq('id', row.id);
    if (error) setNote({ ok: false, text: error.message });
    load();
  };

  const remove = async (row: ScheduleRow) => {
    if (!(await brandConfirm('Apagar esta linha do histórico de agendamentos?'))) return;
    const { error } = await supabase.from('email_schedule').delete().eq('id', row.id);
    if (error) setNote({ ok: false, text: error.message });
    load();
  };

  const saveAuto = async (id: string, patch: Partial<AutomationRow>) => {
    // Optimistic: a toggle that waits for the network feels broken.
    setAutos(list => list.map(a => (a.id === id ? { ...a, ...patch } as AutomationRow : a)));
    const { error } = await supabase.from('email_automations').update(patch).eq('id', id);
    if (error) { setNote({ ok: false, text: error.message }); load(); }
  };

  const upcoming = useMemo(() => rows.filter(r => r.status === 'pending' || r.status === 'sending'), [rows]);
  const past = useMemo(() => rows.filter(r => r.status !== 'pending' && r.status !== 'sending'), [rows]);

  if (missing) {
    return (
      <div style={{ ...card, marginTop: '1.5rem', background: '#fff4e5', border: '1px solid #f0d9b5' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#7a4a00', marginBottom: '0.5rem' }}>⏰ Agendamento e automações</h2>
        <p style={{ color: '#7a4a00', lineHeight: 1.7, fontSize: '0.92rem' }}>
          Rode a <strong>migration_26_email_scheduler.sql</strong> no Supabase para ligar esta parte. Até lá, os e-mails
          continuam funcionando normalmente pelo botão <strong>Enviar</strong> ali em cima.
        </p>
      </div>
    );
  }

  const knobInput = (row: AutomationRow, knob: AutomationKnob, text: string) => (
    <label key={knob} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#2c3e50' }}>
      {text}
      <input type="number" min={1} max={knob === 'offsetDays' ? 30 : 100}
        value={(knob === 'threshold' ? row.threshold : row.offset_days) ?? ''}
        onChange={e => {
          const n = Math.max(1, Number(e.target.value) || 1);
          saveAuto(row.id, knob === 'threshold' ? { threshold: n } : { offset_days: n });
        }}
        style={{ ...field, width: '5rem', padding: '0.4rem 0.5rem' }} />
    </label>
  );

  return (
    <div style={{ display: 'grid', gap: '1.5rem', marginTop: '1.5rem' }}>

      {/* ---------------------------------------------------------- heartbeat */}
      <div style={{ ...card, display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '1.6rem' }}>{lastRun ? (lastRun.ok ? '🟢' : '🔴') : '⚪'}</span>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <strong style={{ color: '#2c3e50', display: 'block' }}>
            {lastRun ? `O robô conferiu ${sinceText(lastRun.ran_at)}` : 'O robô ainda não conferiu nada'}
          </strong>
          <span style={{ fontSize: '0.85rem', color: '#7f8c8d', lineHeight: 1.6 }}>
            {lastRun
              ? `${lastRun.due} agendamento(s) vencido(s) · ${lastRun.sent} e-mail(s) enviado(s)${lastRun.failed ? ` · ${lastRun.failed} falha(s)` : ''}`
              : 'Enquanto o relógio (pg_cron) não estiver configurado, nada agendado sai sozinho. Veja SETUP_email_scheduler.md.'}
          </span>
        </div>
        <button type="button" onClick={load} style={{ border: '1px solid #dfe4ea', background: '#fff', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>
          Atualizar
        </button>
      </div>

      {lastRun?.detail?.length ? (
        <details style={{ ...card, paddingTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 'bold', color: '#2c3e50' }}>O que ele fez na última conferida</summary>
          <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.8rem' }}>
            {lastRun.detail.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <strong style={{ color: '#2c3e50', minWidth: '180px' }}>{d.what}</strong>
                <span style={{ color: '#7f8c8d' }}>{d.result}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}

      {/* ----------------------------------------------------------- schedule */}
      <div style={card}>
        <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '0.5rem' }}>⏰ Agendar este e-mail</h2>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1rem', lineHeight: 1.6 }}>
          Ele sai sozinho na hora marcada, com o que você preencheu ali em cima
          {campaign ? <> — <strong>{campaign.emoji} {campaign.name}</strong></> : null}. Dá para cancelar até a hora chegar.
        </p>

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={lbl}>Quando</label>
            <input type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} style={field} />
          </div>
          <div style={{ flex: '2 1 260px' }}>
            <label style={lbl}>Como chamar isso (opcional)</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)} placeholder="Caixa da semana — sexta de manhã" style={field} />
          </div>
          <button type="button" onClick={schedule} disabled={busy === 'schedule'} style={{ ...dark, background: '#8e44ad' }}>
            {busy === 'schedule' ? 'Agendando…' : '⏰ Agendar'}
          </button>
        </div>

        {note && (
          <div style={{ marginTop: '1rem', background: note.ok ? '#e8f5e9' : '#ffebee', color: note.ok ? '#2e7d32' : '#c62828', border: `1px solid ${note.ok ? '#a5d6a7' : '#ef9a9a'}`, borderRadius: '10px', padding: '0.85rem 1.1rem', fontWeight: 'bold', lineHeight: 1.6 }}>
            {note.text}
          </div>
        )}

        <h3 style={{ fontSize: '0.95rem', color: '#2c3e50', margin: '1.5rem 0 0.6rem' }}>Na fila ({upcoming.length})</h3>
        {upcoming.length === 0 ? (
          <p style={{ color: '#95a5a6', fontSize: '0.9rem' }}>Nada agendado.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {upcoming.map(r => {
              const look = STATUS_LOOK[r.status] || STATUS_LOOK.pending;
              return (
                <div key={r.id} style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.7rem 1rem', border: '1px solid #eef1f4', borderRadius: '8px' }}>
                  <span style={{ fontSize: '1.1rem' }}>{CAMPAIGNS.find(c => c.id === r.campaign_id)?.emoji || '✉️'}</span>
                  <span style={{ flex: 1, minWidth: '200px' }}>
                    <strong style={{ color: '#2c3e50' }}>{r.label || r.campaign_id}</strong>
                    <span style={{ display: 'block', fontSize: '0.78rem', color: '#95a5a6' }}>{whenText(r.run_at)}</span>
                  </span>
                  <span style={{ background: look.bg, color: look.fg, fontSize: '0.78rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>{look.label}</span>
                  <button type="button" onClick={() => cancel(r)} style={{ border: '1px solid #ef9a9a', background: '#fff', color: '#c62828', borderRadius: '6px', padding: '0.35rem 0.7rem', cursor: 'pointer', fontSize: '0.82rem' }}>
                    Cancelar
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {past.length > 0 && (
          <details style={{ marginTop: '1rem' }}>
            <summary style={{ cursor: 'pointer', color: '#7f8c8d', fontSize: '0.88rem' }}>Agendamentos que já passaram ({past.length})</summary>
            <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.7rem' }}>
              {past.map(r => {
                const look = STATUS_LOOK[r.status] || STATUS_LOOK.done;
                return (
                  <div key={r.id} style={{ display: 'flex', gap: '0.9rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.6rem 0.9rem', border: '1px solid #f4f6f8', borderRadius: '8px' }}>
                    <span style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ color: '#2c3e50', fontWeight: 'normal' }}>{r.label || r.campaign_id}</strong>
                      <span style={{ display: 'block', fontSize: '0.76rem', color: '#95a5a6' }}>
                        {whenText(r.run_at)}
                        {r.status === 'done' && ` · ${r.sent} enviado(s)`}
                        {r.last_error && ` · ${r.last_error}`}
                      </span>
                    </span>
                    <span style={{ background: look.bg, color: look.fg, fontSize: '0.76rem', fontWeight: 'bold', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>{look.label}</span>
                    <button type="button" onClick={() => remove(r)} style={{ border: '1px solid #dfe4ea', background: '#fff', color: '#7f8c8d', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.78rem' }}>
                      Apagar
                    </button>
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* --------------------------------------------------------- automations */}
      <div style={card}>
        <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '0.5rem' }}>🤖 Automações</h2>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1.25rem', lineHeight: 1.6 }}>
          Estas não precisam de data: elas ficam de olho e mandam o e-mail quando a coisa acontece. Cada pessoa continua
          recebendo cada mensagem <strong>uma única vez</strong>. Vêm todas desligadas — ligue uma por vez e confira o
          resultado antes de ligar a próxima.
        </p>

        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {AUTOMATIONS.map(def => {
            const row = autos.find(a => a.id === def.id);
            if (!row) return null;
            return (
              <div key={def.id} style={{ border: `1px solid ${row.enabled ? '#d4af37' : '#eef1f4'}`, background: row.enabled ? '#fffdf5' : '#fff', borderRadius: '10px', padding: '0.9rem 1.1rem' }}>
                <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '1.3rem' }}>{def.emoji}</span>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <strong style={{ color: '#2c3e50' }}>{def.name}</strong>
                    <span style={{ display: 'block', fontSize: '0.82rem', color: '#7f8c8d', lineHeight: 1.6, marginTop: '0.2rem' }}>
                      <strong>Quando:</strong> {def.watches}
                    </span>
                    <span style={{ display: 'block', fontSize: '0.82rem', color: '#7f8c8d', lineHeight: 1.6 }}>
                      <strong>Manda:</strong> {def.sends}
                    </span>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 'bold', color: row.enabled ? '#2e7d32' : '#7f8c8d', minHeight: '44px' }}>
                    <input type="checkbox" checked={row.enabled} onChange={e => saveAuto(def.id, { enabled: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                    {row.enabled ? 'Ligada' : 'Desligada'}
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap', alignItems: 'center', marginTop: '0.8rem', paddingTop: '0.8rem', borderTop: '1px solid #f4f6f8' }}>
                  {def.knobs.map(k => knobInput(row, k, def.knobLabel[k] || k))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#2c3e50' }}>
                    Manda às
                    <select value={row.send_hour} onChange={e => saveAuto(def.id, { send_hour: Number(e.target.value) })}
                      style={{ ...field, width: 'auto', padding: '0.4rem 0.5rem' }}>
                      {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>)}
                    </select>
                  </label>
                </div>

                {row.last_result && (
                  <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '0.7rem', lineHeight: 1.6 }}>
                    Última conferida{row.last_run_at ? ` ${sinceText(row.last_run_at)}` : ''}: {row.last_result}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
