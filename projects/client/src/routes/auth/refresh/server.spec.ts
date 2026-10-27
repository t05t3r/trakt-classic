import { createSessionRotator } from '$lib/features/auth/createSessionRotator.ts';
import { sessionPersistence } from '$lib/features/auth/sessionPersistence.ts';
import { SessionMappedMock } from '$mocks/data/auth/mapped/SessionMappedMock.ts';
import { OAuthTokenResponseMock } from '$mocks/data/auth/response/OAuthTokenResponseMock.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { server } from '$mocks/server.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { POST } from './+server.ts';

type RefreshEventParams = {
  body: Record<string, unknown>;
  refresh: string;
};

function postEvent(body: Record<string, unknown>) {
  return mockRequestEvent({
    url: 'http://localhost/auth/refresh',
    request: new Request('http://localhost/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
    locals: {
      oauthApp: OAuthAppMappedMock,
      sessionRotator: createSessionRotator({
        app: OAuthAppMappedMock,
        fetch,
      }),
    },
  });
}

function refreshEvent({ body, refresh }: RefreshEventParams) {
  const event = postEvent(body);
  const session = { ...SessionMappedMock, refresh };
  sessionPersistence.begin(event, session);
  return { event, session };
}

describe('POST /auth/refresh', () => {
  it('should answer 401 expired without a Session', async () => {
    const tokenRequests: Request[] = [];
    server.use(
      http.post(OAUTH_TOKEN_URL, ({ request }) => {
        tokenRequests.push(request);
        return HttpResponse.json(OAuthTokenResponseMock);
      }),
    );
    const event = postEvent({ rejected: SessionMappedMock.access });

    const response = await POST(event);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'expired' });
    expect(tokenRequests).toEqual([]);
  });

  it('should reject a missing rejected access token without refreshing', async () => {
    const { event } = refreshEvent({ body: {}, refresh: 'missing-refresh' });

    const response = await POST(event);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'invalid_request' });
  });

  it('should return an already-rotated Session when rejected token differs', async () => {
    const { event, session } = refreshEvent({
      body: { rejected: 'stale-access-token' },
      refresh: 'already-rotated-refresh',
    });

    const response = await POST(event);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ token: session.access });
  });

  it('should refresh a rejected Session as the OAuth App', async () => {
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
    const { event, session } = refreshEvent({
      body: { rejected: SessionMappedMock.access },
      refresh: 'rotated-refresh',
    });

    const response = await POST(event);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      token: OAuthTokenResponseMock.access_token,
    });
    expect(event.locals.auth?.access).toBe(OAuthTokenResponseMock.access_token);
    expect(tokenBodies).toEqual([{
      grant_type: 'refresh_token',
      refresh_token: session.refresh,
      client_id: 'client-id',
    }]);
  });

  it('should answer 401 expired and end the Session when Trakt rejects the rotation', async () => {
    silenceWarnings();
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ error: 'invalid_grant' }, { status: 400 }),
      ),
    );
    const { event } = refreshEvent({
      body: { rejected: SessionMappedMock.access },
      refresh: 'rejected-refresh',
    });

    const response = await POST(event);

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'expired' });
    expect(sessionPersistence.read(event)).toBeNull();
  });

  it('should answer 503 unavailable and keep the Session when auth is unreachable', async () => {
    silenceWarnings();
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.error(),
      ),
    );
    const { event, session } = refreshEvent({
      body: { rejected: SessionMappedMock.access },
      refresh: 'unreachable-refresh',
    });

    const response = await POST(event);

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'unavailable' });
    expect(sessionPersistence.read(event)).toEqual(session);
  });
});
