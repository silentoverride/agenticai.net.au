import type { AssessmentReportJob } from './types';

/**
 * Slide structure derived from docs/ai-tools-assessment-redacted.pptx
 *
 * The template has 9 slides with fixed layout and branded sections.
 * This mapper transforms the LLM analysis JSON into Presenton v3 from-json
 * slides that recreate the template structure.
 */

interface AnalysisReport {
  executive_summary?: string;
  pain_points?: Array<{
    title: string;
    description: string;
    severity: string;
    frequency: string;
  }>;
  quick_wins?: Array<{
    title: string;
    description: string;
    effort: string;
    impact: string;
    estimated_hours_saved_per_week: number;
    recommended_tools?: string[];
  }>;
  deeper_opportunities?: Array<{
    title: string;
    description: string;
    category: string;
    estimated_setup_cost_aud: number;
    estimated_monthly_value_aud: number;
  }>;
  tool_recommendations?: Array<{
    name: string;
    category: string;
    purpose: string;
    estimated_monthly_cost_aud: number;
    setup_complexity: string;
  }>;
  implementation_roadmap?: Array<{
    phase: string;
    week: string;
    actions: string[];
  }>;
  financial_impact?: {
    hours_saved_per_week: number;
    hourly_rate_assumed_aud: number;
    weekly_value_aud: number;
    annual_value_aud: number;
    estimated_tool_costs_monthly_aud: number;
    net_annual_value_aud: number;
  };
  researched_tools?: Array<{
    name: string;
    url: string;
    description: string;
    pricing: string;
    category: string;
    source: string;
  }>;
}

function parseAnalysis(analysisJson: string): AnalysisReport {
  try {
    return JSON.parse(analysisJson);
  } catch {
    return {};
  }
}

function formatDate(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

/**
 * Build Presenton v3 from-json payload matching the redacted PPTX template.
 */
export function buildTemplateSlides(analysisJson: string, job: AssessmentReportJob): any[] {
  const analysis = parseAnalysis(analysisJson);
  const company = job.company || job.customerName || 'Your Business';
  const date = formatDate();

  // ── Slide 1: Title ──
  const slides: any[] = [
    {
      type: 'title',
      title: 'AI Tools Assessment',
      subtitle: `Prepared for ${company}\nAssessment Date: ${date}`
    }
  ];

  // ── Slide 2: Executive Summary ──
  const painSummary = analysis.pain_points
    ?.map(p => p.description)
    .slice(0, 3)
    .join(', ');
  const outcome = analysis.executive_summary ||
    `Targeted tool additions and better process automation can return ${analysis.financial_impact?.hours_saved_per_week || 'X'}+ hours per week.`;

  slides.push({
    type: 'content',
    title: 'Executive Summary',
    bullets: [
      `**Pain:** ${painSummary || 'Manual work and process friction are consuming valuable time.'}`,
      `**Outcome:** ${outcome}`
    ]
  });

  // ── Slide 3: The Opportunity at a Glance ──
  const hours = analysis.financial_impact?.hours_saved_per_week ?? '—';
  const focus = analysis.quick_wins?.length
    ? 'Efficiency (Time Savings)'
    : 'Process Optimisation';

  slides.push({
    type: 'content',
    title: 'The Opportunity at a Glance',
    bullets: [
      `**Hours You Can Reclaim Weekly:** ${hours}`,
      `**Primary Focus:** ${focus}`
    ]
  });

  // ── Slide 4: Impact-Effort Matrix ──
  const quickWins = analysis.quick_wins?.filter(w => w.effort === 'low' && w.impact === 'high') || [];
  const majorProjects = analysis.quick_wins?.filter(w => w.effort === 'high' && w.impact === 'high') || [];
  const fillIns = analysis.quick_wins?.filter(w => w.effort === 'low' && w.impact === 'low') || [];

  slides.push({
    type: 'content',
    title: 'Impact-Effort Matrix',
    bullets: [
      'Your pain points have been analyzed and placed into four quadrants based on their business impact and implementation effort.',
      'This report focuses on **Quick Wins** — the fixes that deliver the highest value with the least effort.',
      '',
      '**High Impact, Low Effort — Quick Wins:**',
      ...quickWins.map(w => `• ${w.title} → ${w.recommended_tools?.[0] || 'See recommendations'}`),
      '',
      '**High Impact, High Effort — Major Projects:**',
      ...majorProjects.map(w => `• ${w.title}`),
      '',
      '**Low Impact, Low Effort — Fill-ins:**',
      ...fillIns.map(w => `• ${w.title}`)
    ]
  });

  // ── Slide 5: Recommended Solutions (1 slide per quick win, max 4) ──
  const wins = analysis.quick_wins?.slice(0, 4) || [];
  for (const win of wins) {
    const toolName = win.recommended_tools?.[0] || 'TBD';
    const toolDetail = analysis.tool_recommendations?.find(
      t => toolName.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(toolName.toLowerCase().split(' ')[0])
    );
    const researched = analysis.researched_tools?.find(
      t => toolName.toLowerCase().includes(t.name.toLowerCase()) || t.name.toLowerCase().includes(toolName.toLowerCase().split(' ')[0])
    );

    const monthlyCost = toolDetail?.estimated_monthly_cost_aud
      ? `$${toolDetail.estimated_monthly_cost_aud}/month`
      : researched?.pricing || 'Pricing TBD';

    const complexity = toolDetail?.setup_complexity || 'medium';
    const setupTime = complexity === 'low' ? '15 minutes' : complexity === 'medium' ? '1–2 hours' : '1–2 days';

    slides.push({
      type: 'content',
      title: 'Recommended Solutions',
      bullets: [
        `**${win.title}**`,
        `Recommended Tool: ${toolName}${researched?.url ? ` (${researched.url})` : ''}`,
        `Why This Fits: ${win.description}`,
        `Complexity: ${complexity}`,
        `Monthly Cost: ${monthlyCost}`,
        `Setup Time: ${setupTime}`,
        `Time Saved: ${win.estimated_hours_saved_per_week || '?'} hours/week`
      ]
    });
  }

  // ── Slide 6: 4-Day Quick Wins Plan ──
  const planDays = wins.slice(0, 4).map((win, i) => ({
    day: i + 1,
    task: `Set up ${win.recommended_tools?.[0] || win.title}`,
    tool: win.recommended_tools?.[0] || 'TBD'
  }));

  slides.push({
    type: 'content',
    title: 'Your 4-Day Quick Wins Plan',
    bullets: planDays.map(d => `**Day ${d.day}:** ${d.task} — Tool: ${d.tool}`)
  });

  // ── Slide 7: What Comes After Quick Wins ──
  const deeper = analysis.deeper_opportunities?.slice(0, 3) || [];
  slides.push({
    type: 'content',
    title: 'What Comes After Quick Wins',
    bullets: deeper.map((opp, i) =>
      `${String(i + 1).padStart(2, '0')} **${opp.title}** — ${opp.description}`
    )
  });

  // ── Slide 8: Financial Impact ──
  const fi = analysis.financial_impact;
  const weeklyHours = fi?.hours_saved_per_week ?? '—';
  const monthlyROI = fi?.net_annual_value_aud
    ? `$${Math.round(fi.net_annual_value_aud / 12).toLocaleString()}`
    : '—';
  const monthlyCost = fi?.estimated_tool_costs_monthly_aud ?? '—';

  slides.push({
    type: 'content',
    title: 'Financial Impact',
    bullets: [
      `**Weekly Time Returned:** ${weeklyHours} hours`,
      `**Monthly Net ROI:** ${monthlyROI}`,
      `**Total monthly tool cost:** $${monthlyCost}`
    ]
  });

  // ── Slide 9: Your Next Steps ──
  slides.push({
    type: 'content',
    title: 'Your Next Steps',
    bullets: [
      '1. **Implement the Quick Wins** — Follow the plan exactly as outlined to reclaim time and stabilize operations.',
      '2. **Schedule a 30-minute Review Call** — We\'ll review results, validate wins, and decide if deeper automation is warranted.'
    ]
  });

  return slides;
}

/**
 * Build the full Presenton v3 from-json payload.
 */
export function buildPresentonPayload(analysisJson: string, job: AssessmentReportJob): object {
  const company = job.company || job.customerName || 'AI Business';
  const slides = buildTemplateSlides(analysisJson, job);

  return {
    title: `${company} Assessment`,
    language: 'English',
    standard_template: 'neo-general',
    theme: 'professional-blue',
    export_as: 'pptx',
    slides
  };
}
