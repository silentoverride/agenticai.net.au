import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const match = envContent.match(/^RETELL_API_KEY=(.+)$/m);
if (match) {
  const key = match[1].trim();
  console.log('Full key:', key);
  console.log('Length:', key.length);
  console.log('Prefix:', key.slice(0, 15));
  console.log('Suffix:', key.slice(-15));
} else {
  console.log('Not found');
}
