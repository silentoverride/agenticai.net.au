import { requireOperator } from '$lib/server/operator-auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
  const role = await requireOperator(locals, platform?.env.assessment_db) as 'operator' | 'admin';
  return { role };
};
