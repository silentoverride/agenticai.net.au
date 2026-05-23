import { redirect } from '@sveltejs/kit';
import { resolveUser } from '$lib/server/auth';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
  const user = resolveUser(locals, url);
  throw redirect(302, `/portal/${user.userId}`);
};
