import { DEVS_WATCHED_PROGRESS } from '$mocks/data/sync/DEVS_WATCHED_PROGRESS.ts';
import { describe, expect, it } from 'vitest';
import { sumProgressStats } from './sumProgressStats.ts';

const DEVS_ROW = DEVS_WATCHED_PROGRESS;

describe('sumProgressStats', () => {
  it('should sum the watched and aired episodes and the minutes left over every row', () => {
    const stats = sumProgressStats([
      DEVS_ROW,
      { ...DEVS_ROW, completed: 2, total: 10, minutesLeft: 400 },
    ]);

    expect(stats).toEqual({
      completed: 7,
      aired: 18,
      minutesLeft: 556,
      shows: 2,
    });
  });

  it('should count a row with negative minutes left as none, not take them off the total', () => {
    const stats = sumProgressStats([
      DEVS_ROW,
      { ...DEVS_ROW, minutesLeft: -14 },
    ]);

    expect(stats.minutesLeft).toBe(156);
  });

  it('should read zeros for no rows', () => {
    expect(sumProgressStats([])).toEqual({
      completed: 0,
      aired: 0,
      minutesLeft: 0,
      shows: 0,
    });
  });
});
