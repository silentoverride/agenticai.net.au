import { requireStaff } from '$lib/server/staff-auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  await requireStaff(locals, platform?.env.assessment_db);

  return {};
};
