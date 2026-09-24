import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SITE_URL } from '@/lib/email/layout';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

/**
 * The address behind the "Unsubscribe" button Gmail and Apple Mail put at the
 * top of a message (RFC 8058 one-click). They send a POST and expect the person
 * to be off the list without any further clicks or a login.
 *
 * The token identifies the contact and unlocks nothing else.
 */
export async function POST(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Token ausente.' }, { status: 400 });

  const { data, error } = await supabase.rpc('email_unsubscribe_all', { p_token: token });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'Token não encontrado.' }, { status: 404 });

  return NextResponse.json({ ok: true });
}

/** Some clients follow the link with a GET; send those people to the page. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || '';
  return NextResponse.redirect(`${SITE_URL}/preferencias?token=${encodeURIComponent(token)}&sair=1`);
}
