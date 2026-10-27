import { time } from '$lib/utils/timing/time.ts';
import { sessionPersistence } from '$lib/features/auth/sessionPersistence.ts';
import { SessionMappedMock } from '$mocks/data/auth/mapped/SessionMappedMock.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { OAUTH_REVOKE_URL } from '$mocks/data/auth/OAUTH_REVOKE_URL.ts';
import { server } from '$mocks/server.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from './+server.ts';

describe('POST /auth/logout', () => {
  let clock = new Date('2026-01-01T00:00:00Z').getTime();

  // The auth host's warn throttle outlives a test, so each test starts past the last one's window.
  beforeEach(() => {
    clock += time.minutes(2);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(clock);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should revoke the access token as the OAuth App, end the Session, and return to Login Page', async () => {
    const revokeBodies: Array<Record<string, unknown>> = [];
    const userAgents: Array<string | null> = [];
    server.use(
      http.post(
        OAUTH_REVOKE_URL,
        async ({ request }) => {
          userAgents.push(request.headers.get('user-agent'));
          revokeBodies.push(await request.json() as Record<string, unknown>);
          return new HttpResponse(null, { status: 204 });
        },
      ),
    );
    const event = mockRequestEvent({
      url: 'http://localhost/auth/logout',
      locals: { oauthApp: OAuthAppMappedMock },
    });
    sessionPersistence.begin(event, SessionMappedMock);

    await expect(POST(event)).rejects.toMatchObject({
      status: 303,
      location: '/',
    });
    expect(revokeBodies).toEqual([{
      token: SessionMappedMock.access,
      client_id: 'client-id',
    }]);
    expect(userAgents).toEqual([OAuthAppMappedMock.userAgent]);
    expect(event.locals.auth).toBeNull();
    expect(sessionPersistence.read(event)).toBeNull();
  });

  it('should end the Session locally and warn when the auth host refuses the revoke', async () => {
    const warn = silenceWarnings();
    server.use(
      http.post(
        OAUTH_REVOKE_URL,
        () =>
          new HttpResponse('<html>Blocked</html>', {
            status: 403,
            headers: { 'content-type': 'text/html' },
          }),
      ),
    );
    const event = mockRequestEvent({
      url: 'http://localhost/auth/logout',
      locals: { oauthApp: OAuthAppMappedMock },
    });
    sessionPersistence.begin(event, SessionMappedMock);

    await expect(POST(event)).rejects.toMatchObject({
      status: 303,
      location: '/',
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('403'));
    expect(event.locals.auth).toBeNull();
    expect(sessionPersistence.read(event)).toBeNull();
  });

  it('should end the Session and return to Login Page without a revoke when no Session is held', async () => {
    const revokeRequests: Request[] = [];
    server.use(
      http.post(OAUTH_REVOKE_URL, ({ request }) => {
        revokeRequests.push(request);
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const event = mockRequestEvent({
      url: 'http://localhost/auth/logout',
      locals: { oauthApp: OAuthAppMappedMock },
    });

    await expect(POST(event)).rejects.toMatchObject({
      status: 303,
      location: '/',
    });
    expect(revokeRequests).toEqual([]);
    expect(event.locals.auth).toBeNull();
  });
});
