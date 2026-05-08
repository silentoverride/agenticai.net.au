import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  clerkId: text('clerk_id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  role: text('role').default('client'),
  company: text('company'),
  address: text('address'),
  avatar: text('avatar'),
  abn: text('abn'),
  acn: text('acn'),
  website: text('website'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString())
}, (table) => [
  index('idx_users_email').on(table.email)
]);

export const receipts = sqliteTable('receipts', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.clerkId, { onDelete: 'cascade' }),
  customerEmail: text('customer_email'),
  stripeSessionId: text('stripe_session_id').unique(),
  amountCents: integer('amount_cents'),
  currency: text('currency'),
  customerName: text('customer_name'),
  company: text('company'),
  receiptUrl: text('receipt_url'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString())
}, (table) => [
  index('idx_receipts_user_created').on(table.userId, table.createdAt)
]);

export const transcripts = sqliteTable('transcripts', {
  callId: text('call_id').primaryKey(),
  transcript: text('transcript').notNull(),
  metadata: text('metadata'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  processedAt: text('processed_at')
}, (table) => [
  index('idx_transcripts_created_at').on(table.createdAt)
]);

export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.clerkId, { onDelete: 'set null' }),
  receiptId: text('receipt_id').references(() => receipts.id, { onDelete: 'set null' }),
  callId: text('call_id').references(() => transcripts.callId, { onDelete: 'set null' }),
  sessionId: text('session_id'),
  customerEmail: text('customer_email'),
  customerName: text('customer_name'),
  company: text('company'),
  r2Key: text('r2_key'),
  deckUrl: text('deck_url'),
  title: text('title'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString())
}, (table) => [
  uniqueIndex('idx_reports_receipt_id').on(table.receiptId),
  uniqueIndex('idx_reports_call_id_unique').on(table.callId),
  index('idx_reports_user_created').on(table.userId, table.createdAt),
  index('idx_reports_session_receipt').on(table.sessionId, table.receiptId)
]);

export const pipelineStatus = sqliteTable('pipeline_status', {
  sessionId: text('session_id').primaryKey(),
  status: text('status').notNull(),
  deckUrl: text('deck_url'),
  reportId: text('report_id').references(() => reports.id, { onDelete: 'set null' }),
  error: text('error'),
  attempts: integer('attempts').default(0),
  callId: text('call_id').references(() => transcripts.callId, { onDelete: 'set null' }),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString())
}, (table) => [
  index('idx_pipeline_status').on(table.status, table.updatedAt),
  index('idx_pipeline_status_call_id').on(table.callId),
  uniqueIndex('idx_pipeline_status_report_id_unique').on(table.reportId)
]);
