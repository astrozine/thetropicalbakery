import { NextRequest, NextResponse } from 'next/server';
import { OrderError } from '@/lib/payments/order';
import { createJournalOrder } from '@/lib/payments/journal';

export const dynamic = 'force-dynamic';

/**
 * Buys a Recipe Journal recipe or collection (lib/payments/journal.ts). Body: { kind: 'recipe' | 'collection', slug,
 * payMethod: 'mp' | 'stripe' | 'pix', code?, lang }, with the session's bearer token (required: the purchase is access on
 * the account). Answers { owned } when they already have it, the Pix code, or the payment page's address.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, string>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Pedido inválido.' }, { status: 400 }); }
  const auth = req.headers.get('authorization') || '';
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : null;
  try {
    return NextResponse.json({ ok: true, ...(await createJournalOrder(body, token)) });
  } catch (e) {
    if (e instanceof OrderError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('POST /api/journal/buy:', e);
    return NextResponse.json({ error: body.lang === 'en' ? 'The payment did not open. Please try again.' : 'O pagamento não abriu. Tente de novo.' }, { status: 500 });
  }
}
