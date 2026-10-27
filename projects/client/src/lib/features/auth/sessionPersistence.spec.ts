import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { SessionMappedMock } from '$mocks/data/auth/mapped/SessionMappedMock.ts';
import { OAuthTokenResponseMock } from '$mocks/data/auth/response/OAuthTokenResponseMock.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { server } from '$mocks/server.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { createSessionRotator } from './createSessionRotator.ts';
import { sessionPersistence } from './sessionPersistence.ts';

function authEvent() {
  return mockRequestEvent({
    url: 'http://localhost/dashboard',
    locals: {
      oauthApp: OAuthAppMappedMock,
      sessionRotator: createSessionRotator({
        app: OAuthAppMappedMock,
        fetch,
      }),
    },
  });
}

describe('sessionPersistence', () => {
  it('should read no Session when the browser holds no cookie', () => {
    const event = authEvent();

    expect(sessionPersistence.read(event)).toBeNull();
    expect(event.locals.auth).toBeNull();
  });

  it('should clear a malformed cookie and read no Session', () => {
    const event = authEvent();
    event.cookies.set('trakt-session', 'not a session', {});

    expect(sessionPersistence.read(event)).toBeNull();
    expect(event.locals.auth).toBeNull();
    expect(event.cookies.get('trakt-session')).toBeNull();
  });

  it('should begin a Session that a later read returns', () => {
    const event = authEvent();

    sessionPersistence.begin(event, SessionMappedMock);
    expect(event.locals.auth).toEqual(SessionMappedMock);

    event.locals.auth = null;
    expect(sessionPersistence.read(event)).toEqual(SessionMappedMock);
    expect(event.locals.auth).toEqual(SessionMappedMock);
  });

  it('should rotate as the OAuth App and hold the fresh pair', async () => {
    const tokenBodies: Array<Record<string, unknown>> = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, async ({ request }) => {
        tokenBodies.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const event = authEvent();
    const session = { ...SessionMappedMock, refresh: 'rotate-success-refresh' };
    sessionPersistence.begin(event, session);

    const result = await sessionPersistence.rotate(event, session);

    expect(result.kind).toBe('success');
    expect(event.locals.auth?.access).toBe(OAuthTokenResponseMock.access_token);
    event.locals.auth = null;
    expect(sessionPersistence.read(event)?.access).toBe(
      OAuthTokenResponseMock.access_token,
    );
    expect(tokenBodies).toEqual([{
      grant_type: 'refresh_token',
      refresh_token: 'rotate-success-refresh',
      client_id: OAuthAppMappedMock.clientId,
    }]);
  });

  it('should end the Session when Trakt rejects the rotation', async () => {
    silenceWarnings();
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 }),
      ),
    );
    const event = authEvent();
    const session = {
      ...SessionMappedMock,
      refresh: 'rotate-rejected-refresh',
    };
    sessionPersistence.begin(event, session);

    const result = await sessionPersistence.rotate(event, session);

    expect(result).toEqual({ kind: 'invalid-grant' });
    expect(event.locals.auth).toBeNull();
    expect(sessionPersistence.read(event)).toBeNull();
  });

  it.each([
    ['rate limited', () => new HttpResponse(null, { status: 429 })],
    ['unreachable', () => HttpResponse.error()],
  ])(
    'should keep the Session untouched when auth is %s',
    async (label, response) => {
      silenceWarnings();
      server.use(http.post(OAUTH_TOKEN_URL, response));
      const session = { ...SessionMappedMock, refresh: `kept-${label}` };
      const event = authEvent();
      sessionPersistence.begin(event, session);

      const result = await sessionPersistence.rotate(event, session);

      expect(result).toEqual({ kind: 'unavailable' });
      expect(event.locals.auth).toEqual(session);
      expect(sessionPersistence.read(event)).toEqual(session);
    },
  );

  it('should end a Session so a later read returns none', () => {
    const event = authEvent();
    sessionPersistence.begin(event, SessionMappedMock);

    sessionPersistence.end(event);

    expect(event.locals.auth).toBeNull();
    expect(sessionPersistence.read(event)).toBeNull();
  });
});
