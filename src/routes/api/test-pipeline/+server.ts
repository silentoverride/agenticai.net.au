import { json } from '@sveltejs/kit';
import { runReportPipeline } from '$lib/server/assessment/pipeline';
import * as fs from 'node:fs';
import type { RequestHandler } from './$types';

const MOCK_TRANSCRIPT = `
Interviewer: Hi, I'm calling from Agentic AI. We're offering free AI Business Assessments 
to help small businesses find quick wins with automation. Do you have 20 minutes?

Business Owner: Sure, I run a small digital marketing agency. We have about 8 people.

Interviewer: Great. What's your biggest time drain right now?

Business Owner: Honestly, manual reporting. Every Monday I spend 3-4 hours pulling data 
from Google Analytics, Meta Ads, and our scheduling tool into spreadsheets for clients. 
It's soul-crushing and I'm always behind.

Interviewer: That sounds painful. What else?

Business Owner: Meeting notes. We have daily standups and client check-ins but no one 
takes proper notes. Action items get lost, people forget what they agreed to do, and I 
end up chasing people on Slack.

Interviewer: Any other friction points?

Business Owner: Email. I'm CC'd on everything and get maybe 200 emails a day. Most are 
noise or sales outreach. I probably spend 2 hours just sorting through it.

Interviewer: What about design work?

Business Owner: Oh yeah — our senior designer spends maybe 6 hours a week on 
social media graphics and presentation decks that junior staff should be able to do. 
But they don't have templates or brand guidelines, so everything comes back to her.

Interviewer: If you could wave a magic wand and fix one thing, what would it be?

Business Owner: The reporting, definitely. If I could auto-generate client dashboards 
and free up those 3-4 hours every Monday, I'd actually have time to work on the business 
instead of in it.

Interviewer: And what would you do with that time?

Business Owner: Strategy, business development, maybe finally build that client portal 
I've been talking about for two years. Right now I'm too busy doing $25/hour work.

Interviewer: Last question — if you could implement one quick fix this week, what would it be?

Business Owner: Set up automated dashboards. Even if it's basic, just auto-pulling the 
numbers so I can review instead of compiling.
`;

export const POST: RequestHandler = async () => {
  const start = Date.now();

  try {
    const result = await runReportPipeline({
      receivedAt: new Date().toISOString(),
      source: 'test-pipeline',
      sessionId: `test-${Date.now()}`,
      customerName: 'Test Customer',
      customerEmail: 'test@example.com',
      customerPhone: '',
      company: 'Test Marketing Agency',
      transcript: MOCK_TRANSCRIPT
    });

    const duration = Date.now() - start;

    // Read analysis from saved report for preview
    let analysisPreview: string | null = null;
    try {
      if (result.savedReport?.jsonPath && fs.existsSync(result.savedReport.jsonPath)) {
        const analysisData = JSON.parse(fs.readFileSync(result.savedReport.jsonPath, 'utf-8'));
        analysisPreview = analysisData.executive_summary || null;
      }
    } catch {
      analysisPreview = null;
    }

    return json({
      ok: true,
      durationMs: duration,
      reportId: result.savedReport?.id || null,
      analysisPreview
    });
  } catch (error) {
    const duration = Date.now() - start;
    console.error('Test pipeline failed:', error);
    return json({
      ok: false,
      durationMs: duration,
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
};

export const GET: RequestHandler = async () => {
  return json({ message: 'POST to run end-to-end pipeline test with mock transcript' });
};
