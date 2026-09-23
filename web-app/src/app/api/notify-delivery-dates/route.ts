import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const formatDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });

/**
 * Emails everyone who's opted into marketing when Dolly opens new delivery
 * dates. Runs as the caller's own Supabase session (not a service-role key),
 * so it's covered by the exact same "Admins can read all profiles" / "Admins
 * can manage delivery dates" RLS policies as the rest of the app — a
 * non-admin token gets rejected here the same way it would in the browser.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Apenas administradores.' }, { status: 403 });
  }

  const { dates } = await req.json() as { dates: string[] };
  if (!Array.isArray(dates) || dates.length === 0) {
    return NextResponse.json({ error: 'Nenhuma data informada.' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY não configurada no servidor.' }, { status: 500 });
  }

  const { data: recipients, error: recipientsError } = await supabase
    .from('user_profiles')
    .select('email, full_name')
    .not('email', 'is', null)
    .eq('marketing_opt_in', true);

  if (recipientsError) {
    return NextResponse.json({ error: recipientsError.message }, { status: 500 });
  }

  const uniqueEmails = Array.from(new Map((recipients || []).map(r => [r.email!.toLowerCase(), r])).values());
  const dateList = dates.map(formatDate).join(', ');

  let sent = 0;
  for (const person of uniqueEmails) {
    const firstName = (person.full_name || '').split(' ')[0] || '';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: 'The Tropical Bakery <nao-responda@thetropicalbakery.com>',
          to: person.email,
          subject: `Novas datas de entrega abertas: ${dateList}`,
          html: `
            <div style="background:#fdfaf3;padding:32px 16px;font-family:Helvetica,Arial,sans-serif;">
              <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e8e1d7;border-radius:16px;padding:32px 28px;text-align:center;">
                <img src="https://thetropicalbakery.com/logo-gold.webp" alt="The Tropical Bakery" width="110" style="display:block;margin:0 auto 20px;">
                <h1 style="color:#3c2a21;font-size:22px;margin:0 0 12px;">${firstName ? `Oi, ${firstName}!` : 'Novidade!'}</h1>
                <p style="color:#594a42;font-size:15px;line-height:1.7;margin:0 0 24px;">
                  Abrimos novas datas de entrega da Caixa de Degustação: <strong>${dateList}</strong>.
                  As vagas são limitadas por edição.
                </p>
                <a href="https://thetropicalbakery.com/caixas"
                   style="display:inline-block;background:#d4af37;color:#ffffff;text-decoration:none;font-weight:bold;font-size:16px;padding:14px 32px;border-radius:8px;">
                  Garantir minha caixa
                </a>
                <p style="color:#a89a90;font-size:12px;margin:24px 0 0;">
                  Dúvidas? Fale com a gente no
                  <a href="https://wa.me/5511932119196" style="color:#d4af37;">WhatsApp</a>.
                </p>
              </div>
            </div>
          `,
        }),
      });
      if (res.ok) sent += 1;
    } catch {
      // One bad address shouldn't stop the rest of the batch.
    }
  }

  await supabase
    .from('delivery_dates')
    .update({ notified_at: new Date().toISOString() })
    .in('delivery_date', dates);

  return NextResponse.json({ sent, total: uniqueEmails.length });
}
