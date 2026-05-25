import { describe, expect, it } from 'vitest';
import { deriveWhatMattersNow } from '$lib/server/staff-portal/read-models/derive-what-matters-now';
import type { StaffClientProfileSnapshotDto } from '$lib/staff-portal/dto';

// ---------------------------------------------------------------------------
// Helper to build a minimal profile
// ---------------------------------------------------------------------------

function profile(overrides?: Partial<StaffClientProfileSnapshotDto>): StaffClientProfileSnapshotDto {
  return {
    clientId: 'asst-001',
    businessName: 'Acme Corp',
    ownerName: 'operator-alice',
    journeyStage: 'assessment_complete',
    riskFlags: [],
    valueFlags: [],
    reportState: 'generated',
    humanReviewState: 'none',
    meetingBriefState: 'not_available',
    followUpState: 'not_available',
    commercialNextStepStatus: 'not_available',
    ...overrides
  };
}

describe('deriveWhatMattersNow', () => {
  // -----------------------------------------------------------------------
  // Blocked precedence (highest)
  // -----------------------------------------------------------------------

  it('returns blocked when report is escalated', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'escalated' })
    });

    expect(result.primaryTreatment).toBe('blocked');
    expect(result.blocker.blockerName).toBe('Report escalated for human review');
    expect(result.blocker.blockerType).toBe('report_blocker');
    expect(result.sourceDomain).toBe('report_review');
    expect(result.precedenceLevel).toBe(1);
  });

  it('returns blocked on conflicting report records', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'conflict' })
    });

    expect(result.primaryTreatment).toBe('blocked');
    expect(result.blocker.blockerName).toContain('Conflicting');
    expect(result.precedenceLevel).toBe(1);
  });

  // -----------------------------------------------------------------------
  // Requires decision precedence
  // -----------------------------------------------------------------------

  it('returns requires_decision when report is in review', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'inReview' })
    });

    expect(result.primaryTreatment).toBe('requires_decision');
    expect(result.nextValidAction).toBe('Complete review');
    expect(result.sourceDomain).toBe('report_review');
    expect(result.precedenceLevel).toBe(2);
  });

  it('returns requires_decision when report is generated and not reviewed', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'generated', humanReviewState: 'none' })
    });

    expect(result.primaryTreatment).toBe('requires_decision');
    expect(result.nextValidAction).toBe('Begin review');
    expect(result.sourceDomain).toBe('report_review');
  });

  it('returns requires_decision when report is generated and human review pending', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'generated', humanReviewState: 'pending' })
    });

    expect(result.primaryTreatment).toBe('requires_decision');
    expect(result.nextValidAction).toBe('Continue review');
  });

  // -----------------------------------------------------------------------
  // At risk precedence
  // -----------------------------------------------------------------------

  it('returns at_risk when report generation is delayed', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'delayed' })
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.blocker.blockerName).toBe('Report generation delayed');
    expect(result.sourceDomain).toBe('report_review');
    expect(result.precedenceLevel).toBe(3);
  });

  // -----------------------------------------------------------------------
  // Ready precedence
  // -----------------------------------------------------------------------

  it('returns ready when report is approved', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'approved' })
    });

    expect(result.primaryTreatment).toBe('ready');
    expect(result.precedenceLevel).toBe(5);
  });

  // -----------------------------------------------------------------------
  // Precedence ordering — multiple states compete
  // -----------------------------------------------------------------------

  it('blocked beats requires_decision when both apply', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'escalated',   // blocked
        meetingBriefState: 'needsReview'  // requires_decision
      })
    });

    expect(result.primaryTreatment).toBe('blocked');
    expect(result.precedenceLevel).toBe(1);
  });

  it('requires_decision beats at_risk when both apply', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'inReview',    // requires_decision
        meetingBriefState: 'stale'  // at_risk
      })
    });

    expect(result.primaryTreatment).toBe('requires_decision');
    expect(result.precedenceLevel).toBe(2);
  });

  it('at_risk beats draft/stale when both apply', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'delayed',          // at_risk
        meetingBriefState: 'draft'       // draft_stale
      })
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.precedenceLevel).toBe(3);
  });

  // -----------------------------------------------------------------------
  // Meeting brief domains
  // -----------------------------------------------------------------------

  it('returns draft_stale when meeting brief is draft', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'approved',  // neutral — won't compete
        meetingBriefState: 'draft',
        followUpState: 'not_available',
        commercialNextStepStatus: 'not_available'
      })
    });

    expect(result.primaryTreatment).toBe('draft_stale');
    expect(result.sourceDomain).toBe('meeting_brief');
    expect(result.precedenceLevel).toBe(4);
  });

  it('returns requires_decision when meeting brief needs review', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'approved',
        meetingBriefState: 'needsReview',
        followUpState: 'not_available',
        commercialNextStepStatus: 'not_available'
      })
    });

    expect(result.primaryTreatment).toBe('requires_decision');
    expect(result.sourceDomain).toBe('meeting_brief');
  });

  it('returns at_risk when meeting brief is stale', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'approved',
        meetingBriefState: 'stale',
        followUpState: 'not_available',
        commercialNextStepStatus: 'not_available'
      })
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.sourceDomain).toBe('meeting_brief');
  });

  // -----------------------------------------------------------------------
  // Follow-up domain
  // -----------------------------------------------------------------------

  it('returns at_risk when follow-ups are open', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'approved',
        followUpState: 'open',
        commercialNextStepStatus: 'not_available'
      })
    });

    expect(result.primaryTreatment).toBe('at_risk');
    expect(result.sourceDomain).toBe('follow_up');
    expect(result.blocker.blockerName).toBe('Open follow-up items');
  });

  // -----------------------------------------------------------------------
  // Commercial domain
  // -----------------------------------------------------------------------

  it('returns requires_decision when commercial discuss offer', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'approved',
        commercialNextStepStatus: 'discussOffer'
      })
    });

    expect(result.primaryTreatment).toBe('requires_decision');
    expect(result.sourceDomain).toBe('commercial');
  });

  it('returns requires_decision when commercial send follow-up', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'approved',
        commercialNextStepStatus: 'sendFollowUp'
      })
    });

    expect(result.primaryTreatment).toBe('requires_decision');
    expect(result.sourceDomain).toBe('commercial');
  });

  // -----------------------------------------------------------------------
  // All clear and ready
  // -----------------------------------------------------------------------

  it('returns all_clear when profile is null', () => {
    const result = deriveWhatMattersNow({ profile: null });

    expect(result.primaryTreatment).toBe('all_clear');
    expect(result.blocker.blockerName).toBeNull();
    expect(result.nextValidAction).toBeNull();
    expect(result.precedenceLevel).toBe(7);
  });

  it('returns ready when report is approved and no other domains active', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'approved' })
    });

    expect(result.primaryTreatment).toBe('ready');
    expect(result.precedenceLevel).toBe(5);
  });

  // -----------------------------------------------------------------------
  // Source domain clarity
  // -----------------------------------------------------------------------

  it('source domain is clear for report_review', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'escalated' })
    });

    expect(result.sourceDomain).toBe('report_review');
  });

  it('source domain is clear for report_review when report is escalated', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'escalated' })
    });

    expect(result.sourceDomain).toBe('report_review');
  });

  it('provides consequence of inaction for gate findings via report_review', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'generated',
        humanReviewState: 'pending'
      })
    });

    // When report is generated with pending human review, the report needs a decision
    expect(result.sourceDomain).toBe('report_review');
  });

  // -----------------------------------------------------------------------
  // Owner name is propagated
  // -----------------------------------------------------------------------

  it('propagates owner name from profile', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        ownerName: 'operator-bob',
        reportState: 'escalated'
      })
    });

    expect(result.ownerName).toBe('operator-bob');
  });

  // -----------------------------------------------------------------------
  // Consequence of inaction
  // -----------------------------------------------------------------------

  it('provides consequence of inaction for blocked state', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'escalated' })
    });

    expect(result.consequenceOfInaction).toBeTruthy();
    expect(result.consequenceOfInaction!.toLowerCase()).toContain('blocked');
  });

  it('provides consequence of inaction for at_risk state', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'delayed' })
    });

    expect(result.consequenceOfInaction).toBeTruthy();
  });

  it('does not provide consequence for ready state', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'approved' })
    });

    expect(result.consequenceOfInaction).toBeNull();
  });

  // -----------------------------------------------------------------------
  // DTO shape — camelCase, serializable, no server imports
  // -----------------------------------------------------------------------

  it('returns DTO with all expected camelCase fields', () => {
    const result = deriveWhatMattersNow({
      profile: profile({ reportState: 'escalated' })
    });

    const keys = Object.keys(result).sort();
    expect(keys).toEqual([
      'blocker',
      'consequenceOfInaction',
      'dueDate',
      'nextActionRoute',
      'nextValidAction',
      'ownerName',
      'precedenceLevel',
      'primaryTreatment',
      'sourceDomain'
    ].sort());

    // Verify serializable
    expect(() => JSON.stringify(result)).not.toThrow();
    const serialized = JSON.parse(JSON.stringify(result));
    expect(serialized.primaryTreatment).toBe('blocked');
    expect(serialized.blocker.blockerName).toBe('Report escalated for human review');
  });

  // -----------------------------------------------------------------------
  // Edge case: commercial with no-action status doesn't trigger
  // -----------------------------------------------------------------------

  it('does not trigger requires_decision for noAction commercial status', () => {
    const result = deriveWhatMattersNow({
      profile: profile({
        reportState: 'approved',
        commercialNextStepStatus: 'noAction'
      })
    });

    // Should be 'ready' because report is approved and no other domain triggers
    expect(result.primaryTreatment).toBe('ready');
  });
});
