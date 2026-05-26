import { getDb, withDb, type DbReport, type DbReceipt, type DbUser } from './db';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { env } from '$env/dynamic/private';

/** Directory where assessment reports are stored on the filesystem. */
const REPORTS_DIR = env.REPORTS_DIR || './app_data/reports';

// ---------------------------------------------------------------------------
// User operations
// ---------------------------------------------------------------------------

export async function upsertUser(clerkId: string, email: string, name?: string, phone?: string, role?: string): Promise<DbUser | null> {
  const roleWasProvided = role != null;

  return withDb('upsertUser', null, async db => {
    return db.queryOne<DbUser>(`
      INSERT INTO users (clerk_id, email, name, phone, role)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(clerk_id) DO UPDATE SET
        email = excluded.email,
        name = COALESCE(excluded.name, users.name),
        phone = COALESCE(excluded.phone, users.phone),
        role = CASE WHEN ? THEN excluded.role ELSE users.role END
      RETURNING *
    `, clerkId, email, name || null, phone || null, role || 'client', roleWasProvided ? 1 : 0);
  });
}

export async function getUser(clerkId: string): Promise<DbUser | null> {
  return withDb('getUser', null, async db => {
    return db.queryOne<DbUser>('SELECT * FROM users WHERE clerk_id = ?', clerkId);
  });
}

export async function findOrCreateUserFromStripe(email: string, _name?: string, _phone?: string): Promise<DbUser | null> {
  if (!email) return null;
  return withDb('findOrCreateUserFromStripe', null, async db => {
    return db.queryOne<DbUser>('SELECT * FROM users WHERE email = ?', email);
  });
}

// ---------------------------------------------------------------------------
// Report linking
// ---------------------------------------------------------------------------

export async function linkReportToUser(
  userId: string,
  reportId: string,
  sessionId?: string,
  title?: string,
  company?: string,
  metadata?: {
    callId?: string;
    customerEmail?: string;
    customerName?: string;
    deckUrl?: string;
    r2Key?: string;
  }
): Promise<DbReport | null> {
  return withDb('linkReportToUser', null, async () => upsertReportRecord({
    reportId,
    userId,
    sessionId,
    title,
    company,
    metadata
  }));
}

export async function upsertReportMetadata(
  reportId: string,
  sessionId?: string,
  title?: string,
  company?: string,
  metadata?: {
    callId?: string;
    customerEmail?: string;
    customerName?: string;
    deckUrl?: string;
    r2Key?: string;
  }
): Promise<DbReport | null> {
  return withDb('upsertReportMetadata', null, async () => upsertReportRecord({ reportId, sessionId, title, company, metadata }));
}

async function upsertReportRecord(opts: {
  reportId: string;
  userId?: string;
  sessionId?: string;
  title?: string;
  company?: string;
  metadata?: {
    callId?: string;
    customerEmail?: string;
    customerName?: string;
    deckUrl?: string;
    r2Key?: string;
  };
}): Promise<DbReport | null> {
  const db = getDb();
  const callId = await getLinkableReportCallId(opts.reportId, opts.metadata?.callId);
  const row = await db.queryOne<DbReport>(`
    INSERT INTO reports (id, user_id, call_id, session_id, customer_email, customer_name, company, r2_key, deck_url, title)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      user_id = COALESCE(excluded.user_id, reports.user_id),
      call_id = COALESCE(excluded.call_id, reports.call_id),
      session_id = COALESCE(excluded.session_id, reports.session_id),
      customer_email = COALESCE(excluded.customer_email, reports.customer_email),
      customer_name = COALESCE(excluded.customer_name, reports.customer_name),
      company = COALESCE(excluded.company, reports.company),
      r2_key = COALESCE(excluded.r2_key, reports.r2_key),
      deck_url = COALESCE(excluded.deck_url, reports.deck_url),
      title = COALESCE(excluded.title, reports.title)
    RETURNING *
  `, opts.reportId, opts.userId || null, callId, opts.sessionId || null, opts.metadata?.customerEmail || null,
    opts.metadata?.customerName || null, opts.company || null, opts.metadata?.r2Key || null, opts.metadata?.deckUrl || null, opts.title || null);

  if (row?.session_id) {
    await linkReportToReceiptBySession(row.id, row.session_id);
    await linkReportToPipelineBySession(row.id, row.session_id);
  }

  return row;
}

async function getLinkableReportCallId(reportId: string, callId?: string): Promise<string | null> {
  if (!callId) return null;
  const db = getDb();
  const transcript = await db.queryOne<{ call_id: string }>('SELECT call_id FROM transcripts WHERE call_id = ?', callId);
  if (!transcript) return null;

  const existing = await db.queryOne<{ id: string }>('SELECT id FROM reports WHERE call_id = ? AND id <> ?', callId, reportId);
  return existing ? null : callId;
}

async function linkReportToPipelineBySession(reportId: string, sessionId: string): Promise<void> {
  const db = getDb();
  await db.exec(`
    UPDATE pipeline_status
    SET report_id = ?
    WHERE session_id = ?
      AND report_id IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM pipeline_status linked
        WHERE linked.report_id = ?
      )
  `, reportId, sessionId, reportId);
}

async function linkReportToReceiptBySession(reportId: string, sessionId: string): Promise<void> {
  const db = getDb();
  await db.exec(`
    UPDATE reports
    SET receipt_id = (
      SELECT receipts.id
      FROM receipts
      WHERE receipts.stripe_session_id = ?
      LIMIT 1
    )
    WHERE id = ?
      AND receipt_id IS NULL
      AND EXISTS (
        SELECT 1
        FROM receipts
        WHERE receipts.stripe_session_id = ?
      )
      AND NOT EXISTS (
        SELECT 1
        FROM reports linked
        JOIN receipts ON receipts.id = linked.receipt_id
        WHERE receipts.stripe_session_id = ?
          AND linked.id <> reports.id
      )
  `, sessionId, reportId, sessionId, sessionId);
}

async function linkReceiptToReportBySession(receiptId: string, stripeSessionId: string): Promise<void> {
  const db = getDb();
  await db.exec(`
    UPDATE reports
    SET receipt_id = ?
    WHERE receipt_id IS NULL
      AND session_id = ?
      AND id = (
        SELECT r2.id
        FROM reports r2
        WHERE r2.session_id = ?
          AND r2.receipt_id IS NULL
        ORDER BY r2.created_at, r2.id
        LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1
        FROM reports linked
        WHERE linked.receipt_id = ?
      )
  `, receiptId, stripeSessionId, stripeSessionId, receiptId);
}

export async function getUserReports(userId: string): Promise<DbReport[]> {
  return withDb('getUserReports', [], async db => {
    return db.queryAll<DbReport>('SELECT * FROM reports WHERE user_id = ? ORDER BY created_at DESC', userId);
  });
}

export async function getUserReport(userId: string, reportId: string): Promise<DbReport | null> {
  return withDb('getUserReport', null, async db => {
    return db.queryOne<DbReport>('SELECT * FROM reports WHERE user_id = ? AND id = ?', userId, reportId);
  });
}

// ---------------------------------------------------------------------------
// Receipt operations
// ---------------------------------------------------------------------------

export async function saveReceipt(
  userId: string,
  stripeSessionId: string,
  amountCents: number,
  currency: string,
  customerEmail?: string,
  customerName?: string,
  company?: string,
  receiptUrl?: string
): Promise<DbReceipt | null> {
  return withDb('saveReceipt', null, async db => {
    const id = `receipt-${Date.now()}`;
    const row = await db.queryOne<DbReceipt>(`
      INSERT INTO receipts (id, user_id, stripe_session_id, amount_cents, currency, customer_email, customer_name, company, receipt_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stripe_session_id) DO UPDATE SET
        amount_cents = excluded.amount_cents,
        currency = excluded.currency,
        receipt_url = COALESCE(excluded.receipt_url, receipts.receipt_url)
      RETURNING *
    `, id, userId, stripeSessionId, amountCents, currency,
      customerEmail || null, customerName || null, company || null, receiptUrl || null);
    if (row?.id && row.stripe_session_id) {
      await linkReceiptToReportBySession(row.id, row.stripe_session_id);
    }
    return row;
  });
}

export async function savePendingReceipt(
  stripeSessionId: string,
  amountCents: number,
  currency: string,
  customerEmail?: string,
  customerName?: string,
  company?: string,
  receiptUrl?: string
): Promise<DbReceipt | null> {
  return withDb('savePendingReceipt', null, async db => {
    const id = `receipt-${Date.now()}`;
    const row = await db.queryOne<DbReceipt>(`
      INSERT INTO receipts (id, user_id, stripe_session_id, amount_cents, currency, customer_email, customer_name, company, receipt_url)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(stripe_session_id) DO UPDATE SET
        amount_cents = excluded.amount_cents,
        currency = excluded.currency,
        receipt_url = COALESCE(excluded.receipt_url, receipts.receipt_url)
      RETURNING *
    `, id, stripeSessionId, amountCents, currency,
      customerEmail || null, customerName || null, company || null, receiptUrl || null);
    if (row?.id && row.stripe_session_id) {
      await linkReceiptToReportBySession(row.id, row.stripe_session_id);
    }
    return row;
  });
}

export async function getUserReceipts(userId: string): Promise<DbReceipt[]> {
  return withDb('getUserReceipts', [], async db => {
    return db.queryAll<DbReceipt>('SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC', userId);
  });
}

export async function getUserReceipt(userId: string, receiptId: string): Promise<DbReceipt | null> {
  return withDb('getUserReceipt', null, async db => {
    return db.queryOne<DbReceipt>('SELECT * FROM receipts WHERE user_id = ? AND id = ?', userId, receiptId);
  });
}

// ---------------------------------------------------------------------------
// Auto-linking (orphan record resolution)
// ---------------------------------------------------------------------------

export async function scanAndLinkReportsByEmail(userId: string, email: string): Promise<number> {
  return withDb('scanAndLinkReportsByEmail', 0, async db => {
    try {
      const dir = path.resolve(REPORTS_DIR);
      if (!fs.existsSync(dir)) return 0;

      let linked = 0;

      for (const name of fs.readdirSync(dir)) {
        const subDir = path.join(dir, name);
        if (!fs.statSync(subDir).isDirectory()) continue;
        const metaPath = path.join(subDir, 'meta.json');
        if (!fs.existsSync(metaPath)) continue;

        try {
          const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
          const reportEmail = meta.job?.customerEmail;
          if (!reportEmail || reportEmail.toLowerCase() !== email.toLowerCase()) continue;

          const reportId = meta.id || name;
          const existing = await db.queryOne<{ 1: number }>('SELECT 1 FROM reports WHERE id = ? AND user_id = ?', reportId, userId);
          if (existing) continue;

          await linkReportToUser(
            userId,
            reportId,
            meta.job?.sessionId,
            `${meta.job?.company || meta.job?.customerName || 'Business'} — AI Assessment`,
            meta.job?.company,
            {
              callId: meta.job?.callId,
              customerEmail: meta.job?.customerEmail,
              customerName: meta.job?.customerName
            }
          );
          linked++;
        } catch {
          // Skip invalid meta files silently — don't break the scan.
        }
      }

      return linked;
    } catch (err) {
      console.warn('scanAndLinkReportsByEmail failed:', err);
      return 0;
    }
  });
}

export async function linkPendingReceiptsByEmail(userId: string, email: string): Promise<number> {
  return withDb('linkPendingReceiptsByEmail', 0, async db => {
    const result = await db.exec(`
      UPDATE receipts
      SET user_id = ?
      WHERE user_id IS NULL
        AND customer_email IS NOT NULL
        AND LOWER(customer_email) = LOWER(?)
    `, userId, email);
    return result.changes || 0;
  });
}

export async function linkOrphanedRecordsByEmail(userId: string, email: string): Promise<{ reports: number; receipts: number }> {
  return {
    reports: await scanAndLinkReportsByEmail(userId, email),
    receipts: await linkPendingReceiptsByEmail(userId, email)
  };
}