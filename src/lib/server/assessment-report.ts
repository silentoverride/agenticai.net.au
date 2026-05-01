import { env } from '$env/dynamic/private';
import { llmChat } from './llm';
import { sendEmail } from './email';
import * as fs from 'node:fs';
import * as path from 'node:path';

export type AssessmentReportJob = {
  receivedAt: string;
  source: string;
  event?: string;
  callId?: string;
  sessionId?: string;
  agentId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  company?: string;
  paymentStatus?: string;
  transcript: string;
  transcriptObject?: unknown;
  transcriptWithToolCalls?: unknown;
  analysis?: unknown;
  metadata?: unknown;
  dynamicVariables?: unknown;
};

// --- Retell helpers ---

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
}

export function createAssessmentReportJob(payload: { event?: string; call?: Record<string, any> }): AssessmentReportJob | null {
  const call = payload.call || {};
  const dynamicVariables = (call.retell_llm_dynamic_variables || {}) as Record<string, unknown>;
  const metadata = (call.metadata || {}) as Record<string, unknown>;
  const callAnalysis = (call.call_analysis || {}) as Record<string, any>;
  const customAnalysis = (callAnalysis.custom_analysis_data || callAnalysis.custom_analysis || {}) as Record<string, unknown>;
  const transcript = firstString(call.transcript, call.transcript_text);

  if (!payload.event || !call.call_id || !transcript) {
    return null;
  }

  return {
    receivedAt: new Date().toISOString(),
    source: 'retell-voice-agent',
    event: payload.event,
    callId: String(call.call_id),
    agentId: firstString(call.agent_id),
    customerName: firstString(
      customAnalysis.caller_name,
      customAnalysis.customer_name,
      dynamicVariables.customer_name,
      metadata.customer_name
    ),
    customerEmail: firstString(
      customAnalysis.caller_email,
      customAnalysis.customer_email,
      dynamicVariables.customer_email,
      metadata.customer_email
    ),
    customerPhone: firstString(
      customAnalysis.caller_phone,
      customAnalysis.customer_phone,
      dynamicVariables.customer_phone,
      metadata.customer_phone,
      call.from_number
    ),
    company: firstString(customAnalysis.company, dynamicVariables.company, metadata.company),
    paymentStatus: firstString(customAnalysis.payment_status, dynamicVariables.payment_status, metadata.payment_status),
    transcript,
    transcriptObject: call.transcript_object,
    transcriptWithToolCalls: call.transcript_with_tool_calls,
    analysis: call.call_analysis,
    metadata: call.metadata,
    dynamicVariables: call.retell_llm_dynamic_variables
  };
}

// --- Cloudflare KV helpers (use Memory for dev) ---

const memoryTranscriptStore = new Map<string, { transcript: string; metadata: Record<string, unknown>; timestamp: number }>();

export function storeTranscript(callId: string, transcript: string, metadata?: Record<string, unknown>) {
  memoryTranscriptStore.set(callId, {
    transcript,
    metadata: metadata || {},
    timestamp: Date.now()
  });
}

export function getTranscript(callId: string) {
  return memoryTranscriptStore.get(callId);
}

export function deleteTranscript(callId: string) {
  memoryTranscriptStore.delete(callId);
}

// --- Local report persistence ---

const REPORTS_DIR = env.REPORTS_DIR || './app_data/reports';

function reportsDir() {
  const dir = path.resolve(REPORTS_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function reportId(job: AssessmentReportJob) {
  const base = job.callId || job.sessionId || Date.now().toString();
  return `${Date.now()}-${base}`;
}

function toMarkdown(job: AssessmentReportJob, analysis: string): string {
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

export interface SavedReport {
  id: string;
  dir: string;
  jsonPath: string;
  mdPath: string;
  deckUrl?: string;
}

export function saveReport(job: AssessmentReportJob, analysis: string, deckUrl?: string): SavedReport {
  const dir = reportsDir();
  const id = reportId(job);
  const subDir = path.join(dir, id);
  fs.mkdirSync(subDir, { recursive: true });

  const jsonPath = path.join(subDir, 'analysis.json');
  const mdPath = path.join(subDir, 'report.md');

  fs.writeFileSync(jsonPath, analysis, 'utf-8');
  fs.writeFileSync(mdPath, toMarkdown(job, analysis), 'utf-8');

  if (job.transcript) {
    fs.writeFileSync(path.join(subDir, 'transcript.txt'), job.transcript, 'utf-8');
  }

  const meta = {
    id,
    job: {
      callId: job.callId,
      sessionId: job.sessionId,
      source: job.source,
      customerName: job.customerName,
      customerEmail: job.customerEmail,
      customerPhone: job.customerPhone,
      company: job.company,
      receivedAt: job.receivedAt
    },
    deckUrl: deckUrl || null,
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(path.join(subDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');

  console.info('Report saved locally', { id, jsonPath, mdPath });
  return { id, dir: subDir, jsonPath, mdPath, deckUrl };
}

export function listReports(): SavedReport[] {
  const dir = reportsDir();
  if (!fs.existsSync(dir)) return [];

  const items = fs.readdirSync(dir)
    .map((name) => {
      const subDir = path.join(dir, name);
      if (!fs.statSync(subDir).isDirectory()) return null;
      const metaPath = path.join(subDir, 'meta.json');
      if (!fs.existsSync(metaPath)) return null;
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
        return {
          id: meta.id || name,
          dir: subDir,
          jsonPath: path.join(subDir, 'analysis.json'),
          mdPath: path.join(subDir, 'report.md'),
          deckUrl: meta.deckUrl || undefined
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as SavedReport[];

  // newest first
  return items.sort((a, b) => b.id.localeCompare(a.id));
}

export function getReport(id: string): SavedReport | null {
  const dir = path.resolve(reportsDir(), id);
  if (!fs.existsSync(dir)) return null;
  if (!fs.existsSync(path.join(dir, 'analysis.json'))) return null;
  const metaPath = path.join(dir, 'meta.json');
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    : {};
  return {
    id,
    dir,
    jsonPath: path.join(dir, 'analysis.json'),
    mdPath: path.join(dir, 'report.md'),
    deckUrl: meta.deckUrl || undefined
  };
}

// --- LLM Analysis ---

function buildAnalysisMessages(transcript: string, job: AssessmentReportJob) {
  return [
    {
      role: 'system' as const,
      content: `You are an expert AI Business Assessment analyst. Analyze a business owner interview transcript and produce a structured assessment report in strict JSON format.

Output must be a valid JSON object with these exact keys:
{
  "executive_summary": "2-3 sentences summarizing the biggest findings",
  "pain_points": [
    { "title": "string", "description": "string", "severity": "high|medium|low", "frequency": "daily|weekly|monthly" }
  ],
  "quick_wins": [
    { "title": "string", "description": "string", "effort": "low|medium|high", "impact": "low|medium|high", "estimated_hours_saved_per_week": number, "recommended_tools": ["Tool Name (category)"] }
  ],
  "deeper_opportunities": [
    { "title": "string", "description": "string", "category": "automation|ai_agent|process_optimisation|knowledge_system", "estimated_setup_cost_aud": number, "estimated_monthly_value_aud": number }
  ],
  "tool_recommendations": [
    { "name": "string", "category": "string", "purpose": "string", "estimated_monthly_cost_aud": number, "setup_complexity": "low|medium|high" }
  ],
  "implementation_roadmap": [
    { "phase": "string", "week": "1-2|3-4|5-8", "actions": ["string"] }
  ],
  "financial_impact": {
    "hours_saved_per_week": number,
    "hourly_rate_assumed_aud": number,
    "weekly_value_aud": number,
    "annual_value_aud": number,
    "estimated_tool_costs_monthly_aud": number,
    "net_annual_value_aud": number
  }
}

Rules:
- Only recommend real, off-the-shelf tools.
- Base ALL findings on the transcript. Do not hallucinate.
- Be conservative with estimates when the transcript is sparse.`,
    },
    {
      role: 'user' as const,
      content: `Analyze this business assessment interview transcript and return a JSON report.

${job.company ? `Company: ${job.company}` : ''}
${job.customerName ? `Owner: ${job.customerName}` : ''}

TRANSCRIPT START:
${transcript.length > 30000 ? transcript.slice(0, 30000) + '\n...[truncated]' : transcript}
TRANSCRIPT END`,
    }
  ];
}

async function analyzeTranscript(job: AssessmentReportJob): Promise<string> {
  const messages = buildAnalysisMessages(job.transcript, job);
  const response = await llmChat(messages, { temperature: 0.5, maxTokens: 8192, format: 'json' });

  // Validate JSON
  try {
    JSON.parse(response.content);
  } catch {
    console.warn('LLM response was not valid JSON, attempting to extract JSON block');
    const match = response.content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        JSON.parse(match[0]);
        return match[0];
      } catch {
        // Fall through
      }
    }
    throw new Error('LLM returned invalid JSON for assessment analysis');
  }

  return response.content;
}

// --- Presenton Deck Generation ---

async function generatePresentonDeck(analysisJson: string, job: AssessmentReportJob): Promise<string> {
  const apiKey = env.PRESENTON_API_KEY;
  const apiUrl = env.PRESENTON_API_URL || 'https://api.presenton.ai/v1';

  if (!apiKey) {
    console.warn('PRESENTON_API_KEY not configured, skipping deck generation.');
    return '';
  }

  try {
    const response = await fetch(`${apiUrl}/presentations`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        title: `${job.company || job.customerName || 'AI Business'} Assessment`,
        subtitle: 'Workflow pain points, quick wins, and implementation roadmap',
        content: analysisJson,
        template: 'business-assessment-v1',
        format: 'pptx',
        sections: [
          { type: 'executive_summary', title: 'Executive Summary' },
          { type: 'pain_points', title: 'Pain Points' },
          { type: 'quick_wins', title: 'Quick Wins' },
          { type: 'tools', title: 'Recommended Tools' },
          { type: 'roadmap', title: 'Implementation Roadmap' },
          { type: 'financial_impact', title: 'Financial Impact' }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text().catch(() => '');
      console.error('Presenton generation failed:', response.status, error);
      return '';
    }

    const data = await response.json();
    return data.download_url || data.url || '';
  } catch (error) {
    console.error('Presenton API call failed:', error);
    return '';
  }
}

// --- Pipeline Orchestrator ---

export interface PipelineResult {
  queued: boolean;
  savedReport?: SavedReport;
  deckUrl?: string;
  destination: string;
  emailSent?: boolean;
  emailId?: string;
}

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

  // Step 2: Presenton Deck
  let deckUrl = '';
  try {
    deckUrl = await generatePresentonDeck(analysis, job);
    console.info('Presenton deck generated', { callId: job.callId, url: deckUrl });
  } catch (error) {
    console.error('Presenton deck generation failed:', error);
    // Don't fail the pipeline if Presenton fails — analysis is still useful
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
      const { sendEmail } = await import('./email');
      emailResult = await sendEmail({
        to: job.customerEmail,
        subject: `AI Business Assessment Report — ${job.company || 'Your Business'}`,
        html: `<p>Hi ${job.customerName || 'there'},</p>
<p>Your AI Business Assessment report is ready. Here is a summary:</p>
${deckUrl ? `<p><strong>Download your presentation:</strong> <a href="${deckUrl}">${deckUrl}</a></p>` : ''}
<p>If you have questions or want to book a follow-up call, reply to this email or contact us at <a href="mailto:hello@agenticai.net.au">hello@agenticai.net.au</a>.</p>
<p>— Agentic AI</p>`,
        text: `Hi ${job.customerName || 'there'},\n\nYour AI Business Assessment report is ready.${deckUrl ? `\n\nDownload your presentation: ${deckUrl}` : ''}\n\nIf you have questions, reply to this email or contact hello@agenticai.net.au.\n\n— Agentic AI`
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

// --- Backward compat for callers that expect { queued, destination } ---
export async function pipeAssessmentReportJob(job: AssessmentReportJob): Promise<PipelineResult> {
  return runReportPipeline(job);
}
