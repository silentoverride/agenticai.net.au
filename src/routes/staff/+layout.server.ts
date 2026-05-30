import { requireStaff } from '$lib/server/staff-auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
  const role = await requireStaff(locals);
  return { role };
};
