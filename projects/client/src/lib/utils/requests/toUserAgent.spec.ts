import { describe, expect, it } from 'vitest';
import { toUserAgent } from './toUserAgent.ts';

describe('util: toUserAgent', () => {
  it('should name the product, its version and the public origin', () => {
    expect(toUserAgent('https://trakt.example.com')).toBe(
      `trakt-client/${APP_VERSION} (+https://trakt.example.com)`,
    );
  });
});
