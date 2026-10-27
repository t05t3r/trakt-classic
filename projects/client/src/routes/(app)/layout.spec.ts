import { getToken, setToken } from '$lib/features/auth/token.ts';
import { afterEach, describe, expect, it } from 'vitest';
import { load } from './+layout.ts';

type LoadEvent = Parameters<typeof load>[0];

const loadWith = (token: string | null) =>
  load({ data: { auth: { token, isAuthorized: token != null } } } as LoadEvent);

describe('load: app layout in the browser', () => {
  afterEach(() => setToken(null));

  it("should seed the browser token with the Session's token", () => {
    loadWith('access');

    expect(getToken().value).toBe('access');
  });

  it('should pass the gate data on', () => {
    expect(loadWith('access')).toEqual({
      auth: { token: 'access', isAuthorized: true },
    });
  });
});
