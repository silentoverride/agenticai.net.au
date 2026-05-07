import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { stopRetellCall } from '$lib/server/retell';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	const callId = body.callId ?? body.call_id;

	if (!callId || typeof callId !== 'string') {
		return error(400, 'Missing callId');
	}
	if (!env.RETELL_API_KEY) {
		return error(500, 'Retell API key not configured');
	}

	try {
		await stopRetellCall(callId, env.RETELL_API_KEY);
		return json({ success: true });
	} catch (e) {
		console.error('Failed to stop Retell call:', e);
		return error(502, 'Failed to end call');
	}
};
