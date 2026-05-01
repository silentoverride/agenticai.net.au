import { sendEmail } from '../email';
import { welcomeTemplate, receiptTemplate, reportReadyTemplate } from '../email-templates';

type EmailResult = { sent: boolean; id?: string; message?: string };

export async function sendWelcomeEmail(opts: {
  to: string;
  customerName?: string;
  company?: string;
}): Promise<EmailResult> {
  const { html, text } = welcomeTemplate({
    customerName: opts.customerName,
    company: opts.company
  });
  return sendEmail({
    to: opts.to,
    subject: 'Agentic AI — Assessment booked',
    html,
    text
  });
}

export async function sendReceiptEmail(opts: {
  to: string;
  customerName?: string;
  company?: string;
  amount: string;
  reference?: string;
}): Promise<EmailResult> {
  const { html, text } = receiptTemplate({
    customerName: opts.customerName,
    amount: opts.amount,
    reference: opts.reference,
    company: opts.company
  });
  return sendEmail({
    to: opts.to,
    subject: 'Payment Receipt — AI Business Assessment',
    html,
    text
  });
}

export async function sendReportReadyEmail(opts: {
  to: string;
  customerName?: string;
  company?: string;
  deckUrl?: string | null;
}): Promise<EmailResult> {
  const { html, text } = reportReadyTemplate({
    customerName: opts.customerName,
    company: opts.company,
    deckUrl: opts.deckUrl
  });
  return sendEmail({
    to: opts.to,
    subject: `AI Business Assessment Report — ${opts.company || 'Your Business'}`,
    html,
    text
  });
}
