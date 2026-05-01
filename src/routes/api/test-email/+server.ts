import { json } from '@sveltejs/kit';
import { isSendgridConfigured, sendEmail } from '$lib/server/email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json().catch(() => ({})) as {
    to?: string;
    source?: string;
  };

  if (!isSendgridConfigured()) {
    return json(
      { message: 'SendGrid not configured. Set SENDGRID_API_KEY.' },
      { status: 501 }
    );
  }

  const to = body.to || 'mail@lorin.io';
  const result = await sendEmail({
    to,
    subject: 'Agentic AI — SendGrid Test Email',
    text: `Hi Lorin,\n\nThis is a test email from the Agentic AI report pipeline.\n\nIf you are receiving this, SendGrid email delivery is working correctly.\n\n— Agentic AI`,
    html: `<p>Hi Lorin,</p>
<p>This is a test email from the <strong>Agentic AI</strong> report pipeline.</p>
<p>If you are receiving this, SendGrid email delivery is <strong>working correctly</strong>.</p>
<p>— Agentic AI</p>`
  });

  return json({
    sent: result.sent,
    to,
    messageId: result.id,
    message: result.message || undefined
  }, { status: result.sent ? 202 : 502 });
};
