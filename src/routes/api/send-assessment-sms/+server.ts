import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { apiError } from '$lib/server/api-error';
import { isTwilioConfigured, sanitizeSpokenPhoneNumber, sendTwilioSms } from '$lib/server/twilio';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  if (!isTwilioConfigured()) {
    throw apiError(
      501,
      'Twilio SMS is not configured. Set TWILIO_ACCOUNT_SID, Twilio API credentials, and a sender.'
    );
  }

  if (env.RETELL_TWILIO_WEBHOOK_SECRET) {
    const providedSecret = request.headers.get('x-agenticai-webhook-secret');

    if (providedSecret !== env.RETELL_TWILIO_WEBHOOK_SECRET) {
      throw apiError(401, 'Unauthorized.');
    }
  }

  const body = (await request.json().catch(() => ({}))) as {
    customerPhone?: string;
    callerPhone?: string;
    customerName?: string;
    callerName?: string;
    company?: string;
    checkoutUrl?: string;
    message?: string;
  };

  const rawTo = body.customerPhone || body.callerPhone || '';
  const toPhone = sanitizeSpokenPhoneNumber(rawTo);
  const customerName = body.customerName || body.callerName;

  if (!toPhone) {
    throw apiError(400, 'customerPhone or callerPhone is required.');
  }

  const smsBody =
    body.message ||
    `Hi${customerName ? ` ${customerName}` : ''}, your secure Agentic AI Business Assessment payment link is ${body.checkoutUrl || '[payment link pending]'}. Once payment is complete, your transcript will be queued for analysis.`;

  if (!body.checkoutUrl && !body.message) {
    throw apiError(400, 'checkoutUrl or message is required.');
  }

  try {
    const sms = await sendTwilioSms(toPhone, smsBody);

    return json({
      sent: true,
      sid: sms.sid,
      status: sms.status,
      to: sms.to
    });
  } catch (error) {
    console.error('Twilio assessment SMS failed:', error);

    throw apiError(
      502,
      error instanceof Error ? error.message : 'Unable to send assessment SMS.'
    );
  }
};
