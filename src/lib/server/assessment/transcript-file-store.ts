import * as fs from 'node:fs';
import * as path from 'node:path';
import { env } from '$env/dynamic/private';

const TRANSCRIPTS_DIR = env.TRANSCRIPTS_DIR || './app_data/transcripts';

function ensureTranscriptsDir(): string {
  const dir = path.resolve(TRANSCRIPTS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function saveTranscriptToDisk(opts: {
  transcript: string;
  company?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  callId?: string;
  sessionId?: string;
  source?: string;
}): { saved: boolean; path?: string; error?: string } {
  try {
    const dir = ensureTranscriptsDir();
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const companySlug = slugify(opts.company || 'unknown');
    const nameSlug = slugify(opts.customerName || 'unknown');
    const filename = `${dateStr}-transcript-${companySlug}-${nameSlug}.txt`;
    const filePath = path.join(dir, filename);

    const header = [
      '=== AI Business Assessment Intake Transcript ===',
      `Date: ${new Date().toISOString()}`,
      `Session ID: ${opts.sessionId || 'N/A'}`,
      `Call ID: ${opts.callId || 'N/A'}`,
      `Company: ${opts.company || 'N/A'}`,
      `Customer: ${opts.customerName || 'N/A'}`,
      `Email: ${opts.customerEmail || 'N/A'}`,
      `Phone: ${opts.customerPhone || 'N/A'}`,
      `Source: ${opts.source || 'N/A'}`,
      '================================================',
      ''
    ].join('\n');

    fs.writeFileSync(filePath, header + opts.transcript, 'utf-8');
    console.info('Transcript saved to disk', { path: filePath });
    return { saved: true, path: filePath };
  } catch (err: any) {
    console.error('Failed to save transcript to disk:', err);
    return { saved: false, error: err.message };
  }
}
