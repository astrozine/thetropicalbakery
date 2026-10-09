'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { brandAlert, brandConfirm } from '@/lib/brandDialog';
import { formatBRL } from '@/lib/deliveryZones';
import { getSiteSetting } from '@/lib/siteSettings';
import { COURSE_CONTENT } from '@/lib/courseContent';
import { IMMERSION_FEE_PER_GUEST_PER_NIGHT, quoteRetreatPackage, type RetreatRoom } from '@/lib/retreatPricing';
import {
  HOUSE_ID, addDays, classesOf, effectiveBusy, isFree, nightsForClasses, nightsOf, todayBR, type NightsByRoom,
} from '@/lib/retreatPlan';

/**
 * Retreat reservations, side by side with the Airbnb calendar (migration 47).
 * Grey = sold on Airbnb/Booking, gold = a retreat held, green = a retreat with the deposit paid.
 * Tap a free day to reserve it; the nights go out to Airbnb through the room's calendar link.
 */

interface CalRow { room_id: string; import_urls: string[]; export_token: string; last_synced_at: string | null; last_sync_error: string | null }
interface Booking {
  id: string; room_id: string; check_in: string; check_out: string; guests: number; courses: string[];
  guest_name: string; whatsapp: string | null; email: string | null; status: 'reservado' | 'confirmado' | 'cancelado';
  total: number | null; deposit_paid: number; notes: string | null;
}

const card: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: 'clamp(1rem, 3vw, 1.5rem)', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', marginBottom: '1.5rem' };
const input: React.CSSProperties = { width: '100%', padding: '0.7rem', border: '1px solid #ccc', borderRadius: '8px', fontSize: '0.95rem' };
const label: React.CSSProperties = { display: 'block', fontWeight: 700, color: '#2c3e50', marginBottom: '0.3rem', fontSize: '0.85rem' };
const chip = (on: boolean): React.CSSProperties => ({
  padding: '0.45rem 0.9rem', borderRadius: '999px', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem',
  border: `2px solid ${on ? '#d4af37' : '#e5e5e5'}`, background: on ? '#fffdf3' : 'white', color: '#2c3e50',
});
const dark: React.CSSProperties = { background: '#2c3e50', color: 'white', border: 'none', padding: '0.7rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 };
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
// One color per rental, so the four cards below (and the rows of the month above) are easy to tell apart.
// `airbnbId` is the number in that listing's Airbnb address and calendar link; it is how a link pasted in the
// wrong card gets caught.
const ROOM_STYLE: Record<string, { color: string; emoji: string; airbnb: string; airbnbId: string }> = {
  house: { color: '#2e7d4f', emoji: '🏡', airbnb: 'Fabulous Luxury Beach House', airbnbId: '873166894206646380' },
  penthouse: { color: '#2b6cb0', emoji: '🌅', airbnb: 'Luxury Family Beach Penthouse', airbnbId: '1257394362209121684' },
  big_suite: { color: '#7b4fa3', emoji: '🌊', airbnb: 'Luxury Surf & Beach ~Suite 1~', airbnbId: '589851889015316995' },
  small_suite: { color: '#d9822b', emoji: '🌴', airbnb: 'Practical Surf & Beach Kitnet', airbnbId: '873138853997998343' },
};
const roomStyle = (id: string) => ROOM_STYLE[id] ?? { color: '#7f8c8d', emoji: '🛏️', airbnb: '', airbnbId: '' };
const COLORS = { free: '#dff3e5', guest: '#5f6b78', closed: '#b9c0c8', linked: 'repeating-linear-gradient(135deg, #d5dade 0 4px, #f1f3f5 4px 8px)', reservado: '#f1c84b', confirmado: '#3f8f5a' };
type CellKind = keyof typeof COLORS;
const LEGEND: { kind: CellKind; title: string; text: string }[] = [
  { kind: 'free', title: 'Livre', text: 'dá para vender um retiro: toque no dia' },
  { kind: 'guest', title: 'Hóspede do Airbnb / Booking', text: 'alguém já reservou esse quarto' },
  { kind: 'closed', title: 'Fechado', text: 'dia bloqueado no Airbnb' },
  { kind: 'linked', title: 'Preso a outro quarto', text: 'a casa toda está alugada, ou (na linha da casa) uma suíte está ocupada' },
  { kind: 'reservado', title: 'Retiro reservado', text: 'ainda sem sinal' },
  { kind: 'confirmado', title: 'Retiro com sinal pago', text: 'confirmado' },
];
const br = (iso: string) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const waNumber = (v: string | null) => { const d = (v || '').replace(/\D/g, ''); return d ? (d.length <= 11 ? `55${d}` : d) : ''; };

const EMPTY = { room_id: 'penthouse', check_in: '', nights: 3, guests: 2, courses: [] as string[], guest_name: '', whatsapp: '', email: '', status: 'reservado' as Booking['status'], total: '', deposit_paid: '', notes: '' };

export default function RetreatReservations() {
  const [rooms, setRooms] = useState<RetreatRoom[]>([]);
  const [cal, setCal] = useState<CalRow[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [busyData, setBusyData] = useState<{ ical: NightsByRoom; blocked?: NightsByRoom; booked: NightsByRoom } | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [form, setForm] = useState<typeof EMPTY | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState('');
  const [urlDrafts, setUrlDrafts] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState('');
  const [roomNote, setRoomNote] = useState<Record<string, { ok: boolean; text: string }>>({});
  const [fee, setFee] = useState(IMMERSION_FEE_PER_GUEST_PER_NIGHT);
  const [coursePrice, setCoursePrice] = useState<Record<string, number>>({});

  const loadBusy = useCallback(async () => {
    const r = await fetch('/api/retreats/availability', { cache: 'no-store' });
    if (r.ok) { const d = await r.json(); if (!d.error) setBusyData(d); }
  }, []);

  const load = useCallback(async () => {
    const [roomsRes, calRes, bookRes, coursesRes] = await Promise.all([
      supabase.from('retreat_rooms').select('id, name, airbnb_nightly_rate, max_guests').order('id'),
      supabase.from('retreat_calendar').select('*'),
      supabase.from('retreat_bookings').select('*').gte('check_out', addDays(todayBR(), -30)).order('check_in'),
      supabase.from('courses').select('slug, price'),
    ]);
    if (calRes.error || bookRes.error) { setMissing(true); setLoading(false); return; }
    const order = ['house', 'penthouse', 'big_suite', 'small_suite'];
    setRooms((roomsRes.data ?? []).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)));
    setCal(calRes.data ?? []);
    setUrlDrafts(Object.fromEntries((calRes.data ?? []).map(c => [c.room_id, (c.import_urls ?? []).join('\n')])));
    setBookings(bookRes.data ?? []);
    setCoursePrice(Object.fromEntries((coursesRes.data ?? []).map(c => [c.slug, Number(c.price) || 0])));
    await loadBusy();
    setLoading(false);
  }, [loadBusy]);

  useEffect(() => {
    load();
    getSiteSetting('retreat_immersion_fee_per_guest_per_night', IMMERSION_FEE_PER_GUEST_PER_NIGHT).then(setFee);
  }, [load]);

  const busy = useMemo(() => (busyData ? effectiveBusy(rooms.map(r => r.id), busyData.ical, busyData.booked, busyData.blocked) : {}), [busyData, rooms]);

  /** What one day of one room is, for the grid, and why (the tooltip). */
  const cellOf = (roomId: string, d: string): { kind: CellKind; why: string; booking?: Booking } => {
    const active = bookings.filter(b => b.status !== 'cancelado' && d >= b.check_in && d < b.check_out);
    const own = active.find(b => b.room_id === roomId);
    if (own) return { kind: own.status === 'confirmado' ? 'confirmado' : 'reservado', why: `Retiro: ${own.guest_name}`, booking: own };
    if (busyData?.ical[roomId]?.includes(d)) return { kind: 'guest', why: 'Hóspede do Airbnb / Booking' };
    if (roomId === HOUSE_ID) {
      const suite = rooms.find(r => r.id !== HOUSE_ID && (busyData?.ical[r.id]?.includes(d) || busyData?.blocked?.[r.id]?.includes(d) || active.some(b => b.room_id === r.id)));
      if (suite) return { kind: 'linked', why: `A casa toda não dá: ${suite.name} está ocupada`, booking: active.find(b => b.room_id === suite.id) };
      if (busyData?.blocked?.[HOUSE_ID]?.includes(d)) return { kind: 'closed', why: 'Fechado no Airbnb' };
    } else {
      const houseRetreat = active.find(b => b.room_id === HOUSE_ID);
      if (houseRetreat || busyData?.ical[HOUSE_ID]?.includes(d)) return { kind: 'linked', why: 'A casa toda está alugada', booking: houseRetreat };
      if (busyData?.blocked?.[roomId]?.includes(d)) return { kind: 'closed', why: 'Fechado no Airbnb' };
    }
    return busy[roomId]?.has(d) ? { kind: 'closed', why: 'Ocupado' } : { kind: 'free', why: 'Livre: toque para reservar um retiro' };
  };

  // Month grid
  const base = new Date(`${todayBR().slice(0, 7)}-01T00:00:00Z`);
  base.setUTCMonth(base.getUTCMonth() + monthOffset);
  const year = base.getUTCFullYear(), month = base.getUTCMonth();
  const first = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const days = Array.from({ length: new Date(Date.UTC(year, month + 1, 0)).getUTCDate() }, (_, i) => addDays(first, i));

  // The form's own quote
  const fRoom = rooms.find(r => r.id === form?.room_id);
  const autoTotal = form && fRoom
    ? quoteRetreatPackage(fRoom, form.nights, form.guests, fee).total + form.courses.reduce((s, c) => s + (coursePrice[c] ?? 0), 0) * form.guests
    : 0;

  const openForm = (roomId: string, checkIn: string) => setForm({ ...EMPTY, room_id: roomId, check_in: checkIn });
  const setCourses = (courses: string[]) => setForm(f => f && ({ ...f, courses, nights: classesOf(courses) ? nightsForClasses(classesOf(courses)) : f.nights }));

  const save = async () => {
    if (!form) return;
    if (!form.check_in || !form.guest_name.trim()) { await brandAlert('Preencha a data de chegada e o nome.'); return; }
    setSaving(true);
    // Read Airbnb again right before saving: the grid may be a few minutes old.
    const fresh = await fetch('/api/retreats/availability', { cache: 'no-store' }).then(r => r.json()).catch(() => null);
    const nowBusy = fresh && !fresh.error ? effectiveBusy(rooms.map(r => r.id), fresh.ical, fresh.booked, fresh.blocked) : busy;
    if (!isFree(nowBusy[form.room_id], form.check_in, form.nights)) {
      const clash = nightsOf(form.check_in, form.nights).filter(n => nowBusy[form.room_id]?.has(n)).map(br).join(', ');
      setSaving(false);
      if (!(await brandConfirm(`Essas noites já estão ocupadas (${clash}), no Airbnb ou em outro retiro. Salvar mesmo assim?`))) return;
      setSaving(true);
    }
    const { error } = await supabase.from('retreat_bookings').insert({
      room_id: form.room_id, check_in: form.check_in, check_out: addDays(form.check_in, form.nights), guests: form.guests,
      courses: form.courses, guest_name: form.guest_name.trim(), whatsapp: form.whatsapp.trim() || null, email: form.email.trim() || null,
      status: form.status, total: Number(form.total) || autoTotal || null, deposit_paid: Number(form.deposit_paid) || 0, notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) { await brandAlert(`Não deu para salvar: ${error.message}`); return; }
    setForm(null);
    await load();
    await brandAlert('Reserva salva. O Airbnb bloqueia essas noites na próxima leitura do calendário (até ~2 horas). Se for para já, bloqueie também no app do Airbnb.');
  };

  const setStatus = async (b: Booking, status: Booking['status']) => {
    if (status === 'cancelado' && !(await brandConfirm(`Cancelar o retiro de ${b.guest_name}? As noites voltam a ficar livres no Airbnb.`))) return;
    const patch: Partial<Booking> = { status };
    if (status === 'confirmado' && !b.deposit_paid && b.total) patch.deposit_paid = Math.round(b.total * 0.3);
    await supabase.from('retreat_bookings').update(patch).eq('id', b.id);
    load();
  };

  const syncNow = async () => {
    setSyncing(true); setSyncNote('');
    const { data: { session } } = await supabase.auth.getSession();
    const r = await fetch('/api/retreats/availability', { method: 'POST', headers: { Authorization: `Bearer ${session?.access_token ?? ''}` } });
    const d = await r.json().catch(() => ({}));
    setSyncing(false);
    if (!r.ok) { setSyncNote(d.error || 'Não deu para sincronizar.'); return; }
    setBusyData(d);
    const done = (d.results ?? []).filter((x: { skipped?: boolean }) => !x.skipped);
    const bad = done.filter((x: { ok: boolean }) => !x.ok);
    setSyncNote(done.length === 0 ? 'Nenhum link do Airbnb colado ainda.' : bad.length ? `${bad.length} link(s) com erro, veja abaixo.` : 'Calendários lidos agora.');
    const { data } = await supabase.from('retreat_calendar').select('*');
    if (data) setCal(data);
  };

  const saveUrls = async (roomId: string) => {
    const urls = (urlDrafts[roomId] ?? '').split(/\s+/).map(u => u.trim()).filter(u => /^https?:\/\//.test(u));
    const { error } = await supabase.from('retreat_calendar').update({ import_urls: urls, last_synced_at: null }).eq('room_id', roomId);
    if (error) { await brandAlert(error.message); return; }
    setRoomNote(n => ({ ...n, [roomId]: { ok: true, text: 'Lendo o Airbnb…' } }));
    await syncNow();
    // syncNow refreshed the stored nights; say what this room ended up with, right under the button.
    const { data: row } = await supabase.from('retreat_calendar').select('last_sync_error').eq('room_id', roomId).maybeSingle();
    const { count } = await supabase.from('retreat_busy_nights').select('night', { count: 'exact', head: true }).eq('room_id', roomId).gte('night', todayBR());
    setRoomNote(n => ({
      ...n,
      [roomId]: !urls.length
        ? { ok: true, text: 'Link removido.' }
        : row?.last_sync_error
          ? { ok: false, text: `Não consegui ler esse link: ${row.last_sync_error}. Confira se copiou o link inteiro.` }
          : { ok: true, text: `✓ Pronto! Li o calendário: ${count ?? 0} noites ocupadas daqui para frente. Elas já aparecem cinza no mês lá em cima.` },
    }));
  };

  const exportUrl = (c: CalRow) => `${window.location.origin}/api/retreats/ical/${c.room_id}.ics?token=${c.export_token}`;
  const roomName = (id: string) => rooms.find(r => r.id === id)?.name ?? id;

  if (loading) return <div style={{ padding: '2rem' }}>Carregando…</div>;
  if (missing) return (
    <div style={card}>
      <h2>Falta um passo</h2>
      <p>Rode o arquivo <code>migration_47_retreat_calendar.sql</code> no Supabase (SQL Editor) e recarregue esta página.</p>
    </div>
  );

  const upcoming = bookings.filter(b => b.status !== 'cancelado' && b.check_out >= todayBR());
  const anyFeed = cal.some(c => c.import_urls?.length);

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', color: '#2c3e50' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0 }}>🏝️ Reservas de Retiro</h1>
          <p style={{ margin: '0.3rem 0 0', color: '#7f8c8d' }}>O calendário da casa, junto com o Airbnb. Toque num dia livre para reservar.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {syncNote && <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>{syncNote}</span>}
          <button type="button" style={dark} onClick={syncNow} disabled={syncing}>{syncing ? 'Lendo o Airbnb…' : '🔄 Sincronizar agora'}</button>
          <button type="button" style={{ ...dark, background: '#d4af37', color: '#2c3e50' }} onClick={() => openForm(rooms[1]?.id ?? 'penthouse', addDays(todayBR(), 7))}>+ Novo retiro</button>
        </div>
      </div>

      {!anyFeed && (
        <div style={{ ...card, background: '#fff8e1', border: '1px solid #f1c84b' }}>
          <strong>⚠️ O Airbnb ainda não está ligado.</strong> Até colar os links lá embaixo (“Ligar ao Airbnb”), o site oferece todas as datas e quem confirma é você no WhatsApp.
        </div>
      )}

      {/* The month, one row per room */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <button type="button" style={chip(false)} onClick={() => setMonthOffset(m => m - 1)}>‹</button>
          <strong style={{ fontSize: '1.15rem' }}>{MONTHS[month]} {year}</strong>
          <button type="button" style={chip(false)} onClick={() => setMonthOffset(m => m + 1)}>›</button>
        </div>
        <p style={{ margin: '0 0 0.9rem', padding: '0.7rem 0.9rem', background: '#f4f8fb', borderRadius: '10px', color: '#34495e', fontSize: '0.9rem', lineHeight: 1.55 }}>
          <b>Cada quarto se vende separado.</b> Um casal na Standard Suite só precisa que a Standard Suite esteja livre.
          {' '}<b>A Casa Toda</b> só fica livre quando os três quartos estão livres. Os dias com <b style={{ color: '#2e7d4f' }}>+</b> são os que você pode vender.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: '3px', fontSize: '0.75rem' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', minWidth: '120px' }} />
                {days.map(d => {
                  const wd = new Date(`${d}T12:00:00Z`).getUTCDay();
                  return <th key={d} style={{ minWidth: '26px', color: wd === 0 || wd === 6 ? '#d9453a' : '#7f8c8d', fontWeight: d === todayBR() ? 900 : 500 }}>{Number(d.slice(8))}</th>;
                })}
              </tr>
            </thead>
            <tbody>
              {rooms.map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 700, paddingRight: '0.6rem', whiteSpace: 'nowrap', borderLeft: `6px solid ${roomStyle(r.id).color}`, paddingLeft: '0.5rem', lineHeight: 1.25 }}>
                    {roomStyle(r.id).emoji} {r.name}
                    <div style={{ fontWeight: 600, fontSize: '0.72rem', color: '#2e7d4f' }}>
                      {days.filter(d => d >= todayBR() && cellOf(r.id, d).kind === 'free').length} noites livres
                    </div>
                  </td>
                  {days.map(d => {
                    const c = cellOf(r.id, d);
                    const past = d < todayBR();
                    return (
                      <td key={d}>
                        <button
                          type="button"
                          disabled={past || (c.kind !== 'free' && !c.booking)}
                          onClick={() => c.kind === 'free' ? openForm(r.id, d) : c.booking && document.getElementById(`b-${c.booking.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                          title={`${br(d)} · ${c.why}`}
                          style={{
                            width: '28px', height: '32px', border: c.kind === 'free' && !past ? '1px solid #9fd4ae' : 'none', borderRadius: '6px', padding: 0,
                            background: past ? '#f3f3f3' : COLORS[c.kind],
                            color: '#2e7d4f', fontWeight: 900, fontSize: '1rem', lineHeight: 1,
                            cursor: past ? 'default' : c.kind === 'free' || c.booking ? 'pointer' : 'default', opacity: past ? 0.45 : 1,
                          }}
                        >
                          {c.kind === 'free' && !past ? '+' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.6rem 1.2rem', fontSize: '0.82rem', marginTop: '1rem', color: '#555' }}>
          {LEGEND.map(l => (
            <div key={l.kind} style={{ display: 'flex', gap: '0.55rem', alignItems: 'flex-start' }}>
              <span style={{ flex: '0 0 auto', width: 22, height: 22, borderRadius: 5, background: COLORS[l.kind], border: l.kind === 'free' ? '1px solid #9fd4ae' : '1px solid #ddd', color: '#2e7d4f', fontWeight: 900, textAlign: 'center', lineHeight: '20px' }}>{l.kind === 'free' ? '+' : ''}</span>
              <span><b style={{ color: '#2c3e50' }}>{l.title}</b><br />{l.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* New reservation */}
      {form && (
        <div style={{ ...card, border: '2px solid #d4af37' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: '0 0 1rem' }}>Novo retiro</h2>
            <button type="button" style={chip(false)} onClick={() => setForm(null)}>Fechar</button>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <span style={label}>Cursos</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {COURSE_CONTENT.map(c => (
                  <button key={c.slug} type="button" style={chip(form.courses.includes(c.slug))}
                    onClick={() => setCourses(form.courses.includes(c.slug) ? form.courses.filter(x => x !== c.slug) : [...form.courses, c.slug])}>
                    {c.title} · {c.retreatClasses} {c.retreatClasses > 1 ? 'aulas' : 'aula'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span style={label}>Acomodação</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {rooms.map(r => <button key={r.id} type="button" style={chip(form.room_id === r.id)} onClick={() => setForm({ ...form, room_id: r.id })}>{r.name}</button>)}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
              <div><label style={label}>Chegada</label><input type="date" style={input} value={form.check_in} onChange={e => setForm({ ...form, check_in: e.target.value })} /></div>
              <div><label style={label}>Noites {form.check_in && <span style={{ fontWeight: 400 }}>(sai {br(addDays(form.check_in, form.nights))})</span>}</label><input type="number" min={1} style={input} value={form.nights} onChange={e => setForm({ ...form, nights: Math.max(1, Number(e.target.value) || 1) })} /></div>
              <div><label style={label}>Pessoas</label><input type="number" min={1} max={fRoom?.max_guests ?? 11} style={input} value={form.guests} onChange={e => setForm({ ...form, guests: Math.max(1, Number(e.target.value) || 1) })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div><label style={label}>Nome</label><input style={input} value={form.guest_name} onChange={e => setForm({ ...form, guest_name: e.target.value })} /></div>
              <div><label style={label}>WhatsApp</label><input style={input} value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
              <div><label style={label}>E-mail</label><input style={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div><label style={label}>Total (R$) <span style={{ fontWeight: 400 }}>calculado: {formatBRL(autoTotal)}</span></label><input type="number" style={input} placeholder={String(autoTotal)} value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} /></div>
              <div><label style={label}>Sinal já pago (R$)</label><input type="number" style={input} value={form.deposit_paid} onChange={e => setForm({ ...form, deposit_paid: e.target.value })} /></div>
              <div>
                <span style={label}>Situação</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" style={chip(form.status === 'reservado')} onClick={() => setForm({ ...form, status: 'reservado' })}>Reservado</button>
                  <button type="button" style={chip(form.status === 'confirmado')} onClick={() => setForm({ ...form, status: 'confirmado' })}>Sinal pago</button>
                </div>
              </div>
            </div>
            <div><label style={label}>Anotações (alergias, como chegam, pedidos)</label><textarea style={{ ...input, minHeight: '70px' }} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <button type="button" style={{ ...dark, background: '#d4af37', color: '#2c3e50', padding: '0.9rem' }} onClick={save} disabled={saving}>
              {saving ? 'Conferindo o Airbnb e salvando…' : 'Salvar e bloquear as noites'}
            </button>
          </div>
        </div>
      )}

      {/* Upcoming */}
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Próximos retiros</h2>
        {upcoming.length === 0 ? <p style={{ color: '#7f8c8d' }}>Nenhum ainda.</p> : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {upcoming.map(b => {
              const wa = waNumber(b.whatsapp);
              return (
                <div key={b.id} id={`b-${b.id}`} style={{ border: '1px solid #eee', borderLeft: `6px solid ${COLORS[b.status === 'confirmado' ? 'confirmado' : 'reservado']}`, borderRadius: '10px', padding: '0.9rem 1rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <strong>{b.guest_name}</strong> · {roomName(b.room_id)} · {b.guests}p
                    <div style={{ fontSize: '0.88rem', color: '#555' }}>
                      {br(b.check_in)} → {br(b.check_out)} ({Math.round((Date.parse(b.check_out) - Date.parse(b.check_in)) / 86400000)} noites)
                      {b.courses.length > 0 && <> · {b.courses.map(s => COURSE_CONTENT.find(c => c.slug === s)?.title ?? s).join(', ')}</>}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>
                      {b.total ? <>Total {formatBRL(b.total)} · sinal {formatBRL(b.deposit_paid)} · falta {formatBRL(b.total - b.deposit_paid)}</> : 'Sem valor'}
                      {b.notes && <> · {b.notes}</>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" style={chip(false)}>WhatsApp</a>}
                    <Link href={`/admin/propostas?from=retreat_bookings:${b.id}`} style={chip(false)}>💳 Proposta</Link>
                    {b.status === 'reservado' && <button type="button" style={chip(true)} onClick={() => setStatus(b, 'confirmado')}>Sinal pago ✓</button>}
                    <button type="button" style={{ ...chip(false), color: '#c0392b' }} onClick={() => setStatus(b, 'cancelado')}>Cancelar</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Connecting Airbnb / Booking */}
      <div style={card}>
        <h2 style={{ marginTop: 0 }}>Ligar ao Airbnb e ao Booking</h2>
        <style>{`
          .rr-code { background: #0d0d0d !important; color: #fff !important; border: 1px solid #333 !important; caret-color: #ff2d95; letter-spacing: 0.2px; }
          .rr-code::placeholder { color: #8a8a8a; }
          .rr-code::selection { background: #ff2d95; color: #fff; }
        `}</style>
        <div style={{ display: 'grid', gap: '0.9rem', margin: '1rem 0 1.5rem' }}>
          {[
            {
              title: 'Pegue o link no Airbnb',
              items: [
                <>Airbnb → <b>Calendário</b> → clique no anúncio</>,
                <><b>Configurações de disponibilidade</b> → <b>Conectar a outro site</b></>,
                <>Em “Etapa 1”, aperte o botão preto <b>Copy</b></>,
              ],
            },
            {
              title: 'Cole aqui, no cartão da cor certa',
              items: [
                <>Cole o link na <b>caixa preta</b> do quarto</>,
                <>Aperte <b>Salvar e ler</b> e espere a mensagem verde</>,
              ],
            },
            {
              title: 'Agora o caminho de volta: do site para o Airbnb',
              items: [
                <>Aqui no cartão, aperte <b>Copiar</b> no “Link para o Airbnb importar”</>,
                <>No Airbnb, “Etapa 2”: cole em <b>Other website link</b></>,
                <>Nome: <b>Retiros Tropical Bakery</b> → <b>Add calendar</b></>,
              ],
            },
            {
              title: 'Pronto!',
              items: [
                <>O site só oferece noites livres, e cada retiro salvo bloqueia o Airbnb sozinho</>,
                <>O Airbnb relê a cada ~2 horas. Repita para cada um dos 4 quartos</>,
                <>No Booking.com: <i>Tarifas e disponibilidade → Sincronizar calendários</i></>,
              ],
            },
          ].map((step, i) => (
            <div key={step.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', background: '#fff0f7', border: '1px solid #ffc2e0', borderRadius: '14px', padding: '0.9rem 1.1rem' }}>
              <span style={{ flex: '0 0 auto', width: '46px', height: '46px', borderRadius: '50%', background: '#ff2d95', color: 'white', fontWeight: 900, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(255,45,149,0.4)' }}>{i + 1}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#2c3e50', marginBottom: '0.3rem' }}>{step.title}</div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.65, color: '#444' }}>
                  {step.items.map((it, j) => <li key={j}>{it}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
          {rooms.map(r => {
            const c = cal.find(x => x.room_id === r.id);
            if (!c) return null;
            const st = roomStyle(r.id);
            // A link copied from the wrong Airbnb listing carries that listing's number.
            const wrongRoom = Object.entries(ROOM_STYLE).find(([id, o]) => id !== r.id && (urlDrafts[r.id] ?? '').includes(o.airbnbId));
            return (
              <div key={r.id} style={{ border: `2px solid ${st.color}`, borderTop: `10px solid ${st.color}`, background: `${st.color}12`, borderRadius: '12px', padding: '1rem 1.1rem 1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
                  <span style={{ background: st.color, color: 'white', fontWeight: 800, fontSize: '1.05rem', padding: '0.3rem 0.85rem', borderRadius: '999px' }}>{st.emoji} {r.name}</span>
                  {st.airbnb && <span style={{ fontSize: '0.8rem', color: '#555' }}>no Airbnb: <strong>{st.airbnb}</strong> <span style={{ color: '#888' }}>(nº {st.airbnbId})</span></span>}
                </div>
                <span style={{ fontSize: '0.8rem', color: c.last_sync_error ? '#c0392b' : '#7f8c8d', marginLeft: '0.6rem' }}>
                  {c.last_sync_error ? `⚠️ erro: ${c.last_sync_error}` : c.last_synced_at ? `lido ${new Date(c.last_synced_at).toLocaleString('pt-BR')} · ${busyData?.ical[r.id]?.length ?? 0} noites ocupadas` : c.import_urls?.length ? 'ainda não lido' : 'sem link'}
                </span>
                <label style={{ ...label, marginTop: '0.6rem' }}>Links do Airbnb / Booking (um por linha)</label>
                <textarea className="rr-code" style={{ ...input, minHeight: '70px', fontFamily: 'Consolas, "Courier New", monospace', fontSize: '0.82rem' }} placeholder="https://www.airbnb.com/calendar/ical/....ics?s=..."
                  value={urlDrafts[r.id] ?? ''} onChange={e => setUrlDrafts(u => ({ ...u, [r.id]: e.target.value }))} />
                {wrongRoom && (
                  <p style={{ margin: '0.5rem 0 0', padding: '0.5rem 0.8rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.88rem', background: '#fff3cd', color: '#8a6100' }}>
                    ⚠️ Esse link é do anúncio “{wrongRoom[1].airbnb}”. Cole no cartão {wrongRoom[1].emoji} {rooms.find(x => x.id === wrongRoom[0])?.name ?? wrongRoom[0]}.
                  </p>
                )}
                <button type="button" style={{ ...dark, background: st.color, marginTop: '0.5rem', padding: '0.5rem 1rem' }} onClick={() => saveUrls(r.id)}>Salvar e ler</button>
                {roomNote[r.id] && (
                  <p style={{ margin: '0.6rem 0 0', padding: '0.6rem 0.8rem', borderRadius: '8px', fontWeight: 700, fontSize: '0.9rem', background: roomNote[r.id].ok ? '#e8f5e9' : '#ffebee', color: roomNote[r.id].ok ? '#2e7d32' : '#c62828' }}>
                    {roomNote[r.id].text}
                  </p>
                )}
                <label style={{ ...label, marginTop: '0.9rem' }}>Link para o Airbnb importar</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input readOnly className="rr-code" style={{ ...input, fontFamily: 'Consolas, "Courier New", monospace', fontSize: '0.78rem' }} value={exportUrl(c)} onFocus={e => e.target.select()} />
                  <button type="button" style={{ ...chip(false), background: copied === r.id ? '#2e7d4f' : '#ff2d95', borderColor: copied === r.id ? '#2e7d4f' : '#ff2d95', color: 'white', whiteSpace: 'nowrap' }} onClick={() => { navigator.clipboard.writeText(exportUrl(c)); setCopied(r.id); setTimeout(() => setCopied(''), 2000); }}>
                    {copied === r.id ? 'Copiado ✓' : 'Copiar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: '0.82rem', color: '#7f8c8d', marginTop: '1rem' }}>
          A Casa Toda e as suítes se bloqueiam entre si aqui no site. Diárias e capacidade ficam em <Link href="/admin/retreats">Retiros: fotos e preços</Link>.
        </p>
      </div>
    </div>
  );
}
