import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { isTwilioConfigured, sendTwilioSms } from '$lib/server/twilio';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  if (!isTwilioConfigured()) {
    return json(
      {
        message:
          'Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, Twilio API credentials, and a sender.'
      },
      { status: 501 }
    );
  }

  if (env.RETELL_TWILIO_WEBHOOK_SECRET) {
    const providedSecret = request.headers.get('x-agenticai-webhook-secret');

    if (providedSecret !== env.RETELL_TWILIO_WEBHOOK_SECRET) {
      return json({ message: 'Unauthorized.' }, { status: 401 });
    }
  }

  const body = (await request.json().catch(() => ({}))) as {
    customerPhone?: string;
    customerName?: string;
    company?: string;
    checkoutUrl?: string;
    message?: string;
  };

  if (!body.customerPhone) {
    return json({ message: 'customerPhone is required.' }, { status: 400 });
  }

  const smsBody =
    body.message ||
    `Hi${body.customerName ? ` ${body.customerName}` : ''}, your secure Agentic AI Business Assessment payment link is ${body.checkoutUrl || '[payment link pending]'}. Once payment is complete, your transcript will be queued for analysis.`;

  if (!body.checkoutUrl && !body.message) {
    return json({ message: 'checkoutUrl or message is required.' }, { status: 400 });
  }

  try {
    const sms = await sendTwilioSms(body.customerPhone, smsBody);

    return json({
      sent: true,
      sid: sms.sid,
      status: sms.status,
      to: sms.to
    });
  } catch (error) {
    console.error('Twilio assessment SMS failed:', error);

    return json(
      {
        message: error instanceof Error ? error.message : 'Unable to send assessment SMS.'
      },
      { status: 502 }
    );
  }
};
