const callId = process.argv[2];
if (!callId) {
  console.error('Usage: node scripts/fetch-retell-and-import.mjs <call_id>');
  process.exit(1);
}

const RETELL_API_KEY = process.env.RETELL_API_KEY || '';

async function fetchRetellCall() {
  console.log(`[fetch-retell] Fetching call ${callId}...`);

  const res = await fetch(`https://api.retellai.com/v2/get-call/${callId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${RETELL_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Retell API error ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = await res.json();
  return data;
}

async function importToD1(data) {
  const rawTranscript = data.transcript || data.scrubbed_transcript_with_tool_calls || data.transcript_with_tool_calls || '';
  
  // Retell returns transcript as array of { role, content } or already as string
  let transcript = '';
  if (typeof rawTranscript === 'string') {
    transcript = rawTranscript;
  } else if (Array.isArray(rawTranscript)) {
    transcript = rawTranscript.map(t => `${t.role || t.speaker}: ${t.content || t.text || t.message}`).join('\n');
  } else if (rawTranscript) {
    transcript = JSON.stringify(rawTranscript);
  }

  const dynVars = data.retell_llm_dynamic_variables || data.scrubbed_retell_llm_dynamic_variables || {};
  const callAnalysis = data.call_analysis || data.scrubbed_call_analysis || {};
  
  const metadata = {
    customer_name: dynVars.caller_name || dynVars.customerName || callAnalysis.custom_analysis?.customer_name || '',
    customer_email: dynVars.caller_email || dynVars.customerEmail || '',
    customer_phone: data.from_number || dynVars.caller_phone || dynVars.customerPhone || '',
    company: dynVars.company || callAnalysis.custom_analysis?.company || '',
    source: 'retell-voice-agent',
    call_duration_ms: data.duration_ms || 0,
    disconnection_reason: data.disconnection_reason || '',
    recording_url: data.recording_url || data.scrubbed_recording_url || '',
    call_status: data.call_status || '',
    agent_name: data.agent_name || ''
  };

  console.log('[import] Transcript length:', transcript.length);
  console.log('[import] Transcript type:', typeof rawTranscript, Array.isArray(rawTranscript) ? '(array)' : '');
  console.log('[import] Dynamic variables keys:', Object.keys(dynVars));
  console.log('[import] Call analysis keys:', Object.keys(callAnalysis));
  console.log('[import] Metadata:', JSON.stringify(metadata, null, 2));

  if (!transcript) {
    console.warn('[import] No transcript found — will save empty transcript');
  }

  const fs = await import('fs');
  const sql = `INSERT INTO transcripts (call_id, transcript, metadata)
VALUES ('${callId}', '${transcript.replace(/'/g, "''")}', '${JSON.stringify(metadata).replace(/'/g, "''")}')
ON CONFLICT(call_id) DO UPDATE SET
  transcript = excluded.transcript,
  metadata = excluded.metadata,
  processed_at = NULL;`;

  const sqlFile = `/tmp/import_${callId}.sql`;
  fs.writeFileSync(sqlFile, sql);

  console.log('[import] SQL written to', sqlFile);
  console.log('[import] Executing wrangler ...');
  
  const { execSync } = await import('child_process');
  try {
    const output = execSync(`npx wrangler d1 execute assessment-db --remote --file=${sqlFile}`, { encoding: 'utf-8' });
    console.log('[import] D1 import successful');
    console.log(output);
  } catch (e) {
    console.error('[import] D1 import failed:', e.stderr || e.message);
    process.exit(1);
  }
}

fetchRetellCall()
  .then(data => {
    console.log('[fetch-retell] Got response with keys:', Object.keys(data));
    return importToD1(data);
  })
  .catch(err => {
    console.error('[error]', err.message);
    process.exit(1);
  });
