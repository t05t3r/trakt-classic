import { describe, expect, it } from 'vitest';
import { formatNumber } from './formatNumber.ts';

describe('formatNumber', () => {
  it('should format whole numbers with thousand separators', () => {
    expect(formatNumber(1234)).toMatch(/1[,\s]234/);
  });

  it('should round decimals to nearest integer', () => {
    const result = formatNumber(1234.5);
    expect(result).toMatch(/1[,\s]235/);
  });

  it('should round down when decimal is less than 0.5', () => {
    const result = formatNumber(1234.4);
    expect(result).toMatch(/1[,\s]234/);
  });

  it('should handle zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('should handle single digits', () => {
    expect(formatNumber(5)).toBe('5');
  });

  it('should handle numbers under 1000', () => {
    expect(formatNumber(999)).toBe('999');
  });

  it('should format large numbers', () => {
    const result = formatNumber(1234567);
    // Different locales use different separators (comma or space)
    expect(result).toMatch(/1[,\s]234[,\s]567/);
  });

  it('should handle negative numbers', () => {
    const result = formatNumber(-1234);
    expect(result).toMatch(/-1[,\s]234/);
  });
});
