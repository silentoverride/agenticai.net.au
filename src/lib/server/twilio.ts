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

/**
 * Convert spoken phone numbers (e.g. 'oh four one two...') into digits.
 * Handles: 'oh'→0, 'double'/'triple' repetition, punctation, then normalises to E.164.
 */
export function sanitizeSpokenPhoneNumber(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw.toLowerCase().trim();

  // Expand spoken repetition: "double four" → "four four", "triple zero" → "zero zero zero"
  const multipliers: Record<string, number> = { double: 2, triple: 3, quadruple: 4, quintuple: 5 };
  for (const [word, count] of Object.entries(multipliers)) {
    const regex = new RegExp(`\\b${word}\\s+(\\w+)\\b`, 'gi');
    text = text.replace(regex, (_m, digitWord) => Array(count).fill(digitWord).join(' '));
  }

  // Spoken-digit map (Australian "oh" and common homophones)
  const digitMap: Record<string, string> = {
    zero: '0', oh: '0', o: '0',
    one: '1', won: '1',
    two: '2', too: '2', to: '2',
    three: '3',
    four: '4', for: '4', fore: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8', ate: '8',
    nine: '9',
  };

  // Replace each spoken digit on word boundaries to avoid partial matches
  for (const [word, digit] of Object.entries(digitMap)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    text = text.replace(regex, digit);
  }

  // Strip everything except digits
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';

  // Normalise to E.164 (assume AU mobile unless already international)
  if (digits.startsWith('+')) return digits; // already handled by \D stripping; won't happen
  if (digits.startsWith('61') && digits.length >= 11) return `+${digits}`;
  if (digits.startsWith('0') && digits.length >= 9) return `+61${digits.slice(1)}`;
  if (digits.length >= 9) return `+61${digits}`; // no prefix → assume AU

  return `+${digits}`;
}

/**
 * Convert spoken email addresses (e.g. 'john at smith dot com') into clean email.
 * Returns null if the result is not a valid-looking email.
 */
export function sanitizeVoiceEmail(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;

  let cleaned = raw.trim().toLowerCase();
  cleaned = cleaned.replace(/\s+at\s+/g, '@');
  cleaned = cleaned.replace(/\s+dot\s+/g, '.');
  cleaned = cleaned.replace(/\bat\s+/g, '@');
  cleaned = cleaned.replace(/\bdot\s+/g, '.');
  cleaned = cleaned.replace(/\s+@\s+/g, '@');
  cleaned = cleaned.replace(/\s+\.\s+/g, '.');
  cleaned = cleaned.replace(/\s+/g, '');
  cleaned = cleaned.replace(/\.{2,}/g, '.');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(cleaned)) {
    return cleaned;
  }
  return null;
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
