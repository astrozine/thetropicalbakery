import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/payments/server';
import { HOUSE_ID } from '@/lib/retreatPlan';

export const dynamic = 'force-dynamic';

const ymd = (iso: string) => iso.replace(/-/g, '');

/**
 * /api/retreats/ical/<room>.ics?token=… — our retreat reservations for one room, as a calendar Airbnb and
 * Booking.com can import ("Import calendar"), so they block those nights. Only dates leave: no names.
 *
 * A Casa Toda and the suites share walls: a retreat in a suite also blocks the house listing, and a retreat in the
 * house blocks every suite. Only OUR reservations go out, never nights read from Airbnb: sending Airbnb's own
 * nights back to Airbnb makes a loop where a cancelled booking never frees up.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const roomId = (await params).file.replace(/\.ics$/i, '');
  const token = req.nextUrl.searchParams.get('token') ?? '';
  const db = supabaseAdmin();

  const { data: cal } = await db.from('retreat_calendar').select('export_token').eq('room_id', roomId).maybeSingle();
  if (!cal || !token || cal.export_token !== token) return new Response('Not found', { status: 404 });

  const { data: rooms } = await db.from('retreat_rooms').select('id');
  const linked = roomId === HOUSE_ID ? (rooms ?? []).map(r => r.id as string) : [roomId, HOUSE_ID];
  const { data: bookings } = await db.from('retreat_bookings')
    .select('id, check_in, check_out, created_at')
    .in('room_id', linked)
    .neq('status', 'cancelado')
    .gte('check_out', new Date(Date.now() - 86400000).toISOString().slice(0, 10));

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const events = (bookings ?? []).map(b => [
    'BEGIN:VEVENT',
    `UID:retiro-${b.id}@thetropicalbakery.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${ymd(b.check_in)}`,
    `DTEND;VALUE=DATE:${ymd(b.check_out)}`,
    'SUMMARY:Retiro The Tropical Bakery',
    'TRANSP:OPAQUE',
    'END:VEVENT',
  ].join('\r\n'));

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Tropical Bakery//Retiros//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Retiros ${roomId}`,
    ...events,
    'END:VCALENDAR',
    '',
  ].join('\r\n');

  return new Response(body, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Disposition': `inline; filename="${roomId}.ics"` },
  });
}
