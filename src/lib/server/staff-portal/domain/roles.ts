import type { StaffRole } from '$lib/staff-portal/dto';

export type { StaffRole };

export const STAFF_ROLES = ['admin', 'staff'] as const satisfies readonly StaffRole[];

export function isStaffRole(value: unknown): value is StaffRole {
  return value === 'admin' || value === 'staff';
}

export function parseStaffRole(value: unknown): StaffRole | null {
  return isStaffRole(value) ? value : null;
}

export function canActOnAssignedItem(input: {
  role: StaffRole;
  staffId?: string;
  assignedOperatorId?: string | null;
  sharedQueue?: boolean;
}): boolean {
  if (input.role === 'admin') return true;
  if (input.sharedQueue) return true;
  if (!input.assignedOperatorId) return true;
  return Boolean(input.staffId && input.staffId === input.assignedOperatorId);
}
