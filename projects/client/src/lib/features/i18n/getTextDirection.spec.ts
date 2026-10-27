import { describe, expect, it } from 'vitest';
import { getTextDirection } from './getTextDirection.ts';

describe('util: getTextDirection', () => {
  it('should return rtl for an RTL locale', () => {
    expect(getTextDirection('fa-IR')).toBe('rtl');
  });

  it('should return ltr for an LTR locale', () => {
    expect(getTextDirection('en')).toBe('ltr');
  });
});
