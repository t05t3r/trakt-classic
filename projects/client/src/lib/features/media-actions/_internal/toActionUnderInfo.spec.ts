import { describe, expect, it } from 'vitest';
import { toActionUnderInfo } from './toActionUnderInfo.ts';

const LAST_WATCHED_AT = new Date('2026-07-06T20:04:00Z');

describe('toActionUnderInfo', () => {
  describe('for plays', () => {
    it('should read a single play in the singular', () => {
      expect(
        toActionUnderInfo({
          kind: 'plays',
          count: 1,
          lastWatchedAt: LAST_WATCHED_AT,
        }),
      ).toBe('1 play · last 6 Jul 2026');
    });

    it('should read several plays in the plural', () => {
      expect(
        toActionUnderInfo({
          kind: 'plays',
          count: 3,
          lastWatchedAt: LAST_WATCHED_AT,
        }),
      ).toBe('3 plays · last 6 Jul 2026');
    });

    it('should give no line before the first play', () => {
      expect(
        toActionUnderInfo({ kind: 'plays', count: 0, lastWatchedAt: null }),
      ).toBeUndefined();
    });

    it('should give no line while the last play has no date', () => {
      expect(
        toActionUnderInfo({ kind: 'plays', count: 2, lastWatchedAt: null }),
      ).toBeUndefined();
    });
  });

  describe('for episodes', () => {
    it('should read the watched and aired episodes and the last play', () => {
      expect(
        toActionUnderInfo({
          kind: 'episodes',
          completed: 12,
          total: 40,
          lastWatchedAt: LAST_WATCHED_AT,
        }),
      ).toBe('12 of 40 episodes · last 6 Jul 2026');
    });

    it('should give no line before the first watched episode', () => {
      expect(
        toActionUnderInfo({
          kind: 'episodes',
          completed: 0,
          total: 40,
          lastWatchedAt: LAST_WATCHED_AT,
        }),
      ).toBeUndefined();
    });

    it('should give no line while the last play has no date', () => {
      expect(
        toActionUnderInfo({
          kind: 'episodes',
          completed: 12,
          total: 40,
          lastWatchedAt: null,
        }),
      ).toBeUndefined();
    });
  });

  it('should read a dropped show as dropped', () => {
    expect(toActionUnderInfo({ kind: 'dropped' })).toBe('Dropped');
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
