import type { AssessmentReportJob, PipelineResult, SavedReport } from './types';
import { analyzeTranscript } from './llm-analysis';
import { lookupToolsForTranscript, enrichAnalysisWithTools } from './tool-lookup';
import { saveReportUnified, isR2Available } from './report-store-r2';
import { sendReportReadyEmail } from './emails';
import { findOrCreateUserFromStripe, linkReportToUser, upsertReportMetadata } from '$lib/server/portal';
import { runGate } from './gate/runner';
import { isGateActive, getGateMode } from './gate/gate-mode';

// ============================================================================
// Stage Functions — independently callable pipeline stages
// Each function is a single stage that can be wired into the queue consumer's
// stage router (workers/stages/) or composed via runReportPipeline().
// ============================================================================

/** Stage 0: Tool Research — lookup AI tools relevant to transcript context. */
export async function stageToolResearch(
  transcript: string
): Promise<import('./tool-lookup').AITool[]> {
  let tools: import('./tool-lookup').AITool[] = [];
  try {
    tools = await lookupToolsForTranscript(transcript);
    console.info(`[pipeline:stage:tool-research] Complete`, { toolsFound: tools.length });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.warn(`[pipeline:stage:tool-research] Failed (continuing without tools):`, details);
  }
  return tools;
}

/** Stage 1: LLM Analysis — generate structured analysis from transcript + tools. */
export async function stageLlmAnalysis(
  job: AssessmentReportJob,
  tools: import('./tool-lookup').AITool[]
): Promise<string> {
  let analysis: string;
  try {
    analysis = await analyzeTranscript(job, tools);
    console.info(`[pipeline:stage:llm-analysis] Complete`, { length: analysis.length });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[pipeline:stage:llm-analysis] Failed:`, details);
    throw new Error('LLM analysis failed: ' + (error instanceof Error ? error.message : String(error)));
  }

  if (tools.length > 0) {
    try {
      analysis = enrichAnalysisWithTools(analysis, tools);
      console.info(`[pipeline:stage:llm-analysis] Enriched with tool data`);
    } catch (error) {
      const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.warn(`[pipeline:stage:llm-analysis] Tool enrichment failed (analysis kept as-is):`, details);
    }
  }

  return analysis;
}

/** Stage 2: Save Report — persist analysis to R2 (production) or filesystem (dev). */
export async function stageSaveReport(
  job: AssessmentReportJob,
  analysis: string,
  r2Bucket: R2Bucket | null
): Promise<SavedReport> {
  try {
    const saved = await saveReportUnified(r2Bucket, job, analysis);
    console.info(`[pipeline:stage:save-report] Saved`, {
      reportId: saved.id,
      destination: isR2Available(r2Bucket) ? 'r2' : 'local'
    });
    return saved;
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[pipeline:stage:save-report] Failed:`, details);
    throw new Error('Report save failed: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/** Stage 3: Link Report — associate report with portal user. */
export async function stageLinkReport(
  saved: SavedReport,
  job: AssessmentReportJob
): Promise<void> {
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
    console.warn(`[pipeline:stage:link-report] Failed to save report metadata:`, details);
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
        console.info(`[pipeline:stage:link-report] Linked to portal user`, { reportId: saved.id, userId: user.clerk_id });
      }
    } catch (error) {
      const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
      console.warn(`[pipeline:stage:link-report] Failed to link report:`, details);
    }
  }
}

/** Stage 4: Email Delivery — send report-ready notification. */
export async function stageEmailDelivery(
  saved: SavedReport,
  job: AssessmentReportJob
): Promise<{ sent: boolean; id?: string; message?: string }> {
  const emailResult: { sent: boolean; id?: string; message?: string } = { sent: false };
  if (job.customerEmail) {
    try {
      const result = await sendReportReadyEmail({
        to: job.customerEmail!,
        customerName: job.customerName,
        company: job.company,
        reportId: saved.id
      });
      Object.assign(emailResult, result);
      if (result.sent) {
        console.info(`[pipeline:stage:email-delivery] Delivered`, { to: job.customerEmail, id: result.id });
      } else {
        console.warn(`[pipeline:stage:email-delivery] Skipped or failed`, result.message);
      }
    } catch (err) {
      const details = err instanceof Error ? { message: err.message, stack: err.stack } : err;
      console.error(`[pipeline:stage:email-delivery] Failed:`, details);
    }
  }
  return emailResult;
}

// ============================================================================
// Gate Checkpoint Hook
// ============================================================================

/**
 * Optional gate checkpoint — runs GPT-5.5 evaluation on pipeline content.
 * In shadow mode (Epic 2a), gates log verdicts but do not block.
 * In hard mode (Epic 2b+), failing a gate blocks the pipeline.
 *
 * Currently a no-op placeholder. Gate execution is wired in Epic 2a
 * when the assessment pipeline gets stage routing.
 */
export async function runGateCheckpoint(params: {
  stage: string;
  content: string;
  assessmentId: string;
  db?: D1Database;
  envOverrides?: Record<string, string | undefined>;
}): Promise<{ passed: boolean; blocked: boolean; verdict?: string; shadowMode?: boolean }> {
  const gateType = params.stage;

  // Check if gate is active
  if (!isGateActive(gateType, params.envOverrides)) {
    return { passed: true, blocked: false };
  }

  // Run gate with env-var-driven mode
  const result = await runGate({
    assessmentId: params.assessmentId,
    content: params.content,
    gateType,
    db: params.db,
    envOverrides: params.envOverrides,
    includeUsage: true,
    promptVersion: 'v1'
  });

  const blocked = result.action === 'block' || result.action === 'escalate';

  if (blocked) {
    console.warn(`[pipeline:gate] Gate checkpoint "${gateType}" ${result.shadowMode ? 'WOULD BLOCK (shadow mode)' : 'BLOCKED'} pipeline`, {
      assessmentId: params.assessmentId,
      verdict: result.verdict,
      action: result.action,
      confidence: result.confidence,
      reasoning: result.reasoning,
      shadowMode: result.shadowMode
    });
  } else {
    console.info(`[pipeline:gate] Gate checkpoint "${gateType}" passed`, {
      assessmentId: params.assessmentId,
      verdict: result.verdict,
      action: result.action,
      confidence: result.confidence
    });
  }

  return {
    passed: result.passed,
    blocked,
    verdict: result.verdict,
    shadowMode: result.shadowMode
  };
}

// ============================================================================
// Composed Pipeline
// ============================================================================

/**
 * Full pipeline composed from independent stage functions.
 * Each stage is independently callable and can be wired into
 * the queue consumer's stage router (workers/stages/).
 */
export async function runReportPipeline(
  job: AssessmentReportJob,
  opts?: { r2Bucket?: R2Bucket | null }
): Promise<PipelineResult> {
  const sessionId = job.callId || job.sessionId || 'unknown';
  const logPrefix = `[pipeline:${sessionId}]`;
  const r2Bucket = opts?.r2Bucket ?? null;

  console.info(`${logPrefix} Starting report pipeline`, {
    customer: job.customerName,
    company: job.company,
    transcriptLength: job.transcript.length
  });

  // Stage 0: Tool Research
  const tools = await stageToolResearch(job.transcript);

  // Gate Checkpoint: quick-wins-verification (placeholder — wired in Epic 2a)
  await runGateCheckpoint({
    stage: 'quick-wins-verification',
    content: job.transcript,
    assessmentId: sessionId
  });

  // Stage 1: LLM Analysis + enrichment
  const analysis = await stageLlmAnalysis(job, tools);

  // Gate Checkpoint: major-project-verification (placeholder)
  await runGateCheckpoint({
    stage: 'major-project-verification',
    content: analysis,
    assessmentId: sessionId
  });

  // Stage 2: Save Report
  const saved = await stageSaveReport(job, analysis, r2Bucket);

  // Stage 3: Link Report
  await stageLinkReport(saved, job);

  // Gate Checkpoint: report-review (placeholder)
  await runGateCheckpoint({
    stage: 'report-review',
    content: analysis,
    assessmentId: sessionId
  });

  // Stage 4: Email Delivery
  const emailResult = await stageEmailDelivery(saved, job);

  return {
    queued: true,
    savedReport: saved,
    destination: isR2Available(r2Bucket) ? 'r2' : 'local',
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
