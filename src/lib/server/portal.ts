/**
 * Client Portal Business Logic
 *
 * Provides data-access functions for the client portal: user management,
 * report ownership, receipt storage, and filesystem scanning for auto-linking.
 *
 * All functions are synchronous because better-sqlite3 runs in the same thread.
 * Errors bubble up to the API route handlers where they are logged and
 * returned as appropriate HTTP responses.
 *
 * **Cloudflare Workers note:** `better-sqlite3` requires native C++ bindings
 * and does not run in Cloudflare Workers. When the database is unavailable,
 * all functions in this module return empty arrays / `null` so that the core
 * site (homepage, Stripe webhooks, report pipeline) continues to work.
 * The portal routes themselves will return `503` when the DB is down.
 *
 * @module portal
 * @example
 * import { upsertUser, linkReportToUser, getUserReports } from '$lib/server/portal';
 *
 * const user = upsertUser('user_123', 'alice@example.com', 'Alice');
 * if (user) {
 *   const report = linkReportToUser(user.clerk_id, 'report-456', deckUrl);
 *   const allReports = getUserReports(user.clerk_id);
 * }
 */

import { getDb, isDatabaseAvailable, type DbReport, type DbReceipt, type DbUser } from './db';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { env } from '$env/dynamic/private';

/** Directory where assessment reports are stored on the filesystem. */
const REPORTS_DIR = env.REPORTS_DIR || './app_data/reports';

// ---------------------------------------------------------------------------
// User operations
// ---------------------------------------------------------------------------

/**
 * Upsert a user from Clerk authentication data.
 *
 * Inserts a new row if the `clerk_id` does not exist, otherwise updates
 * `email`, `name`, and `phone` (non-destructive — existing values are kept
 * if the new ones are empty).
 *
 * @param clerkId - The Clerk user ID (e.g. `user_abc123`).
 * @param email - Email address from the Clerk session.
 * @param name - Optional display name.
 * @param phone - Optional phone number.
 * @returns The upserted {@link DbUser} row, or `null` if the database is unavailable.
 * @example
 * const user = upsertUser('user_123', 'alice@example.com', 'Alice Smith');
 */
export async function upsertUser(clerkId: string, email: string, name?: string, phone?: string, role?: string): Promise<DbUser | null> {
  if (!isDatabaseAvailable()) {
    console.warn('upsertUser skipped: database unavailable');
    return null;
  }
  const db = getDb();
  const row = await db.queryOne<DbUser>(`
    INSERT INTO users (clerk_id, email, name, phone, role)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(clerk_id) DO UPDATE SET
      email = excluded.email,
      name = COALESCE(excluded.name, users.name),
      phone = COALESCE(excluded.phone, users.phone),
      role = COALESCE(excluded.role, users.role)
    RETURNING *
  `, clerkId, email, name || null, phone || null, role || 'client');
  return row;
}

/**
 * Fetch a user by their Clerk ID.
 *
 * @param clerkId - The Clerk user ID.
 * @returns The {@link DbUser} record, or `null` if not found or DB unavailable.
 * @example
 * const user = getUser('user_abc123');
 * if (!user) throw error(404, 'User not found');
 */
export async function getUser(clerkId: string): Promise<DbUser | null> {
  if (!isDatabaseAvailable()) return null;
  const db = getDb();
  const row = await db.queryOne<DbUser>('SELECT * FROM users WHERE clerk_id = ?', clerkId);
  return row;
}

/**
 * Find an existing user by email, or return `null` if no Clerk sign-up has
 * happened yet. This is used during Stripe webhook processing to link receipts
 * to users who paid before creating a portal account.
 *
 * **Note:** This function *cannot* create a new user — a `clerk_id` is
 * required, and Stripe sessions do not provide one.
 *
 * @param email - Customer email from the Stripe session.
 * @param name - Optional customer name.
 * @param phone - Optional phone number.
 * @returns The matching {@link DbUser}, or `null` if the user hasn't signed up or DB is unavailable.
 * @example
 * const user = findOrCreateUserFromStripe('bob@example.com', 'Bob');
 * if (user) {
 *   saveReceipt(user.clerk_id, session.id, 120000, 'aud');
 * }
 */
export async function findOrCreateUserFromStripe(email: string, _name?: string, _phone?: string): Promise<DbUser | null> {
  if (!email || !isDatabaseAvailable()) return null;
  const db = getDb();
  const row = await db.queryOne<DbUser>('SELECT * FROM users WHERE email = ?', email);
  return row;
}

// ---------------------------------------------------------------------------
// Report linking
// ---------------------------------------------------------------------------

/**
 * Link a generated assessment report to a portal user.
 *
 * Creates a new `user_reports` row. Safe to call multiple times for the same
 * report — the unique constraint is on the local `id`, not `report_id`, so
 * duplicates are prevented at the application layer by checking
 * `getUserReport()` first.
 *
 * @param userId - The Clerk user ID.
 * @param reportId - The report ID (matches the filesystem directory name).
 * @param stripeSessionId - Optional Stripe Checkout session that paid for this report.
 * @param deckUrl - Optional URL to the generated report download (R2 public URL or portal path).
 * @param title - Optional human-readable title for the report list.
 * @param company - Optional company name from the assessment job.
 * @returns The inserted {@link DbReport} row, or `null` if DB is unavailable.
 * @example
 * const report = linkReportToUser(
 *   'user_abc123',
 *   'report-456',
 *   'cs_test_xxx',
 *   'https://presenton.ai/exports/...',
 *   'Acme — AI Assessment',
 *   'Acme Inc'
 * );
 */
export async function linkReportToUser(
  userId: string,
  reportId: string,
  stripeSessionId?: string,
  title?: string,
  company?: string
): Promise<DbReport | null> {
  if (!isDatabaseAvailable()) {
    console.warn('linkReportToUser skipped: database unavailable');
    return null;
  }
  const db = getDb();
  const id = `${Date.now()}-${reportId.slice(0, 8)}`;
  const row = await db.queryOne<DbReport>(`
    INSERT INTO user_reports (id, user_id, report_id, stripe_session_id, title, company)
    VALUES (?, ?, ?, ?, ?, ?)
    RETURNING *
  `, id, userId, reportId, stripeSessionId || null, title || null, company || null);
  return row;
}

/**
 * Fetch all reports belonging to a user, ordered newest first.
 *
 * @param userId - The Clerk user ID.
 * @returns An array of {@link DbReport} rows. Empty array if none or DB unavailable.
 * @example
 * const reports = getUserReports('user_abc123');
 * return json(reports);
 */
export async function getUserReports(userId: string): Promise<DbReport[]> {
  if (!isDatabaseAvailable()) return [];
  const db = getDb();
  const rows = await db.queryAll<DbReport>('SELECT * FROM user_reports WHERE user_id = ? ORDER BY created_at DESC', userId);
  return rows;
}

/**
 * Fetch a single report for a specific user.
 *
 * @param userId - The Clerk user ID.
 * @param reportId - The report ID.
 * @returns The {@link DbReport} record, or `null` if not found / not owned / DB unavailable.
 * @example
 * const report = getUserReport('user_abc123', 'report-456');
 * if (!report) throw error(404, 'Report not found');
 */
export async function getUserReport(userId: string, reportId: string): Promise<DbReport | null> {
  if (!isDatabaseAvailable()) return null;
  const db = getDb();
  const row = await db.queryOne<DbReport>('SELECT * FROM user_reports WHERE user_id = ? AND report_id = ?', userId, reportId);
  return row;
}

// ---------------------------------------------------------------------------
// Receipt operations
// ---------------------------------------------------------------------------

/**
 * Save a Stripe payment receipt linked to an existing user.
 *
 * Uses `ON CONFLICT(stripe_session_id)` so duplicate webhook deliveries
 * are idempotent — only `amount_cents`, `currency`, and `receipt_url`
 * are updated, and only if the new values are non-null.
 *
 * @param userId - The Clerk user ID.
 * @param stripeSessionId - The Stripe Checkout session ID.
 * @param amountCents - Payment amount in the smallest currency unit.
 * @param currency - Three-letter ISO currency code, e.g. `aud`.
 * @param customerEmail - Customer email for display.
 * @param customerName - Customer name for display.
 * @param company - Company name from the assessment job.
 * @param receiptUrl - URL to the Stripe-hosted receipt page.
 * @returns The inserted or updated {@link DbReceipt} row, or `null` if DB is unavailable.
 * @example
 * const receipt = saveReceipt(
 *   'user_abc123',
 *   'cs_test_xxx',
 *   120000,
 *   'aud',
 *   'alice@example.com',
 *   'Alice Smith',
 *   'Acme Inc'
 * );
 */
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
  if (!isDatabaseAvailable()) {
    console.warn('saveReceipt skipped: database unavailable');
    return null;
  }
  const db = getDb();
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
  return row;
}

/**
 * Save a receipt **without** a user ID. Used when a customer pays via Stripe
 * but has not yet signed up for the portal. The receipt is linked later via
 * {@link linkPendingReceiptsByEmail} when the user first signs in.
 *
 * @param stripeSessionId - The Stripe Checkout session ID.
 * @param amountCents - Payment amount in the smallest currency unit.
 * @param currency - Three-letter ISO currency code.
 * @param customerEmail - Customer email (used for later linkage).
 * @param customerName - Customer name for display.
 * @param company - Company name from the assessment job.
 * @param receiptUrl - URL to the Stripe-hosted receipt page.
 * @returns The inserted or updated {@link DbReceipt} row (with `user_id: null`), or `null` if DB unavailable.
 * @example
 * const pending = savePendingReceipt(
 *   'cs_test_xxx',
 *   120000,
 *   'aud',
 *   'bob@example.com',
 *   'Bob',
 *   'Acme Inc'
 * );
 */
export async function savePendingReceipt(
  stripeSessionId: string,
  amountCents: number,
  currency: string,
  customerEmail?: string,
  customerName?: string,
  company?: string,
  receiptUrl?: string
): Promise<DbReceipt | null> {
  if (!isDatabaseAvailable()) {
    console.warn('savePendingReceipt skipped: database unavailable');
    return null;
  }
  const db = getDb();
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
  return row;
}

/**
 * Fetch all receipts belonging to a user, ordered newest first.
 *
 * @param userId - The Clerk user ID.
 * @returns An array of {@link DbReceipt} rows. Empty array if none or DB unavailable.
 * @example
 * const receipts = getUserReceipts('user_abc123');
 * return json(receipts);
 */
export async function getUserReceipts(userId: string): Promise<DbReceipt[]> {
  if (!isDatabaseAvailable()) return [];
  const db = getDb();
  const rows = await db.queryAll<DbReceipt>('SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC', userId);
  return rows;
}

/**
 * Fetch a single receipt for a specific user.
 *
 * @param userId - The Clerk user ID.
 * @param receiptId - The receipt ID (local primary key).
 * @returns The {@link DbReceipt} record, or `null` if not found / not owned / DB unavailable.
 * @example
 * const receipt = getUserReceipt('user_abc123', 'receipt-1715600000000');
 * if (!receipt) throw error(404, 'Receipt not found');
 */
export async function getUserReceipt(userId: string, receiptId: string): Promise<DbReceipt | null> {
  if (!isDatabaseAvailable()) return null;
  const db = getDb();
  const row = await db.queryOne<DbReceipt>('SELECT * FROM receipts WHERE user_id = ? AND id = ?', userId, receiptId);
  return row;
}

// ---------------------------------------------------------------------------
// Auto-linking (orphan record resolution)
// ---------------------------------------------------------------------------

/**
 * Scan the filesystem report directories and link any reports whose
 * `customerEmail` matches the given email to the specified user.
 *
 * This is called automatically when a user first signs into the portal,
 * allowing them to see reports that were generated before they created
 * their account.
 *
 * **Cloudflare Workers note:** `fs.readdirSync` may not be available or
 * the `REPORTS_DIR` may not exist in the Worker environment. Errors are
 * caught and logged, returning `0`.
 *
 * @param userId - The Clerk user ID.
 * @param email - The email address to match (case-insensitive).
 * @returns The number of reports newly linked. `0` if DB unavailable or scan fails.
 * @example
 * const linked = scanAndLinkReportsByEmail('user_123', 'alice@example.com');
 * console.log(`Linked ${linked} historical reports`);
 */
export async function scanAndLinkReportsByEmail(userId: string, email: string): Promise<number> {
  if (!isDatabaseAvailable()) return 0;

  try {
    const dir = path.resolve(REPORTS_DIR);
    if (!fs.existsSync(dir)) return 0;

    let linked = 0;
    const db = getDb();

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
        const existing = await db.queryOne<{ 1: number }>('SELECT 1 FROM user_reports WHERE report_id = ? AND user_id = ?', reportId, userId);
        if (existing) continue;

        await linkReportToUser(
          userId,
          reportId,
          meta.job?.sessionId,
          `${meta.job?.company || meta.job?.customerName || 'Business'} — AI Assessment`,
          meta.job?.company
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
}

/**
 * Link pending receipts (`user_id IS NULL`) to a user by matching
 * `customer_email`. Called automatically on portal login so customers
 * see receipts for payments they made before signing up.
 *
 * @param userId - The Clerk user ID.
 * @param email - The email address to match (case-insensitive).
 * @returns The number of receipts newly linked. `0` if DB unavailable.
 * @example
 * const linked = linkPendingReceiptsByEmail('user_abc123', 'alice@example.com');
 * console.log(`Linked ${linked} pending receipts`);
 */
export async function linkPendingReceiptsByEmail(userId: string, email: string): Promise<number> {
  if (!isDatabaseAvailable()) return 0;
  const db = getDb();
  const result = await db.exec(`
    UPDATE receipts
    SET user_id = ?
    WHERE user_id IS NULL
      AND customer_email IS NOT NULL
      AND LOWER(customer_email) = LOWER(?)
  `, userId, email);
  return result.changes || 0;
}

/**
 * Legacy helper that returns zero counts. Reports and receipts are now
 * auto-linked individually via {@link scanAndLinkReportsByEmail} and
 * {@link linkPendingReceiptsByEmail}.
 *
 * @deprecated Use the individual link functions above.
 */
export async function linkOrphanedRecordsByEmail(userId: string, email: string): Promise<{ reports: number; receipts: number }> {
  return {
    reports: await scanAndLinkReportsByEmail(userId, email),
    receipts: await linkPendingReceiptsByEmail(userId, email)
  };
}
