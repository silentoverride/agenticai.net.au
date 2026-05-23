/**
 * Structured analysis output types for the LLM analysis generation pipeline.
 */

/** Severity levels for identified pain points. */
export type Severity = 'high' | 'medium' | 'low';
export type Frequency = 'daily' | 'weekly' | 'monthly';
export type Effort = 'low' | 'medium' | 'high';
export type Impact = 'low' | 'medium' | 'high';
export type AutomationCategory = 'automation' | 'ai_agent' | 'process_optimisation' | 'knowledge_system';
export type SetupComplexity = 'low' | 'medium' | 'high';

export interface PainPoint {
  title: string;
  description: string;
  severity: Severity;
  frequency: Frequency;
}

export interface QuickWin {
  title: string;
  description: string;
  effort: Effort;
  impact: Impact;
  estimated_hours_saved_per_week: number;
  recommended_tools?: string[];
}

export interface DeeperOpportunity {
  title: string;
  description: string;
  category: AutomationCategory;
  estimated_setup_cost_aud: number;
  estimated_monthly_value_aud: number;
}

export interface ToolRecommendation {
  name: string;
  category: string;
  purpose: string;
  estimated_monthly_cost_aud: number;
  setup_complexity: SetupComplexity;
}

export interface ImplementationPhase {
  phase: number;
  week: string;
  actions: string[];
}

export interface FinancialImpact {
  hours_saved_per_week: number;
  hourly_rate_assumed_aud: number;
  weekly_value_aud: number;
  annual_value_aud: number;
  estimated_tool_costs_monthly_aud: number;
  net_annual_value_aud: number;
}

/**
 * Structured analysis output from the LLM analysis generation pipeline.
 * This is the canonical format for all assessment analyses.
 */
export interface StructuredAnalysis {
  executive_summary: string;
  pain_points: PainPoint[];
  quick_wins: QuickWin[];
  deeper_opportunities: DeeperOpportunity[];
  tool_recommendations: ToolRecommendation[];
  implementation_roadmap: ImplementationPhase[];
  financial_impact: FinancialImpact;
}

/** Required fields that MUST be present in a valid analysis. */
export const REQUIRED_ANALYSIS_FIELDS: (keyof StructuredAnalysis)[] = [
  'executive_summary',
  'pain_points',
  'quick_wins',
  'deeper_opportunities',
  'tool_recommendations',
  'implementation_roadmap',
  'financial_impact'
];

/**
 * Validate a parsed analysis object.
 * Returns { valid: true } or { valid: false, errors: string[] }.
 */
export function validateAnalysis(raw: unknown): { valid: true; analysis: StructuredAnalysis } | { valid: false; errors: string[] } {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Analysis is not an object'] };
  }

  const obj = raw as Record<string, unknown>;
  const errors: string[] = [];

  // Check required fields
  for (const field of REQUIRED_ANALYSIS_FIELDS) {
    if (!(field in obj)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate executive_summary
  if (typeof obj.executive_summary !== 'string' || obj.executive_summary.trim().length === 0) {
    errors.push('executive_summary must be a non-empty string');
  }

  // Validate arrays
  const arrayFields: (keyof StructuredAnalysis)[] = ['pain_points', 'quick_wins', 'deeper_opportunities', 'tool_recommendations', 'implementation_roadmap'];
  for (const field of arrayFields) {
    if (field in obj && (!Array.isArray(obj[field]) || obj[field].length === 0)) {
      errors.push(`${field} must be a non-empty array`);
    }
  }

  // Validate financial_impact
  if (obj.financial_impact && typeof obj.financial_impact === 'object') {
    const fi = obj.financial_impact as Record<string, unknown>;
    const numFields = ['hours_saved_per_week', 'hourly_rate_assumed_aud', 'weekly_value_aud', 'annual_value_aud', 'estimated_tool_costs_monthly_aud', 'net_annual_value_aud'];
    for (const f of numFields) {
      if (typeof fi[f] !== 'number') {
        errors.push(`financial_impact.${f} must be a number`);
      }
    }
  } else if ('financial_impact' in obj) {
    errors.push('financial_impact must be an object');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, analysis: obj as unknown as StructuredAnalysis };
}

/**
 * Extract the structured analysis from a raw LLM JSON response string.
 * Returns the parsed and validated analysis, or throws if invalid.
 */
export function parseAndValidateAnalysis(rawJson: string): StructuredAnalysis {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Analysis LLM response is not valid JSON');
  }

  const result = validateAnalysis(parsed);
  if (!result.valid) {
    throw new Error(`Analysis validation failed: ${result.errors.join('; ')}`);
  }

  return result.analysis;
}

/**
 * Default empty analysis for fallback/error scenarios.
 */
export function createDefaultAnalysis(errorMessage?: string): StructuredAnalysis {
  return {
    executive_summary: errorMessage
      ? `Analysis generation encountered an issue: ${errorMessage}. Please try again later.`
      : 'Analysis generation is in progress.',
    pain_points: [],
    quick_wins: [],
    deeper_opportunities: [],
    tool_recommendations: [],
    implementation_roadmap: [],
    financial_impact: {
      hours_saved_per_week: 0,
      hourly_rate_assumed_aud: 0,
      weekly_value_aud: 0,
      annual_value_aud: 0,
      estimated_tool_costs_monthly_aud: 0,
      net_annual_value_aud: 0
    }
  };
}
