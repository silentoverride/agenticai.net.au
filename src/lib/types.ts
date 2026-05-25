/**
 * Shared portal types — safe to import from both server and client.
 *
 * These are lightweight data-transfer shapes returned by portal APIs.
 * Prefer importing from `$lib/types` rather than `$lib/server/db`
 * so that Svelte components stay SSR-safe.
 */

export type PortalUser = {
  clerk_id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
};

export type PortalReport = {
  id: string;
  user_id: string | null;
  receipt_id: string | null;
  call_id: string | null;
  session_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  company: string | null;
  r2_key: string | null;
  deck_url: string | null;
  title: string | null;
  version?: number | null;
  last_regenerated_at?: string | null;
  created_at: string;
};

export type PortalReceipt = {
  id: string;
  user_id: string | null;
  stripe_session_id: string | null;
  amount_cents: number | null;
  currency: string | null;
  customer_email: string | null;
  customer_name: string | null;
  company: string | null;
  receipt_url: string | null;
  created_at: string;
};

export type PortalReportDetail = PortalReport & { analysis?: unknown };
