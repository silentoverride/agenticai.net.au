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

export interface IntakeQuestion {
  id: string;
  topic: string;
  question: string;
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
    question: "Let's start with the basics. What does your business do, and what's your role there? Tell me a bit about the team size and how long you've been operating.",
    followUps: [
      {
        keywords: ['team', 'employee', 'staff', 'people', 'freelancer', 'solo'],
        probe: "Great, and how is the team currently structured? Are there clear departments or do people wear multiple hats?"
      },
      {
        keywords: ['startup', 'new', 'just started', 'recently', 'founded'],
        probe: "How has the first few months been? What's been the biggest challenge in getting established?"
      }
    ],
    required: true
  },
  {
    id: 'current_tools',
    topic: 'Current Tooling & Tech Stack',
    question: "What tools and software does your business use day-to-day? Think about CRM, project management, accounting, communication platforms, reporting, and any other systems you rely on.",
    followUps: [
      {
        keywords: ['none', 'not really', 'manual', 'spreadsheet', 'excel', 'google sheets', 'pen'],
        probe: "So things are fairly manual at the moment. What's the most time-consuming manual task that you wish was automated?"
      },
      {
        keywords: ['zapier', 'make', 'integromat', 'automation', 'api'],
        probe: "You're already using some automation — that's great. Are there any workflows that still feel clunky or require too many steps?"
      }
    ],
    required: true
  },
  {
    id: 'pain_points',
    topic: 'Pain Points & Bottlenecks',
    question: "What frustrates you most about your current workflow? Where do you feel like time or money is being wasted on a regular basis?",
    followUps: [
      {
        keywords: ['reporting', 'reports', 'data', 'analytics', 'dashboard'],
        probe: "How are you currently handling those reports — manually pulling data from different sources?"
      },
      {
        keywords: ['email', 'inbox', 'messages', 'communication', 'slack', 'teams'],
        probe: "It sounds like communication is a bottleneck. Are you missing messages, or is the volume just too high to keep up with?"
      },
      {
        keywords: ['customer', 'client', 'lead', 'enquiry', 'support', 'service'],
        probe: "How are you currently handling customer enquiries — is there a dedicated person or does it fall on whoever's available?"
      }
    ],
    required: true
  },
  {
    id: 'ai_readiness',
    topic: 'AI Readiness & Experience',
    question: "Have you or your team used any AI tools before? Things like ChatGPT, Claude, Copilot, or any AI-powered features in your existing software.",
    followUps: [
      {
        keywords: ['yes', 'chatgpt', 'claude', 'copilot', 'used', 'tried', 'experiment'],
        probe: "What has your experience been like? Are there specific things you found useful or frustrating?"
      },
      {
        keywords: ['no', 'not really', 'haven\'t', 'avoid', 'wary', 'unsure'],
        probe: "That's completely understandable. Is there a particular concern or just not enough time to explore it?"
      }
    ],
    required: true
  },
  {
    id: 'budget',
    topic: 'Budget & Investment',
    question: "For improving your business with AI and automation, what's a comfortable monthly investment range? Are you thinking a small subscription, a few hundred, or more significant investment?",
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
