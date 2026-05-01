import { json } from '@sveltejs/kit';
import { isSendgridConfigured, sendEmail } from '$lib/server/email';
import {
  genericTemplate,
  welcomeTemplate,
  receiptTemplate,
  reportReadyTemplate
} from '$lib/server/email-templates';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  if (!isSendgridConfigured()) {
    return json({ message: 'SendGrid not configured' }, { status: 501 });
  }

  const body = await request.json().catch(() => ({})) as {
    to?: string;
  };
  const to = body.to || 'mail@lorin.io';

  const results: Array<{ template: string; sent: boolean; id?: string; error?: string }> = [];

  // 1. Generic test
  try {
    const { html, text } = genericTemplate({
      subject: 'Agentic AI — Generic Test',
      preheader: 'Testing generic email template.',
      heading: 'Generic template test',
      paragraphs: ['This is a live test of the generic email template.'],
      customerName: 'Lorin'
    });
    const r = await sendEmail({ to, subject: 'Agentic AI — Generic Test', html, text });
    results.push({ template: 'generic', sent: r.sent, id: r.id, error: r.message });
  } catch (e) {
    results.push({ template: 'generic', sent: false, error: String(e) });
  }

  // 2. Welcome
  try {
    const { html, text } = welcomeTemplate({ customerName: 'Lorin', company: 'Acme Pty Ltd' });
    const r = await sendEmail({ to, subject: 'Agentic AI — Assessment booked', html, text });
    results.push({ template: 'welcome', sent: r.sent, id: r.id, error: r.message });
  } catch (e) {
    results.push({ template: 'welcome', sent: false, error: String(e) });
  }

  // 3. Receipt
  try {
    const { html, text } = receiptTemplate({
      customerName: 'Lorin',
      amount: '$1,200.00 AUD',
      reference: 'pi_test_12345',
      company: 'Acme Pty Ltd'
    });
    const r = await sendEmail({ to, subject: 'Payment Receipt — AI Business Assessment', html, text });
    results.push({ template: 'receipt', sent: r.sent, id: r.id, error: r.message });
  } catch (e) {
    results.push({ template: 'receipt', sent: false, error: String(e) });
  }

  // 4. Report ready
  try {
    const { html, text } = reportReadyTemplate({
      customerName: 'Lorin',
      company: 'Acme Pty Ltd',
      deckUrl: 'https://agenticai.net.au/reports/sample-deck.pdf'
    });
    const r = await sendEmail({ to, subject: 'AI Business Assessment Report — Acme Pty Ltd', html, text });
    results.push({ template: 'reportReady', sent: r.sent, id: r.id, error: r.message });
  } catch (e) {
    results.push({ template: 'reportReady', sent: false, error: String(e) });
  }

  return json({ to, results }, { status: 200 });
};
