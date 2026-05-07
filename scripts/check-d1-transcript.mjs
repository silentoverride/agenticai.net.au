import { getDb, isDatabaseAvailable } from '../src/lib/server/db.js';

async function main() {
  if (!isDatabaseAvailable()) {
    console.log('D1 not available locally');
    return;
  }
  const db = getDb();
  const callId = 'call_8153280819ccc61607fa29a9e93';
  const row = await db.queryOne('SELECT call_id, transcript, metadata, created_at FROM transcripts WHERE call_id = ?', callId);
  if (row) {
    console.log('Found transcript in D1:');
    console.log({ call_id: row.call_id, transcript_length: row.transcript?.length, metadata: row.metadata, created_at: row.created_at });
  } else {
    console.log('No transcript row found for callId:', callId);
  }
}

main().catch(console.error);
