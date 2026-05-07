// Check D1 for all transcripts associated with the known call_id

async function checkD1() {
  // List all transcripts
  const { execSync } = await import('child_process');
  
  try {
    const result = execSync(
      `cd /home/loki/projects.io/agenticai.net.au && npx wrangler d1 execute assessment-db --remote --command="SELECT call_id, LENGTH(transcript) as len, payment_status, created_at FROM transcripts ORDER BY created_at DESC LIMIT 5"`,
      { encoding: 'utf-8', timeout: 15000 }
    );
    console.log(result);
  } catch (e) {
    console.error('Error:', e.stderr || e.message);
  }
}

await checkD1();
