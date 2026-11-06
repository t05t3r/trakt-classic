import { describe, expect, it } from 'vitest';
import { toActionUnderInfo } from './toActionUnderInfo.ts';

const LAST_WATCHED_AT = new Date('2026-07-06T20:04:00Z');

describe('toActionUnderInfo', () => {
  describe('for a played title', () => {
    it('should read the date and time of its latest play', () => {
      expect(toActionUnderInfo({ kind: 'played', at: LAST_WATCHED_AT })).toBe(
        '6 Jul 2026 20:04',
      );
    });

    it('should give no line while the date is not known', () => {
      expect(toActionUnderInfo({ kind: 'played', at: null })).toBeUndefined();
    });
  });

  describe('for a dropped show', () => {
    it('should read as dropped with no counts', () => {
      expect(toActionUnderInfo({ kind: 'dropped' })).toBe('Dropped');
    });

    it('should follow the counts it is given', () => {
      expect(
        toActionUnderInfo({ kind: 'dropped', counts: '25/30 eps — 25 plays' }),
      ).toBe('25/30 eps — 25 plays · Dropped');
    });
  });

  describe('for an added title', () => {
    it('should read the date it was added', () => {
      expect(toActionUnderInfo({ kind: 'added', at: LAST_WATCHED_AT })).toBe(
        'Added 6 Jul 2026',
      );
    });

    it('should give no line while the date is not known', () => {
      expect(toActionUnderInfo({ kind: 'added', at: undefined }))
        .toBeUndefined();
    });
  });
});
