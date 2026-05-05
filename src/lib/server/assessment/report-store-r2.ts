/**
 * R2-backed report store — persists report artifacts to Cloudflare R2.
 *
 * In production (R2 wired), reports are written as JSON blobs keyed by
 * `reports/{reportId}/analysis.json`, `reports/{reportId}/meta.json`,
 * and `reports/{reportId}/transcript.txt`.
 *
 * In local dev or when R2 is down, falls back to the filesystem store.
 */

import type { AssessmentReportJob, SavedReport } from './types';

export type R2SavedReport = SavedReport & { r2Key?: string };

function reportId(job: AssessmentReportJob): string {
  const base = job.callId || job.sessionId || Date.now().toString();
  return `${Date.now()}-${base}`;
}

/** Write a report to R2. Returns the R2 key prefix on success. */
export async function saveReportToR2(
  bucket: R2Bucket,
  job: AssessmentReportJob,
  analysis: string,
  deckUrl?: string
): Promise<{ id: string; r2Prefix: string }> {
  const id = reportId(job);
  const prefix = `reports/${id}`;

  const meta = {
    id,
    job: {
      callId: job.callId,
      sessionId: job.sessionId,
      source: job.source,
      customerName: job.customerName,
      customerEmail: job.customerEmail,
      customerPhone: job.customerPhone,
      company: job.company,
      receivedAt: job.receivedAt
    },
    deckUrl: deckUrl || null,
    createdAt: new Date().toISOString()
  };

  await bucket.put(`${prefix}/analysis.json`, analysis, {
    httpMetadata: { contentType: 'application/json' }
  });

  if (job.transcript) {
    await bucket.put(`${prefix}/transcript.txt`, job.transcript, {
      httpMetadata: { contentType: 'text/plain; charset=utf-8' }
    });
  }

  await bucket.put(`${prefix}/meta.json`, JSON.stringify(meta, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  });

  console.info('Report saved to R2', { id, prefix });
  return { id, r2Prefix: prefix };
}

/** Read an analysis JSON from R2. */
export async function getReportAnalysisFromR2(bucket: R2Bucket, reportId: string): Promise<string | null> {
  const obj = await bucket.get(`reports/${reportId}/analysis.json`);
  if (!obj) return null;
  return await obj.text();
}

/** Read meta JSON from R2. */
export async function getReportMetaFromR2(bucket: R2Bucket, reportId: string): Promise<Record<string, unknown> | null> {
  const obj = await bucket.get(`reports/${reportId}/meta.json`);
  if (!obj) return null;
  try {
    return JSON.parse(await obj.text());
  } catch {
    return null;
  }
}

/** Read transcript from R2. */
export async function getReportTranscriptFromR2(bucket: R2Bucket, reportId: string): Promise<string | null> {
  const obj = await bucket.get(`reports/${reportId}/transcript.txt`);
  if (!obj) return null;
  return await obj.text();
}

/** List report IDs in R2 (best-effort prefix scan). */
export async function listReportsFromR2(bucket: R2Bucket): Promise<string[]> {
  const listed = await bucket.list({ prefix: 'reports/' });
  const ids = new Set<string>();
  for (const obj of listed.objects) {
    // Key format: reports/{id}/analysis.json
    const match = obj.key.match(/^reports\/([^/]+)\//);
    if (match) ids.add(match[1]);
  }
  return Array.from(ids).sort((a, b) => b.localeCompare(a));
}

/** Return true if R2 bucket is wired (Cloudflare production). */
export function isR2Available(bucket?: R2Bucket | null): bucket is R2Bucket {
  return bucket !== null && bucket !== undefined;
}

/**
 * Save report to R2 if available, otherwise filesystem.
 * Returns a SavedReport compatible shape.
 */
export async function saveReportUnified(
  bucket: R2Bucket | null,
  job: AssessmentReportJob,
  analysis: string
): Promise<R2SavedReport> {
  if (isR2Available(bucket)) {
    const { id, r2Prefix } = await saveReportToR2(bucket, job, analysis);
    return {
      id,
      dir: '', // no local dir in R2 mode
      jsonPath: `${r2Prefix}/analysis.json`,
      mdPath: '',
      r2Key: r2Prefix
    };
  }

  // Fallback to filesystem for local dev
  const { saveReport } = await import('./report-store');
  return saveReport(job, analysis);
}

/** Read a report from R2 if available, otherwise filesystem. */
export async function getReportUnified(
  bucket: R2Bucket | null,
  reportId: string
): Promise<R2SavedReport | null> {
  if (isR2Available(bucket)) {
    const meta = await getReportMetaFromR2(bucket, reportId);
    if (!meta) return null;
    return {
      id: reportId,
      dir: '',
      jsonPath: `reports/${reportId}/analysis.json`,
      mdPath: '',
      r2Key: `reports/${reportId}`
    };
  }

  const { getReport } = await import('./report-store');
  return getReport(reportId);
}
