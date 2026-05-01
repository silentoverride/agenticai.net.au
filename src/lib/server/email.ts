import { env } from '$env/dynamic/private';
export { reportReadyTemplate, welcomeTemplate, receiptTemplate, genericTemplate } from './email-templates';

export interface EmailPayload {
  to: string;
  from?: string;
  fromName?: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export function isSendgridConfigured(): boolean {
  return Boolean(env.SENDGRID_API_KEY);
}

export async function sendEmail(payload: EmailPayload): Promise<{ sent: boolean; id?: string; message?: string }> {
  if (!env.SENDGRID_API_KEY) {
    console.warn('SendGrid not configured: SENDGRID_API_KEY missing');
    return { sent: false, message: 'SendGrid API key not configured' };
  }

  const fromEmail = payload.from || env.DEFAULT_FROM_EMAIL || 'hello@agenticai.net.au';
  const fromName = payload.fromName || env.DEFAULT_FROM_NAME || 'Agentic AI';

  const body = {
    personalizations: [{ to: [{ email: payload.to }] }],
    from: { email: fromEmail, name: fromName },
    subject: payload.subject,
    content: [
      ...(payload.text ? [{ type: 'text/plain', value: payload.text }] : []),
      ...(payload.html ? [{ type: 'text/html', value: payload.html }] : [])
    ],
    ...(payload.replyTo ? { reply_to: { email: payload.replyTo } } : {})
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.SENDGRID_API_KEY}`,
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text().catch(() => '');
    console.error('SendGrid send failed:', response.status, error);
    return { sent: false, message: `SendGrid ${response.status}: ${error}` };
  }

  // SendGrid returns 202 Accepted with X-Message-Id header
  const id = response.headers.get('x-message-id') || undefined;
  console.info('Email sent via SendGrid', { to: payload.to, id });
  return { sent: true, id };
}
