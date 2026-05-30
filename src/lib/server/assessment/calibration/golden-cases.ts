/**
 * Golden Test Cases v2 — curated input/output pairs for gate calibration.
 *
 * Updated for judge-layer gate prompts with:
 * - Evidence-map expectations (coverage thresholds)
 * - Budget-ratio boundary testing
 * - Pretty-But-Wrong detection (6 failure patterns)
 * - Buzzword boundary testing (ALLOW when substance + language coexist)
 */

import type { GoldenTestCase } from './types';
import { GateVerdict } from '../types';

export const GOLDEN_TEST_CASES: GoldenTestCase[] = [
  // ==========================================================================
  // QUICK WIN — CLEAR EVIDENCE
  // ==========================================================================
  {
    id: 'qw-001',
    name: 'Quick Win — Clear transcript evidence',
    description: 'A recommendation about automated invoicing is clearly supported by the customer saying they spend 10h/week on manual invoicing.',
    transcript: `Customer: Our biggest time sink is invoicing. We manually create and send invoices — it takes about 10 hours a week for my office manager.
Customer: We've looked at Xero but haven't set up the automated billing yet.
Customer: I'd estimate we're losing about $15,000 a year in late payments because invoices go out late.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.7,
    tags: ['quick-win', 'happy-path'],
    notes: 'Standard case — recommendation is directly supported by customer statements.'
  },

  // ==========================================================================
  // QUICK WIN — HALLUCINATION (no evidence)
  // ==========================================================================
  {
    id: 'qw-002',
    name: 'Quick Win — Hallucinated recommendation',
    description: 'A recommendation about AI chatbot is NOT supported — customer never mentioned customer support or chatbots.',
    transcript: `Customer: We're a small accounting firm with 5 staff.
Customer: Our main challenge is tax season workload — we work 60-hour weeks from July to October.
Customer: We use Xero, Microsoft Office, and a practice management tool called SimplePractice.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.BLOCK,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.RETRY,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.6,
    tags: ['quick-win', 'hallucination', 'edge-case'],
    notes: 'If the system recommends an AI customer support chatbot despite no mention of support, this should BLOCK.'
  },

  // ==========================================================================
  // MAJOR PROJECT — BUDGET MISMATCH
  // ==========================================================================
  {
    id: 'mp-001',
    name: 'Major Project — Budget vs recommendation mismatch',
    description: 'Customer says $5k budget, recommendation suggests $50k ERP implementation — should flag.',
    transcript: `Customer: We have about $5,000 set aside for technology improvements this year.
Customer: Our inventory management is a mess — we're using spreadsheets and a whiteboard.
Customer: We have about 200 SKUs and do about $2M in annual revenue.
Customer: I'd like something that can be set up in a few days, not months.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.BLOCK,
      'report-review': GateVerdict.RETRY,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.6,
    tags: ['major-project', 'budget', 'edge-case'],
    notes: 'Any ERP recommendation exceeding stated budget 10x should be blocked for proportionality.'
  },

  // ==========================================================================
  // REPORT REVIEW — CONTRADICTORY STATEMENTS
  // ==========================================================================
  {
    id: 'rr-001',
    name: 'Report Review — Contradictory statements',
    description: 'Report contains contradictory recommendations that conflict with each other.',
    transcript: `Customer: We have 3 part-time staff who handle customer support via email.
Customer: Response times are about 24 hours which customers complain about.
Customer: We're not looking to hire more staff — we want to work with what we have.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.RETRY,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.5,
    tags: ['report-review', 'quality', 'edge-case'],
    notes: 'Report should not simultaneously recommend AI chatbot AND hiring more support staff.'
  },

  // ==========================================================================
  // HUMAN ASSIST — AMBIGUOUS
  // ==========================================================================
  {
    id: 'ha-001',
    name: 'Human Assist — Ambiguous industry terminology',
    description: 'Customer uses industry-specific jargon that could be interpreted multiple ways.',
    transcript: `Customer: We need help with our "packaging" — right now we're doing it all manually.
Customer: The compliance requirements are killing us, we need something that handles the regulatory side.
Customer: We're a small team but we handle about 50 "placements" per month.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.HUMAN_ASSIST,
      'major-project-verification': GateVerdict.HUMAN_ASSIST,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.APPROVE
    },
    tags: ['human-assist', 'ambiguous', 'edge-case'],
    notes: 'Industry-specific terms like "packaging" and "placements" are ambiguous — could be logistics, recruitment, or manufacturing.'
  },

  // ==========================================================================
  // HAPPY PATH — COMPLETE
  // ==========================================================================
  {
    id: 'full-001',
    name: 'Full pipeline — Complete assessment happy path',
    description: 'A full transcript with clear answers across all dimensions — all gates should pass.',
    transcript: `Customer: I'm the owner of a construction company with 25 employees.
Customer: We use Xero for accounting, Procore for project management, and Excel for everything else.
Customer: Our biggest problem is project cost tracking — we never know if we're on budget until it's too late.
Customer: We've tried a few different tools but nothing talks to each other.
Customer: We spend about $3,000 a month on software and I'd be comfortable investing another $1,000-2,000.
Customer: Ideally we'd have something implemented within 3 months — before our next big project starts.
Customer: I'm moderately comfortable with technology but my team less so — training would be important.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.8,
    tags: ['happy-path', 'full-pipeline'],
    notes: 'Complete, clear transcript with budget, timeline, pain points, and tooling — all gates should approve.'
  },

  // ==========================================================================
  // EDGE CASE — EMPTY TRANSCRIPT
  // ==========================================================================
  {
    id: 'edge-001',
    name: 'Edge case — Empty/minimal transcript',
    description: 'Empty or near-empty transcript — gates should handle gracefully.',
    transcript: 'Customer: Not sure what to say. Customer: I guess automation? Customer: Yes.',
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.BLOCK,
      'major-project-verification': GateVerdict.BLOCK,
      'report-review': GateVerdict.BLOCK,
      'pbw-detector': GateVerdict.BLOCK
    },
    tags: ['edge-case', 'empty'],
    notes: 'Minimal content should block — insufficient evidence for any recommendation.'
  },

  // ==========================================================================
  // EDGE CASE — TECHNICAL JARGON
  // ==========================================================================
  {
    id: 'edge-002',
    name: 'Edge case — Heavy technical jargon',
    description: 'Customer uses technical language that requires domain knowledge.',
    transcript: `Customer: Our CI/CD pipeline is running on self-hosted runners and we need to migrate to Kubernetes.
Customer: We're experiencing latency issues with our message broker — RabbitMQ clustering isn't scaling.
Customer: The observability stack needs improvement — our OpenTelemetry instrumentation is incomplete.
Customer: Budget is flexible — probably $10-20k for the initial phase.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.6,
    tags: ['edge-case', 'technical'],
    notes: 'Technical customer with clear budget and pain points — gates should handle technical language appropriately.'
  },

  // ==========================================================================
  // v2: PRETTY-BUT-WRONG — INDUSTRY MISFIRE
  // ==========================================================================
  {
    id: 'pbw-001',
    name: 'Pretty-But-Wrong — Industry Misfire (trade vs. office)',
    description: 'Trade business gets office-productivity recommendations — PBW detector must flag.',
    transcript: `Customer: I run an electrical contracting business with 8 electricians.
Customer: We use ServiceM8 for job scheduling and Xero for invoicing.
Customer: Our biggest headache is quoting — we lose jobs because quotes take too long to prepare.
Customer: We also struggle with tracking material costs across different job sites.
Customer: Budget is around $500/month for new software.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.BLOCK
    },
    minConfidence: 0.7,
    tags: ['pbw-detector', 'industry-misfire', 'edge-case'],
    notes: 'If report recommends Notion, Slack, knowledge management, or office productivity tools for a trade business, PBW should BLOCK. Correct: quoting automation, material cost tracking, estimating tools.'
  },

  // ==========================================================================
  // v2: PRETTY-BUT-WRONG — TOOL WORSHIP
  // ==========================================================================
  {
    id: 'pbw-002',
    name: 'Pretty-But-Wrong — Tool Worship (tools without process)',
    description: 'Customer with no documented processes gets tool recommendations with no process advice.',
    transcript: `Customer: We're a boutique marketing agency with 6 people.
Customer: Everything is in our heads — there are no documented processes.
Customer: We use Gmail, Google Drive, and Canva. That's pretty much it.
Customer: We lose track of client requests because they come through email, WhatsApp, and phone.
Customer: I know we need systems but I don't know where to start.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.RETRY,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.BLOCK
    },
    minConfidence: 0.6,
    tags: ['pbw-detector', 'tool-worship', 'edge-case'],
    notes: 'Recommending 5+ tools without process design advice when customer has no documented processes should trigger PBW BLOCK.'
  },

  // ==========================================================================
  // v2: PRETTY-BUT-WRONG — SCALE MISMATCH
  // ==========================================================================
  {
    id: 'pbw-003',
    name: 'Pretty-But-Wrong — Scale Mismatch (Excel to AI agents)',
    description: 'Solo business owner using Excel gets AI agent orchestration recommendations.',
    transcript: `Customer: I'm a freelance graphic designer working from home.
Customer: I use Excel to track my projects and invoices.
Customer: I spend too much time on admin — maybe 5 hours a week.
Customer: My budget is tight — maybe $50/month for tools.
Customer: It's just me, no team.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.BLOCK,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.BLOCK
    },
    minConfidence: 0.7,
    tags: ['pbw-detector', 'scale-mismatch', 'edge-case'],
    notes: 'A solo freelancer with $50/month budget should NOT get AI agent orchestration, custom dashboards, or API integrations. Both major-project-verification (budget) and PBW (scale mismatch) should BLOCK.'
  },

  // ==========================================================================
  // v2: PRETTY-BUT-WRONG — GENERIC PLATITUDES
  // ==========================================================================
  {
    id: 'pbw-004',
    name: 'Pretty-But-Wrong — Generic Platitudes',
    description: 'Report contains advice that applies to any business, not this specific one.',
    transcript: `Customer: We're a catering company with 12 staff. Our biggest problem is last-minute cancellations — we lose about $2,000 a month from cancelled events.
Customer: We also struggle with dietary requirement tracking — we've had two allergic reactions this year.
Customer: We use Google Sheets for everything and it's falling apart.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.RETRY,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.BLOCK
    },
    minConfidence: 0.6,
    tags: ['pbw-detector', 'generic-platitudes', 'edge-case'],
    notes: 'If report says "implement automation to save time" without addressing cancellations or dietary tracking, PBW should BLOCK.'
  },

  // ==========================================================================
  // v2: MAJOR PROJECT — BUDGET RATIO BOUNDARY (RETRY zone)
  // ==========================================================================
  {
    id: 'mp-002',
    name: 'Major Project — Budget ratio at 3x boundary (RETRY zone)',
    description: 'Customer states $5k budget, recommendation costs $14k — just under 3x threshold.',
    transcript: `Customer: We have $5,000 budgeted for process improvement this year.
Customer: Our order fulfillment takes 3 days when competitors do same-day.
Customer: We're a wholesale distributor with 15 warehouse staff.
Customer: I think we need a warehouse management system but not sure what's realistic.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.RETRY,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.5,
    tags: ['major-project', 'budget', 'edge-case', 'boundary'],
    notes: 'A $14k recommendation against a $5k budget is 2.8x — within RETRY zone (<3x). Gate should suggest scaling down. $15k (3x) would be BLOCK.'
  },

  // ==========================================================================
  // v2: MISSING REAL PAIN
  // ==========================================================================
  {
    id: 'rr-002',
    name: 'PBW — Missing the customer\'s primary pain point',
    description: 'Customer spends 60% of transcript on invoicing pain, but report barely mentions it.',
    transcript: `Customer: Our invoicing process is killing us — I can't stress this enough.
Customer: We spend maybe 15 hours a week just on creating and tracking invoices.
Customer: Customers pay late because our invoices are confusing — we have a 45-day average payment time.
Customer: I've tried Xero but we couldn't figure out the setup.
Customer: Also, our email follow-ups to clients are a bit slow — maybe 24h response time.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.RETRY,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.BLOCK
    },
    minConfidence: 0.6,
    tags: ['pbw-detector', 'missing-real-pain', 'edge-case'],
    notes: 'If report leads with email response time and barely mentions invoicing automation despite 15h/week + 45-day payment delay, PBW should BLOCK.'
  },

  // ==========================================================================
  // v2: EVIDENCE COVERAGE — BELOW 40% THRESHOLD
  // ==========================================================================
  {
    id: 'ev-001',
    name: 'Evidence Coverage — Below 40%',
    description: 'Sparse transcript produces report with <40% evidence coverage.',
    transcript: `Customer: We run a small retail shop.
Customer: Things are okay but could be better.
Customer: We use some software.
Customer: Budget is flexible.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.BLOCK,
      'major-project-verification': GateVerdict.BLOCK,
      'report-review': GateVerdict.BLOCK,
      'pbw-detector': GateVerdict.BLOCK
    },
    minConfidence: 0.8,
    tags: ['edge-case', 'evidence-coverage', 'empty'],
    notes: 'Transcript with no concrete workflow/tool/pain point statements — all gates should BLOCK.'
  },

  // ==========================================================================
  // v2: AUTOMATING CHAOS — ALL GATES PASS, REPORT STILL WRONG
  // ==========================================================================
  {
    id: 'chaos-001',
    name: 'Automating Chaos — Standardize-first pattern missed',
    description: 'Real estate agency with rich transcript and inconsistent processes. Report recommends automation without standardization.',
    transcript: `Customer: I own a real estate agency with 14 staff.
Customer: Our biggest problem is lead follow-up — we're too slow, clients go elsewhere.
Customer: Each agent has their own way of following up, some use email templates, some call, some text.
Customer: Contract generation is manual — each agent maintains their own templates.
Customer: Commission calculations are a nightmare because two agents use different spreadsheet structures.
Customer: We use PropertyMate for listings and Xero for accounting.
Customer: Budget isn't an issue — maybe $2,000/month for the right systems.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.RETRY,
      'pbw-detector': GateVerdict.BLOCK
    },
    minConfidence: 0.6,
    tags: ['pbw-detector', 'automating-chaos', 'edge-case'],
    notes: 'This transcript clearly signals process inconsistency ("each agent has their own way," "different spreadsheet structures"). A report that recommends automating lead response, contract generation, or commission calculations WITHOUT first recommending standardization should trigger PBW BLOCK (automating chaos pattern). Quick-wins and major-projects may APPROVE because there IS transcript evidence for each pain point — but PBW should catch that the process foundation is missing. Report-review should also RETRY because the taste dimension T2 (Recommendation Credibility) should flag this as standardize-first, not automate-first.'
  },
  {
    id: 'pbw-005',
    name: 'Pretty-But-Wrong — Buzzword boundary (allowable professional language)',
    description: 'Report uses professional language but is substantively specific — should ALLOW.',
    transcript: `Customer: We're a digital marketing agency with 20 staff.
Customer: We use HubSpot, Slack, Adobe Creative Suite, and Google Workspace.
Customer: Our reporting takes 8 hours a week — pulling data from different platforms, formatting spreadsheets.
Customer: We need automated reporting with client-facing dashboards.
Customer: Budget is $1,000-2,000 per month for the right solution.`,
    expectedVerdicts: {
      'quick-wins-verification': GateVerdict.APPROVE,
      'major-project-verification': GateVerdict.APPROVE,
      'report-review': GateVerdict.APPROVE,
      'pbw-detector': GateVerdict.APPROVE
    },
    minConfidence: 0.7,
    tags: ['pbw-detector', 'boundary', 'happy-path'],
    notes: 'Professional language + specific recommendations = ALLOW. Tests that PBW does not over-block on legitimate business language.'
  }
];

/**
 * Get a golden test case by ID.
 */
export function getGoldenTestCase(id: string): GoldenTestCase | undefined {
  return GOLDEN_TEST_CASES.find(c => c.id === id);
}

/**
 * Get golden test cases filtered by tags.
 */
export function getGoldenTestCasesByTags(tags: string[]): GoldenTestCase[] {
  if (tags.length === 0) return GOLDEN_TEST_CASES;
  return GOLDEN_TEST_CASES.filter(c => tags.some(t => c.tags.includes(t)));
}

/**
 * Get all unique tags across all golden test cases.
 */
export function getAllGoldenTags(): string[] {
  const tagSet = new Set<string>();
  for (const c of GOLDEN_TEST_CASES) {
    for (const t of c.tags) {
      tagSet.add(t);
    }
  }
  return Array.from(tagSet).sort();
}
