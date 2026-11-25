import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/payments/server';
import { verifyLetterToken } from '@/lib/letterServer';
import { LETTER_MAX_PHOTOS, sundayFor, type LetterSubmission } from '@/lib/letter';
import { letterReceivedEmail } from '@/lib/email/letterMail';
import { alertRecipients } from '@/lib/email/alerts';
import { deliver } from '@/lib/email/send';

/**
 * Dolly's weekly letter (lib/letter.ts): her photos and words from /carta/escrever. Allowed with the signed link from
 * her Thursday e-mail, or for a signed-in admin (so Andrew can send one himself). Saves the row, puts the photos in the
 * public `uploads` bucket and e-mails Andrew the letter ready to send. Never sends anything to the list.
 */

const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_BYTES = 3_000_000;
const text = (v: FormDataEntryValue | null, max: number) => String(v ?? '').trim().slice(0, max);

async function isAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: auth } },
  });
  const { data } = await db.rpc('is_admin');
  return !!data;
}

export async function POST(req: Request) {
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'bad form' }, { status: 400 }); }

  let sunday = verifyLetterToken(text(form.get('t'), 80));
  if (!sunday) {
    if (!(await isAdmin(req))) return NextResponse.json({ error: 'This link has expired. Ask Andrew for a new one.' }, { status: 403 });
    sunday = sundayFor(new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10));
  }

  const story = text(form.get('story'), 4000);
  if (story.length < 3) return NextResponse.json({ error: 'Write a few lines first.' }, { status: 400 });
  const lang = text(form.get('lang'), 2) === 'pt' ? 'pt' : 'en';
  const title = text(form.get('title'), 120) || null;
  const tip = text(form.get('tip'), 2000) || null;

  const db = supabaseAdmin();
  const photos: string[] = [];
  const files = form.getAll('photos').filter((f): f is File => typeof f === 'object' && f !== null && 'arrayBuffer' in f).slice(0, LETTER_MAX_PHOTOS);
  for (const f of files) {
    const ext = TYPES[f.type];
    if (!ext || f.size > MAX_BYTES) continue;
    const path = `cartas/${sunday}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from('uploads').upload(path, Buffer.from(await f.arrayBuffer()), { contentType: f.type });
    if (error) { console.error('carta photo upload', error.message); continue; }
    photos.push(db.storage.from('uploads').getPublicUrl(path).data.publicUrl);
  }

  const { data, error } = await db.from('letter_submissions')
    .insert({ sunday, lang, title, story, tip, photos }).select('*').single();
  if (error || !data) {
    console.error('carta insert', error?.message);
    return NextResponse.json({ error: 'We could not save it just now. Please try again in a minute.' }, { status: 500 });
  }

  // Tell Andrew, with the letter ready to send. An e-mail problem must not lose what she wrote.
  try {
    const built = letterReceivedEmail(data as LetterSubmission);
    for (const email of alertRecipients()) {
      await deliver(db, { email, token: '', messageKey: built.messageKey, subject: built.subject, topic: 'pedido', template: 'carta-recebida', transactional: true, layout: built.layout });
    }
  } catch (e) { console.error('carta notify', e); }

  return NextResponse.json({ ok: true, photos: photos.length });
}
