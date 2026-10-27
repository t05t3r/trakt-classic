import { describe, expect, it } from 'vitest';
import { toTotalRuntimeValues } from './toTotalRuntimeValues.ts';

describe('toTotalRuntimeValues', () => {
  it('should hand the total runtime on in minutes with the episode count', () => {
    expect(toTotalRuntimeValues({ minutes: 2047, count: 40 })).toStrictEqual([
      { key: 'total-runtime', minutes: 2047, alt: '(40 episodes)' },
    ]);
  });

  it('should count a single episode in the singular', () => {
    expect(toTotalRuntimeValues({ minutes: 60, count: 1 })).toStrictEqual([
      { key: 'total-runtime', minutes: 60, alt: '(1 episode)' },
    ]);
  });

  it('should group the episode count with commas', () => {
    expect(toTotalRuntimeValues({ minutes: 55_534, count: 1234 }))
      .toStrictEqual([
        { key: 'total-runtime', minutes: 55_534, alt: '(1,234 episodes)' },
      ]);
  });

  it.each([NaN, 0])(
    'should leave the episode count out when it reads %s',
    (count) => {
      expect(toTotalRuntimeValues({ minutes: 900, count }))
        .toStrictEqual([
          { key: 'total-runtime', minutes: 900 },
        ]);
    },
  );

  it.each([0, NaN])('should skip a total runtime of %s', (minutes) => {
    expect(toTotalRuntimeValues({ minutes, count: 15 })).toEqual([]);
  });
});
