/**
 * Server load: full client record (company, files, interactions, tasks).
 */

import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { requireStaff } from '$lib/server/staff-auth';
import { getClient } from '$lib/server/staff-portal/services/clients.service';
import { getClientFiles } from '$lib/server/staff-portal/services/client-files.service';
import { listInteractions } from '$lib/server/staff-portal/services/client-interactions.service';
import { listTasks } from '$lib/server/staff-portal/services/client-tasks.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
  await requireStaff(locals, platform?.env.assessment_db);
  const db = getDb();

  const client = await getClient(db, params.clientId);
  if (!client) throw error(404, 'Client not found');

  const [files, interactions, tasks] = await Promise.all([
    getClientFiles(db, params.clientId),
    listInteractions(db, params.clientId, {}),
    listTasks(db, params.clientId)
  ]);

  return {
    client,
    files: files.map(({ r2Key, ...rest }) => rest),
    interactions,
    tasks
  };
};
