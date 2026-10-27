import { describe, expect, it } from 'vitest';
import { parseEnvInt } from './parseEnvInt.ts';

describe('util: parseEnvInt', () => {
  it('should fall back to the default when the value is undefined', () => {
    expect(parseEnvInt({ value: undefined, fallback: 6, minimum: 1 }))
      .toBe(6);
  });

  it('should fall back to the default when the value is an empty string', () => {
    expect(parseEnvInt({ value: '', fallback: 6, minimum: 1 })).toBe(6);
  });

  it('should fall back to the default when the value is whitespace only', () => {
    expect(parseEnvInt({ value: '   ', fallback: 6, minimum: 1 })).toBe(
      6,
    );
  });

  it('should fall back to the default for an empty string when the minimum is zero', () => {
    expect(parseEnvInt({ value: '', fallback: 6, minimum: 0 })).toBe(6);
  });

  it('should fall back to the default for whitespace only when the minimum is zero', () => {
    expect(parseEnvInt({ value: ' \t\n ', fallback: 6, minimum: 0 })).toBe(
      6,
    );
  });

  it('should accept an integer surrounded by whitespace', () => {
    expect(parseEnvInt({ value: ' 12 ', fallback: 6, minimum: 1 })).toBe(
      12,
    );
  });

  it('should accept exponent, hex and signed integer syntax', () => {
    expect(parseEnvInt({ value: '1e3', fallback: 6, minimum: 1 })).toBe(
      1000,
    );
    expect(parseEnvInt({ value: '0x10', fallback: 6, minimum: 1 })).toBe(
      16,
    );
    expect(parseEnvInt({ value: '+12', fallback: 6, minimum: 1 })).toBe(
      12,
    );
  });

  it('should fall back to the default when the value has trailing garbage', () => {
    expect(parseEnvInt({ value: '12abc', fallback: 6, minimum: 1 })).toBe(
      6,
    );
  });

  it('should fall back to the default when the value is Infinity', () => {
    expect(
      parseEnvInt({ value: 'Infinity', fallback: 6, minimum: 1 }),
    ).toBe(6);
  });

  it('should fall back to the default when the value is below the minimum', () => {
    expect(parseEnvInt({ value: '0', fallback: 6, minimum: 1 })).toBe(6);
  });

  it('should fall back to the default when the value is not an integer', () => {
    expect(parseEnvInt({ value: '2.5', fallback: 6, minimum: 1 })).toBe(
      6,
    );
  });

  it('should fall back to the default when the value is not a number', () => {
    expect(parseEnvInt({ value: 'nope', fallback: 6, minimum: 1 }))
      .toBe(6);
  });

  it('should accept a positive integer at or above the minimum', () => {
    expect(parseEnvInt({ value: '12', fallback: 6, minimum: 1 })).toBe(
      12,
    );
  });

  it('should accept zero when the minimum is zero', () => {
    expect(
      parseEnvInt({ value: '0', fallback: 5_368_709_120, minimum: 0 }),
    ).toBe(0);
  });
});
