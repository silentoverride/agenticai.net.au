/**
 * Annie Intake Script — structured question tree for business context capture.
 *
 * REDESIGNED (2026-05-28): Post-AICC-002 audit. Changes from v1:
 *   - Compound Q1 broken into sequential sub-questions
 *   - Guardrails section added (matching voice script constraints)
 *   - Quality bar annotations per question (minimum specificity standards)
 *   - Budget question now separates "comfortable" from "maximum"
 *   - AI readiness moved earlier to allow adaptation of subsequent questions
 *   - Timeline question adds "waiting for trigger" classification
 *   - Pipeline stage mappings documented per question
 *   - Definition of done: intake is complete when Q1-Q5 have substantive answers
 *
 * Each question has:
 * - id: unique question identifier
 * - topic: the category (business_overview, tools, pain_points, etc.)
 * - question: the text Annie asks
 * - qualityBar: what makes an answer "good enough" vs "needs re-probing"
 * - feedsPipelines: which downstream pipeline stages consume this answer
 * - feedsGateCriteria: which gate criteria this answer supports (BLOCKING marked)
 * - followUps: probing questions asked based on user response keywords
 * - required: whether this is a required question
 *
 * The script is used by both the chat API (for prompting) and the UI
 * (for tracking progress through the intake flow).
 */

// ============================================================================
// Guardrails — What Annie Must NEVER Do
// ============================================================================

/**
 * These guardrails apply to ALL intake interactions regardless of channel.
 * They constrain the LLM generating Annie's responses to prevent:
 * - Regulated topic drift (tax, legal, financial, medical advice)
 * - Sensitive data collection (passwords, API keys, bank details)
 * - Premature tool recommendations during intake
 * - Outcome promises or guarantees
 */
export const ANNIE_GUARDRAILS = [
  'Do not recommend specific tools or products during intake.',
  'Do not diagnose or advise on legal, medical, financial, tax, or compliance issues.',
  'Do not ask for passwords, API keys, bank details, credit card numbers, or sensitive customer records.',
  'If the caller shares sensitive information, ask them to describe the workflow without sharing private details.',
  'Do not criticise the caller\'s current process. Frame gaps as opportunities.',
  'If the caller asks for pricing or scope, say the assessment team can confirm after reviewing the transcript.',
  'If the caller asks whether AI can "solve everything," explain the assessment will separate practical quick wins from ideas that are not worth doing.',
  'Do not promise specific savings, revenue increases, conversion rates, or compliance outcomes.',
  'If the caller mentions a regulated topic (tax strategy, legal compliance, financial advice, medical diagnosis), acknowledge it and explain that Annie cannot advise on that area — redirect to the relevant workflow or tool aspect only.',
  'Do not collect personally identifiable information beyond name, email, phone, company name, and role. If additional PII appears in the conversation, do not record it in the intake data.'
];

// ============================================================================
// Types
// ============================================================================

export interface IntakeQuestion {
  id: string;
  topic: string;
  question: string;
  /** What makes an answer "good enough" vs "needs re-probing." */
  qualityBar: string;
  /** Which pipeline stages consume this answer. */
  feedsPipelines: string[];
  /** Which gate criteria this answer supports (● = BLOCKING). */
  feedsGateCriteria: string[];
  followUps?: Array<{
    keywords: string[];
    probe: string;
  }>;
  required: boolean;
}

export interface IntakeProgress {
  sessionId: string;
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    answer: string;
    followUpAnswer?: string;
    timestamp: string;
    /** Whether this answer meets the quality bar for sufficiency. */
    meetsQualityBar?: boolean;
  }>;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'annie' | 'user';
  text: string;
  timestamp: string;
  isTyping?: boolean;
}

// ============================================================================
// Intake Script — 8 Questions (redesigned from original 6)
// ============================================================================

export const INTAKE_SCRIPT: IntakeQuestion[] = [
  // --- Q1: Business Overview (split from original compound question) ---
  {
    id: 'business_overview',
    topic: 'Business Overview',
    question: "Let's start with the basics. What does your business do, and who do you primarily serve?",
    qualityBar: 'Answer must name: (1) the industry or sector, (2) the primary customer or client type, (3) what the business actually produces or delivers. "We do events" is insufficient — re-probe for specifics.',
    feedsPipelines: ['evidence extraction (business context)', 'LLM analysis (industry-specific recommendations)'],
    feedsGateCriteria: ['● QW-A1 Stated need', '● MP-A2 Business context', 'RR-T7 Appropriateness'],
    followUps: [
      {
        keywords: ['startup', 'new', 'just started', 'recently', 'founded', 'launched'],
        probe: "How has the first few months been? What's been the biggest challenge in getting established?"
      },
      {
        keywords: ['growing', 'scaling', 'expanding', 'growth', 'hiring'],
        probe: "What's driving the growth — more customers, bigger projects, or new offerings?"
      }
    ],
    required: true
  },

  // --- Q1b: Role & Team (was part of original compound Q1) ---
  {
    id: 'role_and_team',
    topic: 'Role & Team',
    question: "What's your role in the business, and how many people are on the team? Include employees, contractors, virtual assistants, or regular external partners.",
    qualityBar: 'Answer must include: (1) a named role ("owner," "operations manager," "founder"), (2) a team count (specific number or range). "A few people" is insufficient — probe for actual count.',
    feedsPipelines: ['tool research (team-size-appropriate tools)', 'LLM analysis (capacity context)'],
    feedsGateCriteria: ['● MP-A2 Business context', '● RR-TC3 Pricing accuracy (team-size tiers)'],
    followUps: [
      {
        keywords: ['team', 'employee', 'staff', 'people', 'freelancer', 'solo', 'contractor', 'va'],
        probe: "How is the team structured? Clear departments or do people wear multiple hats?"
      }
    ],
    required: true
  },

  // --- Q1c: Operating History (was part of original compound Q1) ---
  {
    id: 'operating_history',
    topic: 'Operating History',
    question: "How long has the business been operating, and what are the main ways customers or clients first come in?",
    qualityBar: 'Answer must include: (1) business age (years or "since YYYY"), (2) at least one named customer acquisition channel.',
    feedsPipelines: ['LLM analysis (business maturity context)', 'evidence extraction (lead channels)'],
    feedsGateCriteria: ['● MP-A2 Business context', 'RR-T1 Completeness'],
    required: true
  },

  // --- Q2: AI Readiness (moved from Q4 to allow adaptation) ---
  {
    id: 'ai_readiness',
    topic: 'AI Readiness & Experience',
    question: "Have you or your team used any AI tools before? ChatGPT, Claude, Copilot, or any AI-powered features in your existing software? Be honest — there's no wrong answer.",
    qualityBar: 'Answer must include: yes/no + if yes, at least one named tool or feature. "We tried some stuff" is insufficient — probe for what was tried and the outcome.',
    feedsPipelines: ['LLM analysis (AI sophistication calibration)', 'tool research (sophistication-appropriate tools)'],
    feedsGateCriteria: ['RR-T7 Appropriateness (TASTE)'],
    followUps: [
      {
        keywords: ['yes', 'chatgpt', 'claude', 'copilot', 'used', 'tried', 'experiment'],
        probe: "What has your experience been like? Specific things you found useful or frustrating?"
      },
      {
        keywords: ['no', 'not really', "haven't", 'avoid', 'wary', 'unsure', 'concerned'],
        probe: "That's completely understandable. What's the main hesitation — cost, complexity, data privacy, or just haven't had time?"
      }
    ],
    required: true
  },

  // --- Q3: Current Tools (unchanged structure, added quality bar and pipeline mapping) ---
  {
    id: 'current_tools',
    topic: 'Current Tooling & Tech Stack',
    question: "What tools and software does your business use day-to-day? Think about CRM, project management, accounting, communication platforms, email, scheduling, reporting, and anything else you rely on regularly.",
    qualityBar: 'Answer must name at least one specific software product (not just a category). "We use Google Workspace and spreadsheets" is borderline — probe for any additional tools. "Just email and Excel" with no named products is insufficient — probe for hidden tools.',
    feedsPipelines: ['tool research (gap analysis)', 'evidence extraction (tool inventory)'],
    feedsGateCriteria: ['● QW-A1 Stated need', '● QW-E2 Tool grounding', '● RR-TC1 Tool citation', '● RR-TC3 Pricing accuracy'],
    followUps: [
      {
        keywords: ['none', 'not really', 'manual', 'spreadsheet', 'excel', 'google sheets', 'pen', 'paper'],
        probe: "So things are fairly manual at the moment. What's the most time-consuming manual task you wish was automated?"
      },
      {
        keywords: ['zapier', 'make', 'integromat', 'automation', 'api', 'n8n'],
        probe: "You're already using automation — great. Are there any workflows that still feel clunky or require too many steps?"
      },
      {
        keywords: ['xero', 'quickbooks', 'myob', 'jobber', 'simpro', 'servicem8', 'tradify', 'fergus',
                   'hubspot', 'salesforce', 'monday', 'asana', 'trello', 'notion', 'airtable',
                   'slack', 'teams', 'calendly', 'stripe', 'square', 'shopify', 'mailchimp',
                   'activecampaign', 'canva', 'eventpro', 'dubsado', 'honeybook'],
        probe: "You've got a solid stack. Are any of those tools not being used to their full potential, or do you have tools the team pays for but doesn't use properly?"
      }
    ],
    required: true
  },

  // --- Q4: Pain Points & Bottlenecks (unchanged core, added quality bar) ---
  {
    id: 'pain_points',
    topic: 'Pain Points & Bottlenecks',
    question: "What frustrates you most about your current workflow? Where do you feel like time or money is being wasted? Give me a specific, recent example if you can.",
    qualityBar: 'Answer must include: (1) a named workflow or task, (2) a frequency ("every day," "weekly," "every Monday"), (3) a time or money impact (even approximate). "Admin takes too long" without frequency or impact is insufficient — probe for a recent example.',
    feedsPipelines: ['evidence extraction (pain point claims)', 'LLM analysis (Quick Win generation)', 'tool research (pain-point-specific tool queries)'],
    feedsGateCriteria: ['● QW-A1 Stated need', '● QW-E1 Traceability', '● QW-E3 Number grounding', '● MP-A1 Problem existence', '● RR-A0 Evidence traceability'],
    followUps: [
      {
        keywords: ['reporting', 'reports', 'data', 'analytics', 'dashboard', 'numbers'],
        probe: "Walk me through the actual steps. What tools or spreadsheets are open when you're doing those reports, and about how long does it take?"
      },
      {
        keywords: ['email', 'inbox', 'messages', 'communication', 'slack', 'teams', 'overload'],
        probe: "Is it the volume, the sorting, or the follow-up that's the problem? About how many messages are we talking about?"
      },
      {
        keywords: ['customer', 'client', 'lead', 'enquiry', 'support', 'service', 'response'],
        probe: "Walk me through what happens after a new enquiry comes in. Who handles it, how fast, and where does it sometimes go wrong?"
      },
      {
        keywords: ['manual', 'copy', 'paste', 'double', 'retype', 'spreadsheet', 'data entry'],
        probe: "Which specific step in that manual process takes the most time? If you had to guess, how many hours a week does that one step consume?"
      }
    ],
    required: true
  },

  // --- Q5: Concrete Impact (NEW — replaces original vague Q4/Q5 with quantifiable focus) ---
  {
    id: 'concrete_impact',
    topic: 'Business Impact & Numbers',
    question: "Let's put some numbers on this. Of the frustrations you mentioned, which one has the biggest impact — in time lost, missed revenue, or team stress? Give me your best estimate — rough numbers are fine.",
    qualityBar: 'Answer must include at least one quantifiable estimate: hours per week lost, approximate revenue impact, or specific team capacity cost. "It costs us a lot" is insufficient — probe: "Ballpark — an extra hour a week, or an extra day?"',
    feedsPipelines: ['evidence extraction (quantified claims)', 'LLM analysis (financial impact calculation)', 'budget detection (willingness-to-pay signal)'],
    feedsGateCriteria: ['● QW-E1 Traceability', '● QW-E3 Number grounding', '● MP-A1 Problem existence', '● RR-A0 Evidence traceability', '● RR-T4 Financial honesty'],
    followUps: [
      {
        keywords: ['hours', 'hour', 'per week', 'per day', 'minutes', 'time', 'saving'],
        probe: "If you could get that time back, what would you spend it on instead?"
      },
      {
        keywords: ['revenue', 'money', 'dollars', 'sales', 'lost', 'missed', 'cost'],
        probe: "Roughly what's an average customer or booking worth to the business? What would one extra per month mean?"
      },
      {
        keywords: ['stress', 'frustration', 'team', 'staff', 'burnout', 'turnover'],
        probe: "Is this affecting anyone's ability to do their actual job, or causing people to work extra hours they shouldn't?"
      }
    ],
    required: true
  },

  // --- Q6: Budget (redesigned — separates comfortable from maximum) ---
  {
    id: 'budget',
    topic: 'Budget & Investment',
    question: "Two questions on budget. First, what's a comfortable monthly investment you'd make without hesitation for the right solution? And second, what's your absolute maximum if the opportunity was clearly worth it?",
    qualityBar: 'Answer must include two numbers or ranges — comfortable AND maximum. If only one number given, probe for the other. "A few hundred" without specifying which tier is ambiguous — clarify: "Does a few hundred mean around $200, or closer to $500?"',
    feedsPipelines: ['budget detection (comfortable vs max)', 'tool research (budget-appropriate tools)', 'LLM analysis (recommendation sequencing)'],
    feedsGateCriteria: ['● MP-E1 Budget alignment', '● RR-TC3 Pricing accuracy'],
    followUps: [
      {
        keywords: ['unsure', 'not sure', 'depends', 'flexible', 'whatever'],
        probe: "No problem. Most of the tools we recommend start around $20-50/month, and the more comprehensive ones run $100-300/month. Does that range feel about right?"
      },
      {
        keywords: ['hundred', 'thousand', 'dollar', 'budget', 'limited', 'small'],
        probe: "Got it. And if a tool could clearly save you 5+ hours a week, would the budget conversation change?"
      }
    ],
    required: true
  },

  // --- Q7: Timeline & Urgency (redesigned — adds "waiting for trigger") ---
  {
    id: 'timeline',
    topic: 'Timeline & Urgency',
    question: "Last question on timing. How urgent is this for you right now — and is there a specific trigger or event that would make it more urgent?",
    qualityBar: 'Answer must include a timeframe (this month / this quarter / next 6 months / exploring) AND whether there is a trigger event. "We\'re just looking" without context is insufficient — probe for what prompted the look.',
    feedsPipelines: ['LLM analysis (roadmap phase sequencing)', 'Quick Win vs Deeper Opportunity prioritization'],
    feedsGateCriteria: ['RR-T6 Prioritization (TASTE)'],
    followUps: [
      {
        keywords: ['urgent', 'asap', 'this month', 'now', 'immediately', 'quick', 'yesterday'],
        probe: "What's driving the urgency — a specific pain point getting worse, or a growth opportunity you want to capture?"
      },
      {
        keywords: ['quarter', 'next few', 'planning', 'this year', 'roadmap'],
        probe: "Makes sense to plan ahead. Is there a particular trigger — end of quarter, new client, team hire — that would move this up your priority list?"
      },
      {
        keywords: ['exploring', 'sometime', 'curious', 'looking', 'options', 'research'],
        probe: "Exploring is a great place to start. Was there something specific that prompted you to look into this now — a recommendation, an article, a competitor move, or just a growing sense that something needs to change?"
      }
    ],
    required: true
  },

  // --- Q8: Open-Ended Close (NEW — captures anything missed) ---
  {
    id: 'open_close',
    topic: 'Anything Else',
    question: "Before we wrap up, is there anything important about your business, your workflows, or your goals that I didn't ask about? Sometimes the most valuable insight is the one nobody thought to ask.",
    qualityBar: 'No minimum requirement — this is an open-ended capture question. But if the user mentions a new pain point, tool, or constraint, apply the same quality bar from the relevant earlier question.',
    feedsPipelines: ['evidence extraction (catch-all)', 'LLM analysis (additional context)'],
    feedsGateCriteria: ['RR-T2 Completeness (TASTE)'],
    required: false
  }
];

/** Total number of intake questions. */
export const TOTAL_QUESTIONS = INTAKE_SCRIPT.length;

/** Questions that feed BLOCKING gate criteria and MUST have substantive answers before pipeline trigger. */
export const BLOCKING_QUESTION_IDS = [
  'business_overview',   // Q1: feeds QW-A1, MP-A2, RR-T7
  'role_and_team',       // Q1b: feeds MP-A2, RR-TC3
  'operating_history',   // Q1c: feeds MP-A2, RR-T1
  'current_tools',       // Q3: feeds QW-A1, QW-E2, RR-TC1, RR-TC3
  'pain_points',         // Q4: feeds QW-A1, QW-E1, QW-E3, MP-A1, RR-A0
  'concrete_impact',     // Q5: feeds QW-E1, QW-E3, MP-A1, RR-A0, RR-T4
  'budget'               // Q6: feeds MP-E1, RR-TC3
  // Note: ai_readiness (Q2) and timeline (Q7) feed TASTE criteria only,
  // so they are not required for pipeline trigger but improve report quality.
];

/**
 * Definition of done: intake is complete when at minimum:
 * - Transcript length ≥ 400 characters
 * - All 7 BLOCKING questions answered with substance (length > 10 chars)
 * - At least one specific, named tool detected
 * - At least one pain point with temporal anchor detected
 * - Budget signal detected (comfortable or maximum)
 *
 * See src/lib/server/assessment/intake-quality-check.ts for the runtime check.
 */

// ============================================================================
// Follow-up Logic (unchanged from v1)
// ============================================================================

/**
 * Get a follow-up probe question based on keywords in the user's answer.
 * Returns undefined if no keywords match.
 */
export function getFollowUp(questionId: string, answer: string): string | undefined {
  const question = INTAKE_SCRIPT.find(q => q.id === questionId);
  if (!question?.followUps) return undefined;

  const lowerAnswer = answer.toLowerCase();
  for (const fu of question.followUps) {
    for (const keyword of fu.keywords) {
      if (lowerAnswer.includes(keyword.toLowerCase())) {
        return fu.probe;
      }
    }
  }
  return undefined;
}
