import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { toKnownDate } from './toKnownDate.ts';

describe('util: toKnownDate', () => {
  it('should keep a known date', () => {
    const date = new Date('2026-04-20T04:00:00.000Z');

    expect(toKnownDate(date)).toBe(date);
  });

  it.each([
    { name: 'the unknown-date marker', date: MAX_DATE },
    { name: 'an Invalid Date', date: new Date('not a date') },
    { name: 'null', date: null },
    { name: 'undefined', date: undefined },
  ])('should give undefined for $name', ({ date }) => {
    expect(toKnownDate(date)).toBeUndefined();
  });
});
