import { env } from '$env/dynamic/public';

const BRAND_PRIMARY = '#1a1a2e';
const BRAND_ACCENT = '#e94560';
const BRAND_TEXT = '#16213e';
const BRAND_MUTED = '#6c757d';
const BRAND_BG = '#f8f9fa';
const SITE_URL = env.PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://agenticai.net.au';
const LOGO_URL = `${SITE_URL}/logo.png`;
const BUSINESS_NAME = 'Agentic AI Pty Ltd';
const BUSINESS_ABN = '23 697 415 151';
const BUSINESS_ACN = '697 415 151';
const BUSINESS_EMAIL = 'hello@agenticai.net.au';
const GST_RATE = 0.1;

function baseHtml({ title, preheader, body }: { title: string; preheader: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="https://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
  <style type="text/css">
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; padding-left: 24px !important; padding-right: 24px !important; }
      .hide-mobile { display: none !important; }
      .stack { display: block !important; width: 100% !important; }
      h1 { font-size: 22px !important; line-height: 1.3 !important; }
      .btn { width: 100% !important; text-align: center !important; }
    }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
  </style>
</head>
<body style="margin:0; padding:0; background-color:${BRAND_BG}; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:${BRAND_TEXT}; line-height:1.6;">
  <!-- Preview text (hidden) -->
  <div style="display:none; max-height:0; overflow:hidden;">${preheader}</div>

  <!-- Wrapper -->
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:${BRAND_BG};">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="container" width="600" style="max-width:600px; width:100%; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:${BRAND_PRIMARY}; padding:32px 40px; text-align:center;">
              <a href="${SITE_URL}" style="text-decoration:none;">
                <img src="${LOGO_URL}" alt="Agentic AI" width="180" height="28" style="display:block; max-width:180px; width:180px; height:auto; margin:0 auto; border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic;" />
              </a>
              <p style="margin:12px 0 0 0; font-size:13px; color:rgba(255,255,255,0.72); font-weight:400;">AI Business Audits for Australian SMBs</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="container" style="padding:40px 48px 32px 48px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:${BRAND_BG}; padding:28px 40px; text-align:center; border-top:1px solid #e9ecef;">
              <p style="margin:0 0 8px 0; font-size:13px; color:${BRAND_MUTED};">
                <a href="${SITE_URL}" style="color:${BRAND_ACCENT}; text-decoration:none; font-weight:600;">agenticai.net.au</a>
              </p>
              <p style="margin:0; font-size:12px; color:#adb5bd;">
                Agentic AI · Sydney, Australia<br>
                <span style="color:#adb5bd;">Reply to this email or contact <a href="mailto:hello@agenticai.net.au" style="color:${BRAND_MUTED}; text-decoration:underline;">hello@agenticai.net.au</a></span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function money(cents: number, currency = 'AUD') {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(cents / 100);
}

function parseAmountCents(amount: string) {
  const value = Number(amount.replace(/[^\d.]/g, ''));
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function formatDate(value?: string) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

// ---------------------------------------------------------------------------
// 1. Report Ready — sent after deck + analysis are saved
// ---------------------------------------------------------------------------
export function reportReadyTemplate(opts: {
  customerName?: string;
  company?: string;
  deckUrl?: string | null;
}): { html: string; text: string } {
  const name = opts.customerName || 'there';
  const company = opts.company || 'Your Business';

  const body = `
<h1 style="margin:0 0 16px 0; font-size:26px; font-weight:700; color:${BRAND_PRIMARY};">Your assessment is ready</h1>

<p style="margin:0 0 20px 0; font-size:16px; color:${BRAND_TEXT};">Hi ${name},</p>

<p style="margin:0 0 16px 0; font-size:15px; color:${BRAND_TEXT};">
  We have completed the AI Business Assessment for <strong>${company}</strong>. 
  The report identifies operational bottlenecks, AI tool fits, and a practical implementation roadmap ranked by impact and effort.
</p>

${opts.deckUrl ? `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
  <tr>
    <td align="center">
      <a href="${opts.deckUrl}" class="btn" style="display:inline-block; padding:16px 32px; background:${BRAND_ACCENT}; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">Download your report</a>
    </td>
  </tr>
</table>

<p style="margin:16px 0 0 0; font-size:13px; color:${BRAND_MUTED}; word-break:break-all;">
  Or copy this link: <a href="${opts.deckUrl}" style="color:${BRAND_ACCENT};">${opts.deckUrl}</a>
</p>
` : '<p style="margin:16px 0; font-size:15px; color:' + BRAND_MUTED + ';">Your report is available in your client portal. We will send a separate link once it is generated.</p>'}

<h3 style="margin:32px 0 12px 0; font-size:17px; font-weight:600; color:${BRAND_PRIMARY};">What happens next</h3>
<ul style="margin:0 0 20px 0; padding-left:20px; font-size:15px; color:${BRAND_TEXT};">
  <li style="margin-bottom:8px;">Review the deck and highlight anything you want to discuss.</li>
  <li style="margin-bottom:8px;">We can run a 30‑minute follow‑up call to answer questions and scope implementation.</li>
  <li>Reply to this email if you want us to forward the report to colleagues.</li>
</ul>

<p style="margin:24px 0 0 0; font-size:15px; color:${BRAND_TEXT};">— The Agentic AI team</p>
`;

  const html = baseHtml({
    title: `AI Business Assessment Report — ${company}`,
    preheader: `Your AI Business Assessment for ${company} is ready.`,
    body
  });

  const text = `Hi ${name},

Your AI Business Assessment for ${company} is ready.

${opts.deckUrl ? `Download your report:
${opts.deckUrl}
` : 'Your report is available in your client portal. We will send a separate link once it is generated.'}

WHAT HAPPENS NEXT
- Review the deck and highlight anything you want to discuss.
- We can run a 30-minute follow-up call to scope implementation.
- Reply to forward the report to colleagues.

— The Agentic AI team
agenticai.net.au · hello@agenticai.net.au
`;

  return { html, text };
}

// ---------------------------------------------------------------------------
// 2. Welcome / Assessment Booked — sent after voice call or checkout
// ---------------------------------------------------------------------------
export function welcomeTemplate(opts: {
  customerName?: string;
  company?: string;
}): { html: string; text: string } {
  const name = opts.customerName || 'there';
  const company = opts.company || 'Your Business';

  const body = `
<h1 style="margin:0 0 16px 0; font-size:26px; font-weight:700; color:${BRAND_PRIMARY};">Thank you for booking</h1>

<p style="margin:0 0 20px 0; font-size:16px; color:${BRAND_TEXT};">Hi ${name},</p>

<p style="margin:0 0 16px 0; font-size:15px; color:${BRAND_TEXT};">
  We received your request for an AI Business Assessment for <strong>${company}</strong>.
</p>

<p style="margin:0 0 16px 0; font-size:15px; color:${BRAND_TEXT};">
  Here is what happens next:
</p>

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:8px 0 24px 0;">
  <tr>
    <td style="padding:0 0 12px 0; vertical-align:top;" width="28">
      <span style="display:inline-block; width:24px; height:24px; background:${BRAND_PRIMARY}; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700;">1</span>
    </td>
    <td style="padding:0 0 12px 8px; font-size:15px; color:${BRAND_TEXT};">
      <strong>Intake call</strong> — our voice agent will call you within 24 hours to gather context (20–30 min).
    </td>
  </tr>
  <tr>
    <td style="padding:0 0 12px 0; vertical-align:top;" width="28">
      <span style="display:inline-block; width:24px; height:24px; background:${BRAND_PRIMARY}; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700;">2</span>
    </td>
    <td style="padding:0 0 12px 8px; font-size:15px; color:${BRAND_TEXT};">
      <strong>Analysis</strong> — we map your workflows, pain points, and AI tool fits.
    </td>
  </tr>
  <tr>
    <td style="vertical-align:top;" width="28">
      <span style="display:inline-block; width:24px; height:24px; background:${BRAND_PRIMARY}; color:#fff; border-radius:50%; text-align:center; line-height:24px; font-size:12px; font-weight:700;">3</span>
    </td>
    <td style="padding-left:8px; font-size:15px; color:${BRAND_TEXT};">
      <strong>Report delivery</strong> — you receive a presentation‑style report within 48 hours.
    </td>
  </tr>
</table>

<p style="margin:0 0 16px 0; font-size:15px; color:${BRAND_TEXT};">
  If you need to reschedule or have questions before the call, reply to this email.
</p>

<p style="margin:24px 0 0 0; font-size:15px; color:${BRAND_TEXT};">— The Agentic AI team</p>
`;

  const html = baseHtml({
    title: `AI Business Assessment — Booking Confirmed`,
    preheader: `We have received your assessment request for ${company}.`,
    body
  });

  const text = `Hi ${name},

Thank you for booking an AI Business Assessment for ${company}.

WHAT HAPPENS NEXT
1. Intake call — our voice agent will call you within 24 hours (20–30 min).
2. Analysis — we map your workflows, pain points, and AI tool fits.
3. Report delivery — you receive a presentation-style report within 48 hours.

If you need to reschedule or have questions, reply to this email.

— The Agentic AI team
agenticai.net.au · hello@agenticai.net.au
`;

  return { html, text };
}

// ---------------------------------------------------------------------------
// 3. Payment Receipt
// ---------------------------------------------------------------------------
export function receiptTemplate(opts: {
  customerName?: string;
  amount: string;
  amountCents?: number;
  currency?: string;
  reference?: string;
  company?: string;
  customerEmail?: string;
  issuedAt?: string;
}): { html: string; text: string } {
  const name = opts.customerName || 'there';
  const currency = opts.currency || 'AUD';
  const totalCents = opts.amountCents ?? parseAmountCents(opts.amount);
  const gstCents = Math.round(totalCents / (1 + GST_RATE) * GST_RATE);
  const subtotalCents = totalCents - gstCents;
  const issuedDate = formatDate(opts.issuedAt);
  const invoiceNumber = opts.reference || `AA-${Date.now()}`;
  const buyerName = opts.company || opts.customerName || 'Customer';

  const body = `
<h1 style="margin:0 0 16px 0; font-size:26px; font-weight:700; color:${BRAND_PRIMARY};">Tax invoice / receipt</h1>

<p style="margin:0 0 20px 0; font-size:16px; color:${BRAND_TEXT};">Hi ${name},</p>

<p style="margin:0 0 16px 0; font-size:15px; color:${BRAND_TEXT};">
  We have received your payment for the AI Business Assessment. Please keep this tax invoice/receipt for your records.
</p>

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0 20px 0;">
  <tr>
    <td class="stack" width="50%" style="vertical-align:top; padding:0 12px 12px 0;">
      <p style="margin:0 0 6px 0; font-size:13px; color:${BRAND_MUTED}; text-transform:uppercase; letter-spacing:.04em;">Supplier</p>
      <p style="margin:0; font-size:14px; color:${BRAND_TEXT};">
        <strong>${BUSINESS_NAME}</strong><br>
        ABN ${BUSINESS_ABN}<br>
        ACN ${BUSINESS_ACN}<br>
        Sydney, Australia<br>
        <a href="mailto:${BUSINESS_EMAIL}" style="color:${BRAND_ACCENT};">${BUSINESS_EMAIL}</a>
      </p>
    </td>
    <td class="stack" width="50%" style="vertical-align:top; padding:0 0 12px 12px;">
      <p style="margin:0 0 6px 0; font-size:13px; color:${BRAND_MUTED}; text-transform:uppercase; letter-spacing:.04em;">Bill to</p>
      <p style="margin:0; font-size:14px; color:${BRAND_TEXT};">
        <strong>${buyerName}</strong><br>
        ${opts.customerName && opts.company ? `${opts.customerName}<br>` : ''}
        ${opts.customerEmail ? `<a href="mailto:${opts.customerEmail}" style="color:${BRAND_ACCENT};">${opts.customerEmail}</a>` : ''}
      </p>
    </td>
  </tr>
</table>

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0; background:${BRAND_BG}; border-radius:8px; border:1px solid #e9ecef;">
  <tr>
    <td style="padding:20px 24px;">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-bottom:6px;" width="170">Invoice number</td>
          <td style="font-size:14px; color:${BRAND_TEXT}; padding-bottom:6px;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-bottom:6px;">Issue date</td>
          <td style="font-size:14px; color:${BRAND_TEXT}; padding-bottom:6px;">${issuedDate}</td>
        </tr>
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-bottom:6px;">Payment status</td>
          <td style="font-size:14px; color:${BRAND_TEXT}; padding-bottom:6px;">Paid via Stripe</td>
        </tr>
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-bottom:6px;">Description</td>
          <td style="font-size:14px; color:${BRAND_TEXT}; padding-bottom:6px;">AI Business Assessment — workflow intake, analysis, opportunity report, quick wins, and implementation roadmap</td>
        </tr>
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-bottom:6px;">Quantity</td>
          <td style="font-size:14px; color:${BRAND_TEXT}; padding-bottom:6px;">1</td>
        </tr>
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-bottom:6px;">Subtotal excluding GST</td>
          <td style="font-size:14px; color:${BRAND_TEXT}; padding-bottom:6px;">${money(subtotalCents, currency)}</td>
        </tr>
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-bottom:6px;">GST 10%</td>
          <td style="font-size:14px; color:${BRAND_TEXT}; padding-bottom:6px;">${money(gstCents, currency)}</td>
        </tr>
        <tr>
          <td style="font-size:14px; color:${BRAND_MUTED}; padding-top:8px; border-top:1px solid #dde2e6;">Total paid including GST</td>
          <td style="font-size:18px; font-weight:700; color:${BRAND_PRIMARY}; padding-top:8px; border-top:1px solid #dde2e6;">${money(totalCents, currency)}</td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<p style="margin:16px 0 0 0; font-size:15px; color:${BRAND_TEXT};">
  Your transcript will be processed and your report will be ready within 48 hours. Once you receive your report, you will have the opportunity to book a complimentary 30-minute consultation with one of our consultants.
</p>

<p style="margin:24px 0 0 0; font-size:15px; color:${BRAND_TEXT};">— The Agentic AI team</p>
`;

  const html = baseHtml({
    title: `Tax Invoice / Receipt — AI Business Assessment`,
    preheader: `We received your payment of ${money(totalCents, currency)} for the AI Business Assessment.`,
    body
  });

  const text = `Hi ${name},

Tax invoice / receipt

Supplier: ${BUSINESS_NAME}
ABN: ${BUSINESS_ABN}
ACN: ${BUSINESS_ACN}
Email: ${BUSINESS_EMAIL}

Bill to: ${buyerName}
${opts.customerName && opts.company ? `Contact: ${opts.customerName}\n` : ''}${opts.customerEmail ? `Customer email: ${opts.customerEmail}\n` : ''}
Invoice number: ${invoiceNumber}
Issue date: ${issuedDate}
Payment status: Paid via Stripe

Description: AI Business Assessment — workflow intake, analysis, opportunity report, quick wins, and implementation roadmap
Quantity: 1
Subtotal excluding GST: ${money(subtotalCents, currency)}
GST 10%: ${money(gstCents, currency)}
Total paid including GST: ${money(totalCents, currency)}

Your transcript will be processed and your report will be ready within 48 hours. Once you receive your report, you will have the opportunity to book a complimentary 30-minute consultation.

— The Agentic AI team
agenticai.net.au · hello@agenticai.net.au
`;

  return { html, text };
}

// ---------------------------------------------------------------------------
// 4. Generic
// ---------------------------------------------------------------------------
export function genericTemplate(opts: {
  subject: string;
  preheader: string;
  heading: string;
  paragraphs: string[];
  cta?: { text: string; href: string } | null;
  customerName?: string;
}): { html: string; text: string } {
  const name = opts.customerName ? `Hi ${opts.customerName},` : 'Hi there,';

  let body = `
<h1 style="margin:0 0 16px 0; font-size:26px; font-weight:700; color:${BRAND_PRIMARY};">${opts.heading}</h1>
<p style="margin:0 0 20px 0; font-size:16px; color:${BRAND_TEXT};">${name}</p>
`;

  for (const p of opts.paragraphs) {
    body += `<p style="margin:0 0 16px 0; font-size:15px; color:${BRAND_TEXT};">${p}</p>\n`;
  }

  if (opts.cta) {
    body += `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
  <tr>
    <td align="center">
      <a href="${opts.cta.href}" class="btn" style="display:inline-block; padding:16px 32px; background:${BRAND_ACCENT}; color:#ffffff; text-decoration:none; border-radius:8px; font-weight:600; font-size:16px;">${opts.cta.text}</a>
    </td>
  </tr>
</table>
`;
  }

  body += `<p style="margin:24px 0 0 0; font-size:15px; color:${BRAND_TEXT};">— The Agentic AI team</p>`;

  const html = baseHtml({ title: opts.subject, preheader: opts.preheader, body });

  const text = `${name}

${opts.heading}

${opts.paragraphs.join('\n\n')}
${opts.cta ? `\n${opts.cta.text}: ${opts.cta.href}\n` : ''}
— The Agentic AI team
agenticai.net.au · hello@agenticai.net.au
`;

  return { html, text };
}
