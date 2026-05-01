import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  if (!env.RETELL_API_KEY || !env.RETELL_VOICE_AGENT_ID) {
    return json(
      {
        message:
          'Retell voice calls are not configured. Set RETELL_API_KEY and RETELL_VOICE_AGENT_ID in the server environment.'
      },
      { status: 501 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    source?: string;
  };

  const payload: {
    agent_id: string;
    agent_version?: number;
    metadata: Record<string, string>;
    retell_llm_dynamic_variables: Record<string, string>;
  } = {
    agent_id: env.RETELL_VOICE_AGENT_ID,
    metadata: {
      source: body.source || 'website-call-assessment-button'
    },
    retell_llm_dynamic_variables: {
      source: body.source || 'website-call-assessment-button',
      assessment_fee: '$1,200.00 AUD',
      site: 'agenticai.net.au'
    }
  };

  if (env.RETELL_VOICE_AGENT_VERSION) {
    const agentVersion = Number(env.RETELL_VOICE_AGENT_VERSION);

    if (Number.isInteger(agentVersion)) {
      payload.agent_version = agentVersion;
    }
  }

  const retellResponse = await fetch('https://api.retellai.com/v2/create-web-call', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.RETELL_API_KEY}`,
      'content-type': 'application/json',
      'user-agent': 'agenticai.net.au/1.0 (SvelteKit; Cloudflare Pages)',
      accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const retellBody = await retellResponse.json();

  if (!retellResponse.ok) {
    return json(
      {
        message: retellBody.message || retellBody.error || 'Unable to start Annie voice call.'
      },
      { status: retellResponse.status }
    );
  }

  return json({
    accessToken: retellBody.access_token,
    callId: retellBody.call_id,
    agentId: retellBody.agent_id,
    agentName: retellBody.agent_name
  });
};
