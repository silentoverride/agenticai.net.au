import { env } from '$env/dynamic/private';

type TwilioMessageResult = {
  sid: string;
  status: string;
  to: string;
};

type TwilioMessageError = {
  message?: string;
  code?: number;
  more_info?: string;
};

export function isTwilioConfigured() {
  const hasAuth =
    Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_API_KEY_SID && env.TWILIO_API_KEY_SECRET) ||
    Boolean(env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN);
  const hasSender = Boolean(env.TWILIO_MESSAGING_SERVICE_SID || env.TWILIO_FROM_NUMBER);

  return hasAuth && hasSender;
}

export function normalizePhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('+')) return trimmed.replace(/[^\d+]/g, '');

  const digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('61')) return `+${digits}`;
  if (digits.startsWith('0')) return `+61${digits.slice(1)}`;

  return `+${digits}`;
}

export async function sendTwilioSms(to: string, body: string): Promise<TwilioMessageResult> {
  if (!env.TWILIO_ACCOUNT_SID) {
    throw new Error('TWILIO_ACCOUNT_SID is not configured.');
  }

  const normalizedTo = normalizePhoneNumber(to);

  if (!normalizedTo) {
    throw new Error('A destination phone number is required.');
  }

  if (!body.trim()) {
    throw new Error('SMS body is required.');
  }

  const username = env.TWILIO_API_KEY_SID || env.TWILIO_ACCOUNT_SID;
  const password = env.TWILIO_API_KEY_SECRET || env.TWILIO_AUTH_TOKEN;

  if (!password) {
    throw new Error('Twilio API credentials are not configured.');
  }

  if (!env.TWILIO_MESSAGING_SERVICE_SID && !env.TWILIO_FROM_NUMBER) {
    throw new Error('Set TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER.');
  }

  const params = new URLSearchParams();
  params.set('To', normalizedTo);
  params.set('Body', body.slice(0, 1500));

  if (env.TWILIO_MESSAGING_SERVICE_SID) {
    params.set('MessagingServiceSid', env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    params.set('From', env.TWILIO_FROM_NUMBER || '');
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        authorization: `Basic ${btoa(`${username}:${password}`)}`,
        'content-type': 'application/x-www-form-urlencoded',
        'user-agent': 'agenticai.net.au/1.0 (SvelteKit; Cloudflare Pages)',
        accept: 'application/json'
      },
      body: params
    }
  );

  const data = (await response.json()) as Partial<TwilioMessageResult> & TwilioMessageError;

  if (!response.ok) {
    throw new Error(data.message || 'Unable to send Twilio SMS.');
  }

  return {
    sid: data.sid || '',
    status: data.status || '',
    to: data.to || normalizedTo
  };
}
