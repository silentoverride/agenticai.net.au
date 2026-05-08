#!/usr/bin/env node
/**
 * List all completed pipeline reports.
 *
 * Usage:
 *   node scripts/list-completed-reports.mjs [--remote]
 *
 * Options:
 *   --remote   Query the remote/production D1 database (default: local)
 */

const args = process.argv.slice(2);
const useRemote = args.includes('--remote');

const DB_NAME = 'assessment-db';

async function listCompletedReports() {
  const { execSync } = await import('child_process');

  const remoteFlag = useRemote ? ' --remote' : '';
  const cmd = `npx wrangler d1 execute ${DB_NAME}${remoteFlag} --command "SELECT session_id, status, report_id, call_id, created_at, updated_at FROM pipeline_status WHERE status = 'completed' ORDER BY updated_at DESC"`;

  console.log(`[list-reports] Querying ${useRemote ? 'remote' : 'local'} D1...\n`);

  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });

    // wrangler may emit the JSON array across multiple lines; join and try to parse
    const joined = output.split('\n').map(l => l.trim()).join('');

    // Try to extract the JSON array from wrangler output
    const match = joined.match(/\[\s*\{\s*"results"[\s\S]*?\}\s*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed[0]?.results) {
          const rows = parsed[0].results;
          if (rows.length === 0) {
            console.log('No completed reports found.');
            return;
          }

          console.log(`Found ${rows.length} completed report(s):\n`);
          for (const row of rows) {
            console.log(`  Session:      ${row.session_id}`);
            console.log(`  Report ID:    ${row.report_id || 'N/A'}`);
            console.log(`  Call ID:      ${row.call_id || 'N/A'}`);
            console.log(`  Status:       ${row.status}`);
            console.log(`  Updated:      ${row.updated_at}`);
            console.log(`  Portal URL:   https://agenticai.net.au/portal/{user_id}/reports/${row.report_id}`);
            console.log(`  API:          GET /api/pipeline-status/${row.session_id}`);
            console.log('  ──────────────────────────────────');
          }
          return;
        }
      } catch {
        // parse failed, fall through to raw output
      }
    }

    // fallback: print raw output
    console.log(output);
  } catch (err) {
    console.error('[list-reports] Failed:', err.stderr || err.message);
    process.exit(1);
  }
}

listCompletedReports();
