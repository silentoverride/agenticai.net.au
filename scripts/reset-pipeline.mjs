/**
 * Reset/retry a pipeline session by its Stripe checkout session ID.
 *
 * Usage:
 *   node scripts/reset-pipeline.mjs <session_id>
 */

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('Usage: node scripts/reset-pipeline.mjs <session_id>');
  process.exit(1);
}

const API_URL = process.env.API_URL || 'https://agenticai.net.au';

async function resetSession(sessionId) {
  console.log(`[reset] Clearing pipeline status for ${sessionId}...`);

  // Step 1: Clear status by writing 'unknown' to the pipeline status endpoint
  // We'll do this via the assessment-transcript POST endpoint which re-triggers
  const response = await fetch(`${API_URL}/api/assessment-transcript`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId })
  });

  const body = await response.json().catch(() => ({}));
  console.log(`[reset] POST status: ${response.status}`);
  console.log(`[reset] Response:`, JSON.stringify(body, null, 2));

  // Step 2: Verify the GET status reflects the reset
  const getResponse = await fetch(`${API_URL}/api/assessment-transcript?sessionId=${sessionId}`);
  const getBody = await getResponse.json().catch(() => ({}));
  console.log(`[reset] GET status: ${getResponse.status}`);
  console.log(`[reset] Current pipeline status:`, JSON.stringify(getBody, null, 2));
}

resetSession(sessionId).catch(err => {
  console.error('[reset] Failed:', err.message);
  process.exit(1);
});
