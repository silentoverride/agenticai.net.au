import type { AssessmentReportJob } from './types';

export function toMarkdown(job: AssessmentReportJob, analysis: string): string {
  let data: Record<string, any>;
  try {
    data = JSON.parse(analysis);
  } catch {
    data = { executive_summary: 'Analysis JSON could not be parsed.' };
  }

  const lines: string[] = [];
  lines.push(`# AI Business Assessment Report`);
  lines.push('');
  lines.push(`**Date:** ${new Date().toISOString()}`);
  if (job.company) lines.push(`**Company:** ${job.company}`);
  if (job.customerName) lines.push(`**Owner:** ${job.customerName}`);
  if (job.customerEmail) lines.push(`**Email:** ${job.customerEmail}`);
  if (job.customerPhone) lines.push(`**Phone:** ${job.customerPhone}`);
  lines.push(`**Source:** ${job.source}`);
  lines.push('');

  if (data.executive_summary) {
    lines.push(`## Executive Summary`);
    lines.push(data.executive_summary);
    lines.push('');
  }

  if (data.pain_points?.length) {
    lines.push(`## Pain Points`);
    for (const p of data.pain_points) {
      lines.push(`- **${p.title}** (${p.severity}, ${p.frequency}): ${p.description}`);
    }
    lines.push('');
  }

  if (data.quick_wins?.length) {
    lines.push(`## Quick Wins`);
    for (const q of data.quick_wins) {
      lines.push(`- **${q.title}** — ${q.description}`);
      lines.push(`  - Effort: ${q.effort}, Impact: ${q.impact}, ~${q.estimated_hours_saved_per_week} hrs/week saved`);
    }
    lines.push('');
  }

  if (data.deeper_opportunities?.length) {
    lines.push(`## Deeper Opportunities`);
    for (const o of data.deeper_opportunities) {
      lines.push(`- **${o.title}** — ${o.description}`);
      lines.push(`  - Setup cost: $${o.estimated_setup_cost_aud} AUD, Monthly value: $${o.estimated_monthly_value_aud} AUD`);
    }
    lines.push('');
  }

  if (data.tool_recommendations?.length) {
    lines.push(`## Recommended Tools`);
    for (const t of data.tool_recommendations) {
      lines.push(`- **${t.name}** (${t.category}) — ${t.purpose}`);
      lines.push(`  - ~$${t.estimated_monthly_cost_aud}/month | Setup: ${t.setup_complexity}`);
    }
    lines.push('');
  }

  if (data.implementation_roadmap?.length) {
    lines.push(`## Implementation Roadmap`);
    for (const r of data.implementation_roadmap) {
      lines.push(`### ${r.phase} (${r.week})`);
      for (const a of r.actions) {
        lines.push(`- ${a}`);
      }
      lines.push('');
    }
  }

  if (data.financial_impact) {
    const f = data.financial_impact;
    lines.push(`## Financial Impact`);
    lines.push(`- Hours saved per week: ${f.hours_saved_per_week}`);
    lines.push(`- Hourly rate assumed: $${f.hourly_rate_assumed_aud} AUD`);
    lines.push(`- Weekly value: $${f.weekly_value_aud} AUD`);
    lines.push(`- Annual value: $${f.annual_value_aud} AUD`);
    lines.push(`- Estimated tool costs: $${f.estimated_tool_costs_monthly_aud}/month`);
    lines.push(`- **Net annual value: $${f.net_annual_value_aud} AUD**`);
    lines.push('');
  }

  return lines.join('\n');
}
