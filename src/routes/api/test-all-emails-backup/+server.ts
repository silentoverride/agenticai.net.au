import { json } from '@sveltejs/kit';
import { isSendgridConfigured, sendEmail } from '$lib/server/email';
import {
  genericTemplate,
  welcomeTemplate,
  receiptTemplate,
  portalInvitationTemplate,
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
      amountCents: 120000,
      currency: 'aud',
      reference: 'cs_test_12345',
      company: 'Acme Pty Ltd',
      customerEmail: to,
      issuedAt: new Date().toISOString()
    });
    const r = await sendEmail({ to, subject: 'Tax Invoice / Receipt — AI Business Assessment', html, text });
    results.push({ template: 'receipt', sent: r.sent, id: r.id, error: r.message });
  } catch (e) {
    results.push({ template: 'receipt', sent: false, error: String(e) });
  }

  // 4. Portal invitation
  try {
    const { html, text } = portalInvitationTemplate({
      customerName: 'Lorin',
      company: 'Acme Pty Ltd',
      customerEmail: to
    });
    const r = await sendEmail({ to, subject: 'Your Agentic AI Portal — Access Your Account', html, text });
    results.push({ template: 'portalInvitation', sent: r.sent, id: r.id, error: r.message });
  } catch (e) {
    results.push({ template: 'portalInvitation', sent: false, error: String(e) });
  }

  // 5. Report ready
  try {
    const { html, text } = reportReadyTemplate({
      customerName: 'Lorin',
      company: 'Acme Pty Ltd',
      reportId: 'sample-report-123'
    });
    const r = await sendEmail({ to, subject: 'AI Business Assessment Report — Acme Pty Ltd', html, text });
    results.push({ template: 'reportReady', sent: r.sent, id: r.id, error: r.message });
  } catch (e) {
    results.push({ template: 'reportReady', sent: false, error: String(e) });
  }

  return json({ to, results }, { status: 200 });
};
