import { NextRequest, NextResponse, after } from 'next/server';
import { supabaseAdmin } from '@/lib/payments/server';

export const dynamic = 'force-dynamic';

const FORMATS = new Set(['kindle', 'paperback', 'hardcover']);
const STEPS = new Set(['direct', 'skip', 'signup']);
const LANGS = new Set(['en', 'pt', 'es', 'nl', 'de']);

/**
 * Counts one visitor leaving for Amazon (sent with navigator.sendBeacon from the Amazon editions row). No cookies, no
 * names, no e-mail: just which edition, which page language and how the "Heading to Amazon?" sheet ended. Without
 * migration 52 the insert fails quietly; it must never get in the way of the visitor.
 */
export async function POST(req: NextRequest) {
  let body: { format?: string; step?: string; lang?: string; page?: string } = {};
  try { body = JSON.parse(await req.text()); } catch { /* ignore */ }
  const format = String(body.format || '');
  const step = String(body.step || '');
  if (!FORMATS.has(format) || !STEPS.has(step)) return new NextResponse(null, { status: 204 });
  const row = {
    format, step,
    lang: LANGS.has(String(body.lang)) ? String(body.lang) : null,
    page: String(body.page || '').slice(0, 120) || null,
  };
  after(async () => {
    const { error } = await supabaseAdmin().from('amazon_clicks').insert([row]);
    if (error) console.error('amazon-click: insert failed (run migration 52?):', error.message);
  });
  return new NextResponse(null, { status: 204 });
}
