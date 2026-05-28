/**
 * Story 9.2 — Multi-Artifact Report Output (HCMW-002)
 *
 * Tests for artifact extraction and cross-artifact consistency validation.
 */

import { describe, it, expect } from 'vitest';
import { extractArtifacts, checkCrossArtifactConsistency } from '../../src/lib/server/assessment/artifact-extraction';
import type { StructuredAnalysis } from '../../src/lib/server/assessment/analysis-types';
import type { AssessmentArtifacts } from '../../src/lib/server/assessment/types';

// ============================================================================
// Test fixtures
// ============================================================================

function makeCompleteAnalysis(): StructuredAnalysis {
  return {
    executive_summary: 'Acme Corp is losing 15 hours per week to manual reporting. We recommend Zapier automation (Quick Win) followed by a CRM migration (Phase 2). Estimated annual value: $28,800 after tool costs.',
    pain_points: [
      { title: 'Manual Reporting', description: 'Staff spend 10h/week on Excel reports', severity: 'high', frequency: 'weekly' },
      { title: 'Lead Tracking Gaps', description: 'Leads fall through cracks between email and spreadsheet', severity: 'high', frequency: 'daily' },
      { title: 'No Customer Portal', description: 'Clients email for status updates', severity: 'medium', frequency: 'daily' }
    ],
    quick_wins: [
      { title: 'Automate Reporting with Zapier', description: 'Connect Google Sheets to email reports', effort: 'low', impact: 'high', estimated_hours_saved_per_week: 10, recommended_tools: ['Zapier', 'Google Sheets'] },
      { title: 'Set up CRM Lead Pipeline', description: 'Track leads from first contact to close', effort: 'medium', impact: 'high', estimated_hours_saved_per_week: 5, recommended_tools: ['HubSpot'] }
    ],
    deeper_opportunities: [
      { title: 'AI Chatbot for Client Portal', description: 'Self-service status updates', category: 'ai_agent', estimated_setup_cost_aud: 15000, estimated_monthly_value_aud: 2000 }
    ],
    tool_recommendations: [
      { name: 'Zapier', category: 'Automation', purpose: 'Connect apps and automate workflows without code — addresses manual reporting pain point', estimated_monthly_cost_aud: 50, setup_complexity: 'low' },
      { name: 'HubSpot', category: 'CRM', purpose: 'Track leads through pipeline and automate follow-ups — addresses lead tracking gaps', estimated_monthly_cost_aud: 100, setup_complexity: 'medium' }
    ],
    implementation_roadmap: [
      { phase: 1, week: '1-2', actions: ['Set up Zapier automation for weekly reports', 'Configure Zapier to send automated reports to management', 'Train staff on Zapier workflows'] },
      { phase: 2, week: '3-4', actions: ['Migrate lead data to HubSpot CRM', 'Set up lead pipeline stages in HubSpot', 'Configure automated follow-up emails via HubSpot'] },
      { phase: 3, week: '5-8', actions: ['Evaluate AI chatbot options', 'Scope client portal MVP'] }
    ],
    financial_impact: {
      hours_saved_per_week: 15,
      hourly_rate_assumed_aud: 40,
      weekly_value_aud: 600,
      annual_value_aud: 28800,
      estimated_tool_costs_monthly_aud: 150,
      net_annual_value_aud: 27000
    }
  };
}

function makeDefaultAnalysis(): StructuredAnalysis {
  return {
    executive_summary: 'Analysis generation encountered an issue. Please try again later.',
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

function makeMinimalAnalysis(): StructuredAnalysis {
  return {
    executive_summary: 'Minimal assessment.',
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

// ============================================================================
// extractArtifacts tests
// ============================================================================

describe('extractArtifacts', () => {
  it('produces all 4 artifacts from a complete analysis', () => {
    const analysis = makeCompleteAnalysis();
    const result = extractArtifacts(analysis, 'Acme Corp');

    // Executive Summary
    expect(result.executive_summary.company).toBe('Acme Corp');
    expect(result.executive_summary.summary).toBe(analysis.executive_summary);
    expect(result.executive_summary.key_findings).toHaveLength(3); // top 3 pain points
    expect(result.executive_summary.key_findings[0]).toBe('Manual Reporting');
    expect(result.executive_summary.top_recommendation).toBe('Automate Reporting with Zapier');
    expect(result.executive_summary.financial_impact_summary).toContain('15 hours saved per week');
    expect(result.executive_summary.financial_impact_summary).toContain('$28,800');

    // Detailed Findings
    expect(result.detailed_findings.pain_points).toHaveLength(3);
    expect(result.detailed_findings.quick_wins).toHaveLength(2);
    expect(result.detailed_findings.deeper_opportunities).toHaveLength(1);
    expect(result.detailed_findings.evidence_summary).toBeTruthy();
    expect(result.detailed_findings.generated_at).toBeTruthy();

    // Tool Matrix
    expect(result.tool_matrix.tools).toHaveLength(2);
    expect(result.tool_matrix.tools[0].name).toBe('Zapier');
    expect(result.tool_matrix.tools[1].name).toBe('HubSpot');
    expect(result.tool_matrix.total_estimated_monthly_cost_aud).toBe(150);
    expect(result.tool_matrix.tool_selection_rationale).toContain('Automation');
    expect(result.tool_matrix.tool_selection_rationale).toContain('CRM');

    // Roadmap
    expect(result.implementation_roadmap.phases).toHaveLength(3);
    expect(result.implementation_roadmap.timeline_summary).toBeTruthy();
    expect(result.implementation_roadmap.dependencies).toHaveLength(2); // Phase 2→1, Phase 3→2
    expect(result.implementation_roadmap.risk_factors.length).toBeGreaterThan(0);

    // Consistency Report
    expect(result.consistency_report.checks_performed).toHaveLength(5);
  });

  it('handles default/fallback analysis with graceful placeholders', () => {
    const analysis = makeDefaultAnalysis();
    const result = extractArtifacts(analysis, 'Unknown Corp');

    // Executive Summary
    expect(result.executive_summary.company).toBe('Unknown Corp');
    expect(result.executive_summary.summary).toContain('encountered an issue');
    expect(result.executive_summary.key_findings[0]).toContain('No key findings');
    expect(result.executive_summary.top_recommendation).toContain('No recommendation available');
    expect(result.executive_summary.financial_impact_summary).toContain('not estimated');

    // Detailed Findings
    expect(result.detailed_findings.pain_points).toHaveLength(0);
    expect(result.detailed_findings.quick_wins).toHaveLength(0);
    expect(result.detailed_findings.deeper_opportunities).toHaveLength(0);

    // Tool Matrix
    expect(result.tool_matrix.tools).toHaveLength(0);
    expect(result.tool_matrix.total_estimated_monthly_cost_aud).toBe(0);
    expect(result.tool_matrix.tool_selection_rationale).toContain('No tool recommendations');

    // Roadmap
    expect(result.implementation_roadmap.phases).toHaveLength(0);
    expect(result.implementation_roadmap.timeline_summary).toContain('No implementation phases');
  });

  it('handles empty arrays gracefully', () => {
    const analysis = makeMinimalAnalysis();
    const result = extractArtifacts(analysis, 'Test Corp');

    expect(result.executive_summary.key_findings[0]).toContain('No key findings');
    expect(result.executive_summary.top_recommendation).toContain('No recommendation available');
    expect(result.executive_summary.financial_impact_summary).toContain('not estimated');
    expect(result.detailed_findings.pain_points).toHaveLength(0);
    expect(result.tool_matrix.tools).toHaveLength(0);
    expect(result.implementation_roadmap.phases).toHaveLength(0);
  });

  it('handles single-tool and single-phase cases', () => {
    const analysis: StructuredAnalysis = {
      executive_summary: 'Single tool assessment.',
      pain_points: [{ title: 'Slow invoicing', description: 'Manual invoicing takes 5h/week', severity: 'medium', frequency: 'weekly' }],
      quick_wins: [{ title: 'Invoice Automation', description: 'Automate with Xero', effort: 'low', impact: 'medium', estimated_hours_saved_per_week: 5, recommended_tools: ['Xero'] }],
      deeper_opportunities: [],
      tool_recommendations: [{ name: 'Xero', category: 'Accounting', purpose: 'Automate invoicing', estimated_monthly_cost_aud: 70, setup_complexity: 'low' }],
      implementation_roadmap: [{ phase: 1, week: '1-2', actions: ['Set up Xero invoicing'] }],
      financial_impact: { hours_saved_per_week: 5, hourly_rate_assumed_aud: 40, weekly_value_aud: 200, annual_value_aud: 9600, estimated_tool_costs_monthly_aud: 70, net_annual_value_aud: 8760 }
    };

    const result = extractArtifacts(analysis, 'Solo Corp');

    expect(result.tool_matrix.tools).toHaveLength(1);
    expect(result.tool_matrix.tools[0].name).toBe('Xero');
    expect(result.tool_matrix.total_estimated_monthly_cost_aud).toBe(70);

    expect(result.implementation_roadmap.phases).toHaveLength(1);
    expect(result.implementation_roadmap.dependencies).toHaveLength(0); // single phase = no deps

    expect(result.executive_summary.top_recommendation).toBe('Invoice Automation');
    expect(result.executive_summary.key_findings).toHaveLength(1);
  });

  it('financial_impact_summary handles zero values', () => {
    const analysis = makeMinimalAnalysis();
    const result = extractArtifacts(analysis, 'Zero Corp');

    expect(result.executive_summary.financial_impact_summary).toBe('Financial impact not estimated — insufficient data.');
  });

  it('financial_impact_summary formats partial data', () => {
    const analysis: StructuredAnalysis = {
      ...makeMinimalAnalysis(),
      financial_impact: {
        hours_saved_per_week: 10,
        hourly_rate_assumed_aud: 50,
        weekly_value_aud: 500,
        annual_value_aud: 24000,
        estimated_tool_costs_monthly_aud: 100,
        net_annual_value_aud: 22800
      }
    };
    const result = extractArtifacts(analysis, 'Partial Corp');

    expect(result.executive_summary.financial_impact_summary).toContain('10 hours saved per week');
    expect(result.executive_summary.financial_impact_summary).toContain('$24,000');
    expect(result.executive_summary.financial_impact_summary).toContain('$22,800');
  });
});

// ============================================================================
// checkCrossArtifactConsistency tests
// ============================================================================

describe('checkCrossArtifactConsistency', () => {
  function makeConsistentArtifacts(): AssessmentArtifacts {
    const analysis = makeCompleteAnalysis();
    const result = extractArtifacts(analysis, 'Acme Corp');
    // Clear any auto-detected warnings for clean test baseline
    result.consistency_report = { verified: false, contradictions: [], warnings: [], checks_performed: [] };
    return result;
  }

  it('reports verified=true for fully consistent artifacts', () => {
    const artifacts = makeConsistentArtifacts();
    const report = checkCrossArtifactConsistency(artifacts);

    expect(report.verified).toBe(true);
    expect(report.contradictions).toHaveLength(0);
    // Warnings may exist (e.g., multi-tool adoption risk) but no contradictions
    expect(report.checks_performed).toHaveLength(5);
    expect(report.checks_performed).toContain('C1: Tool names in matrix must appear in roadmap actions');
  });

  it('detects tool in matrix but not referenced in roadmap', () => {
    const artifacts = makeConsistentArtifacts();
    // Add a tool that's in the matrix but NOT in the roadmap
    artifacts.tool_matrix.tools.push({
      name: 'Slack',
      category: 'Communication',
      purpose: 'Team messaging',
      estimated_monthly_cost_aud: 15,
      setup_complexity: 'low',
      estimated_hours_saved_per_week: 2,
      selection_rationale: 'Improves team communication.'
    });

    const report = checkCrossArtifactConsistency(artifacts);

    const slackWarning = report.warnings.find(w => w.description.includes('Slack'));
    expect(slackWarning).toBeDefined();
    expect(slackWarning!.severity).toBe('warning');
    expect(slackWarning!.locations).toContain('tool_matrix');
    expect(slackWarning!.locations).toContain('implementation_roadmap');
  });

  it('detects findings-pain-point misalignment', () => {
    const artifacts = makeConsistentArtifacts();
    // Set a key finding that doesn't match any pain point
    artifacts.executive_summary.key_findings = ['Fictional Pain Point That Does Not Match Anywhere'];

    const report = checkCrossArtifactConsistency(artifacts);

    const misalignmentWarning = report.warnings.find(w => w.check === 'C3: Findings-PainPoints alignment');
    expect(misalignmentWarning).toBeDefined();
    expect(misalignmentWarning!.description).toContain('Fictional Pain Point');
  });

  it('warns on single-phase roadmap with recommendations', () => {
    const analysis: StructuredAnalysis = {
      executive_summary: 'Single phase test.',
      pain_points: [{ title: 'Slow Process', description: 'Process too slow', severity: 'high', frequency: 'daily' }],
      quick_wins: [{ title: 'Speed Up Process', description: 'Optimize', effort: 'low', impact: 'high', estimated_hours_saved_per_week: 3, recommended_tools: ['ToolX'] }],
      deeper_opportunities: [],
      tool_recommendations: [{ name: 'ToolX', category: 'Productivity', purpose: 'Speed up workflow', estimated_monthly_cost_aud: 30, setup_complexity: 'low' }],
      implementation_roadmap: [{ phase: 1, week: '1-2', actions: ['Install ToolX', 'Configure ToolX'] }],
      financial_impact: { hours_saved_per_week: 3, hourly_rate_assumed_aud: 40, weekly_value_aud: 120, annual_value_aud: 5760, estimated_tool_costs_monthly_aud: 30, net_annual_value_aud: 5400 }
    };

    const artifacts = extractArtifacts(analysis, 'Single Phase Corp');
    const report = checkCrossArtifactConsistency(artifacts);

    const singlePhaseWarning = report.warnings.find(w => w.check === 'C6: Roadmap-Financial timeline alignment');
    expect(singlePhaseWarning).toBeDefined();
  });

  it('handles empty artifacts (no false positives)', () => {
    const emptyArtifacts: AssessmentArtifacts = {
      executive_summary: {
        company: 'Empty Corp',
        summary: 'No data.',
        key_findings: ['No key findings identified'],
        top_recommendation: 'No recommendation available.',
        financial_impact_summary: 'Financial impact not estimated — insufficient data.'
      },
      detailed_findings: {
        pain_points: [],
        quick_wins: [],
        deeper_opportunities: [],
        evidence_summary: 'No evidence coverage data available.',
        generated_at: new Date().toISOString()
      },
      tool_matrix: {
        tools: [],
        total_estimated_monthly_cost_aud: 0,
        tool_selection_rationale: 'No tool recommendations available.'
      },
      implementation_roadmap: {
        phases: [],
        timeline_summary: 'No implementation phases defined.',
        dependencies: [],
        risk_factors: ['No significant risk factors identified at plan time.']
      },
      consistency_report: { verified: false, contradictions: [], warnings: [], checks_performed: [] }
    };

    const report = checkCrossArtifactConsistency(emptyArtifacts);

    expect(report.verified).toBe(true);
    expect(report.contradictions).toHaveLength(0);
    // Warnings for findings-pain-point alignment are expected since finding is generic
  });

  it('returns verified=false when contradictions exist', () => {
    // Create a real inconsistency: tool in matrix but not in roadmap
    const artifacts = makeConsistentArtifacts();
    artifacts.tool_matrix.tools.push({
      name: 'UnusedTool',
      category: 'Unknown',
      purpose: 'No roadmap reference',
      estimated_monthly_cost_aud: 500,
      setup_complexity: 'high',
      estimated_hours_saved_per_week: 0,
      selection_rationale: 'Test tool.'
    });
    // Don't add to roadmap — this will cause a tool not in roadmap
    // Also create a contradiction explicitly: recommendations but no roadmap phases
    artifacts.implementation_roadmap.phases = [];

    const report = checkCrossArtifactConsistency(artifacts);
    expect(report.verified).toBe(false);
    expect(report.contradictions.length).toBeGreaterThan(0);
  });
});
