import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { isKnownDate } from './isKnownDate.ts';

describe('util: isKnownDate', () => {
  it('should accept a date that holds a time', () => {
    expect(isKnownDate(new Date('2026-04-20T04:00:00.000Z'))).toBe(true);
  });

  it('should reject the unknown-date marker', () => {
    expect(isKnownDate(MAX_DATE)).toBe(false);
  });

  it('should reject an Invalid Date', () => {
    expect(isKnownDate(new Date('not a date'))).toBe(false);
  });
});
