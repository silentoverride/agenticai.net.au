import type { AssessmentReportJob, PipelineResult, SavedReport } from './types';
import { analyzeTranscript } from './llm-analysis';
import { generatePresentonDeck } from './presenton';
import { saveReport } from './report-store';
import { sendReportReadyEmail } from './emails';

export async function runReportPipeline(job: AssessmentReportJob): Promise<PipelineResult> {
  console.info('Starting report pipeline for', job.callId || job.sessionId, JSON.stringify({
    customer: job.customerName,
    company: job.company,
    transcriptLength: job.transcript.length
  }));

  // Step 1: LLM Analysis
  let analysis: string;
  try {
    analysis = await analyzeTranscript(job);
    console.info('LLM analysis complete', { callId: job.callId, length: analysis.length });
  } catch (error) {
    console.error('LLM analysis failed:', error);
    throw new Error('LLM analysis failed: ' + (error instanceof Error ? error.message : String(error)));
  }

  // Step 2: Presenton Deck (best effort — analysis is still useful without it)
  let deckUrl = '';
  try {
    deckUrl = await generatePresentonDeck(analysis, job);
    console.info('Presenton deck generated', { callId: job.callId, url: deckUrl });
  } catch (error) {
    console.error('Presenton deck generation failed:', error);
  }

  // Step 3: Save locally
  let saved: SavedReport;
  try {
    saved = saveReport(job, analysis, deckUrl);
  } catch (error) {
    console.error('Report save failed:', error);
    throw new Error('Report save failed: ' + (error instanceof Error ? error.message : String(error)));
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
    destination: 'local-pipeline',
    emailSent: emailResult.sent,
    emailId: emailResult.id
  };
}

// Backward-compat alias
export async function pipeAssessmentReportJob(job: AssessmentReportJob): Promise<PipelineResult> {
  return runReportPipeline(job);
}
