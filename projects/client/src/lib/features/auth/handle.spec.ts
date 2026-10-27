import { OAuthTokenResponseMock } from '$mocks/data/auth/response/OAuthTokenResponseMock.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { SessionMappedMock } from '$mocks/data/auth/mapped/SessionMappedMock.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { server } from '$mocks/server.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { time } from '$lib/utils/timing/time.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { createSessionRotator } from './createSessionRotator.ts';
import { handle } from './handle.ts';
import { sessionPersistence } from './sessionPersistence.ts';

const htmlRequest = new Request('http://localhost/dashboard', {
  headers: { accept: 'text/html' },
});

const apiRequest = new Request('http://localhost/dashboard', {
  headers: { accept: 'application/json' },
});

function htmlEvent(cookieHandler?: (name: string) => string) {
  return requestEvent(htmlRequest, cookieHandler);
}

function requestEvent(
  request: Request,
  cookieHandler?: (name: string) => string,
) {
  return mockRequestEvent({
    url: 'http://localhost/dashboard',
    request,
    cookieHandler,
    locals: {
      sessionEnded: false,
      oauthApp: OAuthAppMappedMock,
      sessionRotator: createSessionRotator({
        app: OAuthAppMappedMock,
        fetch,
      }),
    },
  });
}

describe('auth handle', () => {
  it('should seed the held Session from the browser', async () => {
    const event = htmlEvent();
    sessionPersistence.begin(event, SessionMappedMock);
    event.locals.auth = null;

    await handle({ event, resolve: vi.fn(() => new Response()) });

    expect(event.locals.auth).toEqual(SessionMappedMock);
  });

  it('should rotate an expiring Session on an HTML navigation as the OAuth App', async () => {
    const tokenBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        async ({ request }) => {
          tokenBodies.push(await request.json() as Record<string, unknown>);
          return HttpResponse.json(OAuthTokenResponseMock);
        },
      ),
    );
    const event = htmlEvent();
    sessionPersistence.begin(event, {
      access: 'expiring-access',
      refresh: 'expiring-refresh',
      expiresAt: Date.now() + 1,
    });

    await handle({ event, resolve: vi.fn(() => new Response()) });

    expect(event.locals.auth?.access).toBe(OAuthTokenResponseMock.access_token);
    expect(tokenBodies).toEqual([{
      grant_type: 'refresh_token',
      refresh_token: 'expiring-refresh',
      client_id: 'client-id',
    }]);
  });

  it('should not rotate a fresh Session on an HTML navigation', async () => {
    const tokenRequests: Request[] = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, ({ request }) => {
        tokenRequests.push(request);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const session = {
      access: 'fresh-access',
      refresh: 'fresh-refresh',
      expiresAt: Date.now() + time.days(2),
    };
    const event = htmlEvent();
    sessionPersistence.begin(event, session);

    await handle({ event, resolve: vi.fn(() => new Response()) });

    expect(tokenRequests).toEqual([]);
    expect(event.locals.auth).toEqual(session);
  });

  it('should not rotate an expiring Session on a request that is not an HTML navigation', async () => {
    const tokenRequests: Request[] = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, ({ request }) => {
        tokenRequests.push(request);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const session = {
      access: 'expiring-access',
      refresh: 'expiring-refresh',
      expiresAt: Date.now() + 1,
    };
    const event = requestEvent(apiRequest);
    sessionPersistence.begin(event, session);

    await handle({ event, resolve: vi.fn(() => new Response()) });

    expect(tokenRequests).toEqual([]);
    expect(event.locals.auth).toEqual(session);
    expect(sessionPersistence.read(event)).toEqual(session);
  });

  it('should end the Session when its rotation answers invalid_grant', async () => {
    silenceWarnings();
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 }),
      ),
    );
    const event = htmlEvent();
    sessionPersistence.begin(event, {
      access: 'revoked-access',
      refresh: 'revoked-refresh',
      expiresAt: Date.now() + 1,
    });

    await handle({ event, resolve: vi.fn(() => new Response()) });

    expect(event.locals.sessionEnded).toBe(true);
    expect(event.locals.auth).toBeNull();
    expect(sessionPersistence.read(event)).toBeNull();
  });

  it('should not mark a Session ended when the browser holds no cookie', async () => {
    const event = htmlEvent();

    await handle({ event, resolve: vi.fn(() => new Response()) });

    expect(event.locals.sessionEnded).toBe(false);
  });

  it('should not mark a Session ended when the cookie is malformed', async () => {
    const event = htmlEvent(() => 'not a session');

    await handle({ event, resolve: vi.fn(() => new Response()) });

    expect(event.locals.sessionEnded).toBe(false);
  });
});
