/**
 * User Management Service — Clerk API integration for admin user CRUD.
 *
 * Wraps Clerk's backend user management API with additional role/status
 * tracking in the local database. Supports list, create, update, delete,
 * and bulk operations.
 */

import { createClerkClient } from '@clerk/backend';
import { CLERK_SECRET_KEY } from '$env/static/private';
import { getDb, withDb, type AsyncDb } from '$lib/server/db';

// ── Types ───────────────────────────────────────────────────────────────────

export interface ManagedUser {
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: 'active' | 'inactive';
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UserListResult {
  users: ManagedUser[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  sendWelcomeEmail?: boolean;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

export interface BulkActionInput {
  action: 'deactivate' | 'delete';
  userIds: string[];
  actorId: string; // Prevent self-deletion
}

export interface ValidationError {
  field: string;
  message: string;
}

// ── Clerk client ────────────────────────────────────────────────────────────

let clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerk() {
  if (!clerkClient) {
    if (!CLERK_SECRET_KEY) throw new Error('CLERK_SECRET_KEY not configured');
    clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
  }
  return clerkClient;
}

// ── List users ──────────────────────────────────────────────────────────────

export async function listUsers(params: UserListParams = {}): Promise<UserListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  return withDb('listUsers', { users: [], total: 0, page, pageSize, totalPages: 0 }, async (db) => {
    const conditions: string[] = [];
    const bindings: unknown[] = [];

    if (params.search) {
      conditions.push('(u.email LIKE ? OR u.name LIKE ?)');
      const term = `%${params.search}%`;
      bindings.push(term, term);
    }
    if (params.role) {
      conditions.push('u.role = ?');
      bindings.push(params.role);
    }
    if (params.status === 'active') {
      conditions.push("(u.role != 'inactive' OR u.role IS NULL)");
    } else if (params.status === 'inactive') {
      conditions.push("u.role = 'inactive'");
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await db.queryOne<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM users u ${where}`,
      ...bindings,
    );
    const total = countRow?.cnt ?? 0;

    const rows = await db.queryAll<{
      clerk_id: string; email: string; name: string | null;
      role: string | null; created_at: string;
    }>(
      `SELECT u.clerk_id, u.email, u.name, u.role, u.created_at
       FROM users u ${where}
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      ...bindings, pageSize, offset,
    );

    const users: ManagedUser[] = rows.map(r => {
      const [firstName, ...lastParts] = (r.name ?? '').split(' ');
      return {
        clerkId: r.clerk_id,
        email: r.email,
        firstName: firstName || null,
        lastName: lastParts.join(' ') || null,
        role: r.role || 'client',
        status: r.role === 'inactive' ? 'inactive' : 'active',
        lastLoginAt: null, // Clerk API needed for this — optional enhancement
        createdAt: r.created_at,
        updatedAt: r.created_at,
      };
    });

    return {
      users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  });
}

// ── Get single user ─────────────────────────────────────────────────────────

export async function getUser(clerkId: string): Promise<ManagedUser | null> {
  return withDb('getUser', null, async (db) => {
    const row = await db.queryOne<{
      clerk_id: string; email: string; name: string | null;
      role: string | null; created_at: string;
    }>('SELECT * FROM users WHERE clerk_id = ?', clerkId);

    if (!row) return null;

    const [firstName, ...lastParts] = (row.name ?? '').split(' ');
    return {
      clerkId: row.clerk_id,
      email: row.email,
      firstName: firstName || null,
      lastName: lastParts.join(' ') || null,
      role: row.role || 'client',
      status: row.role === 'inactive' ? 'inactive' : 'active',
      lastLoginAt: null,
      createdAt: row.created_at,
      updatedAt: row.created_at,
    };
  });
}

// ── Validate create input ──────────────────────────────────────────────────

export function validateCreateUser(input: CreateUserInput): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!input.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required.' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    errors.push({ field: 'email', message: 'Please enter a valid email address.' });
  }

  if (!input.password) {
    errors.push({ field: 'password', message: 'Password is required.' });
  } else if (input.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters.' });
  } else if (!/[A-Z]/.test(input.password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one uppercase letter.' });
  } else if (!/[a-z]/.test(input.password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one lowercase letter.' });
  } else if (!/[0-9]/.test(input.password)) {
    errors.push({ field: 'password', message: 'Password must contain at least one number.' });
  }

  const validRoles = ['client', 'staff', 'admin'];
  if (input.role && !validRoles.includes(input.role)) {
    errors.push({ field: 'role', message: 'Invalid role selected.' });
  }

  return errors;
}

export function validateUpdateUser(input: UpdateUserInput): ValidationError[] {
  const errors: ValidationError[] = [];

  // Only validate email if explicitly provided and non-empty
  if (input.email !== undefined && input.email !== null && input.email.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
      errors.push({ field: 'email', message: 'Please enter a valid email address.' });
    }
  }

  if (input.role !== undefined) {
    const validRoles = ['client', 'staff', 'admin', 'inactive'];
    if (!validRoles.includes(input.role)) {
      errors.push({ field: 'role', message: 'Invalid role selected.' });
    }
  }

  return errors;
}

// ── Create user ─────────────────────────────────────────────────────────────

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const client = getClerk();

  // Create in Clerk
  const clerkUser = await client.users.createUser({
    emailAddress: [input.email],
    password: input.password,
    firstName: input.firstName,
    lastName: input.lastName,
    skipPasswordChecks: false,
    skipPasswordRequirement: false,
  });

  const clerkId = clerkUser.id;
  const role = input.role || 'client';
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(' ');

  // Create in local DB
  await withDb('createUser', null, async (db) => {
    await db.exec(
      `INSERT OR REPLACE INTO users (clerk_id, email, name, role, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      clerkId, input.email, fullName || input.email, role,
    );
  });

  return {
    clerkId,
    email: input.email,
    firstName: input.firstName || null,
    lastName: input.lastName || null,
    role,
    status: 'active',
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ── Update user ─────────────────────────────────────────────────────────────

export async function updateUser(clerkId: string, input: UpdateUserInput): Promise<ManagedUser | null> {
  // Update in Clerk if name/email changed. Clerk operations are best-effort —
  // seed/test users may not have Clerk accounts, and we don't want to block
  // local DB updates on Clerk failures.
  try {
    const client = getClerk();

    const clerkUpdate: Record<string, unknown> = {};
    if (input.firstName !== undefined) clerkUpdate.firstName = input.firstName;
    if (input.lastName !== undefined) clerkUpdate.lastName = input.lastName;

    // Only sync email to Clerk if it's a non-empty value
    if (input.email !== undefined && input.email !== null && input.email.trim() !== '') {
      try {
        await client.emailAddresses.createEmailAddress({
          userId: clerkId,
          emailAddress: input.email,
          verified: true,
          primary: true,
        });
      } catch (err) {
        console.warn('[user-management] Clerk email update failed (non-fatal):', String(err));
      }
    }

    if (Object.keys(clerkUpdate).length > 0) {
      try {
        await client.users.updateUser(clerkId, clerkUpdate);
      } catch (err) {
        console.warn('[user-management] Clerk user update failed (non-fatal):', String(err));
      }
    }
  } catch (err) {
    console.warn('[user-management] Clerk init failed (non-fatal):', String(err));
  }

  // Update in local DB
  const fullName = [input.firstName, input.lastName].filter(Boolean).join(' ');

  return withDb('updateUser', null, async (db) => {
    const updates: string[] = [];
    const bindings: unknown[] = [];

    if (input.email !== undefined && input.email !== null && input.email.trim() !== '') {
      updates.push('email = ?');
      bindings.push(input.email);
    }
    if (input.firstName !== undefined || input.lastName !== undefined) {
      updates.push('name = ?');
      bindings.push(fullName || null);
    }
    if (input.role !== undefined) {
      updates.push('role = ?');
      bindings.push(input.role);
    }

    if (updates.length > 0) {
      await db.exec(
        `UPDATE users SET ${updates.join(', ')} WHERE clerk_id = ?`,
        ...bindings, clerkId,
      );
    }

    const user = await getUser(clerkId);
    return user!;
  });
}

// ── Delete user ─────────────────────────────────────────────────────────────

export async function deleteUser(clerkId: string, actorId: string): Promise<{ success: boolean; error?: string }> {
  if (clerkId === actorId) {
    return { success: false, error: 'You cannot delete your own account.' };
  }

  const client = getClerk();

  try {
    // Delete from Clerk
    await client.users.deleteUser(clerkId);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[user-management] Clerk delete failed:', msg);
    // Continue with local deletion even if Clerk fails
  }

  // Delete from local DB
  await withDb('deleteUser', null, async (db) => {
    await db.exec('DELETE FROM users WHERE clerk_id = ?', clerkId);
  });

  return { success: true };
}

// ── Bulk actions ────────────────────────────────────────────────────────────

export async function bulkAction(input: BulkActionInput): Promise<{
  success: boolean;
  results: Array<{ clerkId: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ clerkId: string; success: boolean; error?: string }> = [];

  for (const clerkId of input.userIds) {
    if (input.action === 'deactivate') {
      try {
        await updateUser(clerkId, { role: 'inactive' });
        results.push({ clerkId, success: true });
      } catch (err: unknown) {
        results.push({ clerkId, success: false, error: String(err) });
      }
    } else if (input.action === 'delete') {
      const result = await deleteUser(clerkId, input.actorId);
      results.push({
        clerkId,
        success: result.success,
        error: result.error,
      });
    }
  }

  return {
    success: results.every(r => r.success),
    results,
  };
}

// ── Check email exists ─────────────────────────────────────────────────────

export async function emailExists(email: string, excludeClerkId?: string): Promise<boolean> {
  return withDb('emailExists', false, async (db) => {
    let query = 'SELECT COUNT(*) as cnt FROM users WHERE LOWER(email) = LOWER(?)';
    const bindings: unknown[] = [email];

    if (excludeClerkId) {
      query += ' AND clerk_id != ?';
      bindings.push(excludeClerkId);
    }

    const row = await db.queryOne<{ cnt: number }>(query, ...bindings);
    return (row?.cnt ?? 0) > 0;
  });
}
