import { describe, expect, it, beforeEach } from 'vitest';
import { createMemoryDb } from '../test-db';
import { validateFollowupContinuity, isHighIntentStatus } from '$lib/server/staff-portal/services/commercial-followup-requirement.service';

describe('commercial-followup-requirement service', () => {
  describe('isHighIntentStatus', () => {
    it('returns true for discussOffer', () => {
      expect(isHighIntentStatus('discussOffer')).toBe(true);
    });

    it('returns true for sendFollowUp', () => {
      expect(isHighIntentStatus('sendFollowUp')).toBe(true);
    });

    it('returns false for noAction', () => {
      expect(isHighIntentStatus('noAction')).toBe(false);
    });

    it('returns false for nurture', () => {
      expect(isHighIntentStatus('nurture')).toBe(false);
    });

    it('returns false for createFutureOpportunity', () => {
      expect(isHighIntentStatus('createFutureOpportunity')).toBe(false);
    });

    it('returns false for not_available', () => {
      expect(isHighIntentStatus('not_available')).toBe(false);
    });
  });

  describe('validateFollowupContinuity', () => {
    it('returns null for low-intent statuses regardless of follow-up note', () => {
      expect(validateFollowupContinuity('noAction', null, undefined)).toBeNull();
      expect(validateFollowupContinuity('nurture', null, undefined)).toBeNull();
      expect(validateFollowupContinuity('createFutureOpportunity', null, undefined)).toBeNull();
    });

    it('returns error for discussOffer without follow-up note or confirmation', () => {
      const error = validateFollowupContinuity('discussOffer', null, undefined);
      expect(error).toContain('requires follow-up continuity');
    });

    it('returns error for sendFollowUp without follow-up note or confirmation', () => {
      const error = validateFollowupContinuity('sendFollowUp', null, undefined);
      expect(error).toContain('requires follow-up continuity');
    });

    it('returns null for discussOffer with a follow-up note', () => {
      const result = validateFollowupContinuity('discussOffer', 'Will follow up after board meeting', undefined);
      expect(result).toBeNull();
    });

    it('returns null for sendFollowUp with a follow-up note', () => {
      const result = validateFollowupContinuity('sendFollowUp', 'Sent proposal already', undefined);
      expect(result).toBeNull();
    });

    it('returns null for discussOffer with explicit confirmation', () => {
      const result = validateFollowupContinuity('discussOffer', null, true);
      expect(result).toBeNull();
    });

    it('returns null for sendFollowUp with explicit confirmation', () => {
      const result = validateFollowupContinuity('sendFollowUp', '', true);
      expect(result).toBeNull();
    });

    it('ignores whitespace-only follow-up note', () => {
      const error = validateFollowupContinuity('discussOffer', '   ', undefined);
      expect(error).toContain('requires follow-up continuity');
    });

    it('accepts non-empty note with spaces', () => {
      const result = validateFollowupContinuity('discussOffer', 'Will call next week', undefined);
      expect(result).toBeNull();
    });
  });
});
