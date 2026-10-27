import { LandingErrorSchema } from '$lib/features/auth/models/LandingError.ts';
import type { Session } from '$lib/features/auth/models/Session.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { describe, expect, it } from 'vitest';
import { load } from './+page.server.ts';

type LoadEvent = Parameters<typeof load>[0];

type LoadOptions = {
  sessionEnded?: boolean;
  isDataRequest?: boolean;
  auth?: Session;
};

const loadWith = (
  search: string,
  { sessionEnded = false, isDataRequest = false, auth }: LoadOptions = {},
) => {
  const event = mockRequestEvent({
    url: `http://localhost/${search}`,
    locals: { oauthApp: OAuthAppMappedMock, sessionEnded, auth },
  });
  return load({ ...event, isDataRequest } as unknown as LoadEvent);
};

describe('load: Login Page', () => {
  it('should pass no error without an error parameter', () => {
    expect(loadWith('')).toMatchObject({ error: null });
  });

  it.each(LandingErrorSchema.options)(
    'should pass the %s error through',
    (code) => {
      expect(loadWith(`?error=${code}`)).toMatchObject({ error: code });
    },
  );

  it('should read an unknown error as exchange', () => {
    expect(loadWith('?error=nope')).toMatchObject({ error: 'exchange' });
  });

  it('should read an empty error as exchange', () => {
    expect(loadWith('?error=')).toMatchObject({ error: 'exchange' });
  });

  describe('for a Session', () => {
    const auth = { access: 'access', refresh: 'refresh', expiresAt: 1 };

    it('should redirect to the return path', () => {
      expect(() => loadWith('?returnTo=%2Fcalendar%3Fweek%3D1', { auth }))
        .toThrow(
          expect.objectContaining({
            status: 307,
            location: '/calendar?week=1',
          }),
        );
    });

    it('should redirect a data request to the return path', () => {
      expect(() =>
        loadWith('?returnTo=%2Fcalendar', { auth, isDataRequest: true })
      ).toThrow(
        expect.objectContaining({ status: 307, location: '/calendar' }),
      );
    });

    it.each([
      ['no return path', ''],
      ['Login Page', '?returnTo=%2F%3FreturnTo%3D%252Fcalendar'],
      ['a path that normalises to Login Page', '?returnTo=%2F.'],
      ['an auth route', '?returnTo=%2Fauth%2Flogin'],
      ['another origin', '?returnTo=%2F%2Fevil.com'],
      [
        'a path that normalises to another origin',
        '?returnTo=%2F.%2F%2Fevil.com',
      ],
    ])('should redirect to the dashboard for %s', (_label, search) => {
      expect(() => loadWith(search, { auth })).toThrow(
        expect.objectContaining({ status: 307, location: '/dashboard' }),
      );
    });
  });

  describe('when the hook ended the Session on this load', () => {
    it('should fall back to the expired error', () => {
      expect(loadWith('', { sessionEnded: true })).toMatchObject({
        error: 'expired',
      });
    });

    it('should keep an explicit error over the fallback', () => {
      expect(loadWith('?error=denied', { sessionEnded: true })).toMatchObject({
        error: 'denied',
      });
    });
  });
});
