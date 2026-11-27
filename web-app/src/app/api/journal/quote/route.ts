import { NextRequest, NextResponse } from 'next/server';
import { OrderError } from '@/lib/payments/order';
import { journalPayMethods, quoteJournal } from '@/lib/payments/journal';

export const dynamic = 'force-dynamic';

/**
 * The paywall's price: the price today, the price with a discount code, and the ways to pay this page may offer.
 * Body: { kind, slug, code?, lang }. Needs no sign-in: it says nothing about anyone.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }); }
  const lang = body.lang === 'en' ? 'en' : 'pt';
  try {
    return NextResponse.json({ ok: true, ...(await quoteJournal(body)), methods: journalPayMethods(lang) });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/journal/quote:', e);
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}
