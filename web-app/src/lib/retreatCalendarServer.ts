import 'server-only';
import { supabaseAdmin } from '@/lib/payments/server';
import { addDays, todayBR, type NightsByRoom } from '@/lib/retreatPlan';

/**
 * Keeps the retreat calendar in step with Airbnb / Booking.com through their iCal links (migration 47).
 * Airbnb has no open API for small hosts; iCal is what every platform offers, in both directions.
 */

const STALE_MS = 10 * 60 * 1000;
const HORIZON_DAYS = 540;

/**
 * The nights an .ics file marks as taken. An event 10 -> 13 takes the nights 10, 11 and 12.
 * `reserved` = a guest ("Reserved" on Airbnb); `blocked` = everything else ("Airbnb (Not available)", Booking's
 * "CLOSED"): days closed by hand or by a linked listing. The difference matters for A Casa Toda (see effectiveBusy).
 */
export function parseIcsNights(ics: string): { reserved: string[]; blocked: string[] } {
  const lines = ics.replace(/\r?\n[ \t]/g, '').split(/\r?\n/); // unfold continued lines
  const reserved = new Set<string>(), blocked = new Set<string>();
  const from = addDays(todayBR(), -1), to = addDays(todayBR(), HORIZON_DAYS);
  let start: string | null = null, end: string | null = null, summary = '', inEvent = false;
  const dateOf = (line: string) => {
    const m = line.slice(line.indexOf(':') + 1).match(/^(\d{4})(\d{2})(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
  };
  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) { inEvent = true; start = end = null; summary = ''; }
    else if (inEvent && line.startsWith('SUMMARY')) summary = line.slice(line.indexOf(':') + 1);
    else if (inEvent && line.startsWith('DTSTART')) start = dateOf(line);
    else if (inEvent && line.startsWith('DTEND')) end = dateOf(line);
    else if (line.startsWith('END:VEVENT')) {
      inEvent = false;
      if (!start) continue;
      const stop = end && end > start ? end : addDays(start, 1);
      const into = /reserv/i.test(summary) ? reserved : blocked;
      for (let d = start < from ? from : start; d < stop && d <= to; d = addDays(d, 1)) into.add(d);
    }
  }
  // A night that is both (two feeds for one room) counts as a guest.
  return { reserved: [...reserved], blocked: [...blocked].filter(n => !reserved.has(n)) };
}

async function fetchIcs(url: string) {
  const res = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'TheTropicalBakery-calendar/1.0' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  if (!text.includes('BEGIN:VCALENDAR')) throw new Error('não é um calendário iCal');
  return text;
}

export interface SyncResult { room_id: string; ok: boolean; nights: number; error?: string; skipped?: boolean }

/** Re-read every room's platform links. Rooms read less than 10 minutes ago are skipped unless `force`. */
export async function syncRetreatCalendars(force = false): Promise<SyncResult[]> {
  const db = supabaseAdmin();
  const { data: rows, error } = await db.from('retreat_calendar').select('room_id, import_urls, last_synced_at');
  if (error || !rows) return [];
  const now = Date.now();
  return Promise.all(rows.map(async (row): Promise<SyncResult> => {
    const urls: string[] = (row.import_urls ?? []).filter(Boolean);
    const fresh = row.last_synced_at && now - new Date(row.last_synced_at).getTime() < STALE_MS;
    if (!urls.length || (fresh && !force)) return { room_id: row.room_id, ok: true, nights: 0, skipped: true };
    // Claim the sync first, so ten visitors arriving together don't all fetch Airbnb.
    await db.from('retreat_calendar').update({ last_synced_at: new Date().toISOString() }).eq('room_id', row.room_id);
    try {
      const reserved = new Set<string>(), blocked = new Set<string>();
      for (const url of urls) {
        const n = parseIcsNights(await fetchIcs(url));
        n.reserved.forEach(d => reserved.add(d));
        n.blocked.forEach(d => blocked.add(d));
      }
      await db.from('retreat_busy_nights').delete().eq('room_id', row.room_id).in('source', ['ical', 'ical_block']);
      const list = [
        ...[...reserved].map(night => ({ room_id: row.room_id, night, source: 'ical' })),
        ...[...blocked].filter(n => !reserved.has(n)).map(night => ({ room_id: row.room_id, night, source: 'ical_block' })),
      ];
      for (let i = 0; i < list.length; i += 500) {
        const { error: insErr } = await db.from('retreat_busy_nights').insert(list.slice(i, i + 500));
        if (insErr) throw new Error(insErr.message);
      }
      await db.from('retreat_calendar').update({ last_sync_error: null }).eq('room_id', row.room_id);
      return { room_id: row.room_id, ok: true, nights: list.length };
    } catch (e) {
      // Keep the last good copy of the nights: a blip at Airbnb must not suddenly show the room as free.
      const msg = e instanceof Error ? e.message : String(e);
      await db.from('retreat_calendar').update({ last_sync_error: msg }).eq('room_id', row.room_id);
      return { room_id: row.room_id, ok: false, nights: 0, error: msg };
    }
  }));
}

/** Taken nights from today on: from the platforms, and from our own retreat reservations. Dates only. */
export async function readBusy(): Promise<{ ical: NightsByRoom; blocked: NightsByRoom; booked: NightsByRoom; syncedAt: string | null; connected: boolean }> {
  const db = supabaseAdmin();
  const from = todayBR();
  // Supabase hands back at most 1000 rows per request, and four rooms over a year and a half can be more.
  const allNights = async () => {
    const out: { room_id: string; night: string; source: string }[] = [];
    for (let i = 0; ; i += 1000) {
      const { data } = await db.from('retreat_busy_nights').select('room_id, night, source').gte('night', from).order('night').range(i, i + 999);
      out.push(...(data ?? []));
      if (!data || data.length < 1000) return { data: out };
    }
  };
  const [nightsRes, bookingsRes, calRes] = await Promise.all([
    allNights(),
    db.from('retreat_bookings').select('room_id, check_in, check_out').neq('status', 'cancelado').gt('check_out', from),
    db.from('retreat_calendar').select('import_urls, last_synced_at'),
  ]);
  const ical: NightsByRoom = {}, blocked: NightsByRoom = {}, booked: NightsByRoom = {};
  for (const n of nightsRes.data ?? []) ((n.source === 'ical_block' ? blocked : ical)[n.room_id] ??= []).push(n.night);
  for (const b of bookingsRes.data ?? []) {
    for (let d = b.check_in as string; d < (b.check_out as string); d = addDays(d, 1)) (booked[b.room_id] ??= []).push(d);
  }
  const cal = calRes.data ?? [];
  const synced = cal.map(c => c.last_synced_at).filter(Boolean).sort();
  return { ical, blocked, booked, syncedAt: synced[0] ?? null, connected: cal.some(c => (c.import_urls ?? []).length > 0) };
}
