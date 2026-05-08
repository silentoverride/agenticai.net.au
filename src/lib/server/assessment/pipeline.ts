import type { AssessmentReportJob, PipelineResult, SavedReport } from './types';
import { analyzeTranscript } from './llm-analysis';
import { lookupToolsForTranscript, enrichAnalysisWithTools } from './tool-lookup';
import { saveReportUnified, isR2Available } from './report-store-r2';
import { sendReportReadyEmail } from './emails';
import { findOrCreateUserFromStripe, linkReportToUser, upsertReportMetadata } from '$lib/server/portal';

export async function runReportPipeline(
  job: AssessmentReportJob,
  opts?: { r2Bucket?: R2Bucket | null }
): Promise<PipelineResult> {
  const sessionId = job.callId || job.sessionId;
  const logPrefix = `[pipeline:${sessionId}]`;

  console.info(`${logPrefix} Starting report pipeline`, {
    customer: job.customerName,
    company: job.company,
    transcriptLength: job.transcript.length,
    hasTools: true,
    r2Available: isR2Available(opts?.r2Bucket ?? null)
  });

  // Step 0: Look up real AI tools from Futurepedia / TAAFT via Perplexity
  let tools: import('./tool-lookup').AITool[] = [];
  try {
    tools = await lookupToolsForTranscript(job.transcript);
    console.info(`${logPrefix} Tool lookup complete`, { toolsFound: tools.length });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`${logPrefix} Tool lookup failed (continuing without tools):`, details);
  }

  // Step 1: LLM Analysis (with tool data if available)
  let analysis: string;
  try {
    analysis = await analyzeTranscript(job, tools);
    console.info(`${logPrefix} LLM analysis complete`, { length: analysis.length });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`${logPrefix} LLM analysis failed:`, details);
    throw new Error('LLM analysis failed: ' + (error instanceof Error ? error.message : String(error)));
  }

  // Step 1b: Enrich analysis JSON with researched tool URLs and metadata
  if (tools.length > 0) {
    try {
      analysis = enrichAnalysisWithTools(analysis, tools);
      console.info(`${logPrefix} Analysis enriched with tool data`);
    } catch (error) {
      const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.error(`${logPrefix} Tool enrichment failed (analysis kept as-is):`, details);
    }
  }

  // Step 2: Save to R2 (production) or filesystem (dev)
  let saved: SavedReport;
  try {
    saved = await saveReportUnified(opts?.r2Bucket ?? null, job, analysis);
    console.info(`${logPrefix} Report saved`, { reportId: saved.id, destination: isR2Available(opts?.r2Bucket ?? null) ? 'r2' : 'local' });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`${logPrefix} Report save failed:`, details);
    throw new Error('Report save failed: ' + (error instanceof Error ? error.message : String(error)));
  }

  // Step 2b: Link report to user in portal if email matches an existing user
  try {
    await upsertReportMetadata(
      saved.id,
      job.sessionId,
      `${job.company || job.customerName || 'Business'} — AI Assessment`,
      job.company,
      {
        callId: job.callId,
        customerEmail: job.customerEmail,
        customerName: job.customerName,
        r2Key: saved.r2Key
      }
    );
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`${logPrefix} Failed to save report metadata:`, details);
  }

  if (job.customerEmail) {
    try {
      const user = await findOrCreateUserFromStripe(job.customerEmail, job.customerName);
      if (user) {
        await linkReportToUser(
          user.clerk_id,
          saved.id,
          job.sessionId,
          `${job.company || job.customerName || 'Business'} — AI Assessment`,
          job.company,
          {
            callId: job.callId,
            customerEmail: job.customerEmail,
            customerName: job.customerName,
            r2Key: saved.r2Key
          }
        );
        console.info(`${logPrefix} Report linked to portal user`, { reportId: saved.id, userId: user.clerk_id });
      }
    } catch (error) {
      const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.error(`${logPrefix} Failed to link report to portal user:`, details);
    }
  }

  // Step 3: Email delivery to customer
  let emailResult: { sent: boolean; id?: string; message?: string } = { sent: false };
  if (job.customerEmail) {
    try {
      emailResult = await sendReportReadyEmail({
        to: job.customerEmail,
        customerName: job.customerName,
        company: job.company,
        reportId: saved.id
      });
      if (emailResult.sent) {
        console.info(`${logPrefix} Report delivered by email`, { to: job.customerEmail, id: emailResult.id });
      } else {
        console.warn(`${logPrefix} Email delivery skipped or failed`, emailResult.message);
      }
    } catch (err) {
      const details = err instanceof Error ? { message: err.message, stack: err.stack } : err;
      console.error(`${logPrefix} Email delivery failed:`, details);
    }
  }

  return {
    queued: true,
    savedReport: saved,
    destination: 'r2-or-local',
    emailSent: emailResult.sent,
    emailId: emailResult.id
  };
}

// Backward-compat alias
export async function pipeAssessmentReportJob(
  job: AssessmentReportJob,
  opts?: { r2Bucket?: R2Bucket | null }
): Promise<PipelineResult> {
  return runReportPipeline(job, opts);
}
