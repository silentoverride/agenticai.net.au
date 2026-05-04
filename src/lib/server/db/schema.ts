import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  clerkId: text('clerk_id').primaryKey(),
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString())
});

export const userReports = sqliteTable('user_reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.clerkId, { onDelete: 'cascade' }),
  reportId: text('report_id').notNull(),
  stripeSessionId: text('stripe_session_id'),
  deckUrl: text('deck_url'),
  title: text('title'),
  company: text('company'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString())
});

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
});
