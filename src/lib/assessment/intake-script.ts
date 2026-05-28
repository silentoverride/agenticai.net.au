/**
 * Annie Intake Script — structured question tree for business context capture.
 *
 * Each question has:
 * - id: unique question identifier
 * - topic: the category (business_overview, tools, pain_points, etc.)
 * - question: the text Annie asks
 * - followUps: probing questions asked based on user response keywords
 * - required: whether this is a required question
 *
 * The script is used by both the chat API (for prompting) and the UI
 * (for tracking progress through the intake flow).
 */

// ============================================================================
// Evidence Requirements → Gate Criteria → Intake Questions
// ============================================================================
//
// The pipeline produces an Evidence Map with these claim types:
//   pain_point | workflow_detail | metric | tool_usage | business_context |
//   customer_channel | budget_signal
//
// Each gate criterion needs specific evidence types. Each intake question
// is designed to produce at least one evidence type for at least one gate.
//
// LEGEND:
//   ● BLOCKING — this criterion can BLOCK the pipeline
//   ◐ TASTE — this criterion affects the taste score (no block)
//   ○ INFORM — gate-internal judgment, not driven by intake
//
// GATE CRITERION         | EVIDENCE TYPE        | INTAKE Q    | SEVERITY
// ───────────────────────┼──────────────────────┼─────────────┼──────────
// QW-A1   Stated need     | pain_point           | Q1, Q2, Q3  | ● BLOCKING
// QW-A2   Scope match     | pain_point           | (gate judgment) | ○
// QW-E1   Traceability    | pain_point, metric   | Q3, Q4, Q5  | ● BLOCKING
// QW-E2   Tool grounding  | tool_usage           | Q2          | ● BLOCKING
// QW-E3   Number ground.  | metric               | Q4, Q5      | ● BLOCKING
// QW-R1   Over-promise    | (gate judgment)      | —           | ○
// QW-R2   Regulated risk  | (gate judgment)      | —           | ○
// MP-A1   Problem exist.  | pain_point           | Q1, Q3      | ● BLOCKING
// MP-A2   Scale match     | business_context     | Q1          | ◐ TASTE
// MP-E1   Budget align.   | budget_signal        | Q8          | ● BLOCKING
// MP-E2   Timeline align. | business_context     | Q10         | ◐ TASTE
// MP-E3   Capability      | tool_usage, context  | Q2, Q9      | ◐ TASTE
// MP-R1   Cost promise    | (gate judgment)      | —           | ○
// MP-R2   Category        | (gate judgment)      | —           | ○
// RR-A0   Evidence trace  | ALL                  | ALL         | ● BLOCKING
// RR-A0b  Gap handling    | workflow_detail      | Q7          | ◐ TASTE
// RR-T1   Evidence ground | pain_point, metric   | Q3, Q4, Q5  | ◐ TASTE
// RR-T2   Recomm. cred.   | tool_usage           | Q2, Q7      | ◐ TASTE
// RR-T3   Client spec.    | customer_channel     | Q1, Q6      | ◐ TASTE
// RR-T4   Financial hon.  | metric               | Q4, Q5, Q8  | ◐ TASTE
// RR-T5   AU Market fit   | business_context     | Q1 (implicit AU) | ◐
// RR-TC1  Tool citation   | tool_usage           | Q2          | ● BLOCKING
// RR-TC2  Desc accuracy   | tool_usage           | Q2          | ● BLOCKING
// RR-TC3  Pricing acc.    | tool_usage           | Q2          | ● BLOCKING
//
// INTAKE QUESTION ORDER is front-loaded with ● BLOCKING criteria:
//   Q1 business_overview  → business_context (1 BLOCKING, 3 TASTE)
//   Q2 current_tools       → tool_usage        (3 BLOCKING, 2 TASTE)
//   Q3 pain_points         → pain_point        (3 BLOCKING, 1 TASTE)
//   Q4 workflow_details    → workflow_detail   (2 BLOCKING, 2 TASTE)
//   Q5 concrete_metrics    → metric            (2 BLOCKING, 2 TASTE)
//   Q6 customer_channels   → customer_channel  (1 TASTE)
//   Q7 process_consistency → workflow_detail   (1 BLOCKING, 2 TASTE)
//   Q8 budget              → budget_signal     (2 BLOCKING)
//   Q9 ai_readiness        → business_context  (2 TASTE)
//   Q10 timeline           → business_context  (1 TASTE)
// ============================================================================

export interface IntakeQuestion {
  id: string;
  topic: string;
  question: string;
  /** Gate criteria this question feeds (for traceability). */
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

/** The full intake script. Annie presents questions in order, with probing follow-ups. */
export const INTAKE_SCRIPT: IntakeQuestion[] = [
  {
    id: 'business_overview',
    topic: 'Business Overview',
    // Feeds: QW-A1 (stated need), MP-A2 (scale match), RR-A0 (traceability), RR-T3 (specificity), RR-T5 (AU fit)
    // Gate needs: industry vertical, team size (FT/PT/contractor breakdown), owner role, operating duration, AU confirmation
    question: "To start — what does your business do, and what industry are you in? Tell me your role, how many people work there (rough split between full-time, part-time, and contractors if that applies), and how long you've been operating.",
    followUps: [
      {
        keywords: ['team', 'employee', 'staff', 'people', 'freelancer', 'solo'],
        probe: "Got it — and how is the team structured? Clear departments with dedicated roles, or more of an 'everyone pitches in' setup?"
      },
      {
        keywords: ['startup', 'new', 'just started', 'recently', 'founded'],
        probe: "Early days then. What's been the steepest learning curve so far — finding customers, managing cash flow, or just keeping everything organized?"
      },
      {
        keywords: ['trade', 'construction', 'plumbing', 'electrical', 'building', 'service'],
        probe: "Tradie business — that's really relevant for what tools make sense. Are you mostly on the tools yourself these days, or more running the business side?"
      }
    ],
    feedsGateCriteria: ['QW-A1', 'MP-A2', 'RR-A0', 'RR-T3', 'RR-T5'],
    required: true
  },
  {
    id: 'current_tools',
    topic: 'Current Tooling & Tech Stack',
    // Feeds: QW-A1 (stated need), QW-E2 (tool grounding), RR-TC1–TC3 (tool citation), MP-E3 (capability), RR-T2 (credibility)
    // Gate needs: exact tool names (for citation verification), satisfaction signals, integration gaps, manual workarounds
    question: "What software and tools does your business actually use day-to-day? Name them if you can — CRM, accounting, scheduling, email, spreadsheets, whatever's part of your daily workflow. And be honest: which ones do you actually like using, and which ones drive people up the wall?",
    followUps: [
      {
        keywords: ['none', 'not really', 'manual', 'spreadsheet', 'excel', 'google sheets', 'pen', 'paper'],
        probe: "So things are pretty manual. What's the most time-consuming task you're doing by hand that you know should be automated by now?"
      },
      {
        keywords: ['xero', 'quickbooks', 'myob', 'jobber', 'simpro', 'servicem8', 'tradify', 'fergus'],
        probe: "You're using some solid tools already. Do they talk to each other, or are you copying data between them?"
      },
      {
        keywords: ['zapier', 'make', 'integromat', 'automation', 'api', 'integration'],
        probe: "You're already wiring things together — that's a great sign. Are there any connections that feel fragile or break more often than they should?"
      },
      {
        keywords: ['hate', 'frustrating', 'terrible', 'awful', 'slow', 'clunky', 'outdated'],
        probe: "That one clearly bothers you. Is it the tool itself that's the problem, or more that it doesn't fit how you actually work?"
      }
    ],
    feedsGateCriteria: ['QW-A1', 'QW-E2', 'RR-TC1', 'RR-TC2', 'RR-TC3', 'MP-E3', 'RR-T2'],
    required: true
  },
  {
    id: 'pain_points',
    topic: 'Pain Points & Bottlenecks',
    // Feeds: QW-A1 (stated need), QW-E1 (traceability), MP-A1 (problem existence), RR-A0, RR-T1 (evidence grounding)
    // Gate needs: specific, quotable frustration statements, frequency, impact, who feels it most
    question: "What's the thing in your business that makes you think 'there has to be a better way'? Not a general frustration — I'm looking for something specific that happened this week or last week that ate up time it shouldn't have.",
    followUps: [
      {
        keywords: ['reporting', 'reports', 'data', 'analytics', 'dashboard'],
        probe: "Walk me through the last report you put together — where did the data come from, how many steps, how long did it take?"
      },
      {
        keywords: ['email', 'inbox', 'messages', 'communication', 'slack', 'teams'],
        probe: "Is it the volume that's the problem, or more that things get lost and slip through the cracks? Can you remember the last time something important got missed?"
      },
      {
        keywords: ['customer', 'client', 'lead', 'enquiry', 'support', 'service'],
        probe: "How are enquiries handled right now — is there one person who owns it, or is it whoever grabs the phone first?"
      },
      {
        keywords: ['every day', 'constantly', 'always', 'daily', 'every week'],
        probe: "So this is a recurring headache, not a one-off. Is it worse at certain times — end of month, busy season, staff leave?"
      }
    ],
    feedsGateCriteria: ['QW-A1', 'QW-E1', 'MP-A1', 'RR-A0', 'RR-T1'],
    required: true
  },
  {
    id: 'workflow_details',
    topic: 'Workflow Deep Dive',
    // Feeds: QW-E1 (traceability), QW-E3 (number grounding), RR-A0 (traceability), RR-T1 (evidence grounding), RR-T4 (financial honesty)
    // Gate needs: task names, hours per task with provenance, who performs it, frequency pattern, seasonal variation
    question: "Let's get specific — this is what makes the numbers in your report accurate. Walk me through your 2-3 most time-consuming recurring tasks. For each one: roughly how many hours per week, who handles it, and is this consistent week to week or does it spike at certain times?",
    followUps: [
      {
        keywords: ['invoicing', 'billing', 'invoice', 'accounts', 'payments', 'receivable'],
        probe: "Is it just creating and sending invoices, or does it include chasing late payments and reconciling? Those are different time sinks and we should separate them."
      },
      {
        keywords: ['scheduling', 'roster', 'shifts', 'booking', 'appointment', 'calendar'],
        probe: "And is most of the time spent on the initial scheduling, or on handling changes, cancellations, and rescheduling?"
      },
      {
        keywords: ['varies', 'depends', 'season', 'busy', 'quiet', 'spike', 'surge'],
        probe: "Good to know — during your busiest period, does that time roughly double, or is it more like 50% more?"
      }
    ],
    feedsGateCriteria: ['QW-E1', 'QW-E3', 'RR-A0', 'RR-T1', 'RR-T4'],
    required: true
  },
  {
    id: 'concrete_metrics',
    topic: 'Quantifying the Impact',
    // Feeds: QW-E1 (traceability), QW-E3 (number grounding), RR-A0 (traceability), RR-T1 (evidence grounding), RR-T4 (financial honesty)
    // Gate needs: hours/week, dollar cost per incident, volume numbers, revenue impact — any number the report can anchor to
    question: "Now the numbers — even rough ones help. For your biggest time-waster: roughly how many hours per week? What does it actually cost when it goes wrong — lost revenue, overtime hours, missed deadlines, customers lost? And any volume numbers you can share — leads per week, invoices per month, jobs per day?",
    followUps: [
      {
        keywords: ['not sure', 'don\'t know', 'hard to say', 'depends', 'varies'],
        probe: "No problem — that's actually useful to know. Has anyone ever tried to measure it, or is this a 'nobody's ever tracked it' situation?"
      },
      {
        keywords: ['thousand', 'hundred', 'dollar', '$', 'cost', 'losing', 'loss', 'revenue'],
        probe: "That's helpful — and is that something you can see in your accounts, or more of a gut-feel number you've worked out over time?"
      }
    ],
    feedsGateCriteria: ['QW-E1', 'QW-E3', 'RR-A0', 'RR-T1', 'RR-T4'],
    required: true
  },
  {
    id: 'customer_channels',
    topic: 'Customer Channels',
    // Feeds: RR-T3 (client specificity)
    // Gate needs: channel names with volume splits, conversion quality, after-hours handling — enables channel-specific tool matching
    question: "Where do your customers actually come from? Phone calls, your website, email, walk-ins, word of mouth, social media — roughly what percentage comes through each channel, and which channel tends to bring your best customers?",
    followUps: [
      {
        keywords: ['phone', 'call', 'calling', 'mobile', 'ring'],
        probe: "And when someone calls outside business hours or you can't pick up — voicemail, text back later, or do you think you lose some of those?"
      },
      {
        keywords: ['website', 'online', 'form', 'chat', 'contact', 'google'],
        probe: "Are people finding you through Google searches, or more through your social media and word of mouth?"
      },
      {
        keywords: ['word of mouth', 'referral', 'recommendation', 'friend', 'repeat'],
        probe: "Referral and repeat business is gold — but hard to scale. Do you have any system for staying in touch with past customers, or is it more 'they'll call when they need us'?"
      }
    ],
    feedsGateCriteria: ['RR-A0', 'RR-T3'],
    required: true
  },
  {
    id: 'process_consistency',
    topic: 'Process Consistency',
    // Feeds: QW-E1 (traceability), RR-A0b (gap handling), RR-T2 (recommendation credibility)
    // Gate needs: documented vs ad-hoc signal, enforcement level, tooling for processes — determines whether automation or standardization comes first
    question: "For the key workflows you just described — is there a written-down process everyone follows, or does each person have their own way? And if there is a process, is it in a tool or system somewhere, or more of a 'this is how we've always done it' understanding?",
    followUps: [
      {
        keywords: ['documented', 'written', 'standard', 'same', 'consistent', 'process', 'procedure', 'checklist', 'system'],
        probe: "Good — and be honest: do people actually follow it day to day, or does the real-world version drift from what's on paper?"
      },
      {
        keywords: ['own way', 'different', 'varies', 'depends', 'each', 'individual', 'no process'],
        probe: "That's really common and it's important context — it actually changes what kind of tool or system we'd recommend. Is the variation a problem for you, or more of a 'we're small enough that it works fine' thing?"
      }
    ],
    feedsGateCriteria: ['QW-E1', 'RR-A0', 'RR-A0b', 'RR-T2'],
    required: true
  },
  {
    id: 'budget',
    topic: 'Budget & Investment',
    // Feeds: MP-E1 (budget alignment), RR-T4 (financial honesty)
    // Gate needs: monthly investment range covering both tools AND implementation, past spend signal
    question: "What feels like a comfortable monthly investment for improving how your business runs — including both software tools and any setup or support you might need? A ballpark like 'a couple hundred' or 'up to a thousand' is more than enough to work with.",
    feedsGateCriteria: ['MP-E1', 'RR-T4'],
    required: true
  },
  {
    id: 'ai_readiness',
    topic: 'AI Readiness & Experience',
    // Feeds: MP-E3 (capability alignment), RR-T2 (recommendation credibility)
    // Gate needs: specific tools used, depth of use (experimentation vs workflow integration), team sentiment
    question: "Quick pulse check: have you or anyone on your team used AI tools before — ChatGPT, Claude, Copilot, or anything built into your existing software? And are you using them regularly as part of your workflow, or more experimenting here and there?",
    followUps: [
      {
        keywords: ['yes', 'chatgpt', 'claude', 'copilot', 'used', 'tried', 'regularly', 'daily'],
        probe: "What's been the most useful thing you've used it for? And anything you tried that was more trouble than it was worth?"
      },
      {
        keywords: ['no', 'not really', 'haven\'t', 'avoid', 'wary', 'unsure', 'experiment'],
        probe: "Fair enough. Is there a particular concern holding you back, or has it just not been a priority yet?"
      }
    ],
    feedsGateCriteria: ['MP-E3', 'RR-T2'],
    required: true
  },
  {
    id: 'timeline',
    topic: 'Timeline & Urgency',
    question: "And lastly — how urgent is this for you? Are you looking for quick wins this month, planning improvements over the next quarter, or just exploring what's possible?",
    followUps: [
      {
        keywords: ['urgent', 'asap', 'this month', 'now', 'immediately', 'quick'],
        probe: "What's driving the urgency — a specific pain point that's getting worse, or a growth opportunity you want to capture?"
      },
      {
        keywords: ['quarter', 'next few', 'planning', 'exploring', 'sometime'],
        probe: "No rush at all. Is there a particular trigger that would move this up your priority list?"
      }
    ],
    feedsGateCriteria: ['MP-E2'],
    required: true
  }
];

/** Total number of intake questions. */
export const TOTAL_QUESTIONS = INTAKE_SCRIPT.length;

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
