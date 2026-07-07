import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { sendBulkEmail } from '@/lib/email';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await admin
    .from('email_campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  // Authenticate & get admin client early — before any long-running work
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    title,
    subject,
    html_body,
    target_all,
    target_user_ids,
    created_by,
  } = body;

  // ── 1. Resolve recipient email addresses ─────────────────────────────────
  let recipientEmails: string[] = [];

  if (target_all) {
    const { data: users, error: usersErr } = await admin
      .from('user_profiles')
      .select('email')
      .not('email', 'is', null);

    if (usersErr) {
      console.error('[campaigns] Failed to fetch users:', usersErr.message);
      return NextResponse.json(
        { error: `Could not load recipients: ${usersErr.message}` },
        { status: 500 }
      );
    }

    recipientEmails = (users ?? []).map((u: any) => u.email).filter(Boolean);
  } else if (Array.isArray(target_user_ids) && target_user_ids.length > 0) {
    const { data: users, error: usersErr } = await admin
      .from('user_profiles')
      .select('email')
      .in('id', target_user_ids)
      .not('email', 'is', null);

    if (usersErr) {
      console.error('[campaigns] Failed to fetch selected users:', usersErr.message);
      return NextResponse.json(
        { error: `Could not load recipients: ${usersErr.message}` },
        { status: 500 }
      );
    }

    recipientEmails = (users ?? []).map((u: any) => u.email).filter(Boolean);
  }

  if (recipientEmails.length === 0) {
    return NextResponse.json({ error: 'No valid recipient email addresses found' }, { status: 400 });
  }

  // ── 2. Check SMTP is configured before writing the DB row ─────────────────
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json(
      {
        error:
          'Email (SMTP) is not configured on this server. ' +
          'Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to your .env.local file and restart.',
      },
      { status: 503 }
    );
  }

  // ── 3. Send emails ────────────────────────────────────────────────────────
  // sendBulkEmail now uses batched-concurrent sends (no 500 ms per-email delay)
  // so this completes quickly enough that the Supabase client below stays alive.
  let sendResult = { sent: 0, failed: 0, errors: [] as any[] };
  try {
    sendResult = await sendBulkEmail(recipientEmails, subject, html_body);
  } catch (err: any) {
    // SMTP connection-level failure (wrong host / password / network)
    console.error('[campaigns] SMTP error:', err.message);
    return NextResponse.json(
      { error: `Failed to connect to email server: ${err.message}` },
      { status: 502 }
    );
  }

  // ── 4. Save campaign record with real counts ──────────────────────────────
  // Use a fresh timestamp — never trust the client-supplied sent_at
  const { data: campaign, error: dbErr } = await admin
    .from('email_campaigns')
    .insert({
      title,
      subject,
      html_body,
      status: sendResult.sent === 0 ? 'failed' : 'sent',
      target_all: target_all ?? false,
      target_user_ids: target_all ? null : target_user_ids,
      sent_count: sendResult.sent,
      failed_count: sendResult.failed,
      sent_at: new Date().toISOString(),
      created_by: created_by ?? null,
    })
    .select()
    .single();

  if (dbErr) {
    console.error('[campaigns] DB insert error:', dbErr.message);
    // Emails were already sent — return partial success so the UI still shows counts
    return NextResponse.json(
      {
        warning: 'Emails sent but campaign record could not be saved: ' + dbErr.message,
        sent_count: sendResult.sent,
        failed_count: sendResult.failed,
        errors: sendResult.errors,
      },
      { status: 207 }
    );
  }

  return NextResponse.json({
    ...campaign,
    errors: sendResult.errors.length > 0 ? sendResult.errors : undefined,
  });
}