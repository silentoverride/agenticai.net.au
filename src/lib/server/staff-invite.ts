/**
 * Staff invitation service — Clerk Invitation API integration.
 *
 * Creates Clerk invitations with embedded role metadata, tracks them
 * locally, and applies the role when the invited user first logs in.
 */

import { createClerkClient } from '@clerk/backend';
import { CLERK_SECRET_KEY } from '$env/static/private';
import { getDb, withDb, type AsyncDb } from './db';

type StaffRole = 'staff' | 'admin';

interface ClerkInvitation {
  id: string;
  email_address: string;
  status: string;
  public_metadata: Record<string, unknown>;
  created_at: number;
}

interface LocalInvitation {
  id: string;
  email: string;
  role: StaffRole;
  clerk_invitation_id: string;
  status: 'pending' | 'accepted' | 'revoked';
  invited_by: string;
  created_at: string;
  accepted_at: string | null;
}

// ── Clerk client ──────────────────────────────────────────────────────────

let clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getClerkClient() {
  if (!clerkClient) {
    if (!CLERK_SECRET_KEY) {
      throw new Error('CLERK_SECRET_KEY is not configured');
    }
    clerkClient = createClerkClient({ secretKey: CLERK_SECRET_KEY });
  }
  return clerkClient;
}

// ── Invitation creation ────────────────────────────────────────────────────

/**
 * Create a Clerk invitation for a staff member.
 *
 * Clerk sends an email to the user with a sign-up link.
 * When they accept, their `public_metadata` will contain the role.
 * We track the invitation locally so we can apply the role on first login.
 */
export async function createStaffInvitation(
  email: string,
  role: StaffRole,
  invitedBy: string
): Promise<{ id: string; email: string; role: StaffRole }> {
  const client = getClerkClient();

  const invitation = await client.invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role },
    notify: true,
  }) as unknown as ClerkInvitation;

  // Store locally for role-application on first login
  await withDb('createStaffInvitation', null, async db => {
    const id = crypto.randomUUID();
    await db.exec(
      `INSERT INTO staff_invitations (id, email, role, clerk_invitation_id, invited_by, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      id, email, role, invitation.id, invitedBy
    );
  });

  return { id: invitation.id, email, role };
}

// ── Invitation listing ─────────────────────────────────────────────────────

/**
 * List all pending/active staff invitations, including Clerk-side status.
 */
export async function listStaffInvitations(): Promise<{
  local: LocalInvitation[];
}> {
  const local = await withDb('listStaffInvitations', [], async db => {
    return db.queryAll<LocalInvitation>(
      `SELECT * FROM staff_invitations ORDER BY created_at DESC`
    );
  });

  return { local };
}

// ── Invitation revocation ──────────────────────────────────────────────────

/**
 * Revoke a pending staff invitation both in Clerk and locally.
 */
export async function revokeStaffInvitation(id: string): Promise<void> {
  const local = await withDb('revokeStaffInvitation', null, async db => {
    return db.queryOne<LocalInvitation>(
      `SELECT * FROM staff_invitations WHERE id = ? AND status = 'pending'`,
      id
    );
  });

  if (!local) {
    throw new Error('Pending invitation not found');
  }

  // Revoke in Clerk
  const client = getClerkClient();
  await client.invitations.revokeInvitation(local.clerk_invitation_id);

  // Update local
  await withDb('revokeStaffInvitation', null, async db => {
    await db.exec(
      `UPDATE staff_invitations SET status = 'revoked' WHERE id = ?`,
      id
    );
  });
}

// ── Role-application on login ──────────────────────────────────────────────

/**
 * Check if a user has a pending staff invitation and apply the role.
 *
 * Called during authentication flow — applies the role from the invitation
 * on the user's first login after accepting the Clerk invite.
 */
export async function applyPendingStaffRole(
  db: AsyncDb,
  clerkId: string,
  email: string
): Promise<void> {
  // Check for a pending invitation matching the user's email
  const invitation = await db.queryOne<{ id: string; role: string }>(
    `SELECT id, role FROM staff_invitations
     WHERE LOWER(email) = LOWER(?)
       AND status = 'pending'
     ORDER BY created_at DESC
     LIMIT 1`,
    email
  );

  if (!invitation) return;

  // Update the user's role
  await db.exec(
    `UPDATE users SET role = ? WHERE clerk_id = ?`,
    invitation.role,
    clerkId
  );

  // Mark invitation as accepted
  await db.exec(
    `UPDATE staff_invitations
     SET status = 'accepted', accepted_at = datetime('now')
     WHERE id = ?`,
    invitation.id
  );

  console.info(`[staff-invite] Applied role "${invitation.role}" to user ${clerkId} (${email})`);
}

// ── Staff user listing ─────────────────────────────────────────────────────

/**
 * List existing staff users (staff members and admins).
 */
export async function listStaffUsers(): Promise<{
  clerk_id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
}[]> {
  return withDb('listStaffUsers', [], async db => {
    return db.queryAll(
      `SELECT clerk_id, email, name, role, created_at
       FROM users
       WHERE role IN ('staff', 'admin')
       ORDER BY created_at DESC`
    );
  });
}
