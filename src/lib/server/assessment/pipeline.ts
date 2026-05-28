import type { AssessmentReportJob, PipelineResult, SavedReport, BudgetSignal } from './types';
import { analyzeTranscript } from './llm-analysis';
import { parseAndValidateAnalysis, createDefaultAnalysis } from './analysis-types';
import type { StructuredAnalysis } from './analysis-types';
import { lookupToolsForTranscript, enrichAnalysisWithTools, formatToolsForPrompt, filterToolsByMVTD } from './tool-lookup';
import { saveReportUnified, isR2Available } from './report-store-r2';
import { sendReportReadyEmail } from './emails';
import { findOrCreateUserFromStripe, linkReportToUser, upsertReportMetadata } from '$lib/server/portal';
import { runGate } from './gate/runner';
import { isGateActive, getGateMode } from './gate/gate-mode';
import { extractBudgetSignal } from './budget-detection';
import { extractEvidenceMap, formatEvidenceMapForPrompt } from './evidence-map';
import type { EvidenceMap } from './evidence-map';

// ============================================================================
// Stage Functions — independently callable pipeline stages
// Each function is a single stage that can be wired into the queue consumer's
// stage router (workers/stages/) or composed via runReportPipeline().
// ============================================================================

/** Stage 0: Tool Research — lookup AI tools relevant to transcript context.
 *  Also runs PRE-3 budget detection to tag tools with pricing alignment. */
export async function stageToolResearch(
  transcript: string,
  db?: D1Database | null,
  budgetSignal?: BudgetSignal
): Promise<{ tools: import('./tool-lookup').AITool[]; budgetSignal: BudgetSignal }> {
  let tools: import('./tool-lookup').AITool[] = [];
  try {
    tools = await lookupToolsForTranscript(transcript, db, budgetSignal);

    // Apply MVTD filter — only tools with all critical fields pass to LLM + gates
    const { stats } = filterToolsByMVTD(tools);
    console.info(`[pipeline:stage:tool-research] MVTD quality assessment`, stats);

    console.info(`[pipeline:stage:tool-research] Complete`, {
      toolsFound: tools.length,
      hasBudgetSignal: budgetSignal?.source !== 'none' && (budgetSignal?.confidence ?? 0) > 0
    });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.warn(`[pipeline:stage:tool-research] Failed (continuing without tools):`, details);
  }
  return { tools, budgetSignal: budgetSignal ?? { min: null, max: null, confidence: 0, source: 'none', raw_text: null } };
}

/** Stage 0.5: Evidence Extraction — extract structured claims from transcript before report generation. */
export async function stageEvidenceExtraction(
  transcript: string,
  budgetSignal?: BudgetSignal
): Promise<EvidenceMap> {
  const start = Date.now();
  let evidenceMap: EvidenceMap;
  try {
    evidenceMap = await extractEvidenceMap(transcript, budgetSignal);
    console.info(`[pipeline:stage:evidence-extraction] Complete`, {
      total: evidenceMap.coverage.total_claims,
      direct: evidenceMap.coverage.direct_claims,
      coverage: `${Math.round(evidenceMap.coverage.coverage_rate * 100)}%`,
      gaps: evidenceMap.gaps.length,
      durationMs: Date.now() - start
    });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.warn(`[pipeline:stage:evidence-extraction] Failed (continuing without evidence map):`, details);
    evidenceMap = {
      claims: [],
      coverage: { total_claims: 0, direct_claims: 0, inferred_claims: 0, speculative_claims: 0, coverage_rate: 0 },
      gaps: [{ field: 'unknown', gate_impact: 'Evidence extraction failed', recommended_handling: 'Flag for operator review' }],
      extracted_at: new Date().toISOString()
    };
  }
  return evidenceMap;
}

/** Stage 1: LLM Analysis — generate structured analysis from evidence map + tools + transcript. */
export async function stageLlmAnalysis(
  job: AssessmentReportJob,
  tools: import('./tool-lookup').AITool[],
  evidenceMap: EvidenceMap,
  budgetSignal?: BudgetSignal
): Promise<{ analysis: string; structured: StructuredAnalysis }> {
  const ANALYSIS_TIMEOUT_MS = 600_000; // 10 minutes (NFR7)
  let analysis: string;

  try {
    // Run analysis with timeout
    const startTime = Date.now();
    analysis = await runWithTimeout(
      () => analyzeTranscript(job, tools, evidenceMap, budgetSignal),
      ANALYSIS_TIMEOUT_MS,
      'LLM analysis exceeded 10-minute timeout'
    );
    const elapsed = Date.now() - startTime;
    console.info(`[pipeline:stage:llm-analysis] Complete`, {
      length: analysis.length,
      elapsedMs: elapsed,
      withinTimeout: elapsed < ANALYSIS_TIMEOUT_MS
    });
  } catch (error) {
    const details = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(`[pipeline:stage:llm-analysis] Failed:`, details);
    throw new Error('LLM analysis failed: ' + (error instanceof Error ? error.message : String(error)));
  }

  // Validate structured analysis
  let structured: StructuredAnalysis;
  try {
    structured = parseAndValidateAnalysis(analysis);
  } catch (validationError) {
    console.warn('[pipeline:stage:llm-analysis] Analysis validation failed, using default', {
      error: validationError instanceof Error ? validationError.message : String(validationError)
    });
    // NFR10: continue with default analysis rather than failing completely
    structured = createDefaultAnalysis('Analysis output did not meet quality standards. Using default structure.');
    analysis = JSON.stringify(structured, null, 2);
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

  return { analysis, structured };
}

/**
 * Run an async function with a timeout.
 * Throws if the function does not complete within the specified ms.
 */
async function runWithTimeout<T>(fn: () => Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([fn(), timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
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
  opts?: { r2Bucket?: R2Bucket | null; db?: D1Database | null }
): Promise<PipelineResult> {
  const sessionId = job.callId || job.sessionId || 'unknown';
  const logPrefix = `[pipeline:${sessionId}]`;
  const r2Bucket = opts?.r2Bucket ?? null;

  console.info(`${logPrefix} Starting report pipeline`, {
    customer: job.customerName,
    company: job.company,
    transcriptLength: job.transcript.length
  });

  // Stage 0: Tool Research + Budget Detection (PRE-3)
  const budgetSignal = extractBudgetSignal(job.transcript, job);
  console.info(`${logPrefix} PRE-3 budget detection`, {
    source: budgetSignal.source,
    min: budgetSignal.min,
    max: budgetSignal.max,
    confidence: budgetSignal.confidence
  });
  const { tools } = await stageToolResearch(job.transcript, opts?.db, budgetSignal);

  // Stage 0.5: Evidence Extraction (structured claims for report foundation)
  const evidenceMap = await stageEvidenceExtraction(job.transcript, budgetSignal);

  // Stage 1: LLM Analysis — built from evidence map, not raw transcript
  const { analysis, structured } = await stageLlmAnalysis(job, tools, evidenceMap, budgetSignal);

  // Note: structured analysis persisted to R2 via stageSaveReport below.
  // D1 persistence via user_reports table is handled in stageLinkReport.

  // Gate Checkpoint: quick-wins-verification — evaluates generated Quick Wins against transcript evidence
  // Moved after LLM Analysis (JLA-005 P0 fix: gate was positioned before analysis but expected report content)
  const qwResult = await runGateCheckpoint({
    stage: 'quick-wins-verification',
    content: analysis,
    assessmentId: sessionId,
    db: opts?.db ?? undefined
  });
  if (qwResult.blocked && !qwResult.shadowMode) {
    console.warn(`${logPrefix} Pipeline blocked by quick-wins-verification gate`);
    return {
      queued: false,
      blocked: true,
      blockReason: `Pipeline blocked by quality gate: quick-wins-verification`,
      blockedBy: { gateType: 'quick-wins-verification', verdict: qwResult.verdict ?? 'unknown', confidence: 0 },
      destination: 'none',
      emailSent: false
    };
  }

  // Gate Checkpoint: major-project-verification — evaluates Deeper Opportunities
  const mpResult = await runGateCheckpoint({
    stage: 'major-project-verification',
    content: analysis,
    assessmentId: sessionId,
    db: opts?.db ?? undefined
  });
  if (mpResult.blocked && !mpResult.shadowMode) {
    console.warn(`${logPrefix} Pipeline blocked by major-project-verification gate`);
    return {
      queued: false,
      blocked: true,
      blockReason: `Pipeline blocked by quality gate: major-project-verification`,
      blockedBy: { gateType: 'major-project-verification', verdict: mpResult.verdict ?? 'unknown', confidence: 0 },
      destination: 'none',
      emailSent: false
    };
  }

  // Stage 2: Save Report
  const saved = await stageSaveReport(job, analysis, r2Bucket);

  // Stage 3: Link Report
  await stageLinkReport(saved, job);

  // Gate Checkpoint: report-review (includes taste scoring + PBW detection)
  // Inject evidence map + researched tools + prior gate results so the judge can cross-reference claims
  // JLA-005 P1 fix: prior gate results reduce redundant re-verification
  const priorGateResults = `\n\n---\n## Prior Gate Results\n\n` +
    `### Quick Wins Verification\nVerdict: ${qwResult.verdict ?? 'unknown'} | Action: ${qwResult.blocked ? 'BLOCK' : 'PASS'}\n\n` +
    `### Major Project Verification\nVerdict: ${mpResult.verdict ?? 'unknown'} | Action: ${mpResult.blocked ? 'BLOCK' : 'PASS'}\n`;
  const reviewContent = analysis +
    formatEvidenceMapForPrompt(evidenceMap, budgetSignal) +
    formatToolsForPrompt(tools, budgetSignal) +
    priorGateResults;
  const rrResult = await runGateCheckpoint({
    stage: 'report-review',
    content: reviewContent,
    assessmentId: sessionId,
    db: opts?.db ?? undefined
  });
  if (rrResult.blocked && !rrResult.shadowMode) {
    console.warn(`${logPrefix} Pipeline blocked by report-review gate — email delivery prevented`, {
      verdict: rrResult.verdict
    });
    return {
      queued: false,
      blocked: true,
      blockReason: `Report blocked by quality gate: report-review`,
      blockedBy: { gateType: 'report-review', verdict: rrResult.verdict ?? 'unknown', confidence: 0 },
      savedReport: saved,
      destination: isR2Available(r2Bucket) ? 'r2' : 'local',
      emailSent: false
    };
  }

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
