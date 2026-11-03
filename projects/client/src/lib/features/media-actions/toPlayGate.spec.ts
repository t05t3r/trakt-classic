import { describe, expect, it } from 'vitest';
import { toPlayGate } from './toPlayGate.ts';

describe('util: toPlayGate', () => {
  it.each(
    [
      { isSet: true, hasPlay: false, expected: 'open' },
      { isSet: true, hasPlay: undefined, expected: 'open' },
      { isSet: false, hasPlay: true, expected: 'open' },
      { isSet: false, hasPlay: false, expected: 'blocked' },
      { isSet: false, hasPlay: undefined, expected: 'unknown' },
      { isSet: undefined, hasPlay: true, expected: 'unknown' },
      { isSet: undefined, hasPlay: false, expected: 'unknown' },
    ] as const,
  )(
    'should read $expected when set is $isSet and a Play is $hasPlay',
    ({ isSet, hasPlay, expected }) => {
      expect(toPlayGate({ isSet, hasPlay })).toBe(expected);
    },
  );
});
