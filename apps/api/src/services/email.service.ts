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

export function instructorPendingEmail(name: string): SendArgs['html'] {
  return messageTemplate(
    `Thanks for applying to teach, ${name}`,
    `We've received your instructor application. Please wait while our team reviews your profile — this usually takes 1–2 business days.<br><br>You'll get another email as soon as a decision is made. Until then, you won't be able to sign in.`,
  );
}

export function instructorApprovedEmail(name: string, loginLink: string): SendArgs['html'] {
  return baseTemplate(
    `You're approved, ${name}!`,
    `Great news — your instructor application was accepted. You can now sign in and start building your courses. Welcome to the Learnova teaching community!`,
    'Access your account',
    loginLink,
  );
}

export function instructorDeclinedEmail(name: string, note?: string | null): SendArgs['html'] {
  const extra = note
    ? `<br><br><strong>Note from our team:</strong> ${escapeHtml(note)}`
    : '';
  return messageTemplate(
    `Update on your instructor application`,
    `Hi ${escapeHtml(name)}, thank you for your interest in teaching on Learnova. After careful review, we aren't able to approve your application at this time.${extra}<br><br>You're welcome to apply again later with updated credentials. We appreciate the time you took to reach out — wishing you all the best.`,
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function messageTemplate(title: string, body: string): string {
  const logoUrl = `${getEnv().WEB_URL}/brand/logo-full.png`;
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;color:#0f172a">
    <div style="text-align:center;margin-bottom:24px">
      <img src="${logoUrl}" alt="Learnova" width="160" height="160" style="display:inline-block;width:160px;height:auto" />
    </div>
    <h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
    <p style="color:#475569;line-height:1.6">${body}</p>
    <p style="color:#94a3b8;font-size:12px;margin-top:28px">— The Learnova team</p>
  </div>`;
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
