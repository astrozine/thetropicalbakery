import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CATALOG, GROUPS, catalogEntry } from '@/lib/email/catalog';
import { renderEmail } from '@/lib/email/layout';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Admin › E-mails › "Todos os e-mails" (src/lib/email/catalog.ts). Admin only, like /api/email/send.
 * - No `id`: the list of every e-mail, plus `unlisted`: templates that went out (email_sends) but have no preview yet.
 * - `?id=&lang=&variant=`: that e-mail rendered with example data, `{ subject, html }`.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  const asAdmin = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: isAdmin } = await asAdmin.rpc('is_admin');
  if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores.' }, { status: 403 });

  const q = req.nextUrl.searchParams;
  const id = q.get('id');
  if (id) {
    const entry = catalogEntry(id);
    if (!entry) return NextResponse.json({ error: 'E-mail desconhecido.' }, { status: 404 });
    const lang = entry.langs.find(l => l === q.get('lang')) ?? entry.langs[0];
    const variant = entry.variants?.find(v => v.id === q.get('variant'))?.id ?? entry.variants?.[0]?.id ?? '';
    try {
      const built = entry.render(lang, variant);
      // Images from this server, so a photo added to public/email/ shows before it is on the live site.
      const html = renderEmail({ ...built.layout, assetBase: req.nextUrl.origin });
      return NextResponse.json({ subject: built.subject, html });
    } catch (err) {
      console.error('email catalog preview', id, err);
      return NextResponse.json({ error: 'Não deu para montar a prévia deste e-mail.' }, { status: 500 });
    }
  }

  // Which templates really went out lately, so a new e-mail without a preview shows up as a warning.
  const known = new Set(CATALOG.map(e => e.id));
  const { data: sends } = await asAdmin.from('email_sends').select('template').order('sent_at', { ascending: false }).limit(2000);
  const counts = new Map<string, number>();
  for (const r of (sends as { template: string | null }[] | null) || []) {
    if (r.template && !known.has(r.template)) counts.set(r.template, (counts.get(r.template) || 0) + 1);
  }

  return NextResponse.json({
    groups: GROUPS,
    emails: CATALOG.map(({ render: _render, ...meta }) => meta),
    unlisted: [...counts.entries()].map(([template, count]) => ({ template, count })),
  });
}
