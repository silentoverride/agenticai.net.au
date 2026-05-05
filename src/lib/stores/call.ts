import { writable, get } from 'svelte/store';

export type CallStatus = 'idle' | 'connecting' | 'active' | 'error';

export const callStatus = writable<CallStatus>('idle');
export const callError = writable<string>('');

let retellClient: any = null;

interface RetellCallResponse {
  accessToken?: string;
  message?: string;
}

export async function startCall(source: string): Promise<void> {
  callStatus.set('connecting');
  callError.set('');

  try {
    const response = await fetch('/api/create-retell-web-call', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source })
    });

    const data = (await response.json()) as RetellCallResponse;

    if (!response.ok || !data.accessToken) {
      throw new Error(data.message || 'Unable to connect to Annie.');
    }

    const { RetellWebClient } = await import('retell-client-js-sdk');
    retellClient = new RetellWebClient();

    retellClient.on('call_started', () => {
      callStatus.set('active');
    });

    retellClient.on('call_ended', () => {
      retellClient = null;
      callStatus.set('idle');
    });

    retellClient.on('error', (error: Error | string) => {
      console.error('Retell call error:', error);
      retellClient?.stopCall();
      retellClient = null;
      callStatus.set('error');
      callError.set(
        error instanceof Error && error.message
          ? `The call could not continue: ${error.message}`
          : typeof error === 'string' && error
            ? `The call could not continue: ${error}`
            : 'The call could not continue. Please try again.'
      );
    });

    await retellClient.startCall({ accessToken: data.accessToken, sampleRate: 24000 });
    callStatus.set('active');
  } catch (error) {
    console.error('Unable to start Annie voice call:', error);
    retellClient = null;
    callStatus.set('error');
    callError.set(
      error instanceof Error ? error.message : 'Unable to connect to Annie. Please try again.'
    );
  }
}

export function endCall(): void {
  retellClient?.stopCall();
  retellClient = null;
  callStatus.set('idle');
}

export async function toggleCall(source: string): Promise<void> {
  const current = get(callStatus);
  if (current === 'active') {
    endCall();
  } else if (current === 'idle' || current === 'error') {
    await startCall(source);
  }
}
