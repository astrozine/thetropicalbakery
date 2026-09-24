import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { campaignById } from '@/lib/email/campaigns';
import { FROM_ADDRESS, SITE_URL, plainTextFallback, renderEmail } from '@/lib/email/layout';
import { canReceive, topicById } from '@/lib/emailTopics';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Sent per request, so a big list is delivered over a few clicks instead of timing out. */
const BATCH_LIMIT = 150;

interface Contact {
  email: string;
  full_name: string | null;
  token: string;
  tags: string[] | null;
  opted_out: string[] | null;
  unsubscribed_all: boolean;
}

/**
 * Sends one campaign to everyone who is allowed to receive it, and logs every
 * delivery. The log has a unique key per (address, message), so re-sending the
 * same campaign never reaches anyone twice — the second attempt simply skips
 * the people who already have it.
 *
 * Runs as the calling admin (their Authorization header), never with a
 * service-role key, so the same RLS rules apply as everywhere else.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (!isAdmin) return NextResponse.json({ error: 'Apenas administradores.' }, { status: 403 });

  const { campaignId, values, dryRun, testEmail } = (await req.json()) as {
    campaignId: string;
    values: Record<string, string>;
    dryRun?: boolean;
    testEmail?: string;
  };

  const campaign = campaignById(campaignId);
  if (!campaign) return NextResponse.json({ error: 'Campanha desconhecida.' }, { status: 400 });

  const topic = topicById(campaign.topic);
  if (!topic) return NextResponse.json({ error: 'Tópico desconhecido.' }, { status: 400 });

  const missing = campaign.fields.filter(f => f.required && !String(values?.[f.name] || '').trim());
  if (missing.length) {
    return NextResponse.json({ error: `Preencha: ${missing.map(f => f.label).join(', ')}` }, { status: 400 });
  }

  const messageKey = campaign.messageKey(values);
  const subject = campaign.subject(values);
  const content = campaign.build(values);

  // ---- Who is allowed to get it -------------------------------------------
  const { data: contactRows, error: contactsError } = await supabase
    .from('email_contacts')
    .select('email, full_name, token, tags, opted_out, unsubscribed_all');

  if (contactsError) {
    const missingTable = /email_contacts/.test(contactsError.message);
    return NextResponse.json(
      { error: missingTable ? 'Rode a migration_15_email_preferences.sql no Supabase primeiro.' : contactsError.message },
      { status: 500 },
    );
  }

  const contacts = (contactRows || []) as Contact[];
  let eligible = contacts.filter(c => canReceive(campaign.topic, c));
  if (campaign.tags?.length) {
    eligible = eligible.filter(c => campaign.tags!.some(t => (c.tags || []).includes(t)));
  }

  // A test goes only to the address given, ignoring the audience.
  if (testEmail) {
    const match = contacts.find(c => c.email.toLowerCase() === testEmail.toLowerCase());
    eligible = match ? [match] : [{ email: testEmail.toLowerCase(), full_name: null, token: '', tags: [], opted_out: [], unsubscribed_all: false }];
  }

  // ---- Who already has it --------------------------------------------------
  const { data: alreadySent } = await supabase
    .from('email_sends')
    .select('email')
    .eq('message_key', messageKey);

  const done = new Set((alreadySent || []).map(r => (r.email as string).toLowerCase()));
  const pending = testEmail ? eligible : eligible.filter(c => !done.has(c.email.toLowerCase()));

  if (dryRun) {
    return NextResponse.json({
      subject,
      messageKey,
      audience: eligible.length,
      alreadySent: eligible.length - pending.length,
      willSend: Math.min(pending.length, BATCH_LIMIT),
      remainingAfter: Math.max(0, pending.length - BATCH_LIMIT),
    });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return NextResponse.json({ error: 'RESEND_API_KEY não configurada no servidor.' }, { status: 500 });

  // ---- Send ----------------------------------------------------------------
  const batch = pending.slice(0, BATCH_LIMIT);
  let sent = 0;
  let failed = 0;

  for (const person of batch) {
    const prefsUrl = person.token ? `${SITE_URL}/preferencias?token=${person.token}` : `${SITE_URL}/preferencias`;
    const unsubscribeUrl = person.token ? `${SITE_URL}/preferencias?token=${person.token}&sair=1` : prefsUrl;
    const firstName = (person.full_name || '').trim().split(' ')[0];

    const layout = {
      ...content,
      heading: firstName ? content.heading : content.heading,
      body: firstName
        ? `<p style="color:#3c2a21;font-size:16px;font-weight:bold;margin:0 0 14px;">Oi, ${firstName}!</p>${content.body}`
        : content.body,
      ...(topic.transactional ? {} : { prefsUrl, unsubscribeUrl, reason: campaign.reason }),
    };

    // Claim the address first: the unique index on (email, message_key) is what
    // guarantees nobody gets a second copy, even if this route runs twice.
    const { error: claimError } = await supabase.from('email_sends').insert([{
      email: person.email, message_key: messageKey, topic: campaign.topic, subject, template: campaign.id,
    }]);
    if (claimError) continue; // already claimed by an earlier run

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: FROM_ADDRESS,
          to: person.email,
          subject,
          html: renderEmail(layout),
          text: plainTextFallback(layout),
          // Lets Gmail/Apple Mail show their own one-click "Unsubscribe" button.
          ...(topic.transactional ? {} : {
            headers: {
              'List-Unsubscribe': `<${SITE_URL}/api/email/unsubscribe?token=${person.token}>, <mailto:nao-responda@thetropicalbakery.com?subject=unsubscribe>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }),
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const json = await res.json().catch(() => ({}));
      sent += 1;
      if (json?.id) {
        await supabase.from('email_sends').update({ provider_id: json.id }).eq('message_key', messageKey).eq('email', person.email);
      }
    } catch (err) {
      failed += 1;
      // Release the claim so this address can be retried on the next click.
      await supabase.from('email_sends').delete().eq('message_key', messageKey).eq('email', person.email);
      console.error('Email send failed for', person.email, err);
    }
  }

  return NextResponse.json({
    sent,
    failed,
    skipped: eligible.length - pending.length,
    remaining: Math.max(0, pending.length - batch.length),
    messageKey,
    subject,
  });
}
