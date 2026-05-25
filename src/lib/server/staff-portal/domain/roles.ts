import type { StaffRole } from '$lib/staff-portal/dto';

export type { StaffRole };

export const STAFF_ROLES = ['admin', 'operator'] as const satisfies readonly StaffRole[];

export function isStaffRole(value: unknown): value is StaffRole {
  return value === 'admin' || value === 'operator';
}

export function parseStaffRole(value: unknown): StaffRole | null {
  return isStaffRole(value) ? value : null;
}

export function canActOnAssignedItem(input: {
  role: StaffRole;
  operatorId?: string;
  assignedOperatorId?: string | null;
  sharedQueue?: boolean;
}): boolean {
  if (input.role === 'admin') return true;
  if (input.sharedQueue) return true;
  if (!input.assignedOperatorId) return true;
  return Boolean(input.operatorId && input.operatorId === input.assignedOperatorId);
}
