/**
 * Evaluation Corpus — programmatic annotation data.
 *
 * Each entry maps a report to human quality annotations across
 * 7 dimensions aligned with gate criteria. Used to validate
 * whether gate scores correlate with human judgment.
 *
 * Schema version: 1
 * Annotator: human (single annotator — expand to 2 for inter-rater reliability)
 */

export interface ReportAnnotation {
  /** Unique report identifier (matches report directory name). */
  reportId: string;
  /** Human-readable label. */
  label: string;
  /** Source transcript quality assessment. */
  transcriptQuality: 'rich' | 'adequate' | 'sparse';
  /** Whether this was a production or test run. */
  source: 'production' | 'test';

  /** Dimension scores (1-10). */
  dimensions: {
    evidence_grounding: number;
    recommendation_credibility: number;
    client_specificity: number;
    financial_honesty: number;
    tone_communication: number;
    safety: number;
    overall_quality: number;
  };

  /** PBW pattern flags. */
  pbwFlags: {
    generic_platitudes: boolean;
    tool_worship: boolean;
    missing_real_pain: boolean;
    scale_mismatch: boolean;
    buzzword_padding: boolean;
    automating_chaos: boolean;
    never_rule_violated: boolean;
  };

  /** Structural completeness checks. */
  structural: {
    allSectionsPresent: boolean;
    executiveSummarySpecific: boolean;
    painPointsHaveTemporalAnchors: boolean;
    quickWinsHaveEffortImpactTime: boolean;
    deeperOpportunitiesHaveCostValue: boolean;
    toolsHavePricing: boolean;
    roadmapHasTimelinePhases: boolean;
    financialImpactHasArithmeticChain: boolean;
  };

  /** Qualitative notes per dimension. */
  notes: {
    evidence_grounding: string;
    recommendation_credibility: string;
    client_specificity: string;
    financial_honesty: string;
    tone_communication: string;
    safety: string;
    overall: string;
  };

  /** Annotation metadata. */
  annotatedAt: string;
  annotator: string;
}

/**
 * Corpus annotations — 5 reports of varying quality.
 */
export const CORPUS: ReportAnnotation[] = [
  {
    reportId: '1777639921371-cs_test_full_workflow_1777639858843',
    label: 'Harbour Workflow Co',
    transcriptQuality: 'adequate',
    source: 'test',
    dimensions: {
      evidence_grounding: 7,
      recommendation_credibility: 8,
      client_specificity: 6,
      financial_honesty: 6,
      tone_communication: 8,
      safety: 9,
      overall_quality: 7
    },
    pbwFlags: {
      generic_platitudes: false,
      tool_worship: false,
      missing_real_pain: false,
      scale_mismatch: false,
      buzzword_padding: false,
      automating_chaos: false,
      never_rule_violated: false
    },
    structural: {
      allSectionsPresent: true,
      executiveSummarySpecific: true,
      painPointsHaveTemporalAnchors: true,
      quickWinsHaveEffortImpactTime: true,
      deeperOpportunitiesHaveCostValue: true,
      toolsHavePricing: true,
      roadmapHasTimelinePhases: true,
      financialImpactHasArithmeticChain: true
    },
    notes: {
      evidence_grounding: '"Six hours a week" is traceable. "Copying email enquiries into a spreadsheet" is specific. Hourly rate ($100) source unclear.',
      recommendation_credibility: 'HubSpot CRM + Zapier are reasonable. "Deploy a simple CRM" is specific and actionable.',
      client_specificity: '"Harbour Workflow Co" implies consulting. Could apply to many service businesses. Somewhat generic.',
      financial_honesty: 'Arithmetic chain present. $100/hr feels assumed, not stated. 5hrs × $100 × 48 wks = $24,000 → net $23,100. Correct math but unverified rate.',
      tone_communication: 'Calm, advisory tone. "Ready for a phased approach" is measured.',
      safety: 'No regulated advice. No "will save" language. Clean.',
      overall: 'Solid report. Would deliver but hourly rate assumption weakens credibility.'
    },
    annotatedAt: '2026-05-28T00:00:00Z',
    annotator: 'human-single'
  },
  {
    reportId: '1777640186476-cs_test_full_workflow_1777640124669',
    label: 'Lorie Test Business',
    transcriptQuality: 'sparse',
    source: 'test',
    dimensions: {
      evidence_grounding: 5,
      recommendation_credibility: 6,
      client_specificity: 4,
      financial_honesty: 5,
      tone_communication: 7,
      safety: 9,
      overall_quality: 5
    },
    pbwFlags: {
      generic_platitudes: true,
      tool_worship: false,
      missing_real_pain: false,
      scale_mismatch: false,
      buzzword_padding: false,
      automating_chaos: false,
      never_rule_violated: false
    },
    structural: {
      allSectionsPresent: true,
      executiveSummarySpecific: false,
      painPointsHaveTemporalAnchors: true,
      quickWinsHaveEffortImpactTime: true,
      deeperOpportunitiesHaveCostValue: true,
      toolsHavePricing: true,
      roadmapHasTimelinePhases: true,
      financialImpactHasArithmeticChain: true
    },
    notes: {
      evidence_grounding: '"Lost leads" and "poor visibility" — no specific numbers. "Manual spreadsheet data entry" is generic.',
      recommendation_credibility: 'HubSpot CRM at $0/month misleading. Free tier limited. Same generic CRM advice as Report 1.',
      client_specificity: '"Local service business" — vague. Swap test: works for plumber, electrician, any service business.',
      financial_honesty: '$50/hr assumed — source unclear. 5 hours saved (same as Report 1 — suspicious). HubSpot at $0 partially misleading.',
      tone_communication: 'Professional but vague. "Streamline operations" is generic language.',
      safety: 'Clean. No regulated advice or over-promises.',
      overall: 'Adequate but generic. Could be about any service business. Financial assumptions unsourced.'
    },
    annotatedAt: '2026-05-28T00:00:00Z',
    annotator: 'human-single'
  },
  {
    reportId: '1777640661879-cs_test_presenton_1777640479621',
    label: 'Deck Verification Services',
    transcriptQuality: 'adequate',
    source: 'test',
    dimensions: {
      evidence_grounding: 6,
      recommendation_credibility: 7,
      client_specificity: 7,
      financial_honesty: 6,
      tone_communication: 8,
      safety: 9,
      overall_quality: 7
    },
    pbwFlags: {
      generic_platitudes: false,
      tool_worship: false,
      missing_real_pain: false,
      scale_mismatch: false,
      buzzword_padding: false,
      automating_chaos: false,
      never_rule_violated: false
    },
    structural: {
      allSectionsPresent: true,
      executiveSummarySpecific: true,
      painPointsHaveTemporalAnchors: true,
      quickWinsHaveEffortImpactTime: true,
      deeperOpportunitiesHaveCostValue: true,
      toolsHavePricing: true,
      roadmapHasTimelinePhases: true,
      financialImpactHasArithmeticChain: true
    },
    notes: {
      evidence_grounding: 'Generic pain points but "Deck Verification" is niche, adding authenticity. Executive summary is adequate.',
      recommendation_credibility: '4 tools (HubSpot, Zapier, Typeform, Tidio) — reasonable stack. Typeform for structured intake is good.',
      client_specificity: '"Deck Verification Services" is specific. "Verification standards, pricing guidelines" shows domain awareness.',
      financial_honesty: '$75/hr assumed — unclear source. Arithmetic correct but rate provenance missing.',
      tone_communication: 'Professional. Phase names are industry-appropriate.',
      safety: 'Clean.',
      overall: 'Better than Report 2. Industry specificity adds credibility. Tools are thoughtfully selected. Still has hourly rate assumption.'
    },
    annotatedAt: '2026-05-28T00:00:00Z',
    annotator: 'human-single'
  },
  {
    reportId: '1777681146818-test-1777681016580',
    label: 'Test Marketing Agency (v1)',
    transcriptQuality: 'rich',
    source: 'test',
    dimensions: {
      evidence_grounding: 9,
      recommendation_credibility: 9,
      client_specificity: 9,
      financial_honesty: 5,
      tone_communication: 8,
      safety: 9,
      overall_quality: 8
    },
    pbwFlags: {
      generic_platitudes: false,
      tool_worship: false,
      missing_real_pain: false,
      scale_mismatch: false,
      buzzword_padding: false,
      automating_chaos: false,
      never_rule_violated: false
    },
    structural: {
      allSectionsPresent: true,
      executiveSummarySpecific: true,
      painPointsHaveTemporalAnchors: true,
      quickWinsHaveEffortImpactTime: true,
      deeperOpportunitiesHaveCostValue: true,
      toolsHavePricing: true,
      roadmapHasTimelinePhases: true,
      financialImpactHasArithmeticChain: true
    },
    notes: {
      evidence_grounding: 'Excellent. "Every Monday 3-4 hours," "200 emails/day," "6 hours/week." All specific, quotable, traceable.',
      recommendation_credibility: '4 Quick Wins map to specific pain points. Tools appropriate: Zapier, SaneBox, Fireflies.ai, Canva.',
      client_specificity: '"8-person digital marketing agency" is very specific. Tools are marketing-agency appropriate. "Client portal owner wanted for 2 years."',
      financial_honesty: 'CRITICAL: $25/hr rate for agency owner is severely understated. Drastically understates value. $25×10=$250/wk=$13k/yr. At $100/hr: $52k/yr. Rate should be flagged.',
      tone_communication: 'Good balance. "Soul-crushingly" adds authenticity without being unprofessional.',
      safety: 'Clean.',
      overall: 'Best report in corpus but $25/hr rate significantly understates value. Financial dimension drags down otherwise excellent quality.'
    },
    annotatedAt: '2026-05-28T00:00:00Z',
    annotator: 'human-single'
  },
  {
    reportId: '1777681614223-test-1777681470638',
    label: 'Test Marketing Agency (v2)',
    transcriptQuality: 'rich',
    source: 'test',
    dimensions: {
      evidence_grounding: 8,
      recommendation_credibility: 8,
      client_specificity: 9,
      financial_honesty: 7,
      tone_communication: 8,
      safety: 9,
      overall_quality: 7
    },
    pbwFlags: {
      generic_platitudes: false,
      tool_worship: false,
      missing_real_pain: false,
      scale_mismatch: false,
      buzzword_padding: false,
      automating_chaos: false,
      never_rule_violated: false
    },
    structural: {
      allSectionsPresent: true,
      executiveSummarySpecific: true,
      painPointsHaveTemporalAnchors: true,
      quickWinsHaveEffortImpactTime: true,
      deeperOpportunitiesHaveCostValue: true,
      toolsHavePricing: true,
      roadmapHasTimelinePhases: true,
      financialImpactHasArithmeticChain: true
    },
    notes: {
      evidence_grounding: 'Same high-quality transcript evidence as v1. Quick Win hour estimates differ from v1 (6→3 for design, 4→5 for email).',
      recommendation_credibility: 'Same tools, similar recs. Pricing differences: Fireflies $15→$25, SaneBox $7→$15.',
      client_specificity: 'Same high specificity. "Owner explicitly prioritises automated client dashboards" — adds priority signal.',
      financial_honesty: '$50/hr vs $25/hr in v1 — improvement. But inconsistency across runs for same input is a concern. 10hrs×$50=$500/wk=$26k/yr. Net $24,920.',
      tone_communication: 'Same professional quality.',
      safety: 'Clean.',
      overall: 'Good report individually, but v1/v2 inconsistency (different rate, different hours, different tool prices) is a trust concern. Individual quality: 8. Consistency penalty: -1.'
    },
    annotatedAt: '2026-05-28T00:00:00Z',
    annotator: 'human-single'
  }
];

/**
 * Compute aggregate corpus statistics.
 */
export function computeCorpusStats(corpus: ReportAnnotation[]) {
  const dims = [
    'evidence_grounding',
    'recommendation_credibility',
    'client_specificity',
    'financial_honesty',
    'tone_communication',
    'safety',
    'overall_quality'
  ] as const;

  const averages: Record<string, number> = {};
  for (const dim of dims) {
    averages[dim] = corpus.reduce((sum, r) => sum + r.dimensions[dim], 0) / corpus.length;
  }

  const pbwRate = (flag: keyof ReportAnnotation['pbwFlags']) =>
    corpus.filter(r => r.pbwFlags[flag]).length / corpus.length;

  const transcriptQualityDist = {
    rich: corpus.filter(r => r.transcriptQuality === 'rich').length,
    adequate: corpus.filter(r => r.transcriptQuality === 'adequate').length,
    sparse: corpus.filter(r => r.transcriptQuality === 'sparse').length
  };

  // Correlation between transcript quality and overall quality
  const qualityByTranscript: Record<string, number[]> = { rich: [], adequate: [], sparse: [] };
  for (const r of corpus) {
    qualityByTranscript[r.transcriptQuality].push(r.dimensions.overall_quality);
  }
  const transcriptQualityAvg: Record<string, number> = {};
  for (const [key, scores] of Object.entries(qualityByTranscript)) {
    transcriptQualityAvg[key] = scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  }

  return {
    corpusSize: corpus.length,
    dimensionAverages: averages,
    pbwFlagRates: {
      generic_platitudes: pbwRate('generic_platitudes'),
      tool_worship: pbwRate('tool_worship'),
      missing_real_pain: pbwRate('missing_real_pain'),
      scale_mismatch: pbwRate('scale_mismatch'),
      buzzword_padding: pbwRate('buzzword_padding'),
      automating_chaos: pbwRate('automating_chaos'),
      never_rule_violated: pbwRate('never_rule_violated')
    },
    transcriptQualityDistribution: transcriptQualityDist,
    overallQualityByTranscriptQuality: transcriptQualityAvg,
    weakestDimension: Object.entries(averages).sort((a, b) => a[1] - b[1])[0][0],
    strongestDimension: Object.entries(averages).sort((a, b) => b[1] - a[1])[0][0],
    overallQualityRange: {
      min: Math.min(...corpus.map(r => r.dimensions.overall_quality)),
      max: Math.max(...corpus.map(r => r.dimensions.overall_quality))
    }
  };
}

/**
 * Compute correlation between gate scores and human overall_quality.
 * This is the critical validation: do gates predict human judgment?
 *
 * @param gateResults — Array of { reportId, gateType, passed, confidence, tasteScores? }
 * @param corpus — Human annotations
 * @returns Pearson correlation coefficient and interpretation
 */
export function computeGateHumanCorrelation(
  gateResults: Array<{
    reportId: string;
    gateType: string;
    passed: boolean;
    confidence: number;
    tasteScores?: Record<string, number>;
  }>,
  corpus: ReportAnnotation[]
): {
  gatePassVsQuality: number;
  gateConfidenceVsQuality: number;
  interpretation: string;
} {
  // Build a lookup of human quality scores by reportId
  const qualityMap = new Map<string, number>();
  for (const r of corpus) {
    qualityMap.set(r.reportId, r.dimensions.overall_quality);
  }

  // Align gate results with human scores
  const pairs: Array<{ quality: number; passed: number; confidence: number }> = [];
  for (const gr of gateResults) {
    const quality = qualityMap.get(gr.reportId);
    if (quality !== undefined) {
      pairs.push({
        quality,
        passed: gr.passed ? 1 : 0,
        confidence: gr.confidence
      });
    }
  }

  if (pairs.length < 3) {
    return {
      gatePassVsQuality: 0,
      gateConfidenceVsQuality: 0,
      interpretation: `Insufficient data: only ${pairs.length} paired results. Need ≥3.`
    };
  }

  // Pearson correlation: pass vs quality
  const rPass = pearsonCorrelation(
    pairs.map(p => p.passed),
    pairs.map(p => p.quality)
  );

  // Pearson correlation: confidence vs quality
  const rConfidence = pearsonCorrelation(
    pairs.map(p => p.confidence),
    pairs.map(p => p.quality)
  );

  const interpretation =
    rConfidence >= 0.7
      ? `Strong correlation (r=${rConfidence.toFixed(2)}). Gate confidence is a valid proxy for human quality judgment. Proceed with AIAS-002.`
      : rConfidence >= 0.5
        ? `Moderate correlation (r=${rConfidence.toFixed(2)}). Gates partially predict quality but calibration needed. Consider weighted composite.`
        : `Weak correlation (r=${rConfidence.toFixed(2)}). Gates do not predict human quality judgments. Need to redesign gate criteria or use direct human evaluation.`;

  return {
    gatePassVsQuality: parseFloat(rPass.toFixed(3)),
    gateConfidenceVsQuality: parseFloat(rConfidence.toFixed(3)),
    interpretation
  };
}

/**
 * Compute Pearson correlation coefficient between two arrays.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}
