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
 *   const check = checkIntakeSufficiency(transcript, intakeProgress);
 *   if (!check.sufficient) {
 *     console.warn('Intake insufficient, deferring pipeline', check);
 *     return; // Don't enqueue — wait for more data or flag for operator
 *   }
 */

// ============================================================================
// Configuration
// ============================================================================

/** Minimum transcript length in characters to consider an intake substantive. */
const MIN_TRANSCRIPT_LENGTH = 400;

/** Minimum number of answered questions for a viable intake. */
const MIN_ANSWERS = 5;

/** Question indices (0-based) that feed BLOCKING gate criteria. These must be answered. */
const BLOCKING_QUESTION_IDS = [
  'business_overview',   // Q1: feeds QW-A1, MP-A2, RR-A0
  'current_tools',       // Q2: feeds QW-A1, QW-E2, RR-TC1-3
  'pain_points',         // Q3: feeds QW-A1, QW-E1, MP-A1
  'workflow_details',    // Q4: feeds QW-E1, QW-E3, RR-T1
  'concrete_metrics',    // Q5: feeds QW-E1, QW-E3, RR-T1, RR-T4
];

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

export interface IntakeQualityResult {
  /** Whether the intake has sufficient evidence to justify pipeline execution. */
  sufficient: boolean;
  /** Specific gaps that prevent sufficiency. */
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
  /** Recommended action if insufficient. */
  recommendation?: string;
}

// ============================================================================
// Check Functions
// ============================================================================

/**
 * Check whether an intake transcript has sufficient evidence to justify
 * running the full assessment pipeline (~$0.30-0.50 in LLM costs).
 *
 * Returns `sufficient: true` only if ALL minimum criteria are met.
 */
export function checkIntakeSufficiency(
  transcript: string,
  answers?: Array<{ questionId: string; answer: string }>
): IntakeQualityResult {
  const gaps: string[] = [];
  const lowerTranscript = transcript.toLowerCase();

  // Check 1: Transcript minimum length
  const transcriptLength = transcript.length;
  if (transcriptLength < MIN_TRANSCRIPT_LENGTH) {
    gaps.push(`Transcript too short (${transcriptLength} chars, minimum ${MIN_TRANSCRIPT_LENGTH})`);
  }

  // Check 2: Minimum answered questions
  const answerCount = answers?.length ?? estimateQuestionCount(lowerTranscript);
  if (answerCount < MIN_ANSWERS) {
    gaps.push(`Too few questions answered (${answerCount}, minimum ${MIN_ANSWERS})`);
  }

  // Check 3: Blocking question coverage — at least Q1-Q5 must be present
  let blockingAnswersPresent = 0;
  if (answers) {
    blockingAnswersPresent = BLOCKING_QUESTION_IDS.filter(
      id => answers.some(a => a.questionId === id && a.answer.trim().length > 10)
    ).length;
  } else {
    // Without structured answers, estimate from transcript
    blockingAnswersPresent = estimateBlockingCoverage(lowerTranscript);
  }
  if (blockingAnswersPresent < BLOCKING_QUESTION_IDS.length) {
    gaps.push(
      `Blocking questions incomplete (${blockingAnswersPresent}/${BLOCKING_QUESTION_IDS.length} answered with substance)`
    );
  }

  // Check 4: Budget signal detection (Q8)
  const hasBudgetSignal = detectBudgetSignal(lowerTranscript);
  if (!hasBudgetSignal) {
    // Budget not detected in transcript — note as gap but don't block (Q8 isn't a blocking criterion)
    gaps.push('Budget signal not detected (Q8 may be unanswered)');
  }

  // Check 5: Tool names present (Q2)
  const hasToolNames = SUBSTANTIVE_TOOL_INDICATORS.some(tool => lowerTranscript.includes(tool));
  if (!hasToolNames) {
    gaps.push('No known tool names detected (Q2 may be unanswered or answered with "none")');
  }

  // Check 6: Specific pain point with temporal anchor (Q3)
  const hasSpecificPain = SUBSTANTIVE_PAIN_INDICATORS.some(indicator =>
    lowerTranscript.includes(indicator)
  );
  if (!hasSpecificPain) {
    gaps.push('No specific pain point with measurable impact detected (Q3 may be vague)');
  }

  // Determine sufficiency: blocking questions coverage + transcript length are hard gates.
  // Tool names and specific pain are strong signals but individually not blocking.
  const sufficient =
    transcriptLength >= MIN_TRANSCRIPT_LENGTH &&
    answerCount >= MIN_ANSWERS &&
    blockingAnswersPresent >= BLOCKING_QUESTION_IDS.length &&
    hasToolNames &&
    hasSpecificPain;

  const recommendation = !sufficient
    ? `Intake needs ${gaps.length} gaps addressed before pipeline execution. ` +
      (blockingAnswersPresent < BLOCKING_QUESTION_IDS.length
        ? 'Prioritize completing Q1-Q5 (blocking criteria). '
        : '') +
      (!hasToolNames ? 'Probe Q2 for specific tool names. ' : '') +
      (!hasSpecificPain ? 'Re-ask Q3 for a specific, recent example. ' : '')
    : undefined;

  return {
    sufficient,
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

/** Estimate number of questions answered from transcript structure. */
function estimateQuestionCount(lowerTranscript: string): number {
  // Count topic transition markers (questions in the intake script use these topic headers)
  const topicMarkers = [
    'business overview', 'current tools', 'pain points', 'workflow',
    'metrics', 'customer channels', 'process consistency', 'budget',
    'ai readiness', 'timeline'
  ];
  return topicMarkers.filter(marker => lowerTranscript.includes(marker)).length;
}

/** Estimate how many blocking questions were answered with substance. */
function estimateBlockingCoverage(lowerTranscript: string): number {
  const signals = [
    // Q1: business overview — has industry/role mentions
    lowerTranscript.match(/industry|sector|business|company|role|founder|owner|manager|team of|employees|staff/) ? 1 : 0,
    // Q2: current tools — has tool names
    SUBSTANTIVE_TOOL_INDICATORS.some(t => lowerTranscript.includes(t)) ? 1 : 0,
    // Q3: pain points — has specific pain language
    SUBSTANTIVE_PAIN_INDICATORS.some(p => lowerTranscript.includes(p)) ? 1 : 0,
    // Q4: workflow — mentions hours/frequency/tasks
    lowerTranscript.match(/hours|per week|per day|handles|responsible|task|workflow|process/) ? 1 : 0,
    // Q5: concrete metrics — mentions numbers
    lowerTranscript.match(/\d+\s*(hours?|minutes?|days?|weeks?|months?|dollars?|leads?|customers?|invoices?|jobs?|clients?)/) ? 1 : 0
  ];
  return signals.reduce((sum: number, s: number) => sum + s, 0);
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
    /(?:hundred|thousand)s?\s*(a|per)\s*month/ // hundreds per month
  ];
  return budgetPatterns.some(pattern => pattern.test(lowerTranscript));
}
