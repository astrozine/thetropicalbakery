import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { BATCH_LIMIT, SendError, type DietTargeting, sendCampaign } from '@/lib/email/send';
import type { CampaignValues } from '@/lib/email/campaigns';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * The admin pressing "Enviar". The sending itself lives in @/lib/email/send so
 * that the scheduler (/api/email/cron) goes through exactly the same rules.
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

  const { campaignId, values, dryRun, testEmail, diet } = (await req.json()) as {
    campaignId: string;
    values: CampaignValues;
    dryRun?: boolean;
    testEmail?: string;
    diet?: DietTargeting;
  };

  try {
    const r = await sendCampaign(supabase, { campaignId, values, diet, dryRun, testEmail });

    // The admin page's "Verificar" panel speaks in these words.
    if (dryRun) {
      return NextResponse.json({
        subject: r.subject,
        messageKey: r.messageKey,
        audience: r.audience,
        alreadySent: r.skipped,
        willSend: Math.min(r.audience - r.skipped, BATCH_LIMIT),
        remainingAfter: r.remaining,
      });
    }

    return NextResponse.json({
      sent: r.sent,
      failed: r.failed,
      skipped: r.skipped,
      remaining: r.remaining,
      messageKey: r.messageKey,
      subject: r.subject,
    });
  } catch (err) {
    if (err instanceof SendError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
