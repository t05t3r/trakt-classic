import { describe, expect, it } from 'vitest';
import { toRovingIndex } from './toRovingIndex.ts';

const COUNT = 4;

describe('util: toRovingIndex', () => {
  it.each(
    [
      ['ArrowRight', 0, 1],
      ['ArrowLeft', 2, 1],
      ['ArrowRight', 3, 0],
      ['ArrowLeft', 0, 3],
    ] as const,
  )(
    'should move %s from %i to %i in left-to-right text',
    (key, from, expected) => {
      expect(toRovingIndex({ key, from, count: COUNT, isRtl: false }))
        .toBe(expected);
    },
  );

  it.each(
    [
      ['ArrowRight', 2, 1],
      ['ArrowLeft', 1, 2],
      ['ArrowRight', 0, 3],
      ['ArrowLeft', 3, 0],
    ] as const,
  )(
    'should move %s from %i to %i in right-to-left text',
    (key, from, expected) => {
      expect(toRovingIndex({ key, from, count: COUNT, isRtl: true }))
        .toBe(expected);
    },
  );

  it.each([false, true])(
    'should move Home to the first and End to the last, right to left %s',
    (isRtl) => {
      expect(toRovingIndex({ key: 'Home', from: 2, count: COUNT, isRtl }))
        .toBe(0);
      expect(toRovingIndex({ key: 'End', from: 1, count: COUNT, isRtl }))
        .toBe(3);
    },
  );

  it.each(['ArrowRight', 'ArrowLeft', 'Home', 'End'])(
    'should not move on %s with no items',
    (key) => {
      expect(toRovingIndex({ key, from: 0, count: 0, isRtl: false }))
        .toBeUndefined();
    },
  );

  it.each(['ArrowUp', 'ArrowDown', 'Enter', 'a'])(
    'should not move on %s',
    (key) => {
      expect(toRovingIndex({ key, from: 1, count: COUNT, isRtl: false }))
        .toBeUndefined();
    },
  );
});
