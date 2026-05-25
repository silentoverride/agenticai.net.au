import type { AsyncDb } from '$lib/server/db';
import type { StaffFollowUpDto, FollowUpSource } from '$lib/staff-portal/dto';
import { insertFollowUp } from '$lib/server/staff-portal/repositories/follow-up.repository';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateFollowUpForSourceInput {
  assessmentId: string;
  title: string;
  description?: string;
  ownerId?: string;
  dueDate?: string;
  source: FollowUpSource;
  clientVisiblePromise?: boolean;
  consequenceOfInaction?: string;
  notes?: string;
  /** Report or gate-finding ID when created from a Human Review decision */
  reportId?: string;
  gateFindingId?: string;
  meetingBriefId?: string;
  commercialStepId?: string;
  supportIssueRef?: string;
  adminTaskRef?: string;
  delayedJourneyState?: string;
}

export type SourceFollowUpErrorCode = 'unsupportedSource' | 'validationFailed';

export interface SourceFollowUpError {
  code: SourceFollowUpErrorCode;
  message: string;
}

// ---------------------------------------------------------------------------
// Supported sources that permit follow-up creation
// ---------------------------------------------------------------------------

const SOURCES_ALLOWING_FOLLOW_UP_CREATION: FollowUpSource[] = [
  'client_profile',
  'human_review',
  'meeting_brief',
  'commercial_next_step',
  'support_issue',
  'admin_task',
  'delayed_journey'
];

const SOURCE_LINK_REQUIREMENTS: Partial<Record<FollowUpSource, { field: string; message: string }>> = {
  human_review: {
    field: 'reportId or gateFindingId',
    message: 'Follow-up from a Human Review decision must link to a report or gate finding.'
  },
  meeting_brief: {
    field: 'meetingBriefId',
    message: 'Follow-up from Meeting Brief notes must link to a meeting brief.'
  },
  commercial_next_step: {
    field: 'commercialStepId',
    message: 'Follow-up from a Commercial Next Step must link to a commercial step.'
  }
};

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * Create a follow-up linked to a specific source context.
 *
 * Validates that:
 *   - The source type is supported for follow-up creation
 *   - Required source-object link fields are present (e.g. reportId for human_review)
 *
 * Returns the created follow-up DTO or a structured error.
 */
export async function createFollowUpForSource(
  db: AsyncDb,
  input: CreateFollowUpForSourceInput
): Promise<{ success: true; followUp: StaffFollowUpDto } | { success: false; error: SourceFollowUpError }> {
  // Validate source is supported
  if (!SOURCES_ALLOWING_FOLLOW_UP_CREATION.includes(input.source)) {
    return {
      success: false,
      error: {
        code: 'unsupportedSource',
        message: `Source '${input.source}' does not support follow-up creation. Supported sources: ${SOURCES_ALLOWING_FOLLOW_UP_CREATION.join(', ')}.`
      }
    };
  }

  // Validate source-link requirements
  const linkRequirement = SOURCE_LINK_REQUIREMENTS[input.source];
  if (linkRequirement) {
    const hasReportLink = Boolean(input.reportId);
    const hasGateFindingLink = Boolean(input.gateFindingId);
    const hasMeetingBriefLink = Boolean(input.meetingBriefId);
    const hasCommercialStepLink = Boolean(input.commercialStepId);

    if (input.source === 'human_review') {
      if (!hasReportLink && !hasGateFindingLink) {
        return { success: false, error: { code: 'validationFailed', message: linkRequirement.message } };
      }
    } else if (input.source === 'meeting_brief' && !hasMeetingBriefLink) {
      return { success: false, error: { code: 'validationFailed', message: linkRequirement.message } };
    } else if (input.source === 'commercial_next_step' && !hasCommercialStepLink) {
      return { success: false, error: { code: 'validationFailed', message: linkRequirement.message } };
    }
  }

  // Build the repository input
  const id = crypto.randomUUID();

  try {
    const followUp = await insertFollowUp(db, {
      id,
      assessmentId: input.assessmentId,
      title: input.title,
      description: input.description,
      ownerId: input.ownerId,
      dueDate: input.dueDate,
      source: input.source,
      clientVisiblePromise: input.clientVisiblePromise,
      consequenceOfInaction: input.consequenceOfInaction,
      notes: input.notes,
      linkedReportId: input.reportId,
      linkedGateFindingId: input.gateFindingId,
      linkedMeetingBriefId: input.meetingBriefId,
      linkedCommercialStepId: input.commercialStepId,
      supportIssueRef: input.supportIssueRef,
      adminTaskRef: input.adminTaskRef,
      delayedJourneyState: input.delayedJourneyState
    });

    return { success: true, followUp };
  } catch (err) {
    console.error('Failed to create follow-up for source:', err);
    return { success: false, error: { code: 'validationFailed', message: 'Failed to persist follow-up.' } };
  }
}
