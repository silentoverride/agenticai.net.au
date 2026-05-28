/**
 * Budget Detection — extracts budget signals from intake transcripts.
 *
 * Implements PRE-3 eval from the assessment eval suite:
 * "The transcript contains explicit or implicit budget information."
 *
 * Strategy (lightweight, no LLM call):
 * 1. Pattern-match currency amounts near budget/timeframe phrases
 * 2. Extract ranges from explicit statements
 * 3. Extract implicit signals from existing tool spend
 * 4. Return BudgetSignal with confidence scoring
 */

import type { BudgetSignal, BudgetSignalSource, AssessmentReportJob } from './types';

const AUD_PATTERNS = [
  /([\$]\s*\d[\d,]*)/g,                                         // $500, $1,000
  /(\d[\d,]*\s*(?:aud|dollars?))/gi,                            // 500 AUD, 500 dollars
  /(\d[\d,]*\s*(?:bucks?))/gi                                   // 500 bucks
];

const BUDGET_PHRASES = [
  /(?:budget|spend|invest|pay|cost|afford|comfortable|set aside|allocat)/i,
  /(?:willing\s+to\s+(?:spend|pay|invest))/i
];

const AMOUNT_PATTERNS = [
  // "between $X and $Y", "$X to $Y"
  /between\s*\$?\s*(\d[\d,]*)\s*(?:and|to|-)\s*\$?\s*(\d[\d,]*)/i,
  // "around $X", "about $X"
  /(?:around|about|roughly|approximately)\s*\$?\s*(\d[\d,]*)/i,
  // "up to $X"
  /up\s+to\s*\$?\s*(\d[\d,]*)/i,
  // "at least $X"
  /at\s+least\s*\$?\s*(\d[\d,]*)/i,
  // standalone: "$X per month", "$X/month"
  /\$?\s*(\d[\d,]*)\s*(?:\/|per\s+)(?:month|week|year)/i
];

const PERIOD_SCALE: Record<string, number> = {
  week: 4.33,
  month: 1,
  year: 1 / 12
};

/**
 * Parse a numeric string like "1,500" or "500" into a number.
 */
function parseAmount(raw: string): number {
  return parseInt(raw.replace(/[^\d]/g, ''), 10);
}

/**
 * Normalize an amount to monthly USD.
 * (Currently assumes AUD ≈ USD for budget signal — precision isn't critical here.)
 */
function toMonthly(amount: number, period: string): number {
  const scale = PERIOD_SCALE[period.toLowerCase()] || 1;
  return Math.round(amount * scale);
}

/**
 * Extract a budget signal from the transcript using pattern matching only.
 * No LLM call — designed to be fast and cheap enough to run on every assessment.
 */
export function extractBudgetSignal(
  transcript: string,
  job?: AssessmentReportJob
): BudgetSignal {
  // === Strategy 1: Find explicit ranges ("between $X and $Y") ===
  for (const pattern of AMOUNT_PATTERNS) {
    const match = transcript.match(pattern);
    if (match) {
      const parts = match[0].match(/(\d[\d,]*)/g);
      if (!parts) continue;

      // Check if this amount appears near a budget phrase
      const ctxStart = Math.max(0, match.index! - 100);
      const ctxEnd = Math.min(transcript.length, match.index! + match[0].length + 100);
      const context = transcript.slice(ctxStart, ctxEnd);

      if (BUDGET_PHRASES.some(p => p.test(context))) {
        // Determine period
        const periodMatch = context.match(/(?:per|\/)\s*(week|month|year)/i);
        const period = periodMatch?.[1]?.toLowerCase() || 'month';

        if (parts.length >= 2) {
          // Range: between X and Y
          const min = toMonthly(parseAmount(parts[0]), period);
          const max = toMonthly(parseAmount(parts[1]), period);
          return {
            min: Math.min(min, max),
            max: Math.max(min, max),
            confidence: 0.85,
            source: 'transcript_range',
            raw_text: match[0]
          };
        }

        // Single amount: "around X", "up to X", "at least X"
        const amount = toMonthly(parseAmount(parts[0]), period);
        if (match[0].toLowerCase().includes('up to') || match[0].toLowerCase().includes('max')) {
          return {
            min: null,
            max: amount,
            confidence: 0.7,
            source: 'transcript_explicit',
            raw_text: match[0]
          };
        }
        if (match[0].toLowerCase().includes('at least') || match[0].toLowerCase().includes('min')) {
          return {
            min: amount,
            max: null,
            confidence: 0.7,
            source: 'transcript_explicit',
            raw_text: match[0]
          };
        }
        return {
          min: amount,
          max: amount,
          confidence: 0.75,
          source: 'transcript_explicit',
          raw_text: match[0]
        };
      }
    }
  }

  // === Strategy 2: Simple dollar amount near budget keywords ===
  const budgetSentences = transcript
    .split(/[.!?]\s*/)
    .filter(s => BUDGET_PHRASES.some(p => p.test(s)));

  if (budgetSentences.length > 0) {
    for (const sentence of budgetSentences) {
      for (const audPattern of AUD_PATTERNS) {
        audPattern.lastIndex = 0;
        const match = audPattern.exec(sentence);
        if (match) {
          const amount = parseAmount(match[0]);
          const periodMatch = sentence.match(/(?:per|\/)\s*(week|month|year)/i);
          const period = periodMatch?.[1]?.toLowerCase() || 'month';
          const monthly = toMonthly(amount, period);
          return {
            min: monthly,
            max: monthly,
            confidence: 0.6,
            source: 'transcript_implicit',
            raw_text: sentence.trim()
          };
        }
      }
    }
  }

  // === Strategy 3: Retell metadata (if available) ===
  if (job?.estimatedTimeLoss) {
    // "estimatedTimeLoss" can hint at budget via opportunity cost
    const lossMatch = job.estimatedTimeLoss.match(/(\d+)/);
    if (lossMatch) {
      const hours = parseInt(lossMatch[1], 10);
      if (hours > 0) {
        // Rough: $50/hr * weekly hours lost * 4.33 weeks → monthly cost = budget signal
        const implicitBudget = Math.round(hours * 50 * 4.33);
        return {
          min: null,
          max: implicitBudget,
          confidence: 0.3,
          source: 'retell_metadata',
          raw_text: job.estimatedTimeLoss
        };
      }
    }
  }

  // === Strategy 4: No budget signal found ===
  return {
    min: null,
    max: null,
    confidence: 0,
    source: 'none',
    raw_text: null
  };
}

/**
 * Format a budget signal for inclusion in the tool lookup prompt.
 * Returns a string describing the budget constraint, or empty if no signal.
 */
export function formatBudgetForToolLookup(signal: BudgetSignal): string {
  if (signal.source === 'none' || signal.confidence < 0.3) return '';

  if (signal.min !== null && signal.max !== null) {
    return `Budget range: $${signal.min}–$${signal.max} AUD/month (${signal.source}, confidence: ${signal.confidence})`;
  }
  if (signal.max !== null) {
    return `Budget cap: up to $${signal.max} AUD/month (${signal.source}, confidence: ${signal.confidence})`;
  }
  if (signal.min !== null) {
    return `Budget floor: at least $${signal.min} AUD/month (${signal.source}, confidence: ${signal.confidence})`;
  }
  return '';
}

/**
 * Compute budget alignment for a given tool pricing.
 * Returns one of: 'within_budget' | 'above_budget' | 'below_budget' | 'no_budget_signal'
 */
export function computeBudgetAlignment(
  toolMonthlyCostMin: number | null,
  toolMonthlyCostMax: number | null,
  budget: BudgetSignal
): string {
  if (budget.source === 'none' || budget.confidence < 0.3) {
    return 'no_budget_signal';
  }

  const toolMax = toolMonthlyCostMax ?? toolMonthlyCostMin ?? 0;
  const toolMin = toolMonthlyCostMin ?? toolMonthlyCostMax ?? 0;
  const budgetMax = budget.max ?? Infinity;
  const budgetMin = budget.min ?? 0;

  // Tool is above stated budget
  if (toolMin > budgetMax) return 'above_budget';

  // Tool is significantly below stated budget floor
  if (budget.min !== null && budget.min > 0 && toolMax < budgetMin * 0.5) return 'below_budget';

  // Tool is within stated or implied range (within 20% tolerance on max)
  if (toolMax <= budgetMax * 1.2) return 'within_budget';

  // Edge case: budgetMax is tight and tool is slightly over
  if (toolMax <= budgetMax * 1.5) return 'within_budget';

  return 'above_budget';
}
