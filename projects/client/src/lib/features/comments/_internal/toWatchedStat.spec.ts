import { describe, expect, it } from 'vitest';
import { toWatchedStat } from './toWatchedStat.ts';

const STATS = { rating: 8, playCount: 54, completedCount: 33 };

describe('toWatchedStat', () => {
  it('should floor the share of aired episodes watched', () => {
    expect(toWatchedStat({ stats: STATS, airedEpisodes: 40 })).toEqual({
      figure: '82%',
      word: 'Watched',
    });
  });

  it.each([
    { name: 'missing', airedEpisodes: undefined },
    { name: 'null', airedEpisodes: null },
    { name: 'not a number', airedEpisodes: NaN },
    { name: 'zero', airedEpisodes: 0 },
  ])(
    'should fall back to the play count when the aired count is $name',
    ({ airedEpisodes }) => {
      expect(toWatchedStat({ stats: STATS, airedEpisodes })).toEqual({
        figure: '54',
        word: 'plays',
      });
    },
  );

  it('should read one play in the singular', () => {
    const stats = { ...STATS, playCount: 1, completedCount: 1 };

    expect(toWatchedStat({ stats })).toEqual({ figure: '1', word: 'play' });
  });

  it('should group a plural play count with commas', () => {
    const stats = { ...STATS, playCount: 1234 };

    expect(toWatchedStat({ stats })).toEqual({
      figure: '1,234',
      word: 'plays',
    });
  });

  it('should give nothing for no plays', () => {
    const stats = { ...STATS, playCount: 0, completedCount: 0 };

    expect(toWatchedStat({ stats })).toBeUndefined();
  });

  it('should give nothing for no aired episode watched', () => {
    const stats = { ...STATS, playCount: 0, completedCount: 0 };

    expect(toWatchedStat({ stats, airedEpisodes: 40 })).toBeUndefined();
  });
});
