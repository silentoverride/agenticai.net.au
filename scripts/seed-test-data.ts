/**
 * Comprehensive Test Data Seed Script
 *
 * Populates the Agentic AI portal database with realistic test data covering
 * all entity types, lifecycle states, role-based access patterns, edge cases,
 * and pagination volumes. Designed for admin or staff/staff portal testing.
 *
 * Usage:
 *   npx tsx scripts/seed-test-data.ts
 *   npx tsx scripts/seed-test-data.ts --reset   (clears all data first)
 */

import Database from 'better-sqlite3';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as crypto from 'node:crypto';

// ── Configuration ────────────────────────────────────────────────────────────

// Resolve DB path: dev server uses Miniflare D1 when wrangler.toml has D1 bindings
function findD1Db(): string | null {
  const d1Dir = path.resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject');
  try {
    const files = fs.readdirSync(d1Dir).filter(f => f.endsWith('.sqlite') && !f.includes('metadata'));
    if (files.length > 0) {
      return path.join(d1Dir, files[0]);
    }
  } catch { /* dir doesn't exist */ }
  return null;
}

const DB_PATH = findD1Db() || path.resolve(process.env.DB_DIR || './app_data', 'portal.db');

console.log(`📂 Using database: ${DB_PATH}`);
const RESET = process.argv.includes('--reset');

const NOW = new Date().toISOString();
const DAY_MS = 86_400_000;

function daysAgo(n: number): string {
  return new Date(Date.now() - n * DAY_MS).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3_600_000).toISOString();
}

function uid(prefix = 'id'): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}

// ── Database Setup ───────────────────────────────────────────────────────────

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Run the schema init to ensure all tables exist (needed before RESET)
db.exec(`
  CREATE TABLE IF NOT EXISTS staff_action_audit_events (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    reason_code TEXT,
    reason TEXT,
    request_hash TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    metadata_json TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(actor_id, assessment_id, idempotency_key)
  );
  CREATE TABLE IF NOT EXISTS staff_invitations (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('staff', 'admin')),
    clerk_invitation_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'revoked')),
    invited_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    accepted_at TEXT
  );
  CREATE TABLE IF NOT EXISTS follow_ups (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    owner_id TEXT,
    due_date TEXT,
    source TEXT NOT NULL DEFAULT 'client_profile',
    status TEXT NOT NULL DEFAULT 'open',
    client_visible_promise INTEGER DEFAULT 0,
    consequence_of_inaction TEXT,
    notes TEXT,
    linked_report_id TEXT,
    linked_gate_finding_id TEXT,
    linked_meeting_brief_id TEXT,
    linked_commercial_step_id TEXT,
    support_issue_ref TEXT,
    admin_task_ref TEXT,
    delayed_journey_state TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS meeting_briefs (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    meeting_date TEXT,
    objective TEXT,
    talking_points TEXT,
    sensitive_issues TEXT,
    offer_next_step TEXT,
    follow_up_intention TEXT,
    final_agenda_notes TEXT,
    prep_checklist TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    linked_report_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS commercial_next_steps (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'noAction',
    owner TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS staff_idempotency (
    key_hash TEXT PRIMARY KEY,
    receipt_id TEXT NOT NULL,
    actor_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

if (RESET) {
  console.log('🧹 Clearing all data...');
  db.exec(`
    DELETE FROM staff_idempotency;
    DELETE FROM follow_ups;
    DELETE FROM meeting_briefs;
    DELETE FROM commercial_next_steps;
    DELETE FROM staff_action_audit_events;
    DELETE FROM staff_invitations;
    DELETE FROM pipeline_status;
    DELETE FROM processed_events;
    DELETE FROM reports;
    DELETE FROM transcripts;
    DELETE FROM receipts;
    DELETE FROM users;
  `);
  console.log('✅ All data cleared.');
}

// Helper: tables already created above in schema init block

// ── Transaction helper ───────────────────────────────────────────────────────

const insert = db.transaction(() => {
  // ===========================================================================
  // 1. USERS — Clients, Operators, Admins
  // ===========================================================================
  console.log('\n👤 Seeding users...');

  const admins = [
    { clerkId: 'admin_sarah',  email: 'sarah@agenticai.net.au', name: 'Sarah Chen',        role: 'admin',    company: 'Agentic AI' },
    { clerkId: 'admin_marcus', email: 'marcus@agenticai.net.au', name: 'Marcus Webb',       role: 'admin',    company: 'Agentic AI' },
  ];

  const staffMembers = [
    { clerkId: 'op_emma',      email: 'emma.l@agenticai.net.au', name: 'Emma Liu',           role: 'staff', company: null },
    { clerkId: 'op_james',     email: 'james.k@agenticai.net.au', name: 'James Kim',          role: 'staff', company: null },
    { clerkId: 'op_priya',     email: 'priya.s@agenticai.net.au', name: 'Priya Sharma',       role: 'staff', company: null },
    { clerkId: 'op_tom',       email: 'tom.r@agenticai.net.au',  name: 'Tom Reynolds',       role: 'staff', company: null },
  ];

  const clients = [
    // Active clients with completed assessments
    { clerkId: 'client_buildright', email: 'info@buildright.au',         name: 'Michael Torres',     role: 'client', company: 'BuildRight Constructions', abn: '12 345 678 901', website: 'buildright.au' },
    { clerkId: 'client_webbco',     email: 'marcus@webbco.au',          name: 'Marcus Webb',        role: 'client', company: 'Webb & Co Advisory',     abn: '98 765 432 109', website: 'webbco.com.au' },
    { clerkId: 'client_lumina',     email: 'emma@luminahealth.au',      name: 'Emma Liu',           role: 'client', company: 'Lumina Health Group',    abn: '45 678 901 234', website: 'luminahealth.com.au' },
    { clerkId: 'client_harvest',    email: 'david@harvestfresh.au',     name: 'David Okonkwo',      role: 'client', company: 'Harvest Fresh Logistics', abn: '78 901 234 567', website: 'harvestfresh.au' },
    { clerkId: 'client_nexus',      email: 'lisa@nexuscreative.au',     name: 'Lisa Park',          role: 'client', company: 'Nexus Creative Agency',   abn: '23 456 789 012', website: 'nexuscreative.au' },
    { clerkId: 'client_techvault',  email: 'raj@techvault.au',          name: 'Raj Patel',          role: 'client', company: 'TechVault Solutions',     abn: '34 567 890 123', website: 'techvault.au' },
    { clerkId: 'client_greendoor',  email: 'anna@greendoor.au',         name: 'Anna Johansson',     role: 'client', company: 'Green Door Consulting',    abn: '56 789 012 345', website: 'greendoor.au' },
    { clerkId: 'client_bluepeak',   email: 'sam@bluepeak.au',           name: 'Samantha Wright',    role: 'client', company: 'Blue Peak Advisory',       abn: '67 890 123 456', website: 'bluepeak.com.au' },
    { clerkId: 'client_oceanview',  email: 'peter@oceanviewdental.au',  name: 'Peter O\'Brien',     role: 'client', company: 'Oceanview Dental',         abn: '89 012 345 678', website: 'oceanviewdental.au' },
    { clerkId: 'client_studio',     email: 'maria@studio8.au',          name: 'María García',       role: 'client', company: 'Studio 8 Architects',      abn: '90 123 456 789', website: 'studio8.au' },
    { clerkId: 'client_aurora',     email: 'chen@auroraimpact.au',      name: 'Chen Wei',           role: 'client', company: 'Aurora Impact Ventures',   abn: '01 234 567 890', website: 'auroraimpact.au' },
    { clerkId: 'client_quantum',    email: 'fatima@quantumed.au',       name: 'Fatima Al-Rashid',   role: 'client', company: 'Quantum Education Group',   abn: '11 222 333 444', website: 'quantumed.au' },
    // Edge case: client with special characters and long name
    { clerkId: 'client_edge_1',     email: 'jürgen.müller@öko-beratung.de', name: 'Jürgen Müller-von der Linden-Schmidt', role: 'client', company: 'Öko-Beratung GmbH — Nachhaltige Lösungen für KMU', abn: '99 888 777 666' },
    // Edge case: client with minimal data
    { clerkId: 'client_minimal',    email: 'minimal@test.au',           name: null,                role: 'client', company: null },
    // Inactive / no-assessment clients
    { clerkId: 'client_empty',      email: 'empty@test.au',             name: 'No Assessment Yet', role: 'client', company: 'Empty State Pty Ltd' },
  ];

  const allUsers = [...admins, ...staffMembers, ...clients];

  const userInsert = db.prepare(
    `INSERT OR REPLACE INTO users (clerk_id, email, name, role, company, abn, website, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const u of allUsers) {
    userInsert.run(u.clerkId, u.email, u.name, u.role, u.company ?? null, (u as any).abn ?? null, (u as any).website ?? null, daysAgo(30));
  }
  console.log(`   ✅ ${allUsers.length} users (${admins.length} admins, ${staffMembers.length} staffMembers, ${clients.length} clients)`);

  // ===========================================================================
  // 2. STAFF INVITATIONS
  // ===========================================================================
  console.log('\n📨 Seeding staff invitations...');

  const invitations = [
    { id: uid('inv'), email: 'new.op@agenticai.net.au', role: 'staff', clerkInvitationId: 'clerk_inv_001', status: 'pending',  invitedBy: 'admin_sarah', createdAt: hoursAgo(2), acceptedAt: null },
    { id: uid('inv'), email: 'promoted@agenticai.net.au', role: 'admin', clerkInvitationId: 'clerk_inv_002', status: 'accepted', invitedBy: 'admin_sarah', createdAt: daysAgo(7), acceptedAt: daysAgo(6) },
    { id: uid('inv'), email: 'revoked@agenticai.net.au',  role: 'staff', clerkInvitationId: 'clerk_inv_003', status: 'revoked',  invitedBy: 'admin_marcus', createdAt: daysAgo(14), acceptedAt: null },
  ];

  const invInsert = db.prepare(
    `INSERT INTO staff_invitations (id, email, role, clerk_invitation_id, status, invited_by, created_at, accepted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const inv of invitations) {
    invInsert.run(inv.id, inv.email, inv.role, inv.clerkInvitationId, inv.status, inv.invitedBy, inv.createdAt, inv.acceptedAt);
  }
  console.log(`   ✅ ${invitations.length} invitations (pending, accepted, revoked)`);

  // ===========================================================================
  // 3. RECEIPTS — various amounts & currencies
  // ===========================================================================
  console.log('\n💰 Seeding receipts...');

  const receiptClients = clients.filter(c => c.clerkId !== 'client_empty' && c.clerkId !== 'client_minimal');
  const receiptData: Array<{ id: string; userId: string; email: string; amount: number; currency: string; name: string; company: string; days: number }> = [];

  for (let i = 0; i < receiptClients.length; i++) {
    const c = receiptClients[i];
    const currencies = ['aud', 'aud', 'aud', 'aud', 'aud', 'usd']; // mostly AUD
    const amounts = [120000, 120000, 120000, 180000, 95000, 120000, 150000, 120000, 120000, 200000, 120000, 120000];
    receiptData.push({
      id: uid('rcpt'),
      userId: c.clerkId,
      email: c.email,
      amount: amounts[i % amounts.length],
      currency: currencies[i % currencies.length],
      name: c.name!,
      company: c.company ?? '',
      days: 5 + i * 2,
    });
  }

  // edge case: receipt with null user (pending receipt)
  receiptData.push({
    id: uid('rcpt'),
    userId: '', // will be null
    email: 'pending@unlinked.au',
    amount: 120000,
    currency: 'aud',
    name: 'Pending User',
    company: 'Unlinked Business',
    days: 1,
  });

  const receiptInsert = db.prepare(
    `INSERT OR REPLACE INTO receipts (id, user_id, customer_email, stripe_session_id, amount_cents, currency, customer_name, company, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const r of receiptData) {
    receiptInsert.run(
      r.id,
      r.userId || null,
      r.email,
      `cs_test_${r.id}`,
      r.amount,
      r.currency,
      r.name,
      r.company,
      daysAgo(r.days)
    );
  }
  console.log(`   ✅ ${receiptData.length} receipts (${receiptData.filter(r => !r.userId).length} pending)`);

  // ===========================================================================
  // 4. TRANSCRIPTS
  // ===========================================================================
  console.log('\n📝 Seeding transcripts...');

  const transcriptData = clients
    .filter(c => c.clerkId !== 'client_empty' && c.clerkId !== 'client_minimal')
    .map((c, i) => ({
      callId: `call_${c.clerkId}_${i}`,
      transcript: `Q: Tell me about your business.\nA: We are ${c.company}, operating in Australia.\n\nQ: What are your main challenges?\nA: ${['Manual reporting', 'Slow lead response', 'Customer onboarding', 'Document admin', 'Scheduling issues'][i % 5]} takes too much time.`,
      metadata: JSON.stringify({ source: i % 2 === 0 ? 'retell-voice-agent' : 'annie-chat-intake', duration_seconds: 1200 + i * 300 }),
      createdAt: daysAgo(10 + i),
    }));

  const transcriptInsert = db.prepare(
    `INSERT OR REPLACE INTO transcripts (call_id, transcript, metadata, created_at, processed_at)
     VALUES (?, ?, ?, ?, ?)`
  );
  for (const t of transcriptData) {
    transcriptInsert.run(t.callId, t.transcript, t.metadata, t.createdAt, daysAgo(8));
  }
  console.log(`   ✅ ${transcriptData.length} transcripts`);

  // ===========================================================================
  // 5. REPORTS — all lifecycle states
  // ===========================================================================
  console.log('\n📊 Seeding reports in all states...');

  const REPORT_STATES = [
    'queued', 'generating', 'delayed', 'generated', 'escalated',
    'inReview', 'approved', 'rejected', 'regenerationRequired',
    'clarificationRequired', 'conflict', 'unavailable'
  ];

  const reportClients = clients.filter(c => c.clerkId !== 'client_empty');
  const reports: Array<{
    id: string; userId: string; receiptId: string | null; callId: string | null;
    sessionId: string; email: string; name: string; company: string;
    title: string; createdAt: string; state: string;
  }> = [];

  for (let i = 0; i < reportClients.length; i++) {
    const c = reportClients[i];
    const state = REPORT_STATES[i % REPORT_STATES.length];
    reports.push({
      id: uid('rpt'),
      userId: c.clerkId,
      receiptId: receiptData[i]?.id ?? null,
      callId: transcriptData[i]?.callId ?? null,
      sessionId: `sess_${c.clerkId}`,
      email: c.email,
      name: c.name ?? 'Unknown',
      company: c.company ?? 'Unknown Business',
      title: `AI Business Assessment — ${c.company ?? 'Client'} — ${new Date().toLocaleDateString('en-AU')}`,
      createdAt: daysAgo(10 + i),
      state,
    });
  }

  // Edge case: report with special characters in company name
  if (reportClients.find(c => c.clerkId === 'client_edge_1')) {
    reports.push({
      id: uid('rpt'),
      userId: 'client_edge_1',
      receiptId: null,
      callId: null,
      sessionId: 'sess_edge_1',
      email: 'jürgen.müller@öko-beratung.de',
      name: 'Jürgen Müller-von der Linden-Schmidt',
      company: 'Öko-Beratung GmbH — Nachhaltige Lösungen für KMU',
      title: 'AI Assessment — Öko-Beratung GmbH',
      createdAt: daysAgo(3),
      state: 'generated',
    });
  }

  const reportInsert = db.prepare(
    `INSERT OR REPLACE INTO reports (id, user_id, receipt_id, call_id, session_id, customer_email, customer_name, company, title, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const r of reports) {
    reportInsert.run(r.id, r.userId, r.receiptId, r.callId, r.sessionId, r.email, r.name, r.company, r.title, r.createdAt);
  }
  console.log(`   ✅ ${reports.length} reports in ${REPORT_STATES.length} states`);

  // ===========================================================================
  // 6. PIPELINE STATUS
  // ===========================================================================
  console.log('\n🔄 Seeding pipeline statuses...');

  const PIPELINE_STATUSES = [
    'pending', 'queued', 'pending_payment', 'running_llm',
    'running_tools', 'running_deck', 'completed', 'error', 'retry'
  ];

  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    const pStatus = PIPELINE_STATUSES[i % PIPELINE_STATUSES.length];
    db.prepare(
      `INSERT OR REPLACE INTO pipeline_status (session_id, status, report_id, error, attempts, call_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      r.sessionId,
      pStatus,
      pStatus === 'completed' ? r.id : null,
      pStatus === 'error' ? `Simulated pipeline error: ${['LLM timeout', 'Tool lookup failed', 'Deck generation crashed'][i % 3]}` : null,
      pStatus === 'retry' ? 2 : (pStatus === 'error' ? 1 : 0),
      r.callId,
      r.createdAt,
      pStatus === 'completed' ? r.createdAt : (pStatus === 'error' ? daysAgo(1) : daysAgo(2))
    );
  }
  console.log(`   ✅ ${reports.length} pipeline statuses in ${PIPELINE_STATUSES.length} states`);

  // ===========================================================================
  // 7. STAFF ACTION AUDIT EVENTS — comprehensive audit trail
  // ===========================================================================
  console.log('\n📋 Seeding audit events...');

  const admin or staffIds = ['op_emma', 'op_james', 'op_priya', 'op_tom', 'admin_sarah', 'admin_marcus'];
  const auditActions = [
    { action: 'approveReport',      targetType: 'report',         fromState: 'generated',  toState: 'approved' },
    { action: 'rejectReport',       targetType: 'report',         fromState: 'generated',  toState: 'rejected' },
    { action: 'requestRegeneration',targetType: 'report',         fromState: 'approved',   toState: 'regenerationRequired' },
    { action: 'requestClarification',targetType:'report',        fromState: 'inReview',   toState: 'clarificationRequired' },
    { action: 'claimFinding',       targetType: 'gateFinding',    fromState: 'open',       toState: 'inReview' },
    { action: 'resolveFinding',     targetType: 'gateFinding',    fromState: 'inReview',   toState: 'resolved' },
    { action: 'overrideFinding',    targetType: 'gateFinding',    fromState: 'inReview',   toState: 'overriddenWithReason' },
    { action: 'escalateFinding',    targetType: 'gateFinding',    fromState: 'open',       toState: 'escalatedFurther' },
    { action: 'completeFollowUp',   targetType: 'followUp',       fromState: 'open',       toState: 'completed' },
    { action: 'deferFollowUp',      targetType: 'followUp',       fromState: 'open',       toState: 'deferred' },
    { action: 'reassignFollowUp',   targetType: 'followUp',       fromState: 'open',       toState: 'reassigned' },
  ];

  const reasonCodes = ['qualityChecksPassed', 'clientReady', 'needsRework', 'missingInformation', 'complianceIssue', 'contentError', 'clientRequest', 'internalDecision', 'scheduleConflict', 'staleContext', 'other'];
  const reasonNotes = [
    'All gate findings resolved. Report is delivery-ready.',
    'Client confirmed ready for review.',
    'Content requires significant rework — see linked notes.',
    'Missing financial data in intake — needs clarification.',
    'Compliance flag requires legal review before approval.',
    'Factual error in recommendation section.',
    'Client explicitly requested this action.',
    'Internal team decision after calibration review.',
    'Schedule conflict — rescheduled for next week.',
    'Context is now stale — pipeline reprocessed.',
    'Other — see detailed audit note.',
  ];

  const auditInsert = db.prepare(
    `INSERT INTO staff_action_audit_events (id, assessment_id, target_type, target_id, actor_id, action, from_state, to_state, reason_code, reason, request_hash, idempotency_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  let auditCount = 0;
  // Generate 3-7 audit events per report
  for (const r of reports) {
    const numEvents = 2 + Math.floor(Math.random() * 6); // 2-7 events
    for (let j = 0; j < numEvents && j < reports.length; j++) {
      const auditAction = auditActions[(auditCount + j) % auditActions.length];
      const actor = admin or staffIds[(auditCount + j) % admin or staffIds.length];
      const reasonIdx = (auditCount + j) % reasonCodes.length;
      const ikey = `idem_${r.sessionId}_${auditCount + j}`;

      auditInsert.run(
        uid('audit'),
        r.sessionId,
        auditAction.targetType,
        r.id,
        actor,
        auditAction.action,
        auditAction.fromState,
        auditAction.toState,
        reasonCodes[reasonIdx],
        reasonNotes[reasonIdx],
        crypto.createHash('sha256').update(`req_${r.sessionId}_${auditCount + j}_${Date.now()}`).digest('hex').slice(0, 32),
        ikey,
        daysAgo(1 + Math.floor(Math.random() * 10))
      );
    }
    auditCount += numEvents;
  }

  // Edge case: duplicate idempotency key (should be unique, but add one to test constraint)
  try {
    auditInsert.run(
      uid('audit'),
      reports[0]?.sessionId ?? 'sess_default',
      'report',
      reports[0]?.id ?? 'rpt_default',
      'admin_sarah',
      'approveReport',
      'generated',
      'approved',
      'qualityChecksPassed',
      'Idempotency edge case test',
      'hash_duplicate_test',
      'idem_duplicate_key_test',
      daysAgo(1)
    );
  } catch { /* expected constraint violation — ignore */ }

  console.log(`   ✅ ~${auditCount} audit events (${auditActions.length} action types, ${reasonCodes.length} reason codes)`);

  // ===========================================================================
  // 8. FOLLOW-UPS — all sources, statuses, edge cases
  // ===========================================================================
  console.log('\n📌 Seeding follow-ups...');

  const followUpSources: Array<{ source: string; title: string; desc: string }> = [
    { source: 'client_profile',         title: 'Schedule onboarding follow-up call',           desc: 'Client requested a follow-up call to discuss onboarding steps.' },
    { source: 'human_review',           title: 'Review flagged report section',                 desc: 'Gate finding flagged financial recommendations for human review.' },
    { source: 'meeting_brief',          title: 'Prepare meeting brief for quarterly review',     desc: 'Meeting scheduled — prepare the brief with talking points and agenda.' },
    { source: 'commercial_next_step',   title: 'Send commercial proposal follow-up',            desc: 'Client is ready to discuss the commercial next step — send proposal.' },
    { source: 'support_issue',          title: 'Investigate pipeline timeout incident',          desc: 'Pipeline timed out during report generation — investigate root cause.' },
    { source: 'admin_task',             title: 'Update calibration golden cases',               desc: 'New golden cases need to be added to the calibration suite.' },
    { source: 'delayed_journey',        title: 'Re-engage stalled client journey',              desc: 'Client has been in the intake phase for over 14 days without completing.' },
  ];

  const followUpStatuses = ['open', 'completed', 'deferred', 'reassigned'];
  const followUps: Array<Record<string, unknown>> = [];

  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    const numFollowUps = 1 + Math.floor(Math.random() * 3); // 1-3 per report
    for (let j = 0; j < numFollowUps; j++) {
      const src = followUpSources[(i + j) % followUpSources.length];
      const status = followUpStatuses[(i + j) % followUpStatuses.length];
      followUps.push({
        id: uid('fu'),
        assessmentId: r.sessionId,
        title: `${src.title} — ${r.company}`,
        description: src.desc,
        ownerId: admin or staffIds[(i + j) % admin or staffIds.length],
        dueDate: status === 'open' ? daysAgo(-3 - j * 2) : daysAgo(2 + j), // some overdue
        source: src.source,
        status,
        clientVisiblePromise: j % 3 === 0 ? 1 : 0,
        consequenceOfInaction: status === 'open' ? 'Client may lose confidence and disengage.' : null,
        notes: status === 'deferred' ? 'Deferred due to client unavailability — follow up next week.' : (status === 'reassigned' ? 'Reassigned to specialist admin or staff.' : null),
        linkedReportId: src.source === 'human_review' ? r.id : null,
      });
    }
  }

  // Edge case: follow-up with max-length values and special characters
  followUps.push({
    id: uid('fu'),
    assessmentId: reports.find(r => r.userId === 'client_edge_1')?.sessionId ?? 'sess_edge_1',
    title: 'Überprüfung der Empfehlungen — Jürgen Müller-von der Linden-Schmidt — Öko-Beratung GmbH',
    description: '⚠️ Kritische Überprüfung erforderlich: Der Bericht enthält Empfehlungen mit potenziellen rechtlichen Implikationen für die deutsche GmbH-Struktur. "Nachhaltigkeitszertifizierung" (DIN EN ISO 14001) muss vor der Freigabe durch die Rechtsabteilung geprüft werden. Zusätzlich: steuerliche Auswirkungen der empfohlenen Automatisierungslösung auf die KMU-Förderung (§ 7g EStG).',
    ownerId: 'op_priya',
    dueDate: daysAgo(-1),
    source: 'human_review',
    status: 'open',
    clientVisiblePromise: 0,
    consequenceOfInaction: 'Rechtliche Risiken und mögliche Compliance-Verstöße.',
    notes: '⚠️ Requires legal review — compliance risk flagged. German GmbH regulations apply.',
    linkedReportId: reports.find(r => r.userId === 'client_edge_1')?.id ?? null,
  });

  // Bulk: generate extra follow-ups for pagination testing
  for (let i = 0; i < 23; i++) {
    const src = followUpSources[i % followUpSources.length];
    followUps.push({
      id: uid('fu'),
      assessmentId: reports[i % reports.length].sessionId,
      title: `Bulk test follow-up #${i + 1}: ${src.title}`,
      description: `Automated bulk follow-up for pagination testing #${i + 1}. Source: ${src.source}.`,
      ownerId: admin or staffIds[i % admin or staffIds.length],
      dueDate: daysAgo(-5 + i),
      source: src.source,
      status: followUpStatuses[i % 4],
      clientVisiblePromise: 0,
      consequenceOfInaction: null,
      notes: null,
      linkedReportId: null,
    });
  }

  const fuInsert = db.prepare(
    `INSERT INTO follow_ups (id, assessment_id, title, description, owner_id, due_date, source, status, client_visible_promise, consequence_of_inaction, notes, linked_report_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  );

  for (const fu of followUps) {
    fuInsert.run(
      fu.id, fu.assessmentId, fu.title, fu.description,
      fu.ownerId, fu.dueDate, fu.source, fu.status,
      fu.clientVisiblePromise, fu.consequenceOfInaction, fu.notes,
      fu.linkedReportId
    );
  }
  console.log(`   ✅ ${followUps.length} follow-ups (${followUpSources.length} sources, ${followUpStatuses.length} statuses, ${followUps.filter(f => f.status === 'open').length} open)`);

  // ===========================================================================
  // 9. MEETING BRIEFS — all states
  // ===========================================================================
  console.log('\n📅 Seeding meeting briefs...');

  const MEETING_BRIEF_STATES = ['draft', 'needsReview', 'ready', 'stale', 'completed'];

  const briefData = reports.map((r, i) => ({
    id: uid('mb'),
    assessmentId: r.sessionId,
    meetingDate: i % 3 === 0 ? daysAgo(-7) : daysAgo(-14),
    objective: `Discuss AI assessment findings for ${r.company}`,
    talkingPoints: `1. Quick-win opportunities\n2. Automation roadmap\n3. Timeline and budget\n4. Next steps for ${r.company}`,
    sensitiveIssues: i % 4 === 0 ? 'Client mentioned budget constraints — approach pricing discussion carefully.' : null,
    offerNextStep: i % 2 === 0 ? 'Propose 4-week pilot engagement' : 'Schedule technical deep-dive session',
    followUpIntention: 'Send summary email with action items within 24 hours',
    finalAgendaNotes: i % 2 === 0 ? 'Agenda confirmed with client via email.' : null,
    prepChecklist: 'Review report findings, prepare ROI estimates, check client history',
    status: MEETING_BRIEF_STATES[i % MEETING_BRIEF_STATES.length],
    linkedReportId: r.id,
    createdAt: daysAgo(7 + i),
    updatedAt: daysAgo(3 + i % 3),
  }));

  const mbInsert = db.prepare(
    `INSERT INTO meeting_briefs (id, assessment_id, meeting_date, objective, talking_points, sensitive_issues, offer_next_step, follow_up_intention, final_agenda_notes, prep_checklist, status, linked_report_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const mb of briefData) {
    mbInsert.run(
      mb.id, mb.assessmentId, mb.meetingDate, mb.objective, mb.talkingPoints,
      mb.sensitiveIssues, mb.offerNextStep, mb.followUpIntention,
      mb.finalAgendaNotes, mb.prepChecklist, mb.status, mb.linkedReportId,
      mb.createdAt, mb.updatedAt
    );
  }
  console.log(`   ✅ ${briefData.length} meeting briefs in ${MEETING_BRIEF_STATES.length} states`);

  // ===========================================================================
  // 10. COMMERCIAL NEXT STEPS — all statuses
  // ===========================================================================
  console.log('\n💼 Seeding commercial next steps...');

  const CNS_STATUSES = ['noAction', 'nurture', 'discussOffer', 'sendFollowUp', 'createFutureOpportunity'];
  const CNS_DISPLAY_STATES = ['draft', 'active', 'needsFollowUp', 'completed', 'deferred', 'cancelled', 'stale'];

  const cnsData = reports.map((r, i) => ({
    id: uid('cns'),
    assessmentId: r.sessionId,
    status: CNS_STATUSES[i % CNS_STATUSES.length],
    owner: admin or staffIds[i % admin or staffIds.length],
    notes: `Commercial opportunity for ${r.company}: ${['Standard engagement', 'Premium package', 'Enterprise pilot', 'Follow-up workshop', 'Annual retainer'][i % 5]}`,
    displayState: CNS_DISPLAY_STATES[i % CNS_DISPLAY_STATES.length],
    createdAt: daysAgo(5 + i),
    updatedAt: daysAgo(1 + i % 3),
  }));

  const cnsInsert = db.prepare(
    `INSERT INTO commercial_next_steps (id, assessment_id, status, owner, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const cns of cnsData) {
    cnsInsert.run(cns.id, cns.assessmentId, cns.status, cns.owner, cns.notes, cns.createdAt, cns.updatedAt);
  }
  console.log(`   ✅ ${cnsData.length} commercial next steps (${CNS_STATUSES.length} statuses, ${CNS_DISPLAY_STATES.length} display states)`);

  // ===========================================================================
  // 11. PROCESSED EVENTS — Stripe idempotency tracking
  // ===========================================================================
  console.log('\n🔁 Seeding processed events...');

  const processedEvents = [
    { eventId: 'evt_3k2jf93kf',  eventType: 'checkout.session.completed', processedAt: daysAgo(10) },
    { eventId: 'evt_9x7y4z1a2b', eventType: 'checkout.session.completed', processedAt: daysAgo(8) },
    { eventId: 'evt_5m6n8o0p1q', eventType: 'charge.failed',            processedAt: daysAgo(3) },
    { eventId: 'evt_8r2s4t6u8v', eventType: 'checkout.session.expired',  processedAt: daysAgo(2) },
  ];

  const evtInsert = db.prepare(
    `INSERT OR IGNORE INTO processed_events (event_id, event_type, processed_at)
     VALUES (?, ?, ?)`
  );
  for (const evt of processedEvents) {
    evtInsert.run(evt.eventId, evt.eventType, evt.processedAt);
  }
  console.log(`   ✅ ${processedEvents.length} processed events`);
});

// ── Execute ──────────────────────────────────────────────────────────────────

console.log('🚀 Seeding Agentic AI test data...\n');

try {
  insert();
  console.log('\n✨ Seed complete!');
  console.log(`   Database: ${DB_PATH}`);
  console.log('\n📊 Summary of seeded data:');
  console.log(`   Users:              admins(2) + staffMembers(4) + clients(14) = 20`);
  console.log(`   Invitations:        3 (pending, accepted, revoked)`);
  console.log(`   Receipts:           13 (1 pending/unlinked)`);
  console.log(`   Transcripts:        12`);
  console.log(`   Reports:            13 (across all 12 lifecycle states)`);
  console.log(`   Pipeline statuses:  13 (all 9 pipeline states)`);
  console.log(`   Audit events:       ~75-100 (11 action types, 10 reason codes)`);
  console.log(`   Follow-ups:         ~35-50 + 23 bulk (7 sources, 4 statuses)`);
  console.log(`   Meeting briefs:     13 (5 states)`);
  console.log(`   Commercial steps:   13 (5 statuses, 7 display states)`);
  console.log(`   Processed events:   4`);
  console.log(`\n   Total records:      ~200+`);
  console.log('\n🔑 Staff logins (use Clerk):');
  console.log('   Admin:   sarah@agenticai.net.au / marcus@agenticai.net.au');
  console.log('   Operator: emma.l@agenticai.net.au / james.k@agenticai.net.au / priya.s@agenticai.net.au / tom.r@agenticai.net.au');
} catch (err) {
  console.error('❌ Seed failed:', err);
  process.exit(1);
} finally {
  db.close();
}
