import { describe, expect, it } from 'vitest';
import { toRuns } from './toRuns.ts';

describe('util: toRuns', () => {
  it('should give no run for no segment', () => {
    expect(toRuns([])).toEqual([]);
  });

  it('should give one run for segments all alike', () => {
    expect(toRuns([true, true, true])).toEqual([
      { isFilled: true, isDimmed: false, start: 0, length: 3 },
    ]);
  });

  it('should split the filled segments from the empty ones', () => {
    expect(toRuns([true, true, false, false, false])).toEqual([
      { isFilled: true, isDimmed: false, start: 0, length: 2 },
      { isFilled: false, isDimmed: false, start: 2, length: 3 },
    ]);
  });

  it('should give a run per stretch of a show watched out of order', () => {
    expect(toRuns([false, true, true, false, true, false, false])).toEqual([
      { isFilled: false, isDimmed: false, start: 0, length: 1 },
      { isFilled: true, isDimmed: false, start: 1, length: 2 },
      { isFilled: false, isDimmed: false, start: 3, length: 1 },
      { isFilled: true, isDimmed: false, start: 4, length: 1 },
      { isFilled: false, isDimmed: false, start: 5, length: 2 },
    ]);
  });

  it('should split the runs at the highlight and dim the segments outside it', () => {
    expect(
      toRuns([true, true, true, false, false, false], { start: 2, length: 2 }),
    ).toEqual([
      { isFilled: true, isDimmed: true, start: 0, length: 2 },
      { isFilled: true, isDimmed: false, start: 2, length: 1 },
      { isFilled: false, isDimmed: false, start: 3, length: 1 },
      { isFilled: false, isDimmed: true, start: 4, length: 2 },
    ]);
  });
});
