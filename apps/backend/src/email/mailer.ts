/**
 * Outgoing email through Resend's HTTP API.
 *
 * Off until both RESEND_API_KEY and EMAIL_FROM are set — which needs a domain
 * verified with Resend. Until then invitations are shared as links, and every
 * caller must cope with `sent: false`.
 */

export interface MailResult {
  sent: boolean;
  error?: string;
}

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(message: { to: string; subject: string; html: string; text: string }): Promise<MailResult> {
  if (!emailEnabled()) return { sent: false, error: 'Email sending is not set up.' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, ...message }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return { sent: true };
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    return { sent: false, error: body?.message ?? `Resend answered ${response.status}.` };
  } catch (error) {
    return { sent: false, error: error instanceof Error ? error.message : 'Could not reach Resend.' };
  }
}

const escape = (text: string) =>
  text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

/** A plain, client-safe email with one button. */
export function actionEmail(heading: string, body: string, buttonLabel: string, url: string) {
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#06070a;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#e2e8f0">
<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#0a0c12;border:1px solid #1e293b;border-radius:16px">
<tr><td style="padding:28px">
<p style="margin:0 0 4px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#00f0ff;font-weight:800">Aura Calisthenics</p>
<h1 style="margin:0 0 12px;font-size:22px;color:#fff">${escape(heading)}</h1>
<p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#cbd5e1">${escape(body)}</p>
<a href="${escape(url)}" style="display:inline-block;padding:12px 20px;border-radius:12px;background:#00f0ff;color:#06070a;font-weight:800;text-decoration:none">${escape(buttonLabel)}</a>
<p style="margin:24px 0 0;font-size:12px;color:#64748b">Or paste this link into your browser:<br><span style="color:#94a3b8;word-break:break-all">${escape(url)}</span></p>
</td></tr></table></body></html>`;
  const text = `${heading}\n\n${body}\n\n${buttonLabel}: ${url}\n`;
  return { html, text };
}
