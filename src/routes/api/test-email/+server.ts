import { json } from '@sveltejs/kit';
import { isSendgridConfigured, sendEmail } from '$lib/server/email';
import { genericTemplate } from '$lib/server/email-templates';
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
  const { html, text } = genericTemplate({
    subject: 'Agentic AI — SendGrid Test Email',
    preheader: 'SendGrid email delivery test.',
    heading: 'SendGrid is working',
    paragraphs: [
      'This is a test email from the <strong>Agentic AI</strong> report pipeline.',
      'If you are receiving this, SendGrid email delivery is working correctly.'
    ],
    customerName: 'Lorin'
  });

  const result = await sendEmail({ to, subject: 'Agentic AI — SendGrid Test Email', html, text });

  return json({
    sent: result.sent,
    to,
    messageId: result.id,
    message: result.message || undefined
  }, { status: result.sent ? 202 : 502 });
};
