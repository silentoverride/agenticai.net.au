import { describe, expect, it } from 'vitest';
import { mapBrownfieldReportState } from '$lib/server/staff-portal/mappers/brownfield-report-state';
import { reportFacts } from '$lib/server/staff-portal/testing/builders';

const notApprovedStatuses = ['ready', 'completed', 'delivered'];

describe('mapBrownfieldReportState', () => {
  it.each(['pending', 'pending_payment', 'queued'])('maps %s as queued, never approved', (status) => {
    const result = mapBrownfieldReportState(reportFacts({ pipelineStatus: status, artifactPresent: false }));
    expect(result.state).toBe('queued');
    expect(result.approved).toBe(false);
    expect(result.canDeliver).toBe(false);
  });

  it.each(['running_llm', 'running_tools', 'running_deck', 'generating'])('maps %s as generating, never approved', (status) => {
    const result = mapBrownfieldReportState(reportFacts({ pipelineStatus: status, artifactPresent: false }));
    expect(result.state).toBe('generating');
    expect(result.approved).toBe(false);
  });

  it('maps delayed without artifact as delayed, never approved', () => {
    const result = mapBrownfieldReportState(reportFacts({ pipelineStatus: 'delayed', artifactPresent: false }));
    expect(result.state).toBe('delayed');
    expect(result.approved).toBe(false);
  });

  it.each(notApprovedStatuses)('does not treat raw %s as approved without approval evidence', (status) => {
    const result = mapBrownfieldReportState(reportFacts({ pipelineStatus: status, artifactPresent: true, approvalEvidence: false }));
    expect(result.state).toBe('generated');
    expect(result.approved).toBe(false);
    expect(result.blockedReasons).toContain('approvalEvidenceRequired');
  });

  it('maps human_assist and pending review as escalated', () => {
    expect(mapBrownfieldReportState(reportFacts({ pipelineStatus: 'human_assist' })).state).toBe('escalated');
    expect(mapBrownfieldReportState(reportFacts({ humanAssistStatus: 'pending' })).state).toBe('escalated');
  });

  it('maps in_review to inReview', () => {
    const result = mapBrownfieldReportState(reportFacts({ humanAssistStatus: 'in_review' }));
    expect(result.state).toBe('inReview');
    expect(result.humanReviewState).toBe('inReview');
  });

  it('requires approval evidence and no unresolved blockers for approved', () => {
    const approved = mapBrownfieldReportState(reportFacts({ humanAssistStatus: 'approved', approvalEvidence: { checklist: true } }));
    expect(approved.state).toBe('approved');
    expect(approved.canDeliver).toBe(true);

    const noEvidence = mapBrownfieldReportState(reportFacts({ humanAssistStatus: 'approved', approvalEvidence: false }));
    expect(noEvidence.state).toBe('conflict');
    expect(noEvidence.approved).toBe(false);

    const blockingFinding = mapBrownfieldReportState(reportFacts({
      humanAssistStatus: 'approved',
      approvalEvidence: true,
      unresolvedBlockingFindings: 1
    }));
    expect(blockingFinding.state).toBe('conflict');
    expect(blockingFinding.blockedReasons).toContain('unresolvedBlockingFinding');
  });

  it('maps rejected and edited to governed non-deliverable states', () => {
    expect(mapBrownfieldReportState(reportFacts({ humanAssistStatus: 'rejected' })).state).toBe('rejected');
    expect(mapBrownfieldReportState(reportFacts({ humanAssistStatus: 'edited' })).state).toBe('regenerationRequired');
  });

  it.each(['failed', 'error'])('maps %s as unavailable, never approved', (status) => {
    const result = mapBrownfieldReportState(reportFacts({ pipelineStatus: status, artifactPresent: false }));
    expect(result.state).toBe('unavailable');
    expect(result.approved).toBe(false);
  });

  it.each(['failed', 'error'])('does not approve %s even with raw approved review evidence', (status) => {
    const result = mapBrownfieldReportState(reportFacts({
      pipelineStatus: status,
      humanAssistStatus: 'approved',
      artifactPresent: true,
      approvalEvidence: true
    }));
    expect(result.state).toBe('conflict');
    expect(result.approved).toBe(false);
    expect(result.canDeliver).toBe(false);
    expect(result.blockedReasons).toContain('conflictingRecords');
  });

  it('surfaces missing artifacts and conflicts instead of silently approving', () => {
    const missing = mapBrownfieldReportState(reportFacts({ pipelineStatus: 'ready', artifactPresent: false }));
    expect(missing.state).toBe('unavailable');
    expect(missing.blockedReasons).toContain('missingArtifact');

    const conflict = mapBrownfieldReportState(reportFacts({ conflict: true, approvalEvidence: true }));
    expect(conflict.state).toBe('conflict');
    expect(conflict.approved).toBe(false);
    expect(conflict.blockedReasons).toContain('conflictingRecords');
  });
});
