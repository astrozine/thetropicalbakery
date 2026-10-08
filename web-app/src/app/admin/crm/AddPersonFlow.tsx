'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DIET_TAGS } from '@/lib/dietary';
import { ALLERGENS } from '@/lib/allergens';
import { brandConfirm } from '@/lib/brandDialog';
import '../caixas/caixas.css';
import './crm.css';

const STEPS = ['Nome', 'Contato', 'Onde mora', 'Como come', 'Nota', 'Revisar'];

const PLACES = ['Itamambuca', 'Ubatuba', 'Paraty', 'São Paulo'];
const HOW_WE_MET = ['Feira', 'WhatsApp', 'Instagram', 'Brunch', 'Indicação', 'Retiro'];

const digitsOnly = (v: string) => v.replace(/\D/g, '');
const looksLikeEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/**
 * One question per screen, the way /admin/caixas creates a box: Dolly writes in someone she met at the
 * feira, on WhatsApp or at a brunch. Saves through admin_add_customer (migration 45), which fills in an
 * existing row instead of duplicating when the WhatsApp or e-mail is already in the CRM.
 */
export default function AddPersonFlow({ onDone, onCancel }: {
  onDone: (name: string, status: 'added' | 'updated') => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [place, setPlace] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dietNotes, setDietNotes] = useState('');
  const [note, setNote] = useState('');
  const [problem, setProblem] = useState('');
  const [saving, setSaving] = useState(false);

  const dirty = Boolean(name || whatsapp || email || place || tags.length || allergens.length || dietNotes || note);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const problemAt = (s: number): string => {
    if (s === 0 && !name.trim()) return 'Escreva o nome para continuar.';
    if (s === 1) {
      const phone = digitsOnly(whatsapp);
      if (!phone && !email.trim()) return 'Coloque o WhatsApp ou o e-mail (ou os dois).';
      if (phone && phone.length < 10) return 'O WhatsApp precisa ter o DDD, ex.: (12) 99123-4567.';
      if (email.trim() && !looksLikeEmail(email)) return 'Esse e-mail parece incompleto.';
    }
    return '';
  };

  const next = () => {
    const p = problemAt(step);
    setProblem(p);
    if (!p) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const back = () => { setProblem(''); setStep(s => Math.max(s - 1, 0)); };
  const goTo = (s: number) => { setProblem(''); setStep(s); };

  const leave = async () => {
    if (!dirty || await brandConfirm('Sair sem salvar? O que você escreveu aqui se perde.', { confirmLabel: 'Sair sem salvar' })) onCancel();
  };

  const save = async () => {
    for (let s = 0; s < STEPS.length; s++) {
      const p = problemAt(s);
      if (p) { setStep(s); setProblem(p); return; }
    }
    setSaving(true);
    setProblem('');
    const { data, error } = await supabase.rpc('admin_add_customer', {
      p_full_name: name.trim(),
      p_whatsapp_number: whatsapp.trim() || null,
      p_email: email.trim() || null,
      p_location: place.trim() || null,
      p_diet_tags: tags,
      p_allergens: allergens,
      p_diet_notes: dietNotes.trim() || null,
      p_admin_notes: note.trim() || null,
    });
    setSaving(false);
    if (error) {
      console.error('admin_add_customer failed:', error);
      setProblem(/admin_add_customer/.test(error.message || '') || error.code === 'PGRST202'
        ? 'Falta rodar a migração 45 no Supabase.'
        : 'Não deu para salvar. Tente de novo.');
      return;
    }
    onDone(name.trim(), (data as { status?: string } | null)?.status === 'updated' ? 'updated' : 'added');
  };

  const dietText = [
    ...DIET_TAGS.filter(t => tags.includes(t.id)).map(t => `${t.emoji} ${t.label}`),
    ...ALLERGENS.filter(a => allergens.includes(a.id)).map(a => `Evita ${a.label.toLowerCase()}`),
  ].join(' · ');

  return (
    <div className="bx">
      <div className="bx-flow">
        <div className="bx-flow__top">
          <span style={{ fontWeight: 800 }}>Nova pessoa no CRM</span>
          <button type="button" className="bx-btn bx-btn--ghost" onClick={leave}>✕ Sair</button>
        </div>
        <div className="bx-progress" aria-hidden>
          {STEPS.map((_, i) => <span key={i} className={i <= step ? 'is-done' : ''}><i /></span>)}
        </div>

        <div className="bx-step" key={step}>
          <p className="bx-step__kicker">Passo {step + 1} de {STEPS.length}</p>

          {step === 0 && (
            <>
              <h1 className="bx-step__title">Quem você quer adicionar?</h1>
              <p className="bx-step__lead">O nome como você chama a pessoa. Dá para completar o resto depois.</p>
              <input className="bx-input bx-input--big" autoFocus value={name} onChange={e => setName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') next(); }} placeholder="Maria Silva" maxLength={120} />
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="bx-step__title">Como falar com {name.trim().split(/\s+/)[0] || 'a pessoa'}?</h1>
              <p className="bx-step__lead">WhatsApp, e-mail ou os dois. Se já estiver no CRM, a gente completa a ficha em vez de duplicar.</p>
              <div style={{ display: 'grid', gap: '1.1rem' }}>
                <label className="bx-field"><span>📱 WhatsApp</span>
                  <input className="bx-input bx-input--big" type="tel" inputMode="tel" autoFocus value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)} placeholder="(12) 99123-4567" maxLength={30} />
                </label>
                <label className="bx-field"><span>✉️ E-mail</span>
                  <input className="bx-input" type="email" inputMode="email" autoCapitalize="none" value={email}
                    onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') next(); }}
                    placeholder="maria@email.com" maxLength={254} />
                </label>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="bx-step__title">Onde mora?</h1>
              <p className="bx-step__lead">Um toque já basta. Ou escreva o endereço, se souber. Pode pular.</p>
              <div className="crm-pills" style={{ marginBottom: '1rem' }}>
                {PLACES.map(p => (
                  <button key={p} type="button" className={`crm-pill${place === p ? ' is-on' : ''}`}
                    onClick={() => setPlace(place === p ? '' : p)} aria-pressed={place === p}>📍 {p}</button>
                ))}
              </div>
              <input className="bx-input" value={place} onChange={e => setPlace(e.target.value)}
                placeholder="Rua, bairro, cidade" maxLength={300} />
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="bx-step__title">Como come?</h1>
              <p className="bx-step__lead">Marque o que você sabe. Pode pular se não souber.</p>
              <div className="crm-pills">
                {DIET_TAGS.map(t => (
                  <button key={t.id} type="button" className={`crm-pill${tags.includes(t.id) ? ' is-on' : ''}`}
                    onClick={() => toggle(tags, setTags, t.id)} aria-pressed={tags.includes(t.id)}>{t.emoji} {t.label}</button>
                ))}
              </div>
              <p className="bx-step__kicker" style={{ marginTop: '1.5rem' }}>⚠️ Alergias: evita…</p>
              <div className="crm-pills">
                {ALLERGENS.map(a => (
                  <button key={a.id} type="button" className={`crm-pill crm-pill--warn${allergens.includes(a.id) ? ' is-on' : ''}`}
                    onClick={() => toggle(allergens, setAllergens, a.id)} aria-pressed={allergens.includes(a.id)}>{a.emoji} {a.label}</button>
                ))}
              </div>
              <input className="bx-input" style={{ marginTop: '1.25rem' }} value={dietNotes} onChange={e => setDietNotes(e.target.value)}
                placeholder="Algo mais? Ex.: não gosta de coco" maxLength={300} />
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="bx-step__title">Como vocês se conheceram?</h1>
              <p className="bx-step__lead">Uma nota só sua, para lembrar depois. Pode pular.</p>
              <div className="crm-pills" style={{ marginBottom: '1rem' }}>
                {HOW_WE_MET.map(h => (
                  <button key={h} type="button" className="crm-pill"
                    onClick={() => setNote(n => (n.trim() ? `${n.trim()} · ${h}` : h))}>+ {h}</button>
                ))}
              </div>
              <textarea className="bx-input" rows={4} value={note} onChange={e => setNote(e.target.value)}
                placeholder="Ex.: comprou na feira de sábado, adorou o brownie, quer saber do curso" maxLength={1000} />
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="bx-step__title">Confira e salve</h1>
              <p className="bx-step__lead">Toque em “Mudar” para voltar em qualquer parte.</p>
              <div className="bx-review">
                {[
                  { s: 0, t: 'Nome', v: name.trim() || '—' },
                  { s: 1, t: 'Contato', v: [whatsapp.trim() && `📱 ${whatsapp.trim()}`, email.trim() && `✉️ ${email.trim()}`].filter(Boolean).join(' · ') || '—' },
                  { s: 2, t: 'Onde mora', v: place.trim() || 'Não informado' },
                  { s: 3, t: 'Como come', v: [dietText, dietNotes.trim() && `“${dietNotes.trim()}”`].filter(Boolean).join(' · ') || 'Nada marcado' },
                  { s: 4, t: 'Nota', v: note.trim() || 'Sem nota' },
                ].map(r => (
                  <div key={r.s} className="bx-review__row">
                    <div style={{ minWidth: 0 }}><strong>{r.t}</strong><span>{r.v}</span></div>
                    <button type="button" className="bx-link" onClick={() => goTo(r.s)}>Mudar</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bx-footer">
          {step > 0 ? <button type="button" className="bx-link" onClick={back}>← Voltar</button> : <span />}
          {problem && <span className="bx-footer__msg" role="alert">{problem}</span>}
          {step < STEPS.length - 1 ? (
            <button type="button" className="bx-btn bx-btn--dark" onClick={next}>
              {step >= 2 && step <= 4 && !(step === 2 ? place : step === 3 ? tags.length || allergens.length || dietNotes : note) ? 'Pular' : 'Avançar'}
            </button>
          ) : (
            <button type="button" className="bx-btn bx-btn--gold" onClick={save} disabled={saving}>
              {saving ? 'Salvando…' : '✓ Salvar no CRM'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
