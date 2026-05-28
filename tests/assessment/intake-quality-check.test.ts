/**
 * Unit tests for checkIntakeSufficiency — the intake quality pre-flight gate.
 *
 * Tests all 4 quality states across various transcript scenarios.
 */

import { describe, it, expect } from 'vitest';
import { checkIntakeSufficiency } from '$lib/server/assessment/intake-quality-check';

// ============================================================================
// SUFFICIENT — all gates pass
// ============================================================================

const RICH_INTAKE = `
Business Overview: We're Deck Verification Services — we inspect decks and balconies
for safety compliance. I'm Deck, the owner. We have 3 full-time inspectors and a part-time
admin. Been operating for 8 years in Melbourne.

Current Tools: We use Xero for invoicing, Google Sheets for tracking inspections, and
Gmail for client communication. It's all manual — inspectors write reports on paper and
the admin types them into spreadsheets.

Pain Points: Every week I spend about 6 hours manually entering inspection data from
paper forms into our spreadsheet. Last week we missed a follow-up on a quote worth $15,000
because it got buried in the spreadsheet. That's the kind of thing that keeps happening.

Workflow Details: Each inspection takes about 2 hours on site, then 45 minutes of paperwork.
The admin spends roughly 3 hours a day typing up reports. During summer it's worse — we do
30% more inspections and the backlog gets really bad.

Concrete Metrics: About 20 inspections per week, 6 hours of data entry, and we lose
maybe 2-3 quotes a month from slow follow-up. At our average job value of $5,000, that's
real money walking out the door.

Customer Channels: 80% phone calls, 15% website enquiries, 5% word of mouth. Phone is
the main channel but we have no after-hours handling — calls go to voicemail and we
often don't get back to them until the next day.

Process Consistency: Everyone does it differently. Two inspectors send emails, one texts
photos, and the rest is on paper. No standard process at all. The admin has her own
spreadsheet system but nobody else uses it.

Budget: We're comfortable spending around $500 a month on tools that would fix this.
`;

describe('checkIntakeSufficiency', () => {
  describe('SUFFICIENT: all gates pass', () => {
    it('returns sufficient for a rich, complete intake', () => {
      const result = checkIntakeSufficiency(RICH_INTAKE);
      expect(result.quality).toBe('sufficient');
      expect(result.sufficient).toBe(true);
      expect(result.gaps).toHaveLength(0);
    });

    it('passes with structured answers', () => {
      const answers = [
        { questionId: 'business_overview', answer: 'Deck verification, 3 inspectors, 8 years in Melbourne' },
        { questionId: 'current_tools', answer: 'Xero for invoicing, Google Sheets, Gmail for client communication' },
        { questionId: 'pain_points', answer: '6 hours per week manually entering inspection data' },
        { questionId: 'workflow_details', answer: 'Each inspection 2 hours onsite, 45 min paperwork' },
        { questionId: 'concrete_metrics', answer: '20 inspections per week, lose 2-3 quotes/month at $5k avg' },
        { questionId: 'customer_channels', answer: '80% phone, 15% website' },
        { questionId: 'process_consistency', answer: 'No standard process, everyone does it differently' },
        { questionId: 'budget', answer: '$500 a month on tools' },
        { questionId: 'ai_readiness', answer: 'Used ChatGPT a few times' },
        { questionId: 'timeline', answer: 'This quarter, fairly urgent' },
      ];
      const result = checkIntakeSufficiency(RICH_INTAKE, answers);
      expect(result.quality).toBe('sufficient');
      expect(result.metrics.blockingAnswersPresent).toBe(7);
    });
  });

  // ========================================================================
  // ADEQUATE — all gates pass except budget signal
  // ========================================================================

  describe('ADEQUATE: budget signal missing', () => {
    // Transcript with NO dollar amounts, budget-specific phrases, or investment language anywhere
    // Structured answers are needed for ADEQUATE detection in transcript-only mode —
    // the heuristic estimator can't distinguish "Q8 answered, customer declined" from "Q8 missing"
    const NO_DOLLAR_INTAKE = `
Business Overview: We're a marketing agency with 8 full-time staff in Sydney. I'm the owner and
have been operating for 5 years. We handle digital marketing for about 30 clients.

Current Tools: We use HubSpot CRM for client tracking, Canva for design work, Google Analytics
for reporting, and Slack for team communication. The HubSpot implementation is pretty solid but
we don't use half the features we're paying for.

Pain Points: Every Monday I spend roughly 4 hours manually pulling data from different platforms
into client reports. It's tedious repetitive work that I should have automated years ago. Last
month we missed a quarterly report deadline for one of our biggest clients because I was sick and
nobody else knew how to pull the numbers.

Workflow Details: Client reporting takes about 4 hours per week, all done by me manually. Our
senior designer spends 6 hours a week on social media graphics that junior staff should handle.
Email management eats another 2 hours daily just sorting through noise.

Concrete Metrics: We handle about 30 active clients, roughly 200 emails per day, and the
reporting work steals about 16 hours per month from strategy work. Social media graphics take
about 24 hours per month from the senior designer.

Process Consistency: We have standard reporting templates but nobody documents them properly.
Each client report follows roughly the same format but the process lives entirely in my head.
`.trim();

    const BUDGET_DECLINED_ANSWERS = [
      { questionId: 'business_overview', answer: 'Marketing agency, 8 staff, 5 years in Sydney' },
      { questionId: 'current_tools', answer: 'HubSpot CRM, Canva, Google Analytics, Slack' },
      { questionId: 'pain_points', answer: '4 hours every Monday on manual client reporting' },
      { questionId: 'workflow_details', answer: 'Reporting 4hrs/week, design 6hrs/week, email 2hrs/day' },
      { questionId: 'concrete_metrics', answer: '30 clients, 200 emails/day, 16hrs/month reporting' },
      { questionId: 'customer_channels', answer: 'Website and referrals' },
      { questionId: 'process_consistency', answer: 'Standard templates exist but process is in my head' },
      { questionId: 'budget', answer: "I'd rather not discuss budget at this stage" },
      { questionId: 'ai_readiness', answer: 'Yes, using ChatGPT' },
      { questionId: 'timeline', answer: 'This quarter' },
    ];

    it('returns adequate when budget is explicitly declined (structured answers)', () => {
      const result = checkIntakeSufficiency(NO_DOLLAR_INTAKE, BUDGET_DECLINED_ANSWERS);
      expect(result.quality).toBe('adequate');
      expect(result.sufficient).toBe(true);
      expect(result.gaps.some((g: string) => g.includes('Budget signal'))).toBe(true);
    });

    it('returns adequate when customer states no budget preference (structured answers)', () => {
      const noPrefAnswers = BUDGET_DECLINED_ANSWERS.map(a =>
        a.questionId === 'budget' ? { ...a, answer: 'Not sure yet, still figuring that out' } : a
      );
      const result = checkIntakeSufficiency(NO_DOLLAR_INTAKE, noPrefAnswers);
      expect(result.quality).toBe('adequate');
      expect(result.recommendation).toContain('estimated budget');
    });
  });

  // ========================================================================
  // INCOMPLETE — hard gates failed
  // ========================================================================

  describe('INCOMPLETE: hard gates failed', () => {
    it('returns incomplete for short transcript', () => {
      // Transcript between 100-400 chars with structured answers = INCOMPLETE
      const mediumTranscript = 'We are a small plumbing business with two full-time employees and a part-time bookkeeper. We have been operating for about six years now and serve the local residential and commercial areas. Our main challenge is keeping track of jobs, scheduling, and invoices without a proper system.';
      const answers = [
        { questionId: 'business_overview', answer: 'Plumbing business with 2 full-time and part-time staff' },
        { questionId: 'current_tools', answer: 'Xero and paper based scheduling' },
        { questionId: 'pain_points', answer: 'Manual tracking of jobs takes 5 hours per week' },
        { questionId: 'workflow_details', answer: 'Scheduling is done on paper then typed into Xero' },
        { questionId: 'concrete_metrics', answer: 'About 15 jobs per week with 5 hours admin overhead' },
        { questionId: 'process_consistency', answer: 'No standard process at all' },
      ];
      const result = checkIntakeSufficiency(mediumTranscript, answers);
      expect(result.quality).toBe('incomplete');
      expect(result.gaps.some((g: string) => g.includes('too short'))).toBe(true);
    });

    it('returns incomplete when no tool names detected', () => {
      const noTools = RICH_INTAKE.replace(/Xero|Google Sheets|Gmail/gi, 'nothing specific');
      const result = checkIntakeSufficiency(noTools);
      expect(result.quality).toBe('incomplete');
      expect(result.gaps.some(g => g.includes('tool names'))).toBe(true);
    });

    it('returns incomplete when fewer than 6 questions answered', () => {
      const answers = [
        { questionId: 'business_overview', answer: 'Deck verification business' },
        { questionId: 'current_tools', answer: 'Xero and spreadsheets' },
        { questionId: 'pain_points', answer: 'Manual data entry takes hours' },
        { questionId: 'workflow_details', answer: 'Inspections are on paper' },
      ];
      // Transcript must be >100 chars to avoid INVALID classification
      const result = checkIntakeSufficiency('We are a small business that does deck verification and safety compliance inspections for residential properties across the greater Melbourne area. We currently handle about twenty inspections per week.', answers);
      expect(result.quality).toBe('incomplete');
      expect(result.metrics.answerCount).toBeLessThan(6);
    });

    it('returns incomplete when blocking questions are insufficient', () => {
      const answers = [
        { questionId: 'business_overview', answer: 'ok' },  // too short
        { questionId: 'current_tools', answer: 'yes' },      // too short
        { questionId: 'pain_points', answer: 'fine' },        // too short
        { questionId: 'workflow_details', answer: 'ok' },     // too short
        { questionId: 'concrete_metrics', answer: 'yep' },    // too short
        { questionId: 'process_consistency', answer: 'sure' }, // too short
        { questionId: 'budget', answer: '500' },              // short but >10 chars? no, only 3
      ];
      const result = checkIntakeSufficiency('some transcript here that is long enough to pass minimum length check, but the answers are all too short to be considered substantive and blocking question coverage will be very low', answers);
      expect(result.quality).toBe('incomplete');
      expect(result.metrics.blockingAnswersPresent).toBeLessThan(7);
    });

    it('returns incomplete for transcript between 100-400 chars with substance', () => {
      const mediumTranscript =
        'Business Overview: I run a small plumbing business with 2 employees. We use Xero and spreadsheets. Pain points: manual invoicing takes 4 hours per week. Budget around $200/mo.';
      const result = checkIntakeSufficiency(mediumTranscript);
      expect(result.quality).toBe('incomplete');
      expect(result.gaps.some(g => g.includes('too short'))).toBe(true);
    });
  });

  // ========================================================================
  // INVALID — no meaningful content
  // ========================================================================

  describe('INVALID: no meaningful content', () => {
    it('returns invalid for critically short transcripts', () => {
      const result = checkIntakeSufficiency('hello');
      expect(result.quality).toBe('invalid');
      expect(result.sufficient).toBe(false);
      expect(result.recommendation).toContain('Do not retry');
    });

    it('returns invalid for fewer than 3 answers', () => {
      const answers = [
        { questionId: 'business_overview', answer: 'yes' },
      ];
      const result = checkIntakeSufficiency('short call transcript', answers);
      expect(result.quality).toBe('invalid');
    });

    it('returns invalid for empty transcript', () => {
      const result = checkIntakeSufficiency('');
      expect(result.quality).toBe('invalid');
    });

    it('returns invalid for garbled/disconnected calls', () => {
      const result = checkIntakeSufficiency('uh... hello? can you hear me? ... hello? ... *click*');
      expect(result.quality).toBe('invalid');
    });
  });

  // ========================================================================
  // Backward compatibility
  // ========================================================================

  describe('backward compatibility', () => {
    it('sufficient field is true for sufficient quality', () => {
      const result = checkIntakeSufficiency(RICH_INTAKE);
      expect(result.sufficient).toBe(true);
    });

    it('sufficient field is true for adequate quality', () => {
      const noBudget = RICH_INTAKE.replace(/Budget[\s\S]*?\./gm, 'Budget: Not sure yet.');
      const result = checkIntakeSufficiency(noBudget);
      expect(result.sufficient).toBe(true);
    });

    it('sufficient field is false for incomplete quality', () => {
      const result = checkIntakeSufficiency('too short');
      expect(result.sufficient).toBe(false);
    });

    it('sufficient field is false for invalid quality', () => {
      const result = checkIntakeSufficiency('');
      expect(result.sufficient).toBe(false);
    });
  });

  // ========================================================================
  // Edge cases
  // ========================================================================

  describe('edge cases', () => {
    it('handles transcript-only path (no structured answers)', () => {
      const result = checkIntakeSufficiency(RICH_INTAKE);
      expect(result.quality).toBeDefined();
      expect(result.metrics.answerCount).toBeGreaterThan(0); // estimated
    });

    it('handles structured answers with questionId field (Annie chat)', () => {
      const answers = [
        { questionId: 'business_overview', answer: 'Marketing agency, 8 employees, 5 years in Sydney' },
        { questionId: 'current_tools', answer: 'HubSpot CRM, Canva, Google Analytics, Slack' },
        { questionId: 'pain_points', answer: 'Client reporting takes 4 hours every Monday manually' },
        { questionId: 'workflow_details', answer: 'Social media graphics, 6 hours/week by senior designer' },
        { questionId: 'concrete_metrics', answer: '200 emails/day, 10 hours/week lost to manual work' },
        { questionId: 'process_consistency', answer: 'Standard processes exist but not documented in a system' },
        { questionId: 'budget', answer: 'Around $1,000 per month all in' },
        { questionId: 'customer_channels', answer: 'Website and referrals' },
        { questionId: 'ai_readiness', answer: 'Yes, using ChatGPT regularly' },
        { questionId: 'timeline', answer: 'This quarter' },
      ];
      const longTranscript = 'Marketing agency transcript text here that is long enough to pass the minimum character length check for the intake quality pre-flight gate check before the pipeline runs. We are a full-service digital marketing agency based in Sydney Australia with eight full-time employees and a growing client base of about thirty active accounts across various industries including retail, professional services, and hospitality. We have been operating for five years and our team handles everything from SEO to paid advertising to content marketing and social media management for our diverse range of clients across multiple time zones and markets throughout Australia and Southeast Asia.';
      const result = checkIntakeSufficiency(longTranscript, answers);
      expect(result.quality).toBe('sufficient');
      expect(result.metrics.blockingAnswersPresent).toBe(7);
    });

    it('estimateQuestionCount detects new question topics', () => {
      const partialTranscript = `
        Business Overview: Construction company, 20 employees.
        Current Tools: Jobber, Xero.
        Pain Points: Manual scheduling takes 10 hours per week.
        Workflow: Each job takes half a day.
        We also use Google Calendar but it doesn't sync with Jobber.
      `;
      const result = checkIntakeSufficiency(partialTranscript);
      expect(result.metrics.answerCount).toBeGreaterThan(0);
    });
  });
});
