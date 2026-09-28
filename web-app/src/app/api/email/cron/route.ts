import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SendError, sendCampaign, type SendRequest } from '@/lib/email/send';
import { AUTOMATIONS, type AutomationRow } from '@/lib/email/automationDefs';
import { isDue, planFor } from '@/lib/email/automations';
import type { CampaignValues } from '@/lib/email/campaigns';
import type { DietTargeting } from '@/lib/email/send';

/**
 * The clock. Something outside the site calls this every few minutes (see
 * SETUP_email_scheduler.md — Supabase pg_cron is what we use); it looks at
 * `email_schedule` and `email_automations` and sends whatever is due.
 *
 * It sends through the same engine as the admin's own button, so a scheduled
 * e-mail obeys exactly the same opt-outs, tag filters and one-copy-per-person
 * rule. Nothing about "automatic" makes it a different kind of mail.
 *
 * Guarded by EMAIL_CRON_SECRET, because this URL can send e-mail to the whole
 * list. Add `?dry=1` to see what it WOULD do without sending anything.
 */

// Long enough to work through a list in one wake-up, with room before the wall.
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** Stop starting new work after this, so the function returns instead of being killed. */
const BUDGET_MS = 45_000;
/** Per call to the engine. Higher than the admin's 150: nobody is waiting on a click. */
const CHUNK = 200;
/** A claim older than this was left behind by a run that died. */
const STALE_CLAIM_MINUTES = 15;

interface ScheduleRow {
  id: string;
  campaign_id: string;
  field_values: CampaignValues | null;
  diet: DietTargeting | null;
  run_at: string;
  label: string | null;
  sent: number;
  failed: number;
  skipped: number;
}

/** One line in the run log, and in the admin's "últimas verificações". */
interface Line {
  what: string;
  result: string;
}

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new SendError(500, 'SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Constant-time-ish comparison, so a wrong secret leaks nothing by how fast it fails. */
function secretOk(given: string, expected: string): boolean {
  if (given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/**
 * Sends one request to completion (or until the clock runs out), in chunks.
 * Returns what it managed, plus whether anyone is still waiting.
 */
async function drain(db: SupabaseClient, req: SendRequest, deadline: number) {
  let sent = 0;
  let failed = 0;
  let remaining = 0;
  let subject = '';
  // Taken from the FIRST chunk only. After that, everyone this call just mailed
  // is in email_sends too, so a later chunk's `skipped` would count our own work
  // as "already had it".
  let alreadyHad: number | null = null;

  for (;;) {
    const r = await sendCampaign(db, { ...req, limit: CHUNK });
    sent += r.sent;
    failed += r.failed;
    remaining = r.remaining;
    subject = r.subject;
    if (alreadyHad === null) alreadyHad = r.skipped;

    if (remaining === 0) break;
    // No progress in a whole chunk (everyone eligible already had it, or Resend
    // is refusing every address): stop rather than hammer it until the deadline.
    if (r.sent === 0) break;
    if (Date.now() > deadline) break;
  }
  return { sent, failed, skipped: alreadyHad ?? 0, remaining, subject };
}

/** Planned one-off sends whose moment has come. */
async function runSchedule(db: SupabaseClient, deadline: number, dry: boolean, lines: Line[]) {
  const nowISO = new Date().toISOString();

  // Recover claims from a run that died mid-send. The per-person index means
  // picking one up again cannot double-send; it just continues where it stopped.
  const stale = new Date(Date.now() - STALE_CLAIM_MINUTES * 60_000).toISOString();
  await db.from('email_schedule').update({ status: 'pending' })
    .eq('status', 'sending').lt('last_run_at', stale);

  const { data, error } = await db.from('email_schedule')
    .select('id, campaign_id, field_values, diet, run_at, label, sent, failed, skipped')
    .eq('status', 'pending').lte('run_at', nowISO)
    .order('run_at', { ascending: true }).limit(10);

  if (error) {
    lines.push({ what: 'agendamentos', result: `erro ao ler: ${error.message}` });
    return { due: 0, sent: 0, failed: 0 };
  }

  const rows = (data || []) as ScheduleRow[];
  let sent = 0;
  let failed = 0;

  for (const row of rows) {
    const name = row.label || row.campaign_id;
    if (Date.now() > deadline) {
      lines.push({ what: name, result: 'adiado para a próxima verificação (tempo)' });
      continue;
    }

    if (dry) {
      // Count the audience for real, so a rehearsal answers "to how many?".
      try {
        const r = await sendCampaign(db, {
          campaignId: row.campaign_id, values: row.field_values || {}, diet: row.diet, dryRun: true,
        });
        lines.push({ what: name, result: `venceu — enviaria para ${r.audience - r.skipped} pessoa(s)` });
      } catch (err) {
        lines.push({ what: name, result: `venceu, mas falharia: ${err instanceof Error ? err.message : 'erro'}` });
      }
      continue;
    }

    // Claim it. `.eq('status', 'pending')` is what makes two overlapping runs
    // safe: only one of them gets the row back.
    const claim = await db.from('email_schedule')
      .update({ status: 'sending', last_run_at: new Date().toISOString() })
      .eq('id', row.id).eq('status', 'pending').select('id');
    if (claim.error || !claim.data?.length) continue;

    try {
      const r = await drain(db, {
        campaignId: row.campaign_id,
        values: row.field_values || {},
        diet: row.diet,
      }, deadline);

      sent += r.sent;
      failed += r.failed;

      // Still people waiting: leave it pending so the next tick carries on.
      // `sent` is the running total across ticks; `failed` and `skipped`
      // describe the latest attempt only.
      await db.from('email_schedule').update({
        status: r.remaining > 0 ? 'pending' : 'done',
        sent: row.sent + r.sent,
        failed: r.failed,
        skipped: r.skipped,
        last_error: null,
        last_run_at: new Date().toISOString(),
      }).eq('id', row.id);

      lines.push({
        what: name,
        result: r.remaining > 0
          ? `${r.sent} enviado(s), faltam ${r.remaining}`
          : `${r.sent} enviado(s)${r.skipped ? `, ${r.skipped} já tinham` : ''}${r.failed ? `, ${r.failed} falharam` : ''}`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'falha desconhecida';
      await db.from('email_schedule').update({
        status: 'error', last_error: message, last_run_at: new Date().toISOString(),
      }).eq('id', row.id);
      lines.push({ what: name, result: `erro: ${message}` });
      failed += 1;
    }
  }

  return { due: rows.length, sent, failed };
}

/** The always-on rules. */
async function runAutomations(db: SupabaseClient, deadline: number, dry: boolean, lines: Line[]) {
  const { data, error } = await db.from('email_automations')
    .select('id, enabled, threshold, offset_days, send_hour, last_run_at, last_result');

  if (error) {
    lines.push({ what: 'automações', result: `erro ao ler: ${error.message}` });
    return { sent: 0, failed: 0 };
  }

  const rows = (data || []) as AutomationRow[];
  let sent = 0;
  let failed = 0;

  for (const def of AUTOMATIONS) {
    const row = rows.find(r => r.id === def.id);
    if (!row) continue;

    // A dry run reports on every rule, so the admin can see why a rule is quiet.
    const { due, why } = isDue(row);
    if (!due) {
      if (dry) lines.push({ what: def.name, result: why });
      continue;
    }
    if (Date.now() > deadline) {
      lines.push({ what: def.name, result: 'adiada para a próxima verificação (tempo)' });
      continue;
    }

    try {
      const plan = await planFor(db, def, row);

      if (!plan.requests.length) {
        if (!dry) {
          await db.from('email_automations')
            .update({ last_run_at: new Date().toISOString(), last_result: plan.note })
            .eq('id', def.id);
        }
        lines.push({ what: def.name, result: plan.note });
        continue;
      }

      if (dry) {
        lines.push({ what: def.name, result: `${plan.note} → enviaria ${plan.requests.length} mensagem(ns)` });
        continue;
      }

      let ruleSent = 0;
      let ruleFailed = 0;
      let ruleSkipped = 0;
      for (const req of plan.requests) {
        const r = await drain(db, req, deadline);
        ruleSent += r.sent;
        ruleFailed += r.failed;
        ruleSkipped += r.skipped;
        if (Date.now() > deadline) break;
      }
      sent += ruleSent;
      failed += ruleFailed;

      // Bookkeeping only once the sending really happened.
      if (plan.after && !ruleFailed) await plan.after();

      const result = ruleSent
        ? `${plan.note} ${ruleSent} enviado(s)${ruleFailed ? `, ${ruleFailed} falharam` : ''}.`
        : `${plan.note} Ninguém novo para receber (${ruleSkipped} já tinham).`;

      await db.from('email_automations')
        .update({ last_run_at: new Date().toISOString(), last_result: result })
        .eq('id', def.id);
      lines.push({ what: def.name, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'falha desconhecida';
      if (!dry) {
        await db.from('email_automations')
          .update({ last_run_at: new Date().toISOString(), last_result: `erro: ${message}` })
          .eq('id', def.id);
      }
      lines.push({ what: def.name, result: `erro: ${message}` });
      failed += 1;
    }
  }

  return { sent, failed };
}

async function tick(req: NextRequest) {
  const expected = process.env.EMAIL_CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: 'EMAIL_CRON_SECRET não está configurada no servidor.' }, { status: 500 });
  }

  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const given = bearer || req.nextUrl.searchParams.get('key') || '';
  if (!secretOk(given, expected)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const deadline = Date.now() + BUDGET_MS;
  const lines: Line[] = [];

  try {
    const db = serviceClient();
    const scheduled = await runSchedule(db, deadline, dry, lines);
    const automated = await runAutomations(db, deadline, dry, lines);

    const sent = scheduled.sent + automated.sent;
    const failed = scheduled.failed + automated.failed;

    // Proof of life, so the admin page can say "checked 4 minutes ago" without
    // anybody reading a deploy log. A dry run is a rehearsal and is not logged.
    if (!dry) {
      await db.from('email_cron_runs').insert([{
        due: scheduled.due, sent, failed, ok: failed === 0, detail: lines,
      }]);
    }

    return NextResponse.json({ ok: true, dry, due: scheduled.due, sent, failed, detail: lines });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'falha desconhecida';
    console.error('email cron:', err);
    return NextResponse.json({ ok: false, error: message, detail: lines }, { status: 500 });
  }
}

/** pg_cron calls POST; a browser (or curl) can use GET to check on it. */
export const GET = tick;
export const POST = tick;
