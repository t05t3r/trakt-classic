import { describe, expect, it } from 'vitest';
import { hasDateRange } from './hasDateRange.ts';

const START = new Date('2026-06-07T00:00:00.000Z');
const END = new Date('2026-06-30T23:59:59.999Z');

describe('util: hasDateRange', () => {
  it.each([
    { name: 'no bound', range: {}, expected: false },
    { name: 'only a start', range: { startDate: START }, expected: true },
    { name: 'only an end', range: { endDate: END }, expected: true },
    {
      name: 'both bounds',
      range: { startDate: START, endDate: END },
      expected: true,
    },
  ])('should read $name as $expected', ({ range, expected }) => {
    expect(hasDateRange(range)).toBe(expected);
  });
});
