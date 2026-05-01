import type { PipelineStatus } from './types';

const memoryPipelineStore = new Map<string, PipelineStatus>();

export function setPipelineStatus(sessionId: string, status: PipelineStatus) {
  memoryPipelineStore.set(sessionId, status);
}

export function getPipelineStatus(sessionId: string) {
  return memoryPipelineStore.get(sessionId);
}
