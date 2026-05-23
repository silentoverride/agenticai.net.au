import { requireOperator } from '$lib/server/operator-auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
  await requireOperator(locals, platform?.env.assessment_db);

  return {};
};
