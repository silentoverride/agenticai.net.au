/**
 * Intake data R2 store — preserves raw intake data as an immutable audit trail.
 *
 * Key convention:
 *   assessments/{assessmentId}/transcript.json       — raw transcript/intake data
 *   assessments/{assessmentId}/meta.json             — metadata (customer info, timestamps)
 *   assessments/{assessmentId}/{stage}-{timestamp}.json  — stage artifacts
 *
 * The assessmentId is derived from the session ID to maintain traceability
 * from intake through pipeline processing.
 */

/**
 * R2 key convention:
 *   assessments/{assessmentId}/transcript.json       — raw transcript JSON
 *   assessments/{assessmentId}/meta.json             — order/pipeline metadata
 *   assessments/{assessmentId}/{stage}-{timestamp}.json  — intermediate artifacts
 *
 * Example keys:
 *   assessments/sess_abc123/transcript.json
 *   assessments/sess_abc123/meta.json
 *   assessments/sess_abc123/analysis-20260521T120000Z.json
 *   assessments/sess_abc123/report-20260521T123000Z.json
 */
export const R2_KEY_CONVENTION = {
  transcript: (id: string) => `assessments/${id}/transcript.json`,
  meta: (id: string) => `assessments/${id}/meta.json`,
  stageArtifact: (id: string, stage: string, timestamp: string) =>
    `assessments/${id}/${stage}-${timestamp}.json`,
  prefix: (id: string) => `assessments/${id}/`
} as const;

export type IntakeMetadata = {
  sessionId: string;
  source: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  company?: string;
  summary?: Array<{ question: string; answer: string; followUpAnswer?: string }>;
  transcript?: string;
  amountCents?: number;
  currency?: string;
  stripeSessionId?: string;
  createdAt: string;
};

/**
 * Save raw intake data to R2.
 * If R2 is unavailable, logs a warning and continues (non-blocking).
 */
export async function saveRawIntake(
  bucket: R2Bucket,
  sessionId: string,
  metadata: IntakeMetadata
): Promise<{ saved: boolean; transcriptKey: string; metaKey: string }> {
  const transcriptKey = R2_KEY_CONVENTION.transcript(sessionId);
  const metaKey = R2_KEY_CONVENTION.meta(sessionId);

  // Save the transcript (raw intake data)
  const transcriptPayload = metadata.transcript
    ? { transcript: metadata.transcript, summary: metadata.summary }
    : { summary: metadata.summary };

  await bucket.put(transcriptKey, JSON.stringify(transcriptPayload, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });

  // Save the metadata envelope
  await bucket.put(metaKey, JSON.stringify(metadata, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });

  console.info('[intake-store] Raw intake saved to R2', {
    sessionId,
    transcriptKey,
    metaKey,
    hasTranscript: !!metadata.transcript,
    summaryCount: metadata.summary?.length
  });

  return { saved: true, transcriptKey, metaKey };
}

/**
 * Read the raw intake transcript from R2.
 */
export async function getRawIntakeTranscript(
  bucket: R2Bucket,
  sessionId: string
): Promise<string | null> {
  const obj = await bucket.get(R2_KEY_CONVENTION.transcript(sessionId));
  if (!obj) return null;
  return await obj.text();
}

/**
 * Read the intake metadata from R2.
 */
export async function getRawIntakeMeta(
  bucket: R2Bucket,
  sessionId: string
): Promise<IntakeMetadata | null> {
  const obj = await bucket.get(R2_KEY_CONVENTION.meta(sessionId));
  if (!obj) return null;
  try {
    return JSON.parse(await obj.text()) as IntakeMetadata;
  } catch {
    return null;
  }
}

/**
 * Save a stage artifact (intermediate pipeline output) to R2.
 */
export async function saveStageArtifact(
  bucket: R2Bucket,
  sessionId: string,
  stage: string,
  data: unknown
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const key = R2_KEY_CONVENTION.stageArtifact(sessionId, stage, timestamp);

  await bucket.put(key, JSON.stringify(data, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });

  console.info('[intake-store] Stage artifact saved to R2', { sessionId, stage, key });
  return key;
}
