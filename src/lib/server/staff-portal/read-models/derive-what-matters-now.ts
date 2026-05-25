import type {
  StaffClientProfileSnapshotDto,
  StaffWhatMattersNowDto,
  PrimaryTreatment,
  BlockerType,
  SourceDomain,
  ReportState,
  HumanReviewState,
  MeetingBriefState,
  FollowUpState,
  CommercialNextStepStatus
} from '$lib/staff-portal/dto';
import { REPORT_STATES, HUMAN_REVIEW_STATES } from '../domain/states';

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------

export interface DeriveWhatMattersNowInput {
  profile: StaffClientProfileSnapshotDto | null;
}

// ---------------------------------------------------------------------------
// Precedence levels (lower number = higher priority)
// ---------------------------------------------------------------------------

const PRECEDENCE: Record<PrimaryTreatment, number> = {
  blocked: 1,
  requires_decision: 2,
  at_risk: 3,
  draft_stale: 4,
  ready: 5,
  completed: 6,
  all_clear: 7
};

// ---------------------------------------------------------------------------
// Derivation engine
// ---------------------------------------------------------------------------

export function deriveWhatMattersNow(
  input: DeriveWhatMattersNowInput
): StaffWhatMattersNowDto {
  const { profile } = input;

  // No profile → nothing matters now
  if (!profile) {
    return allClear();
  }

  // Evaluate each domain section and collect candidate treatments
  const candidates: Array<{
    treatment: PrimaryTreatment;
    precedence: number;
    blockerName: string | null;
    blockerType: BlockerType | null;
    nextValidAction: string | null;
    nextActionRoute: string | null;
    ownerName: string | null;
    dueDate: string | null;
    consequenceOfInaction: string | null;
    sourceDomain: SourceDomain | null;
  }> = [];

  // --- 1. Report Review domain ---
  const reportCandidate = evaluateReportDomain(profile.reportState, profile.humanReviewState);
  if (reportCandidate) candidates.push(reportCandidate);

  // --- 2. Gate Finding domain ---
  // Gate findings are surfaced through the report state. If the report is 'escalated'
  // or 'inReview' with certain human review states, there are open findings.
  const gateCandidate = evaluateGateDomain(profile.reportState, profile.humanReviewState);
  if (gateCandidate) candidates.push(gateCandidate);

  // --- 3. Meeting Brief domain (when available) ---
  if (profile.meetingBriefState !== 'not_available') {
    const meetingCandidate = evaluateMeetingDomain(profile.meetingBriefState);
    if (meetingCandidate) candidates.push(meetingCandidate);
  }

  // --- 4. Follow-up domain (when available) ---
  if (profile.followUpState !== 'not_available') {
    const followUpCandidate = evaluateFollowUpDomain(profile.followUpState);
    if (followUpCandidate) candidates.push(followUpCandidate);
  }

  // --- 5. Commercial domain (when available) ---
  if (profile.commercialNextStepStatus !== 'not_available') {
    const commercialCandidate = evaluateCommercialDomain(profile.commercialNextStepStatus);
    if (commercialCandidate) candidates.push(commercialCandidate);
  }

  // If no candidates found, return all-clear or ready state
  if (candidates.length === 0) {
    return readyState(profile.ownerName);
  }

  // Pick the highest precedence (lowest number) candidate
  candidates.sort((a, b) => a.precedence - b.precedence);
  const top = candidates[0];

  return {
    primaryTreatment: top.treatment,
    blocker: {
      blockerName: top.blockerName,
      blockerType: top.blockerType
    },
    nextValidAction: top.nextValidAction,
    nextActionRoute: top.nextActionRoute,
    ownerName: top.ownerName ?? (profile.ownerName || null),
    dueDate: top.dueDate,
    consequenceOfInaction: top.consequenceOfInaction,
    sourceDomain: top.sourceDomain,
    precedenceLevel: top.precedence
  };
}

// ---------------------------------------------------------------------------
// Domain evaluator return type
// ---------------------------------------------------------------------------

interface TreatmentCandidate {
  treatment: PrimaryTreatment;
  precedence: number;
  blockerName: string | null;
  blockerType: BlockerType | null;
  nextValidAction: string | null;
  nextActionRoute: string | null;
  ownerName: string | null;
  dueDate: string | null;
  consequenceOfInaction: string | null;
  sourceDomain: SourceDomain | null;
}

// ---------------------------------------------------------------------------
// Domain evaluators
// ---------------------------------------------------------------------------

function evaluateReportDomain(
  reportState: ReportState,
  humanReviewState: HumanReviewState
): TreatmentCandidate | null {
  switch (reportState) {
    case REPORT_STATES.ESCALATED:
      return {
        treatment: 'blocked',
        precedence: PRECEDENCE.blocked,
        blockerName: 'Report escalated for human review',
        blockerType: 'report_blocker',
        nextValidAction: 'Open review workspace',
        nextActionRoute: `/operator/assessments`,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Report delivery is blocked until review is completed.',
        sourceDomain: 'report_review'
      };

    case REPORT_STATES.IN_REVIEW:
      return {
        treatment: 'requires_decision',
        precedence: PRECEDENCE.requires_decision,
        blockerName: null,
        blockerType: null,
        nextValidAction: 'Complete review',
        nextActionRoute: `/operator/assessments`,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Report will not be available for delivery until approved.',
        sourceDomain: 'report_review'
      };

    case REPORT_STATES.GENERATED:
      return {
        treatment: 'requires_decision',
        precedence: PRECEDENCE.requires_decision,
        blockerName: null,
        blockerType: null,
        nextValidAction: humanReviewState === HUMAN_REVIEW_STATES.NONE
          ? 'Begin review'
          : 'Continue review',
        nextActionRoute: `/operator/assessments`,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Report will not be available for delivery if not reviewed.',
        sourceDomain: 'report_review'
      };

    case REPORT_STATES.CONFLICT:
      return {
        treatment: 'blocked',
        precedence: PRECEDENCE.blocked,
        blockerName: 'Conflicting report records',
        blockerType: 'report_blocker',
        nextValidAction: 'Resolve state conflict',
        nextActionRoute: `/operator/assessments`,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Report cannot be safely processed.',
        sourceDomain: 'report_review'
      };

    case REPORT_STATES.DELAYED:
      return {
        treatment: 'at_risk',
        precedence: PRECEDENCE.at_risk,
        blockerName: 'Report generation delayed',
        blockerType: 'report_blocker',
        nextValidAction: 'Monitor pipeline',
        nextActionRoute: null,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Continued delay may affect client delivery timeline.',
        sourceDomain: 'report_review'
      };

    case REPORT_STATES.APPROVED:
      return {
        treatment: 'ready',
        precedence: PRECEDENCE.ready,
        blockerName: null,
        blockerType: null,
        nextValidAction: 'Proceed with delivery',
        nextActionRoute: null,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: null,
        sourceDomain: 'report_review'
      };

    default:
      return null;
  }
}

function evaluateGateDomain(
  reportState: ReportState,
  humanReviewState: HumanReviewState
): TreatmentCandidate | null {
  // Gate findings are surfaced through report/human review state
  // Only report when there's active human review with pending/blocking gates
  if (reportState === REPORT_STATES.ESCALATED || reportState === REPORT_STATES.IN_REVIEW) {
    if (humanReviewState === HUMAN_REVIEW_STATES.PENDING) {
      return {
        treatment: 'requires_decision',
        precedence: PRECEDENCE.requires_decision + 0.5, // slightly below report-level requires_decision
        blockerName: 'Gate findings require review',
        blockerType: 'gate_finding',
        nextValidAction: 'Review gate findings',
        nextActionRoute: null,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Report approval is blocked until findings are resolved.',
        sourceDomain: 'gate_finding'
      };
    }
  }
  return null;
}

function evaluateMeetingDomain(
  meetingBriefState: MeetingBriefState
): TreatmentCandidate | null {
  switch (meetingBriefState) {
    case 'draft':
      return {
        treatment: 'draft_stale',
        precedence: PRECEDENCE.draft_stale,
        blockerName: 'Meeting Brief is in draft',
        blockerType: 'meeting_brief',
        nextValidAction: 'Complete meeting brief',
        nextActionRoute: null,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Meeting may proceed without preparation.',
        sourceDomain: 'meeting_brief'
      };

    case 'needsReview':
      return {
        treatment: 'requires_decision',
        precedence: PRECEDENCE.requires_decision,
        blockerName: 'Meeting Brief needs review',
        blockerType: 'meeting_brief',
        nextValidAction: 'Review meeting brief',
        nextActionRoute: null,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Meeting may proceed with outdated notes.',
        sourceDomain: 'meeting_brief'
      };

    case 'stale':
      return {
        treatment: 'at_risk',
        precedence: PRECEDENCE.at_risk,
        blockerName: 'Meeting Brief is stale',
        blockerType: 'meeting_brief',
        nextValidAction: 'Refresh meeting brief',
        nextActionRoute: null,
        ownerName: null,
        dueDate: null,
        consequenceOfInaction: 'Notes may not reflect current client context.',
        sourceDomain: 'meeting_brief'
      };

    default:
      return null;
  }
}

function evaluateFollowUpDomain(
  followUpState: FollowUpState
): TreatmentCandidate | null {
  if (followUpState === 'open') {
    return {
      treatment: 'at_risk',
      precedence: PRECEDENCE.at_risk,
      blockerName: 'Open follow-up items',
      blockerType: 'follow_up',
      nextValidAction: 'Review follow-ups',
      nextActionRoute: null,
      ownerName: null,
      dueDate: null,
      consequenceOfInaction: 'Client commitments may be missed.',
      sourceDomain: 'follow_up'
    };
  }
  return null;
}

function evaluateCommercialDomain(
  commercialStatus: CommercialNextStepStatus
): TreatmentCandidate | null {
  if (commercialStatus === 'discussOffer' || commercialStatus === 'sendFollowUp') {
    return {
      treatment: 'requires_decision',
      precedence: PRECEDENCE.requires_decision + 0.5,
      blockerName: 'Commercial next step requires follow-up',
      blockerType: 'commercial',
      nextValidAction: 'Complete commercial follow-up',
      nextActionRoute: null,
      ownerName: null,
      dueDate: null,
      consequenceOfInaction: 'Commercial commitment may become ambiguous.',
      sourceDomain: 'commercial'
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Default states
// ---------------------------------------------------------------------------

function allClear(): StaffWhatMattersNowDto {
  return {
    primaryTreatment: 'all_clear',
    blocker: { blockerName: null, blockerType: null },
    nextValidAction: null,
    nextActionRoute: null,
    ownerName: null,
    dueDate: null,
    consequenceOfInaction: null,
    sourceDomain: null,
    precedenceLevel: PRECEDENCE.all_clear
  };
}

function readyState(ownerName?: string): StaffWhatMattersNowDto {
  return {
    primaryTreatment: 'ready',
    blocker: { blockerName: null, blockerType: null },
    nextValidAction: null,
    nextActionRoute: null,
    ownerName: ownerName || null,
    dueDate: null,
    consequenceOfInaction: null,
    sourceDomain: null,
    precedenceLevel: PRECEDENCE.ready
  };
}
