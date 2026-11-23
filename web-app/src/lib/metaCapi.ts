import 'server-only';
import { createHash } from 'crypto';

/**
 * Meta Conversions API: the server tells Meta "someone signed up", so ads optimised for sign-ups can learn even when
 * the visitor never tapped "Aceitar" on the cookie banner (the browser pixel only loads after that tap, so it sees few
 * sign-ups). Sent with the same event_id as the browser pixel's Lead, so Meta counts one sign-up, not two.
 *
 * What goes to Meta: the e-mail as a SHA-256 hash (never readable), the ad click id (fbclid), IP address and browser
 * name, and the page address. Never the name. Nothing is sent when the visitor declined cookies, or when
 * META_CAPI_TOKEN is not set (Events Manager > dataset > Settings > Conversions API > Generate access token).
 */

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1953002309021163';
const sha = (v: string) => createHash('sha256').update(v.trim().toLowerCase()).digest('hex');

export interface CapiLead {
  email: string;
  eventId: string;
  url: string;
  ip?: string | null;
  userAgent?: string | null;
  /** fb.1.<ms>.<fbclid>: from the _fbc cookie, or built from the fbclid in the ad link. */
  fbc?: string | null;
  fbp?: string | null;
  contentName?: string;
}

export async function sendCapiLead(lead: CapiLead): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token || !lead.eventId) return;
  const user_data: Record<string, unknown> = { em: [sha(lead.email)] };
  if (lead.ip) user_data.client_ip_address = lead.ip;
  if (lead.userAgent) user_data.client_user_agent = lead.userAgent;
  if (lead.fbc) user_data.fbc = lead.fbc;
  if (lead.fbp) user_data.fbp = lead.fbp;
  const body: Record<string, unknown> = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: lead.eventId,
      action_source: 'website',
      event_source_url: lead.url,
      user_data,
      custom_data: { content_name: lead.contentName || 'free-recipes', currency: 'BRL', value: 0 },
    }],
  };
  // Events Manager > Test events: set META_CAPI_TEST_CODE to see server events arrive live, then remove it.
  if (process.env.META_CAPI_TEST_CODE) body.test_event_code = process.env.META_CAPI_TEST_CODE;
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${PIXEL_ID}/events?access_token=${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) console.error('Meta CAPI Lead failed:', r.status, (await r.text()).slice(0, 300));
  } catch (e) {
    console.error('Meta CAPI Lead error:', e);
  }
}

/** The fbc value Meta expects, from a bare fbclid (ad links carry ?fbclid=…). */
export function fbcFromClickId(fbclid: string | null | undefined, clickedAtMs = Date.now()): string | null {
  const id = String(fbclid || '').trim();
  return id && /^[\w-]{10,500}$/.test(id) ? `fb.1.${clickedAtMs}.${id}` : null;
}
