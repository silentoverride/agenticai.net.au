/**
 * Golden Test Cases — curated input/output pairs for gate calibration.
 *
 * Each case simulates a real assessment scenario and specifies the expected
 * gate verdict. Operators run gates against these to verify behavior and
 * tune prompts/thresholds.
 *
 * To add a new test case:
 * 1. Create a realistic transcript snippet
 * 2. Determine the expected verdict per gate type
 * 3. Tag the case appropriately
 * 4. Add it to the GOLDEN_TEST_CASES array
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
      'report-review': GateVerdict.APPROVE
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
      'report-review': GateVerdict.RETRY
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
      'report-review': GateVerdict.RETRY
    },
    minConfidence: 0.6,
    tags: ['major-project', 'budget', 'edge-case'],
    notes: 'Any ERP recommendation exceeding stated budget 10x should be blocked for proportionality.'
  },

  // ==========================================================================
  // REPORT REVIEW — QUALITY CHECK
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
      'report-review': GateVerdict.RETRY
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
      'report-review': GateVerdict.APPROVE
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
      'report-review': GateVerdict.APPROVE
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
      'report-review': GateVerdict.BLOCK
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
      'report-review': GateVerdict.APPROVE
    },
    minConfidence: 0.6,
    tags: ['edge-case', 'technical'],
    notes: 'Technical customer with clear budget and pain points — gates should handle technical language appropriately.'
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
