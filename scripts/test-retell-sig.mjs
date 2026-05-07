// Test the signature generation locally against the same verify function

import { createHmac } from 'crypto';

const apiKey = 'key_45f2aee94a3807e384d34743';
const timestamp = Date.now();

const payload = { test: 'hello' };
const body = JSON.stringify(payload);
console.log('Body:', body);
console.log('Timestamp:', timestamp);
console.log('Key length:', apiKey.length, apiKey.slice(0, 10) + '...');

const toSign = body + timestamp;
console.log('To-sign:', toSign);

const digest = createHmac('sha256', apiKey).update(toSign).digest('hex');
console.log('Digest:', digest);

// Now replicate the verify function
console.log('\n--- Verify checks ---');
console.log('1. Signature extract timestamp:', timestamp);
console.log('2. Timestamp diff:', Math.abs(Date.now() - timestamp), 'ms');
console.log('   Should be <', 5 * 60 * 1000);

// Actually we know the node code. The server uses Web Crypto API:
// importKey('raw', encoder.encode(apiKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
// sign('HMAC', key, encoder.encode(rawBody + timestamp))
// bytesToHex(signatureBytes)

// Node crypto equivalent would be:
const nodeDigest = createHmac('sha256', apiKey).update(body + timestamp).digest('hex');
console.log('3. Node HMAC:', nodeDigest);

const encoder = new TextEncoder();
// We need to use Web Crypto API the same way the server does
async function webCryptoHmac(keyData, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyData),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

const webDigest = await webCryptoHmac(apiKey, body + timestamp);
console.log('4. WebCrypto HMAC:', webDigest);

console.log('\n5. Match:', nodeDigest === webDigest ? 'YES ✅' : 'NO ❌');
console.log('   Digest length:', webDigest.length);
