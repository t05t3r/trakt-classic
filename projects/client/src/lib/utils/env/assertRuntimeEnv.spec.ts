import { describe, expect, it } from 'vitest';
import { assertRuntimeEnv } from './assertRuntimeEnv.ts';

describe('assertRuntimeEnv', () => {
  const required = ['ORIGIN', 'PUBLIC_TRAKT_CLIENT_ID'] as const;

  it('should accept a complete runtime environment', () => {
    expect(() =>
      assertRuntimeEnv({
        env: {
          ORIGIN: 'https://example.test',
          PUBLIC_TRAKT_CLIENT_ID: 'client-id',
        },
        required,
      })
    ).not.toThrow();
  });

  it('should return the required values narrowed to their names', () => {
    const env = assertRuntimeEnv({
      env: {
        ORIGIN: 'https://example.test',
        PUBLIC_TRAKT_CLIENT_ID: 'client-id',
        IMAGE_ORIGIN: 'https://media.example.test',
      },
      required,
    });

    expect(env).toEqual({
      ORIGIN: 'https://example.test',
      PUBLIC_TRAKT_CLIENT_ID: 'client-id',
    });
  });

  it('should report every missing or empty required variable', () => {
    expect(() =>
      assertRuntimeEnv({
        env: { ORIGIN: ' ' },
        required,
      })
    ).toThrow('Missing runtime env: ORIGIN, PUBLIC_TRAKT_CLIENT_ID');
  });
});
