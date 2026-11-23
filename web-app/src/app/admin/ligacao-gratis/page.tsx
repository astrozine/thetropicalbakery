'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BONUS_CALL, CLAIM_TOPIC, weekStart } from '@/lib/bonusCall';

/**
 * Ligação grátis: the free 30-minute call with Dolly that comes with Sweet Escape (lib/bonusCall.ts).
 * One number (how many calls a week Dolly takes; 0 switches the bonus off everywhere) and the list of who asked.
 * Claims are contact_leads rows; the same rows show in the Caixa de Entrada and arrive as an alert e-mail.
 */

interface Claim { id: string; created_at: string; name: string; whatsapp: string; email: string | null; topic: string }

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: '1.1rem 1.25rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const when = (iso: string) => new Date(iso).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const waLink = (n: string) => `https://wa.me/${n.replace(/\D/g, '')}`;

/** "Free coaching call (Sweet Escape) · Amazon 113-… kindle · wants help with: … · best times: … · lang en" → parts. */
const parts = (topic: string) => topic.slice(CLAIM_TOPIC.length).split(' · ').map(s => s.trim()).filter(Boolean);

export default function AdminBonusCallPage() {
  const [weekly, setWeekly] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [noRow, setNoRow] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: s }, { data: c }] = await Promise.all([
        supabase.from('site_settings').select('value').eq('key', BONUS_CALL.settingKey).maybeSingle(),
        supabase.from('contact_leads').select('id, created_at, name, whatsapp, email, topic').like('topic', `${CLAIM_TOPIC}%`).order('created_at', { ascending: false }).limit(200),
      ]);
      if (s) { setWeekly(Number(s.value)); setDraft(String(s.value)); } else { setNoRow(true); setWeekly(BONUS_CALL.defaultWeekly); setDraft(String(BONUS_CALL.defaultWeekly)); }
      setClaims((c || []) as Claim[]);
    })();
  }, []);

  const save = async () => {
    const n = Math.max(0, Math.min(50, Math.round(Number(draft))));
    if (!Number.isFinite(n)) return;
    setSaving(true); setMsg('');
    const { data, error } = await supabase.from('site_settings').update({ value: n, updated_at: new Date().toISOString() }).eq('key', BONUS_CALL.settingKey).select('key');
    setSaving(false);
    if (error || !data?.length) { setMsg('Não salvou. Rode a migration_51_bonus_call.sql no Supabase primeiro.'); return; }
    setWeekly(n); setDraft(String(n));
    setMsg(n === 0 ? 'Salvo. O bônus está DESLIGADO: some do site e dos e-mails.' : `Salvo: ${n} por semana.`);
  };

  const since = weekStart();
  const thisWeek = claims.filter(c => new Date(c.created_at) >= since).length;

  return (
    <div style={{ display: 'grid', gap: '1rem', maxWidth: 860 }}>
      <div>
        <h1 style={{ margin: '0 0 0.3rem' }}>📞 Ligação grátis com a Dolly</h1>
        <p style={{ margin: 0, color: '#57606f' }}>
          Quem compra o Sweet Escape (PDF no site ou Kindle, capa comum e capa dura na Amazon) ganha uma conversa de {BONUS_CALL.minutes} minutos com a Dolly.
          A pessoa preenche um formulário e a Dolly chama no WhatsApp para marcar. É a porta de entrada para o coaching.
        </p>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Quantas ligações por semana?</h2>
        <p style={{ color: '#57606f', marginTop: 0 }}>
          Esta semana: <b>{thisWeek}</b> pedido(s){weekly ? ` de ${weekly}` : ''}. Quando passa do número, ninguém é recusado: a página diz que a Dolly chama para marcar na semana seguinte.
          Coloque <b>0</b> para desligar o bônus (some dos pop-ups, da página do livro e dos e-mails).
        </p>
        {noRow && <p style={{ color: '#c0392b' }}>A migration_51_bonus_call.sql ainda não rodou: o site usa {BONUS_CALL.defaultWeekly} por semana até lá.</p>}
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="number" min={0} max={50} value={draft} onChange={e => setDraft(e.target.value)} style={{ width: 90, padding: '0.6rem', borderRadius: 8, border: '1px solid #ccc', fontSize: '1rem' }} />
          <span>por semana</span>
          <button type="button" onClick={save} disabled={saving} style={{ padding: '0.6rem 1.2rem', borderRadius: 999, border: 0, background: '#2f3542', color: 'white', fontWeight: 700, cursor: 'pointer' }}>{saving ? 'Salvando…' : 'Salvar'}</button>
        </div>
        {msg && <p style={{ marginBottom: 0 }}>{msg}</p>}
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Quem pediu ({claims.length})</h2>
        {!claims.length && <p style={{ color: '#57606f' }}>Ninguém ainda.</p>}
        <div style={{ display: 'grid', gap: '0.7rem' }}>
          {claims.map(c => (
            <div key={c.id} style={{ border: '1px solid #eef0f3', borderRadius: 10, padding: '0.8rem 1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <b>{c.name}</b><span style={{ color: '#888', fontSize: '0.85rem' }}>{when(c.created_at)}</span>
              </div>
              <ul style={{ margin: '0.4rem 0', paddingLeft: '1.1rem', color: '#57606f', fontSize: '0.92rem' }}>
                {parts(c.topic).map(p => <li key={p}>{p}</li>)}
              </ul>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', fontSize: '0.92rem' }}>
                <a href={waLink(c.whatsapp)} target="_blank" rel="noopener" style={{ color: '#128c7e', fontWeight: 700 }}>WhatsApp {c.whatsapp}</a>
                {c.email && <a href={`mailto:${c.email}`}>{c.email}</a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
