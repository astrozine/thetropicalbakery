'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HOST, type ChatMessage, type RoomData } from '@/lib/brunch';

interface Author { name: string; photo: string | null; emoji: string | null; host: boolean }

/** Someone's face in the room: their photo, else their emoji, with the emoji as a little badge on the photo. */
export function Avatar({ photo, emoji, name, size }: { photo?: string | null; emoji?: string | null; name?: string; size?: number }) {
  const style = size ? { width: size, height: size, fontSize: size * 0.45 } : undefined;
  return (
    <span className="bn-ava" style={style} aria-hidden>
      {photo ? <img src={photo} alt="" /> : (emoji || (name || '?').slice(0, 1).toUpperCase())}
      {photo && emoji && <em>{emoji}</em>}
    </span>
  );
}

const time = (iso: string) => {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return d.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    ...(today ? {} : { day: '2-digit', month: '2-digit' }),
    hour: '2-digit', minute: '2-digit',
  });
};

/**
 * The group chat of one brunch. Messages are rows in brunch_messages; who may read and write is decided by the
 * database (paid guests of this brunch and admins). New messages arrive live over Supabase Realtime, and an admin's
 * message is always shown as the host (the flag is set by the database, not by the browser).
 */
export default function BrunchChat({ room, myId, onUnknownAuthor }: { room: RoomData; myId: string; onUnknownAuthor?: () => void }) {
  const eventId = room.event.id;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const authors = useMemo(() => {
    const map = new Map<string, Author>();
    for (const m of room.members) {
      if (!m.user_id) continue;
      map.set(m.user_id, { name: m.display_name || m.first_name || 'Convidada', photo: m.photo_url ?? null, emoji: m.emoji ?? null, host: false });
    }
    for (const h of room.hosts) {
      map.set(h.user_id, { name: h.display_name || HOST.name, photo: h.photo_url || HOST.photo, emoji: h.emoji, host: true });
    }
    return map;
  }, [room]);

  const authorOf = (m: ChatMessage): Author =>
    authors.get(m.user_id)
    ?? (m.is_host ? { name: HOST.name, photo: HOST.photo, emoji: null, host: true } : { name: 'Convidada', photo: null, emoji: '🌺', host: false });

  const load = useCallback(async () => {
    const { data, error: e } = await supabase.from('brunch_messages').select('*')
      .eq('event_id', eventId).order('created_at', { ascending: false }).limit(300);
    if (!e) setMessages(((data || []) as ChatMessage[]).reverse());
    setLoaded(true);
  }, [eventId]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`brunch-chat-${eventId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'brunch_messages', filter: `event_id=eq.${eventId}` }, payload => {
        const m = payload.new as ChatMessage;
        setMessages(prev => (prev.some(x => x.id === m.id) ? prev : [...prev, m]));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'brunch_messages' }, payload => {
        const id = (payload.old as { id?: string })?.id;
        if (id) setMessages(prev => prev.filter(x => x.id !== id));
      })
      .subscribe();
    // A phone that slept through some messages catches up when it comes back.
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => { supabase.removeChannel(channel); window.removeEventListener('focus', onFocus); };
  }, [eventId, load]);

  // Someone new wrote before the room knew them: fetch the room again so their name and photo show.
  useEffect(() => {
    if (messages.some(m => !m.is_host && !authors.has(m.user_id))) onUnknownAuthor?.();
  }, [messages, authors, onUnknownAuthor]);

  useEffect(() => {
    const el = listRef.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    const { data, error: err } = await supabase.from('brunch_messages').insert([{ event_id: eventId, body, user_id: myId }]).select().single();
    if (err) {
      setError('A mensagem não foi. Tente de novo.');
    } else {
      setText('');
      stick.current = true;
      if (data) setMessages(prev => (prev.some(x => x.id === data.id) ? prev : [...prev, data as ChatMessage]));
    }
    setSending(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Apagar esta mensagem?')) return;
    const { error: err } = await supabase.from('brunch_messages').delete().eq('id', id);
    if (!err) setMessages(prev => prev.filter(x => x.id !== id));
  };

  return (
    <section className="bn-chat" aria-label="Conversa do grupo">
      {room.event.host_note && (
        <div className="bn-chat__pin">
          <img src={HOST.photo} alt="" />
          <span><strong>📌 Dolly:</strong> {room.event.host_note}</span>
        </div>
      )}
      <div
        className="bn-chat__list"
        ref={listRef}
        onScroll={e => { const el = e.currentTarget; stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}
        aria-live="polite"
      >
        {!loaded ? <p className="bn-chat__empty">Carregando a conversa…</p>
          : messages.length === 0 ? (
            <div className="bn-chat__empty">
              <p style={{ fontSize: '2rem', margin: 0 }}>👋</p>
              <p>Ninguém falou ainda. Que tal começar? Diga quem você é e o que te trouxe aqui.</p>
            </div>
          ) : messages.map(m => {
            const a = authorOf(m);
            const me = m.user_id === myId;
            return (
              <div key={m.id} className={`bn-msg${me ? ' bn-msg--me' : ''}${m.is_host ? ' bn-msg--host' : ''}`}>
                <Avatar photo={a.photo} emoji={a.emoji} name={a.name} />
                <div className="bn-bubble">
                  {!me && <span className="bn-bubble__who">{a.name}{m.is_host ? ' · anfitriã' : ''}</span>}
                  {m.body}
                  <span className="bn-bubble__time">
                    {time(m.created_at)}
                    {(me || room.is_admin) && <button type="button" className="bn-bubble__del" onClick={() => remove(m.id)}>apagar</button>}
                  </span>
                </div>
              </div>
            );
          })}
      </div>
      {error && <p className="bn-error" style={{ margin: '0 0.7rem' }}>{error}</p>}
      <form className="bn-chat__form" onSubmit={send}>
        <textarea
          className="bn-input"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(pointer: fine)').matches) { e.preventDefault(); send(); } }}
          placeholder={room.is_admin ? 'Escreva como Dolly…' : 'Escreva para o grupo…'}
          maxLength={2000}
          rows={1}
          aria-label="Mensagem"
        />
        <button className="bn-chat__send" disabled={sending || !text.trim()} aria-label="Enviar">➤</button>
      </form>
    </section>
  );
}
