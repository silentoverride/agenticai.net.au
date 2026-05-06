const signaturePattern = /^v=(\d+),d=([a-f0-9]+)$/i;
const fiveMinutesMs = 5 * 60 * 1000;

function bytesToHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function stopRetellCall(callId: string, apiKey: string) {
  const response = await fetch(`https://api.retellai.com/v2/stop-call/${callId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: '*/*'
    }
  });

  if (!response.ok && response.status !== 404) {
    const text = await response.text();
    console.error(`Failed to stop Retell call ${callId}: ${response.status} ${text}`);
    throw new Error(`Retell stop-call failed: ${response.status}`);
  }
}

export async function verifyRetellSignature(rawBody: string, apiKey: string, signature: string) {
  const match = signature.match(signaturePattern);

  if (!match) return false;

  const [, timestamp, digest] = match;
  const timestampMs = Number(timestamp);

  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > fiveMinutesMs) {
    return false;
  }

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody + timestamp));
  const expectedDigest = bytesToHex(signatureBytes);

  return expectedDigest.length === digest.length && expectedDigest === digest.toLowerCase();
}
