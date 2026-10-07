'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  HOST, POLL_KINDS, SUGGESTIONS_PER_PERSON, VOTES_PER_KIND, votesCloseAt,
  type PollKind, type PollOption, type PollVote, type RoomData,
} from '@/lib/brunch';
import { Avatar } from './BrunchChat';

interface Face { name: string; photo: string | null; emoji: string | null }

const left = (to: Date, now: number) => {
  const ms = to.getTime() - now;
  if (ms <= 0) return '';
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  return d > 0 ? `${d} ${d === 1 ? 'dia' : 'dias'} e ${h}h` : `${h}h`;
};

/**
 * "Monte o brunch": the guests spend 3 votes on treats and 3 on topics, suggest their own ideas, and watch the
 * tally move live, with the faces of who voted for what, so the room starts to lean together. When the vote
 * closes Dolly marks what she will do ("A Dolly escolheu"), which is what tells people their voice counted.
 * The rules (budget, deadline, who may vote) are enforced by the database (migration 41); this only shows them.
 */
export default function BrunchVote({ room, myId }: { room: RoomData; myId: string }) {
  const eventId = room.event.id;
  const [options, setOptions] = useState<PollOption[]>([]);
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(false);
  const [kind, setKind] = useState<PollKind>('doce');
  const [idea, setIdea] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const [menu, setMenu] = useState<{ id: string; name: string; image_url: string | null }[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeAt = votesCloseAt(room.event);
  const open = now < closeAt.getTime();

  const load = useCallback(async () => {
    const [o, v] = await Promise.all([
      supabase.from('brunch_poll_options').select('*').eq('event_id', eventId).order('created_at'),
      supabase.from('brunch_votes').select('*').eq('event_id', eventId),
    ]);
    if (o.error && /brunch_poll_options|schema cache|does not exist/i.test(o.error.message)) setMissing(true);
    setOptions((o.data || []) as PollOption[]);
    setVotes((v.data || []) as PollVote[]);
    setLoaded(true);
  }, [eventId]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`brunch-vote-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brunch_votes' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'brunch_poll_options' }, () => load())
      .subscribe();
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [eventId, load]);

  const faces = useMemo(() => {
    const m = new Map<string, Face>();
    for (const p of room.members) if (p.user_id) m.set(p.user_id, { name: p.display_name || p.first_name || 'Convidada', photo: p.photo_url ?? null, emoji: p.emoji ?? null });
    for (const h of room.hosts) m.set(h.user_id, { name: h.display_name || HOST.name, photo: h.photo_url || HOST.photo, emoji: h.emoji });
    return m;
  }, [room]);
  const face = (uid: string): Face => faces.get(uid) ?? { name: 'Convidada', photo: null, emoji: '🌺' };

  const kindOptions = options.filter(o => o.kind === kind);
  const byOption = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const v of votes) m.set(v.option_id, [...(m.get(v.option_id) || []), v.user_id]);
    return m;
  }, [votes]);
  const count = (id: string) => byOption.get(id)?.length ?? 0;
  const ranked = [...kindOptions].sort((a, b) => Number(b.chosen) - Number(a.chosen) || count(b.id) - count(a.id) || a.created_at.localeCompare(b.created_at));
  const top = Math.max(1, ...kindOptions.map(o => count(o.id)));
  const leaderId = ranked.find(o => count(o.id) > 0)?.id;

  const myVotes = votes.filter(v => v.user_id === myId && kindOptions.some(o => o.id === v.option_id)).map(v => v.option_id);
  const seedsLeft = VOTES_PER_KIND - myVotes.length;
  const mySuggestions = options.filter(o => o.suggested_by === myId).length;
  const voters = new Set(votes.map(v => v.user_id)).size;

  // "N pessoas votaram igual a você": everyone else who shares at least one of your picks.
  const allMine = new Set(votes.filter(v => v.user_id === myId).map(v => v.option_id));
  const alike = new Set(votes.filter(v => v.user_id !== myId && allMine.has(v.option_id)).map(v => v.user_id)).size;

  const toggle = async (o: PollOption) => {
    if (!open || busy) return;
    setError('');
    setBusy(o.id);
    const mine = myVotes.includes(o.id);
    if (!mine && seedsLeft <= 0) { setError(`Você já usou os seus ${VOTES_PER_KIND} votos aqui. Toque num voto seu para tirar e votar em outro.`); setBusy(null); return; }
    const { error: e } = mine
      ? await supabase.from('brunch_votes').delete().eq('option_id', o.id).eq('user_id', myId)
      : await supabase.from('brunch_votes').insert([{ option_id: o.id, event_id: eventId }]);
    if (e) setError(e.message.replace(/^.*?: /, ''));
    await load();
    setBusy(null);
  };

  const suggest = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const label = idea.trim();
    if (label.length < 2) return;
    setBusy('new');
    setError('');
    const { data, error: e } = await supabase.from('brunch_poll_options').insert([{ event_id: eventId, kind, label }]).select().single();
    if (e) { setError(e.message.replace(/^.*?: /, '')); setBusy(null); return; }
    setIdea('');
    // Your own idea gets your vote straight away, if you still have one.
    if (data && seedsLeft > 0) await supabase.from('brunch_votes').insert([{ option_id: data.id, event_id: eventId }]);
    await load();
    setBusy(null);
  };

  /** The treat picker: Dolly's menu, with photos. A treat already in the vote just gets your vote. */
  const openMenu = async () => {
    setMenuOpen(o => !o);
    if (menu) return;
    const { data } = await supabase.from('treats').select('id, name, image_url').eq('is_available', true).order('name');
    setMenu((data || []) as { id: string; name: string; image_url: string | null }[]);
  };
  const pickTreat = async (t: { id: string; name: string }) => {
    const existing = options.find(o => o.treat_id === t.id);
    if (existing) { if (!myVotes.includes(existing.id)) await toggle(existing); setMenuOpen(false); return; }
    setBusy('new');
    setError('');
    const { data, error: e } = await supabase.from('brunch_poll_options').insert([{ event_id: eventId, kind: 'doce', label: t.name, treat_id: t.id }]).select().single();
    if (e) { setError(e.message.replace(/^.*?: /, '')); setBusy(null); return; }
    if (data && seedsLeft > 0) await supabase.from('brunch_votes').insert([{ option_id: data.id, event_id: eventId }]);
    setMenuOpen(false);
    await load();
    setBusy(null);
  };

  const removeOption = async (o: PollOption) => {
    if (!confirm(`Tirar "${o.label}" da votação?`)) return;
    await supabase.from('brunch_poll_options').delete().eq('id', o.id);
    load();
  };

  const setChosen = async (o: PollOption) => {
    await supabase.from('brunch_poll_options').update({ chosen: !o.chosen }).eq('id', o.id);
    load();
  };

  if (missing) return null;
  const k = POLL_KINDS.find(x => x.id === kind)!;

  return (
    <section className="bn-card bn-vote" aria-label="Monte o brunch">
      <div className="bn-vote__head">
        <div>
          <p className="bn-kicker" style={{ marginBottom: '0.2rem' }}>Monte o brunch</p>
          <h3 className="bn-h3" style={{ margin: 0 }}>{k.ask}</h3>
        </div>
        <span className={`bn-chip ${open ? 'bn-chip--gold' : ''}`}>{open ? `⏳ Fecha em ${left(closeAt, now)}` : '🔒 Votação fechada'}</span>
      </div>

      <div className="bn-vote__tabs" role="tablist">
        {POLL_KINDS.map(x => (
          <button key={x.id} type="button" role="tab" aria-selected={kind === x.id} className={`bn-room-tab${kind === x.id ? ' is-on' : ''}`} onClick={() => { setKind(x.id); setError(''); }}>
            {x.emoji} {x.label}
          </button>
        ))}
      </div>

      {open && (
        <div className="bn-seeds" aria-label={`Você tem ${seedsLeft} votos`}>
          <span>Seus votos:</span>
          {Array.from({ length: VOTES_PER_KIND }, (_, i) => <i key={i} className={i < seedsLeft ? 'on' : ''} aria-hidden>🌱</i>)}
          <small>{seedsLeft === 0 ? 'Todos plantados!' : `${seedsLeft} para plantar`}</small>
        </div>
      )}

      {!loaded ? <p className="bn-muted">Carregando…</p> : ranked.length === 0 ? (
        <p className="bn-muted" style={{ margin: '0.75rem 0' }}>{open ? 'Ainda não tem ideias aqui. Seja a primeira a sugerir!' : 'Ninguém votou neste brunch.'}</p>
      ) : (
        <ul className="bn-options">
          {ranked.map(o => {
            const n = count(o.id);
            const mine = myVotes.includes(o.id);
            const who = byOption.get(o.id) || [];
            return (
              <li key={o.id} className={`bn-option${mine ? ' is-mine' : ''}${o.chosen ? ' is-chosen' : ''}`}>
                <button type="button" className="bn-option__main" onClick={() => toggle(o)} disabled={!open || busy === o.id} aria-pressed={mine}>
                  {o.image_url && <img src={o.image_url} alt="" className="bn-option__img" />}
                  <span className="bn-option__text">
                    <span className="bn-option__label">
                      {o.label}
                      {o.chosen && <span className="bn-chip bn-chip--green">✨ A Dolly escolheu</span>}
                      {!o.chosen && o.id === leaderId && n > 1 && <span className="bn-chip bn-chip--rose">🔥 Em alta</span>}
                      {o.suggested_by === myId && <span className="bn-chip">Sua ideia</span>}
                    </span>
                    <span className="bn-option__bar"><span style={{ width: `${(n / top) * 100}%` }} /></span>
                    <span className="bn-option__who">
                      <span className="bn-faces">{who.slice(0, 6).map(uid => { const f = face(uid); return <Avatar key={uid} photo={f.photo} emoji={f.emoji} name={f.name} size={26} />; })}</span>
                      {who.length > 6 && <small>+{who.length - 6}</small>}
                      <small>{n === 0 ? 'nenhum voto ainda' : n === 1 ? '1 voto' : `${n} votos`}</small>
                    </span>
                  </span>
                  <span className="bn-option__seed" aria-hidden>{mine ? '🌱' : open ? '＋' : ''}</span>
                </button>
                {room.is_admin && (
                  <span className="bn-option__admin">
                    <button type="button" className="bn-bubble__del" style={{ color: '#0b6b3a' }} onClick={() => setChosen(o)}>{o.chosen ? 'desmarcar' : '✨ escolher'}</button>
                    <button type="button" className="bn-bubble__del" style={{ color: '#a5281b' }} onClick={() => removeOption(o)}>tirar</button>
                  </span>
                )}
                {!room.is_admin && o.suggested_by === myId && n === 0 && open && (
                  <span className="bn-option__admin"><button type="button" className="bn-bubble__del" onClick={() => removeOption(o)}>tirar minha ideia</button></span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="bn-error">{error}</p>}

      {open && kind === 'doce' && (room.is_admin || mySuggestions < SUGGESTIONS_PER_PERSON) && (
        <div style={{ margin: '0.75rem 0 0' }}>
          <button type="button" className="bn-btn bn-btn--ghost bn-btn--block" onClick={openMenu}>🧁 {menuOpen ? 'Fechar o cardápio' : 'Escolher do cardápio da Dolly'}</button>
          {menuOpen && (
            <div className="bn-menu-pick">
              {menu === null ? <p className="bn-muted">Carregando…</p> : menu.map(t => {
                const inVote = options.some(o => o.treat_id === t.id);
                return (
                  <button key={t.id} type="button" className="bn-menu-pick__item" onClick={() => pickTreat(t)} disabled={busy === 'new'}>
                    {t.image_url ? <img src={t.image_url} alt="" loading="lazy" /> : <span className="bn-menu-pick__ph">🧁</span>}
                    <span>{t.name}</span>
                    {inVote && <small>já na votação</small>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {open && (room.is_admin || mySuggestions < SUGGESTIONS_PER_PERSON) && (
        <form className="bn-suggest" onSubmit={suggest}>
          <input className="bn-input" value={idea} onChange={e => setIdea(e.target.value)} maxLength={120} placeholder={k.suggest} aria-label="Sua ideia" />
          <button className="bn-btn bn-btn--dark" disabled={busy === 'new' || idea.trim().length < 2}>Sugerir</button>
        </form>
      )}

      <p className="bn-help" style={{ marginTop: '0.75rem' }}>
        {voters > 0 && `🗳️ ${voters} ${voters === 1 ? 'pessoa votou' : 'pessoas votaram'}. `}
        {alike > 0 && `🤝 ${alike === 1 ? '1 pessoa pensa' : `${alike} pessoas pensam`} parecido com você. `}
        {open ? `Você pode mudar os seus votos até a votação fechar. A Dolly olha o resultado e conta no grupo o que vai fazer.` : 'O que tem ✨ é o que a Dolly vai fazer.'}
      </p>
    </section>
  );
}
