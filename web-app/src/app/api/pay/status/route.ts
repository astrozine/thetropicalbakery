import { NextRequest, NextResponse } from 'next/server';
import { findOrder, isPaid } from '@/lib/payments/server';

export const dynamic = 'force-dynamic';

/** Is this order paid yet? Reveals nothing but that (the reference is the only key). */
export async function GET(req: NextRequest) {
  try {
    const order = await findOrder(req.nextUrl.searchParams.get('ref') || '');
    if (!order) return NextResponse.json({ found: false });
    return NextResponse.json({ found: true, paid: isPaid(order.status), total: order.total });
  } catch (e) {
    console.error('pay/status:', e);
    return NextResponse.json({ found: false }, { status: 500 });
  }
}
