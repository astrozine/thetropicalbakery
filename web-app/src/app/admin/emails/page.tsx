'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CAMPAIGNS, CampaignValues, campaignById, previewValues } from '@/lib/email/campaigns';
import { SITE_URL, greeting, renderEmail } from '@/lib/email/layout';
import { EMAIL_TOPICS, MARKETING_TOPICS, TAG_LABELS, ContactTag, canReceive, topicById } from '@/lib/emailTopics';
import DietTargeting, { DietTargetingValue, EMPTY_TARGETING } from './DietTargeting';
import { matchDiet } from '@/lib/dietary';
import { brandConfirm } from '@/lib/brandDialog';

interface SendRow {
  message_key: string;
  topic: string;
  subject: string | null;
  template: string | null;
  sent_at: string;
  email: string;
}

interface ContactRow {
  email: string;
  tags: string[] | null;
  opted_out: string[] | null;
  unsubscribed_all: boolean;
  diet_tags?: string[] | null;
  allergens_avoid?: string[] | null;
}

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: 'clamp(1.25rem, 3vw, 1.75rem)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const field: React.CSSProperties = { width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #dfe4ea', fontSize: '0.95rem' };
const lbl: React.CSSProperties = { display: 'block', fontSize: '0.82rem', fontWeight: 'bold', color: '#2c3e50', marginBottom: '0.35rem' };
const dark: React.CSSProperties = { background: '#2c3e50', color: 'white', border: 'none', padding: '0.8rem 1.4rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

interface DryRun { subject: string; messageKey: string; audience: number; alreadySent: number; willSend: number; remainingAfter: number }

export default function AdminEmailsPage() {
  const [campaignId, setCampaignId] = useState(CAMPAIGNS[0].id);
  const [values, setValues] = useState<CampaignValues>({});
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [sends, setSends] = useState<SendRow[]>([]);
  const [setupError, setSetupError] = useState('');
  const [dry, setDry] = useState<DryRun | null>(null);
  const [busy, setBusy] = useState('');
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [diet, setDiet] = useState<DietTargetingValue>(EMPTY_TARGETING);

  const campaign = campaignById(campaignId)!;
  const topic = topicById(campaign.topic)!;
  // Values that arrived in the link (e.g. from the box page's "Avisar a fila" button), applied once.
  const pendingValues = useRef<CampaignValues | null>(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    // A different campaign means a different audience and a different key.
    setValues(pendingValues.current ?? {});
    pendingValues.current = null;
    setDry(null);
    setResult(null);
    setDiet(EMPTY_TARGETING);
  }, [campaignId]);

  // /admin/emails?campaign=box-live&title=...&treats=...: open that campaign with the fields already filled in.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const wanted = campaignById(q.get('campaign') || '');
    if (!wanted) return;
    const filled: CampaignValues = {};
    wanted.fields.forEach(f => { const v = q.get(f.name); if (v) filled[f.name] = v; });
    pendingValues.current = filled;
    setCampaignId(wanted.id);
  }, []);

  const load = async () => {
    const [c, s, me] = await Promise.all([
      supabase.from('email_contacts').select('email, tags, opted_out, unsubscribed_all, diet_tags, allergens_avoid'),
      supabase.from('email_sends').select('message_key, topic, subject, template, sent_at, email').order('sent_at', { ascending: false }).limit(400),
      supabase.auth.getUser(),
    ]);
    let rows = (c.data as ContactRow[]) || null;
    let failure = c.error?.message || '';
    let notice = '';

    // Migration 19 not run yet: the e-mails still work, just without diet targeting.
    if (failure && /diet_tags|allergens_avoid/.test(failure)) {
      const plain = await supabase.from('email_contacts').select('email, tags, opted_out, unsubscribed_all');
      rows = (plain.data as ContactRow[]) || null;
      failure = plain.error?.message || '';
      if (!failure) notice = 'Rode a migration_19_dietary_profiles.sql no Supabase para poder falar com cada restrição alimentar.';
    }

    if (failure) {
      setSetupError('Rode a migration_15_email_preferences.sql no Supabase para ativar os e-mails.');
    } else {
      setSetupError(notice);
      setContacts(rows || []);
    }
    setSends((s.data as SendRow[]) || []);
    if (me.data.user?.email) setTestEmail(prev => prev || me.data.user!.email!);
  };

  // Local estimate, so the numbers move as soon as the campaign changes.
  // Who the campaign itself allows (before any diet narrowing) — also what the
  // diet panel counts against.
  const audience = useMemo(() => {
    let list = contacts.filter(c => canReceive(campaign.topic, c));
    if (campaign.tags?.length) list = list.filter(c => campaign.tags!.some(t => (c.tags || []).includes(t)));
    return list;
  }, [contacts, campaign]);

  // What the diet panel narrows it down to. Mirrors the API so the numbers agree.
  const targeted = useMemo(() => {
    let list = audience;
    if (diet.tags.length) list = list.filter(c => diet.tags.some(t => (c.diet_tags || []).includes(t)));
    if (diet.avoiding.length) list = list.filter(c => diet.avoiding.some(a => (c.allergens_avoid || []).includes(a)));
    if (diet.skipConflicts && diet.contains.length) {
      list = list.filter(c => !matchDiet(c.allergens_avoid, diet.contains, diet.mayContain).conflicts.length);
    }
    return list;
  }, [audience, diet]);

  const previewHtml = useMemo(() => {
    const content = campaign.build(previewValues(campaign, values));
    return renderEmail({
      ...content,
      theme: campaign.theme,
      // Images from this server, so a photo added to public/email/ shows here before it is deployed.
      assetBase: typeof window !== 'undefined' ? window.location.origin : SITE_URL,
      body: greeting('Dolly') + content.body,
      prefsUrl: `${SITE_URL}/preferencias?token=exemplo`,
      unsubscribeUrl: `${SITE_URL}/preferencias?token=exemplo&sair=1`,
      reason: campaign.reason,
    });
  }, [campaign, values]);

  const callApi = async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
      body: JSON.stringify({ campaignId, values, diet, ...body }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Falha no envio');
    return json;
  };

  const check = async () => {
    setBusy('check'); setResult(null);
    try { setDry(await callApi({ dryRun: true })); }
    catch (e) { setResult({ ok: false, text: e instanceof Error ? e.message : 'Falha' }); }
    setBusy('');
  };

  const sendTest = async () => {
    setBusy('test'); setResult(null);
    try {
      const r = await callApi({ testEmail });
      setResult({ ok: true, text: `Teste enviado para ${testEmail}. Veja como chegou antes de mandar para a lista.` });
      void r;
    } catch (e) { setResult({ ok: false, text: e instanceof Error ? e.message : 'Falha' }); }
    setBusy('');
    load();
  };

  const sendReal = async () => {
    const info = dry || (await (async () => { const d = await callApi({ dryRun: true }); setDry(d); return d as DryRun; })());
    if (!info.willSend) {
      setResult({ ok: false, text: 'Ninguém novo para receber isso agora.' });
      return;
    }
    if (!(await brandConfirm(`Enviar "${info.subject}" para ${info.willSend} pessoa(s)?\n\nQuem já recebeu esta mesma mensagem não recebe de novo.`))) return;

    setBusy('send'); setResult(null);
    try {
      const r = await callApi({});
      setResult({
        ok: true,
        text: `Enviado para ${r.sent} pessoa(s).` +
          (r.skipped ? ` ${r.skipped} já tinham recebido.` : '') +
          (r.failed ? ` ${r.failed} falharam (pode clicar em enviar de novo).` : '') +
          (r.remaining ? ` Faltam ${r.remaining} — clique em enviar de novo para continuar.` : ''),
      });
      setDry(null);
    } catch (e) { setResult({ ok: false, text: e instanceof Error ? e.message : 'Falha' }); }
    setBusy('');
    load();
  };

  // Recent sends grouped by message, newest first.
  const history = useMemo(() => {
    const byKey = new Map<string, { key: string; subject: string; template: string; topic: string; count: number; last: string }>();
    sends.forEach(s => {
      const cur = byKey.get(s.message_key);
      if (cur) { cur.count += 1; if (s.sent_at > cur.last) cur.last = s.sent_at; }
      else byKey.set(s.message_key, { key: s.message_key, subject: s.subject || s.message_key, template: s.template || '', topic: s.topic, count: 1, last: s.sent_at });
    });
    return Array.from(byKey.values()).sort((a, b) => b.last.localeCompare(a.last));
  }, [sends]);

  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach(c => (c.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
    return counts;
  }, [contacts]);

  const unsubscribed = contacts.filter(c => c.unsubscribed_all).length;

  return (
    <div style={{ maxWidth: '1400px' }}>
      <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>E-mails</h1>
      <p style={{ color: '#7f8c8d', marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: '820px' }}>
        Escolha o tipo de e-mail, preencha, veja como vai chegar e envie. Cada pessoa só recebe a <strong>mesma</strong> mensagem
        uma vez — se você clicar em enviar de novo, só recebe quem ficou faltando.
      </p>

      {setupError && (
        <div style={{ padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', background: '#fff4e5', color: '#7a4a00', border: '1px solid #f0d9b5' }}>
          ⚠️ {setupError}
        </div>
      )}

      {/* Audience summary */}
      <div style={{ ...card, marginBottom: '1.5rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.78rem', color: '#7f8c8d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Na lista</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2c3e50' }}>{contacts.length}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.78rem', color: '#7f8c8d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Descadastrados</p>
          <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#c0392b' }}>{unsubscribed}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', flex: 1 }}>
          {Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag, n]) => (
            <span key={tag} style={{ background: '#f1f2f6', color: '#2c3e50', fontSize: '0.8rem', padding: '0.3rem 0.7rem', borderRadius: '20px' }}>
              {TAG_LABELS[tag as ContactTag] || tag}: <strong>{n}</strong>
            </span>
          ))}
        </div>
      </div>

      {/* Campaign picker */}
      <div style={{ ...card, marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '1rem' }}>1. Que e-mail é este?</h2>
        <div style={{ display: 'grid', gap: '0.6rem', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))' }}>
          {CAMPAIGNS.map(c => {
            const on = c.id === campaignId;
            const t = topicById(c.topic);
            return (
              <button key={c.id} type="button" onClick={() => setCampaignId(c.id)}
                style={{ textAlign: 'left', padding: '0.85rem 1rem', borderRadius: '10px', cursor: 'pointer',
                  border: on ? '2px solid #d4af37' : '1px solid #dfe4ea', background: on ? '#fdf6dd' : '#fff' }}>
                <span style={{ fontSize: '1.2rem' }}>{c.emoji}</span>
                <strong style={{ display: 'block', color: '#2c3e50', margin: '0.3rem 0 0.2rem' }}>{c.name}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: '#7f8c8d', lineHeight: 1.5 }}>{c.description}</span>
                <span style={{ display: 'inline-block', marginTop: '0.5rem', fontSize: '0.72rem', color: '#8a6d1f', background: 'rgba(212,175,55,0.15)', padding: '0.15rem 0.5rem', borderRadius: '20px' }}>
                  {t?.emoji} {t?.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', alignItems: 'start' }}>
        {/* Compose */}
        <div style={{ ...card, display: 'grid', gap: '1.1rem' }}>
          <h2 style={{ fontSize: '1.1rem', color: '#2c3e50' }}>2. Preencher</h2>

          <p style={{ fontSize: '0.85rem', color: '#7f8c8d', lineHeight: 1.6, background: '#f8f9fa', padding: '0.75rem 1rem', borderRadius: '8px' }}>
            Vai para: <strong>{topic.audience}</strong>
            {campaign.tags?.length ? ` (só quem está marcado como ${campaign.tags.map(t => TAG_LABELS[t]).join(' ou ')})` : ''} ·{' '}
            <strong>{targeted.length}</strong> pessoa(s) hoje
            {targeted.length !== audience.length && <> (de {audience.length}, filtrado por restrição)</>}.
          </p>

          {campaign.fields.map(f => (
            <div key={f.name}>
              <label style={lbl}>{f.label}{f.required && <span style={{ color: '#c0392b' }}> *</span>}</label>
              {f.type === 'textarea' ? (
                <textarea rows={4} value={values[f.name] || ''} placeholder={f.placeholder}
                  onChange={e => setValues({ ...values, [f.name]: e.target.value })} style={{ ...field, resize: 'vertical' }} />
              ) : (
                <input type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'} value={values[f.name] || ''} placeholder={f.placeholder}
                  onChange={e => setValues({ ...values, [f.name]: e.target.value })} style={field} />
              )}
              {f.help && <small style={{ color: '#95a5a6' }}>{f.help}</small>}
            </div>
          ))}

          <div style={{ borderTop: '1px solid #eef1f4', paddingTop: '1rem' }}>
            <p style={{ ...lbl, marginBottom: '0.5rem' }}>Assunto que vai aparecer</p>
            <p style={{ color: '#2c3e50', fontWeight: 'bold' }}>{campaign.subject(values) || '—'}</p>
          </div>

          <DietTargeting value={diet} onChange={setDiet} audience={audience} />

          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={check} disabled={!!busy} style={{ ...dark, background: '#7f8c8d' }}>
              {busy === 'check' ? 'Conferindo…' : '👀 Ver quem vai receber'}
            </button>
            <button type="button" onClick={sendReal} disabled={!!busy} style={{ ...dark, background: '#d4af37' }}>
              {busy === 'send' ? 'Enviando…' : '✉️ Enviar'}
            </button>
          </div>

          <div style={{ borderTop: '1px solid #eef1f4', paddingTop: '1rem', display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={lbl}>Mandar um teste para</label>
              <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} style={field} />
            </div>
            <button type="button" onClick={sendTest} disabled={!!busy || !testEmail} style={{ ...dark, background: '#2980b9' }}>
              {busy === 'test' ? 'Enviando…' : 'Enviar teste'}
            </button>
          </div>

          {dry && (
            <div style={{ background: '#f0faf4', border: '1px solid #b7e1c6', borderRadius: '10px', padding: '1rem 1.15rem', color: '#1e6b3c', lineHeight: 1.8 }}>
              <strong>{dry.subject}</strong><br />
              Podem receber: <strong>{dry.audience}</strong> · já receberam: <strong>{dry.alreadySent}</strong> ·
              vão receber agora: <strong>{dry.willSend}</strong>
              {dry.remainingAfter > 0 && <> · sobram {dry.remainingAfter} para um segundo clique</>}
            </div>
          )}

          {result && (
            <div style={{ background: result.ok ? '#e8f5e9' : '#ffebee', color: result.ok ? '#2e7d32' : '#c62828', border: `1px solid ${result.ok ? '#a5d6a7' : '#ef9a9a'}`, borderRadius: '10px', padding: '1rem 1.15rem', fontWeight: 'bold', lineHeight: 1.7 }}>
              {result.text}
            </div>
          )}
        </div>

        {/* Preview */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', flex: 1 }}>3. Como vai chegar</h2>
            <button type="button" onClick={() => setShowPreview(v => !v)} style={{ border: '1px solid #dfe4ea', background: '#fff', borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.85rem' }}>
              {showPreview ? 'Esconder' : 'Mostrar'}
            </button>
          </div>
          {showPreview && (
            <iframe title="Prévia do e-mail" srcDoc={previewHtml}
              style={{ width: '100%', height: '640px', border: '1px solid #e8e1d7', borderRadius: '10px', background: '#fdfaf3' }} />
          )}
          <p style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '0.75rem', lineHeight: 1.6 }}>
            O nome (“Oi, Dolly!”) e o link de descadastro são trocados pelos de cada pessoa no envio real.
          </p>
        </div>
      </div>

      {/* History */}
      <div style={{ ...card, marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Já enviados</h2>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1rem' }}>
          O que já saiu. É esta lista que impede alguém de receber a mesma mensagem duas vezes.
        </p>
        {history.length === 0 ? (
          <p style={{ color: '#95a5a6', fontSize: '0.9rem' }}>Nada enviado ainda.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.5rem' }}>
            {history.map(h => (
              <div key={h.key} style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', padding: '0.7rem 1rem', border: '1px solid #eef1f4', borderRadius: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>{CAMPAIGNS.find(c => c.id === h.template)?.emoji || '✉️'}</span>
                <span style={{ flex: 1, minWidth: '200px' }}>
                  <strong style={{ color: '#2c3e50' }}>{h.subject}</strong>
                  <span style={{ display: 'block', fontSize: '0.78rem', color: '#95a5a6' }}>{topicById(h.topic)?.label || h.topic} · chave {h.key}</span>
                </span>
                <span style={{ color: '#2c3e50', fontWeight: 'bold' }}>{h.count} pessoa(s)</span>
                <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>{new Date(h.last).toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Topics reference */}
      <div style={{ ...card, marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.1rem', color: '#2c3e50', marginBottom: '0.5rem' }}>Os grupos de e-mail</h2>
        <p style={{ fontSize: '0.85rem', color: '#7f8c8d', marginBottom: '1rem', lineHeight: 1.6 }}>
          Cada pessoa pode desligar cada grupo em <code>/preferencias</code>, sem sair de todo o resto.
          Os dois últimos respondem a algo que a pessoa fez, então não têm descadastro.
        </p>
        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))' }}>
          {EMAIL_TOPICS.map(t => (
            <div key={t.id} style={{ border: '1px solid #eef1f4', borderRadius: '8px', padding: '0.7rem 0.9rem', background: t.transactional ? '#f8f9fa' : '#fff' }}>
              <strong style={{ color: '#2c3e50' }}>{t.emoji} {t.label}</strong>
              {t.transactional && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#7f8c8d', background: '#ecf0f1', padding: '0.1rem 0.45rem', borderRadius: '20px' }}>sempre enviado</span>}
              <span style={{ display: 'block', fontSize: '0.8rem', color: '#7f8c8d', lineHeight: 1.5, marginTop: '0.2rem' }}>{t.description}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '0.8rem', color: '#95a5a6', marginTop: '1rem' }}>
          {MARKETING_TOPICS.length} grupos com descadastro · {EMAIL_TOPICS.length - MARKETING_TOPICS.length} sempre enviados
        </p>
      </div>
    </div>
  );
}
