import nodemailer from 'nodemailer';
import dns from 'dns';
import * as React from 'react';

// Force IPv4 DNS resolution — Node 18+ defaults to IPv6 which breaks Gmail SMTP
// in many hosting environments (fetch failed / ECONNREFUSED on ::1)
dns.setDefaultResultOrder('ipv4first');

function createTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      'SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local'
    );
  }

  const port = Number(SMTP_PORT || 587);

  // Cast to `any` for options that exist at runtime in nodemailer v6 but are
  // absent from @types/nodemailer@6.4.x (socketTimeout, connectionTimeout, etc.)
  // eslint-disable-next-line @next/next/no-assign-module-variable
  const transportOptions: any = {
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    socketTimeout: 30_000,
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
  };

  return nodemailer.createTransport(transportOptions);
}

/** Strip HTML tags to produce a plain-text fallback */
function htmlToText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export interface SendBulkResult {
  sent: number;
  failed: number;
  errors: { email: string; error: string }[];
}

function buildMailOptions(
  to: string,
  subject: string,
  html: string,
  fromAddress: string,
  replyTo?: string
) {
  const smtpUser = process.env.SMTP_USER || '';

  return {
    from: fromAddress,
    to,
    // Reply-To must equal the authenticated Gmail address so replies work
    replyTo: replyTo || smtpUser,
    subject,
    html,
    text: htmlToText(html),
    // ─── Headers kept minimal so Gmail routes to Inbox, not Promotions ───
    // Removed: Precedence: bulk  → tells Gmail this is bulk mail → Promotions tab
    // Removed: X-Auto-Response-Suppress → signals automated/bulk sender
    // Removed: envelope override → mismatched Return-Path triggers spam filters
    // Kept: List-Unsubscribe only (required by Gmail for bulk senders, harmless for small lists)
    headers: {
      'List-Unsubscribe': `<mailto:${smtpUser}?subject=unsubscribe>`,
    },
  };
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailOptions): Promise<void> {
  const transporter = createTransporter();
  const fromAddress = from || process.env.SMTP_FROM || process.env.SMTP_USER!;
  const recipient = Array.isArray(to) ? to.join(', ') : to;
  await transporter.sendMail(
    buildMailOptions(recipient, subject, html, fromAddress, replyTo)
  );
}

export interface SendReactEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
}

export async function sendReactEmail({
  to,
  subject,
  react,
  from,
  replyTo,
}: SendReactEmailOptions): Promise<void> {
  const { render } = await import('@react-email/render');
  const html = await render(react);
  await sendEmail({ to, subject, html, from, replyTo });
}

export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string
): Promise<SendBulkResult> {
  const transporter = createTransporter();
  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER!;
  const result: SendBulkResult = { sent: 0, failed: 0, errors: [] };

  const BATCH_SIZE = 5;
  const BATCH_DELAY_MS = 1_000;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    const outcomes = await Promise.allSettled(
      batch.map((email) =>
        transporter.sendMail(buildMailOptions(email, subject, html, fromAddress))
      )
    );

    for (let j = 0; j < batch.length; j++) {
      const outcome = outcomes[j];
      if (outcome.status === 'fulfilled') {
        result.sent++;
      } else {
        result.failed++;
        const msg = (outcome.reason as Error)?.message || 'Unknown error';
        result.errors.push({ email: batch[j], error: msg });
        console.error(`[email] Failed to send to ${batch[j]}:`, msg);
      }
    }

    if (i + BATCH_SIZE < recipients.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  return result;
}