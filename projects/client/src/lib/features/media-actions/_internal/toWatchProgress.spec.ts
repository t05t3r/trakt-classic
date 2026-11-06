import { describe, expect, it } from 'vitest';
import { toWatchProgress } from './toWatchProgress.ts';

describe('util: toWatchProgress', () => {
  it('should read the percent and the counts with the plays', () => {
    expect(toWatchProgress({ completed: 25, total: 30, plays: 25 })).toEqual({
      percent: 83,
      completed: 25,
      total: 30,
      counts: '25/30 eps — 25 plays',
    });
  });

  it('should write one play in the singular', () => {
    expect(toWatchProgress({ completed: 1, total: 10, plays: 1 })?.counts)
      .toBe('1/10 eps — 1 play');
  });

  it.each([
    { plays: 1, counts: '1/1 ep — 1 play' },
    { plays: 3, counts: '1/1 ep — 3 plays' },
    { plays: undefined, counts: '1/1 ep' },
  ])(
    'should read a total of one in the singular, as $counts',
    ({ plays, counts }) => {
      expect(toWatchProgress({ completed: 1, total: 1, plays })?.counts)
        .toBe(counts);
    },
  );

  it.each([
    { completed: 33, total: 40, percent: 82 },
    { completed: 29, total: 30, percent: 96 },
    { completed: 29, total: 100, percent: 29 },
    { completed: 1, total: 200, percent: 0 },
    { completed: 30, total: 30, percent: 100 },
  ])(
    'should floor $completed of $total to $percent',
    ({ completed, total, percent }) => {
      expect(toWatchProgress({ completed, total, plays: completed })?.percent)
        .toBe(percent);
    },
  );

  it('should cap the percent at 100 when more were watched than aired', () => {
    expect(toWatchProgress({ completed: 18, total: 17, plays: 18 })?.percent)
      .toBe(100);
  });

  it.each([
    { name: 'not known', plays: undefined },
    { name: 'null', plays: null },
    { name: 'zero', plays: 0 },
  ])('should leave the plays out while they are $name', ({ plays }) => {
    expect(toWatchProgress({ completed: 25, total: 30, plays })?.counts)
      .toBe('25/30 eps');
  });

  it.each([
    { name: 'no episode watched', completed: 0, total: 30 },
    { name: 'a total of zero', completed: 25, total: 0 },
    { name: 'a missing total', completed: 25, total: NaN },
  ])('should read nothing with $name', ({ completed, total }) => {
    expect(toWatchProgress({ completed, total, plays: 25 })).toBeUndefined();
  });
});
