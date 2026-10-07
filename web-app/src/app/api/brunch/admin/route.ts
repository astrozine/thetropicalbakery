import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/payments/server';
import { onBrunchOrderPaid } from '@/lib/payments/brunch';
import { sendBrunchConfirmed } from '@/lib/email/brunchMail';
import { SendError, sendCampaign } from '@/lib/email/send';
import { fmtWhen, normalizeEvent, venueKind, type BrunchEvent } from '@/lib/brunch';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Dolly's buttons in /admin/brunch that need the server: confirm a Pix (and send the welcome), add a guest by
 * hand, and the e-mails to one brunch (announce, note to the guests, "a seat opened" to the waiting list).
 * Admin only. E-mails go through sendCampaign with the admin's own session, like /api/email/send.
 *
 * Body: { action: 'confirm', ticketId } | { action: 'addGuest', eventId, name, email, whatsapp }
 *     | { action: 'announce' | 'note' | 'waitlist', eventId, subject?, body?, dryRun?, testEmail? }
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const asAdmin = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: isAdmin } = await asAdmin.rpc('is_admin');
  if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores.' }, { status: 403 });

  let b: Record<string, string | boolean | undefined>;
  try { b = await req.json(); } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }); }

  const loadEvent = async (id: unknown): Promise<BrunchEvent | null> => {
    const { data } = await asAdmin.from('brunch_events').select('*').eq('id', String(id ?? '')).maybeSingle();
    return data ? normalizeEvent(data) : null;
  };

  try {
    switch (b.action) {
      // ------------------------------------------------ a Pix Dolly saw arrive
      case 'confirm': {
        const db = supabaseAdmin();
        const { data: t } = await db.from('brunch_tickets').select('*').eq('id', String(b.ticketId ?? '')).maybeSingle();
        if (!t) return NextResponse.json({ error: 'Ingresso não encontrado.' }, { status: 404 });
        const now = new Date().toISOString();
        await db.from('brunch_tickets').update({ status: 'pago', paid_at: t.paid_at ?? now }).eq('id', t.id);

        if (t.reference) {
          const { data: order } = await db.from('orders').select('*').eq('pix_transaction_id', t.reference).maybeSingle();
          if (order) {
            const { data: inbox } = await db.from('inbox_status').select('status').eq('source_table', 'orders').eq('source_id', order.id).maybeSingle();
            if (!inbox || inbox.status === 'new' || inbox.status === 'cancelled') {
              await db.from('inbox_status').upsert(
                { source_table: 'orders', source_id: order.id, status: 'confirmed', updated_at: now },
                { onConflict: 'source_table,source_id' },
              );
            }
            await onBrunchOrderPaid(order);
            return NextResponse.json({ ok: true });
          }
        }
        const ev = await loadEvent(t.event_id);
        if (ev) await sendBrunchConfirmed(db, { event: ev, name: t.full_name ?? '', email: t.email, reference: t.reference, total: Number(t.price ?? 0) });
        return NextResponse.json({ ok: true });
      }

      // ------------------------------- a guest paid outside, a sponsor, a friend
      case 'addGuest': {
        const ev = await loadEvent(b.eventId);
        if (!ev) return NextResponse.json({ error: 'Brunch não encontrado.' }, { status: 404 });
        const email = String(b.email ?? '').trim().toLowerCase();
        const name = String(b.name ?? '').trim();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || name.length < 2) {
          return NextResponse.json({ error: 'Precisamos do nome e de um e-mail válido.' }, { status: 400 });
        }
        const db = supabaseAdmin();
        const { error } = await db.from('brunch_tickets').insert([{
          event_id: ev.id, email, full_name: name, whatsapp: String(b.whatsapp ?? '').replace(/\D/g, '') || null,
          price: 0, status: 'pago', paid_at: new Date().toISOString(), admin_notes: 'Adicionada pela Dolly',
        }]);
        if (error) {
          return NextResponse.json({ error: /one_per_person|duplicate/.test(error.message) ? 'Essa pessoa já está neste brunch.' : error.message }, { status: 400 });
        }
        try {
          await db.rpc('email_contact_upsert', { p_email: email, p_full_name: name, p_tags: ['brunch'], p_source: 'brunch' });
        } catch { /* not fatal */ }
        await sendBrunchConfirmed(db, { event: ev, name, email, reference: null, total: 0 });
        return NextResponse.json({ ok: true });
      }

      // --------------------------------------------------------------- e-mails
      case 'announce':
      case 'note':
      case 'waitlist': {
        const ev = await loadEvent(b.eventId);
        if (!ev) return NextResponse.json({ error: 'Brunch não encontrado.' }, { status: 404 });
        const dryRun = !!b.dryRun;
        const testEmail = typeof b.testEmail === 'string' && b.testEmail.includes('@') ? b.testEmail : undefined;
        const v = venueKind(ev.venue_kind);

        if (b.action === 'announce') {
          const r = await sendCampaign(asAdmin, {
            campaignId: 'brunch-new', dryRun, testEmail,
            values: {
              slug: ev.slug, title: ev.title, theme: ev.theme || ev.subtitle || '', when: fmtWhen(ev),
              where: `${ev.venue_name || v.label}${ev.city ? `, ${ev.city}` : ''}`,
              price: ev.price > 0 ? String(ev.price) : '', seats: String(ev.capacity),
            },
          });
          return NextResponse.json({ ok: true, ...r });
        }

        const status = b.action === 'waitlist' ? 'espera' : 'pago';
        const { data: rows } = await asAdmin.from('brunch_tickets').select('email').eq('event_id', ev.id).eq('status', status);
        const emails = [...new Set((rows || []).map(r => String(r.email).toLowerCase()))];
        if (!emails.length && !testEmail) return NextResponse.json({ error: status === 'espera' ? 'Ninguém na lista de espera.' : 'Ninguém com ingresso pago ainda.' }, { status: 400 });

        const r = b.action === 'waitlist'
          ? await sendCampaign(asAdmin, {
              campaignId: 'brunch-seat-open', dryRun, testEmail, onlyEmails: emails,
              values: { slug: ev.slug, title: ev.title, round: String(Date.now()) },
            })
          : await sendCampaign(asAdmin, {
              campaignId: 'brunch-note', dryRun, testEmail, onlyEmails: emails,
              values: { slug: ev.slug, title: ev.title, subject: String(b.subject ?? ''), body: String(b.body ?? '') },
            });
        return NextResponse.json({ ok: true, ...r });
      }

      default:
        return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof SendError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/brunch/admin:', e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro.' }, { status: 500 });
  }
}
