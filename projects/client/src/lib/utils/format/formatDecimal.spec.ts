import { describe, expect, it } from 'vitest';
import { formatDecimal } from './formatDecimal.ts';

describe('formatDecimal', () => {
  it('should format a number to a single decimal place', () => {
    expect(formatDecimal(1.25)).toBe('1.3');
  });

  it('should keep a trailing zero', () => {
    expect(formatDecimal(2)).toBe('2.0');
  });

  it('should treat null as zero', () => {
    expect(formatDecimal(null)).toBe('0.0');
  });

  it('should treat undefined as zero', () => {
    expect(formatDecimal(undefined)).toBe('0.0');
  });
});
