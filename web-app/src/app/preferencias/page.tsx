'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MARKETING_TOPICS, TAG_LABELS, ContactTag } from '@/lib/emailTopics';
import DietaryPicker, { DietaryValue } from '@/components/DietaryPicker';

interface Prefs {
  email: string;
  full_name: string | null;
  opted_out: string[] | null;
  unsubscribed_all: boolean;
  tags: string[] | null;
  diet_tags?: string[] | null;
  allergens_avoid?: string[] | null;
  diet_notes?: string | null;
}

const card: React.CSSProperties = {
  background: '#fff', border: '1px solid #e8e1d7', borderRadius: '20px',
  padding: 'clamp(1.5rem, 4vw, 2.5rem)', maxWidth: '640px', margin: '0 auto',
  boxShadow: '0 10px 30px rgba(60,42,33,0.06)',
};

/** A plain on/off switch in the site's colours. */
function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      style={{
        position: 'relative', width: '54px', height: '30px', borderRadius: '30px', border: 'none', padding: 0,
        cursor: 'pointer', flexShrink: 0, background: on ? '#0b6b3a' : '#cfc6ba', transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: '3px', left: on ? '27px' : '3px', width: '24px', height: '24px',
        borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
      }} />
    </button>
  );
}

function EmailPreferences() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const wantsOut = params.get('sair') === '1';

  const [prefs, setPrefs] = useState<Prefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [diet, setDiet] = useState<DietaryValue>({ tags: [], allergens: [], notes: '' });
  const [dietSaving, setDietSaving] = useState(false);
  const [dietSaved, setDietSaved] = useState(false);

  useEffect(() => {
    if (!token) { setLoading(false); return; }

    const load = async () => {
      const { data, error } = await supabase.rpc('email_prefs_get', { p_token: token });
      const row = Array.isArray(data) ? data[0] : data;
      if (error || !row) {
        setError(error?.message && /function/.test(error.message)
          ? 'Esta página ainda não está configurada. Fale com a gente no WhatsApp.'
          : 'Não encontramos este link. Ele pode ter expirado — use o link do e-mail mais recente ou fale com a gente no WhatsApp.');
        setLoading(false);
        return;
      }

      // Clicked "Descadastrar de tudo" in an e-mail: honour it right away, no extra click.
      if (wantsOut && !row.unsubscribed_all) {
        await supabase.rpc('email_prefs_set', { p_token: token, p_opted_out: [], p_unsubscribed_all: true });
        setPrefs({ ...row, unsubscribed_all: true, opted_out: [] });
        setSaved(true);
      } else {
        setPrefs(row);
      }
      setDiet({
        tags: row.diet_tags || [],
        allergens: row.allergens_avoid || [],
        notes: row.diet_notes || '',
      });
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async (next: Prefs) => {
    setSaving(true);
    setSaved(false);
    setError('');
    const { data, error } = await supabase.rpc('email_prefs_set', {
      p_token: token,
      p_opted_out: next.opted_out || [],
      p_unsubscribed_all: next.unsubscribed_all,
    });
    setSaving(false);
    if (error || !data) {
      setError('Não conseguimos salvar. Tente de novo ou fale com a gente no WhatsApp.');
      return;
    }
    setPrefs(next);
    setSaved(true);
  };

  const toggleTopic = (topicId: string, wantIt: boolean) => {
    if (!prefs) return;
    const out = new Set(prefs.opted_out || []);
    if (wantIt) out.delete(topicId); else out.add(topicId);
    // Switching something back on means they're not fully unsubscribed any more.
    save({ ...prefs, opted_out: Array.from(out), unsubscribed_all: wantIt ? false : prefs.unsubscribed_all });
  };

  /** What they can eat. Saved on its own button, so it never fights the switches above. */
  const saveDiet = async () => {
    setDietSaving(true);
    setDietSaved(false);
    setError('');
    const { data, error: err } = await supabase.rpc('email_prefs_set_diet', {
      p_token: token,
      p_diet_tags: diet.tags,
      p_allergens: diet.allergens,
      p_notes: diet.notes.trim() || null,
    });
    setDietSaving(false);
    if (err || !data) {
      setError(err?.message && /function/.test(err.message)
        ? 'Esta parte ainda está sendo preparada. Fale com a gente no WhatsApp que anotamos na hora.'
        : 'Não conseguimos salvar. Tente de novo ou fale com a gente no WhatsApp.');
      return;
    }
    setDietSaved(true);
  };

  const unsubscribeAll = () => prefs && save({ ...prefs, opted_out: [], unsubscribed_all: true });
  const resubscribe = () => prefs && save({ ...prefs, opted_out: [], unsubscribed_all: false });

  return (
    <main style={{ minHeight: '100vh', background: 'var(--color-background)', padding: 'clamp(4.5rem, 12vw, 9rem) 1rem 4rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto 2rem', textAlign: 'center' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-gold.webp" alt="" style={{ height: '72px', margin: '0 auto 1.5rem', display: 'block' }} />
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', color: 'var(--color-primary)', marginBottom: '0.75rem' }}>
          Seus e-mails
        </h1>
        <p style={{ color: '#594a42', lineHeight: 1.8 }}>
          Escolha o que faz sentido para você. Pode mudar quando quiser, e nunca mandamos nada fora do que você marcar aqui.
        </p>
      </div>

      <div style={card}>
        {loading && <p style={{ color: '#7a6a61', textAlign: 'center' }}>Carregando…</p>}

        {!loading && !token && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '1.5rem' }}>
              Para mudar suas preferências, abra o link <strong>“Escolher quais e-mails receber”</strong> que fica no
              rodapé de qualquer e-mail nosso. É ele que identifica a sua inscrição com segurança.
            </p>
            <a href="https://wa.me/5511932119196?text=Ol%C3%A1%21%20Quero%20mudar%20minhas%20prefer%C3%AAncias%20de%20e-mail."
              target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.9rem 1.75rem' }}>
              Pedir pelo WhatsApp
            </a>
          </div>
        )}

        {!loading && token && error && !prefs && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#c0392b', lineHeight: 1.8, marginBottom: '1.5rem' }}>{error}</p>
            <a href="https://wa.me/5511932119196" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.9rem 1.75rem' }}>
              Falar no WhatsApp
            </a>
          </div>
        )}

        {prefs && (
          <>
            <div style={{ borderBottom: '1px solid #f0e9dd', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a6832b', fontWeight: 700, marginBottom: '0.3rem' }}>
                Estas preferências são de
              </p>
              <p style={{ color: '#3c2a21', fontWeight: 700, wordBreak: 'break-all' }}>{prefs.email}</p>
              {(prefs.tags || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem' }}>
                  {(prefs.tags || []).map(t => (
                    <span key={t} style={{ background: '#f5efe2', color: '#7a6a61', fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                      {TAG_LABELS[t as ContactTag] || t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {prefs.unsubscribed_all && (
              <div style={{ background: '#fff4e5', border: '1px solid #f0d9b5', borderRadius: '14px', padding: '1.1rem 1.25rem', marginBottom: '1.5rem' }}>
                <p style={{ color: '#7a4a00', lineHeight: 1.75, marginBottom: '0.9rem' }}>
                  <strong>Pronto: você saiu de todos os e-mails.</strong> Só vamos escrever sobre algo que você pedir —
                  um pedido, uma inscrição, sua conta.
                </p>
                <button type="button" onClick={resubscribe} disabled={saving} className="btn btn-secondary" style={{ padding: '0.7rem 1.4rem', fontSize: '0.9rem' }}>
                  Quero voltar a receber
                </button>
              </div>
            )}

            <p style={{ fontSize: '0.75rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a6832b', fontWeight: 700, marginBottom: '1rem' }}>
              O que você quer receber
            </p>

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.75rem' }}>
              {MARKETING_TOPICS.map(t => {
                const on = !prefs.unsubscribed_all && !(prefs.opted_out || []).includes(t.id);
                return (
                  <div key={t.id} style={{
                    display: 'flex', alignItems: 'center', gap: '1rem',
                    border: `1px solid ${on ? 'rgba(212,175,55,0.5)' : '#e8e1d7'}`,
                    background: on ? 'rgba(212,175,55,0.07)' : '#fff',
                    borderRadius: '14px', padding: '1rem 1.1rem',
                  }}>
                    <span aria-hidden style={{ fontSize: '1.5rem' }}>{t.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: '#3c2a21', fontWeight: 700, marginBottom: '0.2rem' }}>{t.label}</p>
                      <p style={{ color: '#7a6a61', fontSize: '0.86rem', lineHeight: 1.6 }}>{t.description}</p>
                    </div>
                    <Switch on={on} label={t.label} onChange={v => toggleTopic(t.id, v)} />
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', minHeight: '2rem' }}>
              {!prefs.unsubscribed_all && (
                <button type="button" onClick={unsubscribeAll} disabled={saving}
                  style={{ background: 'none', border: '1px solid #d9b3ad', color: '#b03a2e', borderRadius: '8px', padding: '0.7rem 1.3rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem' }}>
                  Descadastrar de tudo
                </button>
              )}
              {saving && <span style={{ color: '#7a6a61', fontSize: '0.9rem' }}>Salvando…</span>}
              {saved && !saving && <span style={{ color: '#0b6b3a', fontSize: '0.9rem', fontWeight: 700 }}>Salvo ✓</span>}
              {error && <span style={{ color: '#c0392b', fontSize: '0.9rem' }}>{error}</span>}
            </div>

            {/* ------------------------------------------------- what they eat */}
            <div style={{ borderTop: '1px solid #eee7db', marginTop: '2rem', paddingTop: '1.75rem' }}>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
                🍽️ O que você pode comer
              </h2>
              <p style={{ color: '#594a42', fontSize: '0.92rem', lineHeight: 1.75, marginBottom: '1.25rem' }}>
                Conte pra gente e a gente confere <strong>cada doce</strong> antes de te mandar qualquer novidade —
                você só recebe o que combina com você, e avisamos direitinho quando algo leva o que você evita. 💛
              </p>
              <DietaryPicker value={diet} onChange={setDiet} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginTop: '1.1rem' }}>
                <button type="button" onClick={saveDiet} disabled={dietSaving} className="btn btn-primary" style={{ padding: '0.8rem 1.6rem' }}>
                  {dietSaving ? 'Salvando…' : 'Salvar minhas restrições'}
                </button>
                {dietSaved && !dietSaving && <span style={{ color: '#0b6b3a', fontSize: '0.9rem', fontWeight: 700 }}>Salvo ✓</span>}
              </div>
            </div>

            <p style={{ color: '#a89a90', fontSize: '0.8rem', lineHeight: 1.7, marginTop: '1.75rem' }}>
              Confirmações de pedido, inscrições e avisos da sua conta continuam chegando, porque respondem a algo que
              você fez. Eles não são divulgação.
            </p>
          </>
        )}
      </div>

      <p style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link href="/" style={{ color: '#7a6a61', fontSize: '0.9rem' }}>← Voltar para o site</Link>
      </p>
    </main>
  );
}

/** useSearchParams needs a boundary while the page is being prerendered. */
export default function EmailPreferencesPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a6a61' }}>Carregando…</main>}>
      <EmailPreferences />
    </Suspense>
  );
}
