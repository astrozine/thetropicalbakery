'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { PARTNER_KINDS, PartnerKind } from '@/lib/portals';

interface Props {
  /** Pre-picked on each B2B page, e.g. 'pousada' on the pousadas page. */
  defaultKind: PartnerKind;
  whatsappHref: string;
}

const input: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem', border: '1px solid rgba(212,175,55,0.5)',
  borderRadius: '8px', background: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-body)', fontSize: '1rem',
};
const label: React.CSSProperties = {
  display: 'block', fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase',
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
      p_notes: form.notes.trim() || null,
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
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.9rem 1.6rem' }}>Falar agora</a>
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
            Já é parceiro? <Link href="/parceiro" style={{ color: '#8a6d1f', fontWeight: 700 }}>Entrar no portal</Link>
          </p>
        </form>
      </div>
    </section>
  );
}
