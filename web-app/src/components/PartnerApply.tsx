'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PARTNER_KINDS, PartnerKind } from '@/lib/portals';
import { optimizedSrc } from '@/lib/thumbs';
import DietaryPicker, { DietaryValue } from '@/components/DietaryPicker';
import { dietSummary, matchDiet } from '@/lib/dietary';

interface PickTreat {
  id: string;
  name: string;
  image_url: string | null;
  emoji: string | null;
  contains: string[] | null;
  may_contain: string[] | null;
}

interface Props {
  /** Pre-picked on each B2B page, e.g. 'pousada' on the pousadas page. */
  defaultKind: PartnerKind;
  whatsappHref: string;
}

const on0 = (chosen: string[]) => (chosen.length === 0 ? '#a89a90' : '#8a6d1f');

const input: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px', background: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-body)', fontSize: '1rem',
};
const label: React.CSSProperties = {
  // 0.8rem = 12.8px: the smallest a form label should ever be on a phone.
  display: 'block', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#a6832b', fontWeight: 700, marginBottom: '0.4rem',
};

/**
 * "Quero ser parceiro" — the form that opens an account in the partner portal.
 * Dolly approves it in /admin/parceiros; until then the portal shows "waiting".
 */
export default function PartnerApply({ defaultKind, whatsappHref }: Props) {
  const { user, profile } = useAuth();
  const [form, setForm] = useState({
    business_name: '', kind: defaultKind, contact_name: '', email: '', whatsapp: '', neighborhood: '', notes: '',
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  // "What would drive your clients wild?": a photo picker over the treats that are on the menu.
  const [treats, setTreats] = useState<PickTreat[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  // What the business's own guests or clients need (diets and allergies).
  const [diet, setDiet] = useState<DietaryValue>({ tags: [], allergens: [], notes: '' });
  React.useEffect(() => {
    supabase.from('treats').select('id, name, image_url, emoji, contains, may_contain').eq('is_available', true).order('name')
      .then(({ data, error: e }) => { if (!e && data) setTreats(data as PickTreat[]); });
  }, []);
  const togglePick = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));
  const chosen = treats.filter(t => picked.includes(t.id)).map(t => t.name);
  const showPicker = treats.length > 0 && form.kind !== 'afiliado';
  // The picks travel inside the message the partner sends, so Dolly reads them next to the note.
  const pickLine = showPicker && chosen.length > 0 ? `Itens que fariam meus clientes pirarem: ${chosen.join(', ')}` : '';
  const dietText = dietSummary(diet.tags, diet.allergens);
  const dietLine = showPicker && dietText ? `Restrições que o meu negócio precisa atender: ${dietText}` : '';
  const extraLines = [dietLine, pickLine].filter(Boolean);

  // Anything we already know about them is filled in.
  React.useEffect(() => {
    setForm(f => ({
      ...f,
      contact_name: f.contact_name || profile?.full_name || '',
      email: f.email || user?.email || '',
      whatsapp: f.whatsapp || profile?.phone || '',
    }));
  }, [user, profile]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    const { error: err } = await supabase.rpc('partner_apply', {
      p_business_name: form.business_name.trim(),
      p_kind: form.kind,
      p_contact_name: form.contact_name.trim() || null,
      p_email: form.email.trim(),
      p_whatsapp: form.whatsapp.trim() || null,
      p_address: null,
      p_neighborhood: form.neighborhood.trim() || null,
      p_notes: [form.notes.trim(), ...extraLines].filter(Boolean).join('\n\n') || null,
    });
    setSending(false);
    if (err) {
      setError(/function/.test(err.message)
        ? 'O cadastro de parceiros está sendo preparado. Fale com a gente no WhatsApp que resolvemos na hora.'
        : 'Não conseguimos enviar. Confira o e-mail e tente de novo, ou fale com a gente no WhatsApp.');
      return;
    }
    setDone(true);
  };

  const whatsappWithPicks = extraLines.length > 0 && whatsappHref.includes('text=')
    ? `${whatsappHref}${encodeURIComponent('. ' + extraLines.join('. '))}`
    : whatsappHref;

  if (done) {
    return (
      <section style={{ padding: 'clamp(3rem, 7vw, 5rem) 1.5rem', background: '#fdf7ee' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', textAlign: 'center', background: '#fff', border: '1px solid rgba(212,175,55,0.5)', borderRadius: '20px', padding: 'clamp(1.75rem, 4vw, 2.5rem)' }}>
          <p style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>🤝</p>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', color: 'var(--color-primary)', marginBottom: '1rem' }}>
            Pedido enviado
          </h2>
          <p style={{ color: '#594a42', lineHeight: 1.8, marginBottom: '1.5rem' }}>
            A Dolly vai confirmar sua parceria e te chamar no WhatsApp. Depois disso, entre com{' '}
            <strong>{form.email}</strong> no Portal do Parceiro para pedir reposição e acompanhar tudo.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/parceiro" className="btn btn-primary" style={{ padding: '0.9rem 1.6rem' }}>Ir para o portal</Link>
            <a href={whatsappWithPicks} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.9rem 1.6rem' }}>Falar agora</a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="ser-parceiro" style={{ padding: 'clamp(3rem, 7vw, 5rem) 1.5rem', background: '#fdf7ee' }}>
      <div style={{ maxWidth: '680px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ ...label, display: 'block' }}>Quero ser parceiro</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.7rem, 4.5vw, 2.6rem)', color: 'var(--color-primary)', lineHeight: 1.2, marginBottom: '1rem' }}>
            Abrir minha parceria
          </h2>
          <p style={{ color: '#594a42', lineHeight: 1.8 }}>
            Preencha e a Dolly confirma com você. Depois de aprovado, você tem um portal próprio para pedir reposição,
            acompanhar a meta do mês e ver as condições combinadas.
          </p>
        </div>

        <form onSubmit={submit} style={{ background: '#fff', border: '1px solid #e8e1d7', borderRadius: '20px', padding: 'clamp(1.5rem, 4vw, 2.25rem)', display: 'grid', gap: '1.1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 240px' }}>
              <label style={label} htmlFor="pa-name">Nome do seu negócio</label>
              <input id="pa-name" required type="text" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} placeholder="Ex: Pousada do Sol" style={input} />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={label} htmlFor="pa-kind">Tipo</label>
              <select id="pa-kind" value={form.kind} onChange={e => setForm({ ...form, kind: e.target.value as PartnerKind })} style={{ ...input, cursor: 'pointer' }}>
                {PARTNER_KINDS.map(k => <option key={k.id} value={k.id}>{k.emoji} {k.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px' }}>
              <label style={label} htmlFor="pa-contact">Seu nome</label>
              <input id="pa-contact" type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} style={input} />
            </div>
            <div style={{ flex: '1 1 200px' }}>
              <label style={label} htmlFor="pa-wa">WhatsApp</label>
              <input id="pa-wa" type="tel" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="(12) 99123-4567" style={input} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 240px' }}>
              <label style={label} htmlFor="pa-email">E-mail (será seu acesso ao portal)</label>
              <input id="pa-email" required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="contato@seunegocio.com" style={input} />
            </div>
            <div style={{ flex: '1 1 180px' }}>
              <label style={label} htmlFor="pa-hood">Bairro / praia</label>
              <input id="pa-hood" type="text" value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="Itamambuca" style={input} />
            </div>
          </div>

          {showPicker && (
            <div>
              <span style={label}>Que restrições alimentares e alergias o seu negócio precisa atender?</span>
              <p style={{ fontSize: '0.88rem', color: '#7a6a61', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                Pense nos seus hóspedes ou clientes. Marque o que se aplica (é opcional): a gente ajusta a proposta e avisa abaixo os doces que contêm o que você marcou.
              </p>
              <DietaryPicker value={diet} onChange={setDiet} compact showNotes={false} audience="business" />
            </div>
          )}

          {showPicker && (
            <div>
              <span style={label}>Quais itens fariam seus clientes pirarem?</span>
              <p style={{ fontSize: '0.88rem', color: '#7a6a61', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
                Toque nos que você imagina vendendo ou servindo. Escolha quantos quiser: eles vão junto com a sua mensagem.{diet.allergens.length > 0 && ' Os que contêm o que você marcou acima aparecem avisados.'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(104px, 1fr))', gap: '0.6rem', maxHeight: '340px', overflowY: 'auto', padding: '2px' }}>
                {treats.map(t => {
                  const on = picked.includes(t.id);
                  const m = diet.allergens.length ? matchDiet(diet.allergens, t.contains, t.may_contain) : null;
                  const flag = m && m.status === 'unsafe' ? `⚠ contém ${m.conflicts.map(a => a.label).join(', ')}`
                    : m && m.status === 'may' ? `🔸 pode conter ${m.traces.map(a => a.label).join(', ')}` : '';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => togglePick(t.id)}
                      style={{ position: 'relative', textAlign: 'center', padding: 0, borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', background: '#fff', border: `2px solid ${on ? '#d4af37' : '#e8e1d7'}`, boxShadow: on ? '0 6px 18px rgba(212,175,55,0.35)' : 'none', opacity: m && m.status === 'unsafe' && !on ? 0.55 : 1 }}
                    >
                      <span style={{ display: 'block', aspectRatio: '1', background: '#f5efe2' }}>
                        {t.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={optimizedSrc(t.image_url, 256)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        )}
                      </span>
                      <span style={{ display: 'block', padding: '0.35rem 0.4rem 0.45rem', fontSize: '0.8rem', lineHeight: 1.25, fontWeight: on ? 700 : 500, color: '#3c2a21' }}>{t.name}</span>
                      {flag && <span style={{ display: 'block', padding: '0 0.4rem 0.45rem', fontSize: '0.68rem', lineHeight: 1.25, color: m?.status === 'unsafe' ? '#b03a2e' : '#8a5a00', fontWeight: 700 }}>{flag}</span>}
                      {on && <span aria-hidden style={{ position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px', borderRadius: '50%', background: '#d4af37', color: '#3c2a21', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.85rem', color: on0(chosen), marginTop: '0.6rem', fontWeight: 600 }}>
                {chosen.length === 0 ? 'Nenhum escolhido ainda (opcional).' : `${chosen.length} ${chosen.length === 1 ? 'item escolhido' : 'itens escolhidos'}: ${chosen.join(', ')}`}
              </p>
            </div>
          )}

          <div>
            <label style={label} htmlFor="pa-notes">O que você tem em mente</label>
            <textarea id="pa-notes" rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Ex: geladeira na recepção, sobremesa no cardápio, café da manhã…" style={{ ...input, resize: 'vertical' }} />
          </div>

          {error && <p style={{ color: '#c0392b', fontSize: '0.92rem', lineHeight: 1.6 }}>{error}</p>}

          <button type="submit" disabled={sending} className="btn btn-primary" style={{ padding: '1.1rem 2rem', fontSize: '1.02rem' }}>
            {sending ? 'Enviando…' : 'Quero ser parceiro'}
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#7a6a61' }}>
            Já é parceiro? <Link href="/parceiro" style={{ color: '#8a6d1f', fontWeight: 700, display: 'inline-block', padding: '0.6rem 0.25rem' }}>Entrar no portal</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
