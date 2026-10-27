import { describe, expect, it } from 'vitest';
import { toCodeChallenge } from './toCodeChallenge.ts';

describe('toCodeChallenge', () => {
  it('should derive the S256 challenge of the RFC 7636 Appendix B example', async () => {
    const challenge = await toCodeChallenge(
      'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk',
    );

    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});
