/**
 * Unified pipeline status store — D1-backed with graceful fallback.
 *
 * In production (D1 wired) status is written to the `pipeline_status` table.
 * In local dev or when D1 is down, falls back to an in-memory Map
 * so that existing code paths keep working.
 */

import { d1PipelineStatusStore } from './pipeline-status-db';
import { isDatabaseAvailable } from '$lib/server/db';
import type { PipelineStatus } from './types';

const memoryPipelineStore = new Map<string, PipelineStatus>();

export async function setPipelineStatus(sessionId: string, status: PipelineStatus) {
  memoryPipelineStore.set(sessionId, status);

  if (isDatabaseAvailable()) {
    await d1PipelineStatusStore.set(sessionId, status);
  }
}

export async function getPipelineStatus(sessionId: string): Promise<PipelineStatus | undefined> {
  if (isDatabaseAvailable()) {
    const d1 = await d1PipelineStatusStore.get(sessionId);
    if (d1) return d1;
  }

  return memoryPipelineStore.get(sessionId);
}
