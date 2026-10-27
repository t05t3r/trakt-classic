import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { describe, expect, it } from 'vitest';
import { isValidDate } from './isValidDate.ts';

describe('util: isValidDate', () => {
  it('should accept a date that holds a time', () => {
    expect(isValidDate(new Date('2026-04-20T04:00:00.000Z'))).toBe(true);
  });

  it('should accept the unknown-date marker, which still holds a time', () => {
    expect(isValidDate(MAX_DATE)).toBe(true);
  });

  it('should reject an Invalid Date', () => {
    expect(isValidDate(new Date('not a date'))).toBe(false);
  });
});
