import { Resend } from 'resend';
import { getEnv } from '@learnova/config';
import { logger } from '../core/logger.js';

let client: Resend | null = null;

function getResend(): Resend | null {
  const env = getEnv();
  if (!env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(env.RESEND_API_KEY);
  return client;
}

export function isResendConfigured(): boolean {
  return Boolean(getEnv().RESEND_API_KEY);
}

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends transactional email via Resend. When `RESEND_API_KEY` is not configured
 * (local dev) the email is logged instead of thrown away, so verification/reset
 * links stay usable in the console.
 */
export async function sendEmail({ to, subject, html, text }: SendArgs): Promise<void> {
  const env = getEnv();
  const resend = getResend();
  if (!resend) {
    logger.info(`[email:dev] To=${to} Subject="${subject}"`, { html });
    return;
  }

  const { error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    logger.error('Resend email failed', { to, subject, error });
    throw new Error(error.message);
  }
}

export function verificationEmail(name: string, link: string): SendArgs['html'] {
  return baseTemplate(
    `Welcome to Learnova, ${name}!`,
    'Confirm your email address to activate your account.',
    'Verify email',
    link,
  );
}

export function passwordResetEmail(name: string, link: string): SendArgs['html'] {
  return baseTemplate(
    `Reset your password, ${name}`,
    'We received a request to reset your password. This link expires in 1 hour.',
    'Reset password',
    link,
  );
}

function baseTemplate(title: string, body: string, cta: string, link: string): string {
  const logoUrl = `${getEnv().WEB_URL}/brand/logo-full.png`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#0f172a">
    <div style="text-align:center;margin-bottom:24px">
      <img src="${logoUrl}" alt="Learnova" width="160" height="160" style="display:inline-block;width:160px;height:auto" />
    </div>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    <p style="color:#475569;line-height:1.6">${body}</p>
    <a href="${link}" style="display:inline-block;margin:20px 0;padding:12px 22px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">${cta}</a>
    <p style="color:#94a3b8;font-size:12px">If the button doesn't work, paste this link into your browser:<br>${link}</p>
  </div>`;
}
