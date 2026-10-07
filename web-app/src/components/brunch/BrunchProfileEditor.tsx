'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resizeImage } from '@/lib/imageUpload';
import { EMOJI_CHOICES, type BrunchProfile, type RoomMember } from '@/lib/brunch';
import { Avatar } from './BrunchChat';

type Draft = Omit<BrunchProfile, 'user_id'>;
const EMPTY: Draft = {
  display_name: '', emoji: '🌺', photo_url: null, headline: '', bio: '', instagram: '',
  business_name: '', business_url: '', offers: '', seeks: '',
};

const handle = (ig: string) => ig.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/\/$/, '');

/** One person's card in the room. */
export function PersonCard({ p, host }: { p: Partial<RoomMember> & { first_name?: string }; host?: boolean }) {
  const name = p.display_name || p.first_name || 'Convidada';
  const ig = p.instagram ? handle(p.instagram) : '';
  return (
    <article className={`bn-person${p.is_me ? ' bn-person--me' : ''}`}>
      <Avatar photo={p.photo_url} emoji={p.emoji} name={name} />
      <div style={{ minWidth: 0 }}>
        <b>{name}{p.is_me ? ' (você)' : ''}{host ? ' · anfitriã' : ''}</b>
        {p.headline && <p className="bn-person__head">{p.headline}</p>}
        {p.bio && <p>{p.bio}</p>}
        {(p.offers || p.seeks) && (
          <div className="bn-person__tags">
            {p.offers && <span>🤲 <strong>Posso ajudar com:</strong> {p.offers}</span>}
            {p.seeks && <span>🔎 <strong>Estou procurando:</strong> {p.seeks}</span>}
          </div>
        )}
        <p style={{ margin: '0.5rem 0 0', display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
          {ig && <a href={`https://instagram.com/${ig}`} target="_blank" rel="noopener noreferrer">@{ig}</a>}
          {p.business_url && <a href={/^https?:\/\//.test(p.business_url) ? p.business_url : `https://${p.business_url}`} target="_blank" rel="noopener noreferrer">{p.business_name || 'Site'} ↗</a>}
          {!p.business_url && p.business_name && <span className="bn-muted">{p.business_name}</span>}
        </p>
        {p.is_me && !p.headline && !p.bio && <p className="bn-help">Seu cartão está vazio: complete para as pessoas te acharem.</p>}
      </div>
    </article>
  );
}

/**
 * "Seu cartão": what the others at your brunch see. Saved to brunch_profiles (your own row only; the database
 * refuses anything else). The photo goes to the public `brunch` bucket, inside a folder named after your account.
 */
export default function BrunchProfileEditor({ userId, initial, fallbackName, onSaved, onCancel }: {
  userId: string;
  initial: Partial<BrunchProfile> | null;
  fallbackName?: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const [d, setD] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    setD({
      ...EMPTY,
      ...Object.fromEntries(Object.entries(initial || {}).filter(([, v]) => v !== null && v !== undefined)),
      display_name: initial?.display_name || fallbackName || '',
    } as Draft);
  }, [initial, fallbackName]);

  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD(prev => ({ ...prev, [k]: e.target.value }));

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setMsg(null);
    try {
      const blob = await resizeImage(file, 600, 0.85);
      const path = `${userId}/avatar-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from('brunch').upload(path, blob, { contentType: 'image/jpeg', upsert: true });
      if (error) throw error;
      setD(prev => ({ ...prev, photo_url: supabase.storage.from('brunch').getPublicUrl(path).data.publicUrl }));
    } catch {
      setMsg({ ok: false, text: 'A foto não subiu. Tente outra, ou mais tarde.' });
    }
    setUploading(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const clean = (v: string | null) => (v ?? '').trim() || null;
    const { error } = await supabase.from('brunch_profiles').upsert({
      user_id: userId,
      display_name: clean(d.display_name),
      emoji: d.emoji || '🌺',
      photo_url: d.photo_url,
      headline: clean(d.headline),
      bio: clean(d.bio),
      instagram: d.instagram ? handle(d.instagram) || null : null,
      business_name: clean(d.business_name),
      business_url: clean(d.business_url),
      offers: clean(d.offers),
      seeks: clean(d.seeks),
    }, { onConflict: 'user_id' });
    setBusy(false);
    if (error) { setMsg({ ok: false, text: 'Não conseguimos salvar. Tente de novo.' }); return; }
    setMsg({ ok: true, text: 'Cartão salvo ✓' });
    onSaved?.();
  };

  return (
    <form className="bn-card" onSubmit={save}>
      <p className="bn-kicker">Seu cartão no brunch</p>
      <h3 className="bn-h3" style={{ marginBottom: '0.9rem' }}>É assim que as outras pessoas te veem</h3>

      <div className="bn-photo-pick">
        <Avatar photo={d.photo_url} emoji={d.emoji} name={d.display_name || '?'} />
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <label className="bn-btn bn-btn--ghost" style={{ minHeight: 44, cursor: 'pointer' }}>
            {uploading ? 'Enviando…' : d.photo_url ? 'Trocar a foto' : '📷 Pôr uma foto'}
            <input type="file" accept="image/*" hidden onChange={e => pickPhoto(e.target.files?.[0])} />
          </label>
          {d.photo_url && <button type="button" className="bn-bubble__del" style={{ color: '#a5281b', textAlign: 'left', padding: 0 }} onClick={() => setD(p => ({ ...p, photo_url: null }))}>tirar a foto</button>}
        </div>
      </div>

      <span className="bn-label">Seu emoji</span>
      <div className="bn-emojis" style={{ marginBottom: '1rem' }} role="radiogroup" aria-label="Seu emoji">
        {EMOJI_CHOICES.map(em => (
          <button key={em} type="button" role="radio" aria-checked={d.emoji === em} className={d.emoji === em ? 'is-on' : ''} onClick={() => setD(p => ({ ...p, emoji: em }))}>{em}</button>
        ))}
      </div>

      <label className="bn-field"><span className="bn-label">Como quer ser chamada</span>
        <input className="bn-input" value={d.display_name ?? ''} onChange={set('display_name')} maxLength={60} placeholder="Ana" />
      </label>
      <label className="bn-field"><span className="bn-label">O que você faz, numa linha</span>
        <input className="bn-input" value={d.headline ?? ''} onChange={set('headline')} maxLength={90} placeholder="Nutricionista funcional · atendo online" />
      </label>
      <label className="bn-field"><span className="bn-label">Um pouco sobre você</span>
        <textarea className="bn-input" value={d.bio ?? ''} onChange={set('bio')} maxLength={500} placeholder="De onde você vem, o que te move, o que está construindo agora." />
      </label>
      <label className="bn-field"><span className="bn-label">🤲 Posso ajudar com</span>
        <input className="bn-input" value={d.offers ?? ''} onChange={set('offers')} maxLength={200} placeholder="Cardápios, Instagram para terapeutas, aulas de yoga…" />
      </label>
      <label className="bn-field"><span className="bn-label">🔎 Estou procurando</span>
        <input className="bn-input" value={d.seeks ?? ''} onChange={set('seeks')} maxLength={200} placeholder="Parcerias, um espaço para atender, clientes em Ubatuba…" />
      </label>
      <div style={{ display: 'grid', gap: '0 0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))' }}>
        <label className="bn-field"><span className="bn-label">Instagram</span>
          <input className="bn-input" value={d.instagram ?? ''} onChange={set('instagram')} maxLength={80} placeholder="@seuperfil" />
        </label>
        <label className="bn-field"><span className="bn-label">Seu negócio</span>
          <input className="bn-input" value={d.business_name ?? ''} onChange={set('business_name')} maxLength={80} placeholder="Nome da marca" />
        </label>
      </div>
      <label className="bn-field"><span className="bn-label">Site ou link</span>
        <input className="bn-input" value={d.business_url ?? ''} onChange={set('business_url')} maxLength={160} placeholder="seusite.com.br" />
      </label>

      {msg && <p className={msg.ok ? 'bn-ok' : 'bn-error'}>{msg.text}</p>}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
        <button className="bn-btn bn-btn--gold" disabled={busy || uploading}>{busy ? 'Salvando…' : 'Salvar meu cartão'}</button>
        {onCancel && <button type="button" className="bn-btn bn-btn--ghost" onClick={onCancel}>Fechar</button>}
      </div>
    </form>
  );
}
