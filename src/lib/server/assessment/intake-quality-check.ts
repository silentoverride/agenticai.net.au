/**
 * Intake Quality Pre-Check — lightweight evidence sufficiency gate.
 *
 * JLA-005 Finding 5: the pipeline triggers on webhook arrival, not on intake
 * quality. A customer who hangs up at Q3 still triggers the full pipeline with
 * incomplete evidence, wasting GPT-5.5 cost (~$0.30-0.50 per run) and producing
 * low-quality reports.
 *
 * This module provides a fast, no-API-call check that runs BEFORE queueing the
 * pipeline. It uses structural signals (transcript length, question count,
 * keyword detection) — no LLM call needed.
 *
 * Usage (in webhook handler, before enqueueReportJob):
 *   const check = checkIntakeSufficiency(transcript, answers);
 *   if (check.quality === 'incomplete' || check.quality === 'invalid') {
 *     if (INTAKE_QUALITY_BLOCK === 'true') {
 *       await setPipelineStatus(sessionId, { status: 'human_assist', error: check.recommendation });
 *       return new Response(null, { status: 200 });
 *     }
 *     // else: shadow mode — log warning and enqueue anyway
 *   }
 */

import { BLOCKING_QUESTION_IDS } from '$lib/server/assessment/intake-script';

// ============================================================================
// Configuration
// ============================================================================

/** Minimum transcript length in characters to consider an intake substantive. */
const MIN_TRANSCRIPT_LENGTH = 400;

/** Minimum transcript length for even considering an intake — below this = INVALID. */
const MIN_VIABLE_LENGTH = 100;

/** Minimum number of answered questions for a viable intake. */
const MIN_ANSWERS = 6;

/** Minimum number of answers before intake is INVALID (no meaningful content). */
const MIN_VIABLE_ANSWERS = 3;

/** Keywords that indicate a substantive tool answer (not "none," "not sure," etc.). */
const SUBSTANTIVE_TOOL_INDICATORS = [
  'xero', 'quickbooks', 'myob', 'jobber', 'simpro', 'servicem8', 'tradify', 'fergus',
  'hubspot', 'salesforce', 'zapier', 'make', 'integromat', 'monday', 'asana', 'trello',
  'notion', 'airtable', 'google sheets', 'excel', 'slack', 'teams', 'calendly',
  'stripe', 'square', 'shopify', 'woocommerce', 'mailchimp', 'activecampaign',
  'outlook', 'gmail', 'google workspace', 'microsoft 365'
];

/** Phrases that indicate a substantive pain point answer. */
const SUBSTANTIVE_PAIN_INDICATORS = [
  'hours', 'hour', 'per week', 'every day', 'daily', 'every week', 'every month',
  'constantly', 'always', 'waste', 'frustrating', 'pain', 'bottleneck', 'slow',
  'manual', 'double', 'retype', 'copy paste', 'copy-paste', 'lost', 'missed',
  'late', 'behind', 'stuck', 'error', 'mistake', 'wrong', 'broken', 'break',
  'fails', 'crash', 'overwhelm'
];

// ============================================================================
// Types
// ============================================================================

/** Intake quality state — replaces the binary sufficient/insufficient. */
export type IntakeQuality = 'sufficient' | 'adequate' | 'incomplete' | 'invalid';

export interface IntakeQualityResult {
  /** The intake quality state. */
  quality: IntakeQuality;
  /** @deprecated kept for backward compat — use `quality` instead. */
  sufficient: boolean;
  /** Specific gaps that caused the quality classification. */
  gaps: string[];
  /** Metrics for observability. */
  metrics: {
    transcriptLength: number;
    answerCount: number;
    hasBudgetSignal: boolean;
    hasToolNames: boolean;
    hasSpecificPain: boolean;
    blockingAnswersPresent: number;
    blockingAnswersRequired: number;
  };
  /** Recommended action. */
  recommendation?: string;
}

// ============================================================================
// Check Functions
// ============================================================================

/**
 * Check whether an intake transcript has sufficient evidence to justify
 * running the full assessment pipeline (~$0.30-0.50 in LLM costs).
 *
 * Returns a quality state from 'invalid' to 'sufficient'. Use the `quality`
 * field (not `sufficient`) for decisions about pipeline triggering.
 */
export function checkIntakeSufficiency(
  transcript: string,
  answers?: Array<{ questionId: string; answer: string }>
): IntakeQualityResult {
  const gaps: string[] = [];
  const lowerTranscript = transcript.toLowerCase();

  // Check 1: Transcript minimum length
  const transcriptLength = transcript.length;

  // Check 2: Minimum answered questions
  const answerCount = answers?.length ?? estimateQuestionCount(lowerTranscript);

  // Check 3: Blocking question coverage
  let blockingAnswersPresent = 0;
  if (answers) {
    blockingAnswersPresent = BLOCKING_QUESTION_IDS.filter(
      (id: string) => answers.some(a => a.questionId === id && a.answer.trim().length > 10)
    ).length;
  } else {
    blockingAnswersPresent = estimateBlockingCoverage(lowerTranscript);
  }

  // Check 4: Budget signal detection (Q8) — check both transcript and answers
  const hasBudgetSignal =
    detectBudgetSignal(lowerTranscript) ||
    (answers?.some(a =>
      a.questionId === 'budget' && detectBudgetSignal(a.answer.toLowerCase())
    ) ?? false);

  // Check 5: Tool names present (Q2) — check both transcript and structured answers
  const hasToolNames =
    SUBSTANTIVE_TOOL_INDICATORS.some(tool => lowerTranscript.includes(tool)) ||
    (answers?.some(a =>
      SUBSTANTIVE_TOOL_INDICATORS.some(tool => a.answer.toLowerCase().includes(tool))
    ) ?? false);

  // Check 6: Specific pain point with temporal anchor (Q3) — check both transcript and structured answers
  const hasSpecificPain =
    SUBSTANTIVE_PAIN_INDICATORS.some(indicator => lowerTranscript.includes(indicator)) ||
    (answers?.some(a =>
      SUBSTANTIVE_PAIN_INDICATORS.some(indicator => a.answer.toLowerCase().includes(indicator))
    ) ?? false);

  // Build gap messages
  if (transcriptLength < MIN_VIABLE_LENGTH) {
    gaps.push(`Transcript critically short (${transcriptLength} chars, minimum viable ${MIN_VIABLE_LENGTH})`);
  } else if (transcriptLength < MIN_TRANSCRIPT_LENGTH) {
    gaps.push(`Transcript too short (${transcriptLength} chars, minimum ${MIN_TRANSCRIPT_LENGTH})`);
  }

  if (answerCount < MIN_VIABLE_ANSWERS) {
    gaps.push(`Critically few questions answered (${answerCount}, minimum viable ${MIN_VIABLE_ANSWERS})`);
  } else if (answerCount < MIN_ANSWERS) {
    gaps.push(`Too few questions answered (${answerCount}, minimum ${MIN_ANSWERS})`);
  }

  if (blockingAnswersPresent < BLOCKING_QUESTION_IDS.length) {
    gaps.push(
      `Blocking questions incomplete (${blockingAnswersPresent}/${BLOCKING_QUESTION_IDS.length} answered with substance)`
    );
  }

  if (!hasBudgetSignal) {
    gaps.push('Budget signal not detected (Q8 may be unanswered)');
  }

  if (!hasToolNames) {
    gaps.push('No known tool names detected (Q2 may be unanswered or answered with "none")');
  }

  if (!hasSpecificPain) {
    gaps.push('No specific pain point with measurable impact detected (Q3 may be vague)');
  }

  // ========================================================================
  // Quality state classification
  // ========================================================================

  // INVALID: No meaningful content at all
  const isInvalid =
    transcriptLength < MIN_VIABLE_LENGTH ||
    answerCount < MIN_VIABLE_ANSWERS;

  // INCOMPLETE: Hard gates failed
  const isIncomplete =
    !isInvalid &&
    (transcriptLength < MIN_TRANSCRIPT_LENGTH ||
     answerCount < MIN_ANSWERS ||
     blockingAnswersPresent < BLOCKING_QUESTION_IDS.length ||
     !hasToolNames ||
     !hasSpecificPain);

  // ADEQUATE: All hard gates pass EXCEPT budget signal
  const isAdequate =
    !isInvalid &&
    !isIncomplete &&
    !hasBudgetSignal;

  // SUFFICIENT: Everything passes
  const isSufficient =
    !isInvalid &&
    !isIncomplete &&
    !isAdequate; // all checks passed including budget

  let quality: IntakeQuality;
  if (isInvalid) quality = 'invalid';
  else if (isIncomplete) quality = 'incomplete';
  else if (isAdequate) quality = 'adequate';
  else quality = 'sufficient';

  // Recommendation message
  let recommendation: string | undefined;
  if (quality === 'invalid') {
    recommendation = 'Intake has no meaningful content. Do not retry — set to failed.';
  } else if (quality === 'incomplete') {
    recommendation =
      `Intake needs ${gaps.length} gaps addressed before pipeline execution. ` +
      (blockingAnswersPresent < BLOCKING_QUESTION_IDS.length
        ? 'Prioritize completing blocking questions (Q1-Q5, Q7, Q8). '
        : '') +
      (!hasToolNames ? 'Probe Q2 for specific tool names. ' : '') +
      (!hasSpecificPain ? 'Re-ask Q3 for a specific, recent example. ' : '');
  } else if (quality === 'adequate') {
    recommendation = 'Intake is adequate but budget signal missing. Pipeline will use estimated budget.';
  }
  // SUFFICIENT: no recommendation needed

  return {
    quality,
    sufficient: quality === 'sufficient' || quality === 'adequate',
    gaps,
    metrics: {
      transcriptLength,
      answerCount,
      hasBudgetSignal,
      hasToolNames,
      hasSpecificPain,
      blockingAnswersPresent,
      blockingAnswersRequired: BLOCKING_QUESTION_IDS.length
    },
    recommendation
  };
}

// ============================================================================
// Heuristic Helpers (used when structured answer data is unavailable)
// ============================================================================

/**
 * Estimate number of questions answered from transcript structure.
 * Updated for the 10-question redesigned intake script.
 */
function estimateQuestionCount(lowerTranscript: string): number {
  const topicMarkers = [
    'business overview', 'business does', 'industry',
    'current tools', 'software', 'tools',
    'pain points', 'bottleneck', 'there has to be a better way',
    'workflow', 'time-consuming', 'recurring tasks',
    'quantifying', 'numbers', 'roughly how many hours',
    'customer channels', 'where do your customers',
    'process consistency', 'written-down process',
    'budget', 'comfortable monthly investment',
    'ai readiness', 'ai tools before', 'chatgpt', 'claude',
    'timeline', 'how urgent', 'quick wins this month'
  ];
  return topicMarkers.filter(marker => lowerTranscript.includes(marker)).length;
}

/**
 * Estimate how many blocking questions were answered with substance.
 * Uses signal checks aligned with each blocking question's content.
 */
function estimateBlockingCoverage(lowerTranscript: string): number {
  let count = 0;

  // Q1: business_overview — industry/role/team size/operating duration
  if (lowerTranscript.match(/industry|sector|business|company|role|founder|owner|manager|team of|employees|staff|operating|years? ago|started/)) {
    count++;
  }

  // Q2: current_tools — known tool names
  if (SUBSTANTIVE_TOOL_INDICATORS.some(t => lowerTranscript.includes(t))) {
    count++;
  }

  // Q3: pain_points — specific pain language with temporal anchors
  if (SUBSTANTIVE_PAIN_INDICATORS.some(p => lowerTranscript.includes(p))) {
    count++;
  }

  // Q4: workflow_details — hours/frequency/tasks/responsibilities
  if (lowerTranscript.match(/hours? per|handles|responsible|task|invoicing|scheduling|report/)) {
    count++;
  }

  // Q5: concrete_metrics — numbers with units
  if (lowerTranscript.match(/\d+\s*(hours?|minutes?|days?|weeks?|months?|dollars?|leads?|customers?|invoices?|jobs?|clients?|per week|per day|per month)/)) {
    count++;
  }

  // Q7: process_consistency — process/standardization mentions
  if (lowerTranscript.match(/process|procedure|standard|checklist|documented|consistent|own way|how we.*do/)) {
    count++;
  }

  // Q8: budget — budget mentions
  if (detectBudgetSignal(lowerTranscript)) {
    count++;
  }

  return count;
}

/** Detect budget signal in transcript. */
function detectBudgetSignal(lowerTranscript: string): boolean {
  const budgetPatterns = [
    /\$\s*\d+/,                           // $500
    /\d+\s*dollars?\s*(a|per)\s*month/,   // 500 dollars per month
    /budget\s*(is|of|around)\s*\$?\d+/,   // budget is $500
    /spend\s*(about|around|up to|\$)\s*\d+/, // spend about $500
    /invest\s*(about|around|up to|\$)\s*\d+/, // invest about $500
    /couple hundred/,                      // a couple hundred
    /up to a thousand/,                    // up to a thousand
    /(?:hundred|thousand)s?\s*(a|per)\s*month/, // hundreds per month
    /monthly investment/,                  // monthly investment (new Q8 phrasing)
    /ballpark/                            // ballpark (new Q8 phrasing)
  ];
  return budgetPatterns.some(pattern => pattern.test(lowerTranscript));
}
