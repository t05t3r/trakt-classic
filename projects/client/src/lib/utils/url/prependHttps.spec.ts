import { describe, expect, it } from 'vitest';
import { prependHttps } from './prependHttps.ts';

describe('prependHttps', () => {
  it('should add https protocol to a given host url', () => {
    const input = 'example.com';

    expect(prependHttps(input)).toBe('https://example.com');
  });

  it('should NOT add https protocol to a given host url if it already has it', () => {
    const input = 'https://example.com';

    expect(prependHttps(input)).toBe('https://example.com');
  });

  it('should return undefined for whitespace-only strings', () => {
    const input = '   ';

    expect(prependHttps(input)).toBeUndefined();
  });

  it('should replace http protocol with https', () => {
    const input = 'http://example.com';

    expect(prependHttps(input)).toBe('https://example.com');
  });

  it('should backfall to provided placeholder if no host is given', () => {
    const input = '';
    const fallback = 'https://fallback.com';

    expect(prependHttps(input, fallback)).toBe(fallback);
  });
});
