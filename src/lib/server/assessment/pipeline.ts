import type { AssessmentReportJob, PipelineResult, SavedReport } from './types';
import { analyzeTranscript } from './llm-analysis';
import { lookupToolsForTranscript, enrichAnalysisWithTools } from './tool-lookup';
import { generatePresentonDeck } from './presenton';
import { saveReportUnified } from './report-store-r2';
import { sendReportReadyEmail } from './emails';
import { findOrCreateUserFromStripe, linkReportToUser } from '$lib/server/portal';

export async function runReportPipeline(
  job: AssessmentReportJob,
  opts?: { r2Bucket?: R2Bucket | null }
): Promise<PipelineResult> {
  console.info('Starting report pipeline for', job.callId || job.sessionId, JSON.stringify({
    customer: job.customerName,
    company: job.company,
    transcriptLength: job.transcript.length
  }));

  // Step 0: Look up real AI tools from Futurepedia / TAAFT via Perplexity
  let tools: import('./tool-lookup').AITool[] = [];
  try {
    tools = await lookupToolsForTranscript(job.transcript);
    console.info('Tool lookup complete', { callId: job.callId, toolsFound: tools.length });
  } catch (error) {
    console.error('Tool lookup failed (continuing without tools):', error);
  }

  // Step 1: LLM Analysis (with tool data if available)
  let analysis: string;
  try {
    analysis = await analyzeTranscript(job, tools);
    console.info('LLM analysis complete', { callId: job.callId, length: analysis.length });
  } catch (error) {
    console.error('LLM analysis failed:', error);
    throw new Error('LLM analysis failed: ' + (error instanceof Error ? error.message : String(error)));
  }

  // Step 1b: Enrich analysis JSON with researched tool URLs and metadata
  if (tools.length > 0) {
    try {
      analysis = enrichAnalysisWithTools(analysis, tools);
      console.info('Analysis enriched with tool data', { callId: job.callId });
    } catch (error) {
      console.error('Tool enrichment failed (analysis kept as-is):', error);
    }
  }

  // Step 2: Presenton Deck (best effort — analysis is still useful without it)
  let deckUrl = '';
  try {
    deckUrl = await generatePresentonDeck(analysis, job);
    console.info('Presenton deck generated', { callId: job.callId, url: deckUrl });
  } catch (error) {
    console.error('Presenton deck generation failed:', error);
  }

  // Step 3: Save to R2 (production) or filesystem (dev)
  let saved: SavedReport;
  try {
    saved = await saveReportUnified(opts?.r2Bucket ?? null, job, analysis, deckUrl);
  } catch (error) {
    console.error('Report save failed:', error);
    throw new Error('Report save failed: ' + (error instanceof Error ? error.message : String(error)));
  }

  // Step 3b: Link report to user in portal if email matches an existing user
  if (job.customerEmail) {
    try {
      const user = await findOrCreateUserFromStripe(job.customerEmail, job.customerName);
      if (user) {
        await linkReportToUser(
          user.clerk_id,
          saved.id,
          job.sessionId,
          deckUrl,
          `${job.company || job.customerName || 'Business'} — AI Assessment`,
          job.company
        );
        console.info('Report linked to portal user', { reportId: saved.id, userId: user.clerk_id });
      }
    } catch (error) {
      console.error('Failed to link report to portal user:', error);
    }
  }

  // Step 4: Email delivery to customer
  let emailResult: { sent: boolean; id?: string; message?: string } = { sent: false };
  if (job.customerEmail) {
    try {
      emailResult = await sendReportReadyEmail({
        to: job.customerEmail,
        customerName: job.customerName,
        company: job.company,
        deckUrl
      });
      if (emailResult.sent) {
        console.info('Report delivered by email', { to: job.customerEmail, id: emailResult.id });
      } else {
        console.warn('Email delivery skipped or failed', emailResult.message);
      }
    } catch (err) {
      console.error('Email delivery failed:', err);
    }
  }

  return {
    queued: true,
    savedReport: saved,
    deckUrl,
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
