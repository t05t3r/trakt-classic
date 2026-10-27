import { authStateCookie } from '$lib/features/auth/authStateCookie.ts';
import { sessionPersistence } from '$lib/features/auth/sessionPersistence.ts';
import { OAuthTokenResponseMock } from '$mocks/data/auth/response/OAuthTokenResponseMock.ts';
import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { server } from '$mocks/server.ts';
import { mockRequestEvent } from '$test/request/mockRequestEvent.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { GET } from './+server.ts';

function expectStateCookieCleared(event: ReturnType<typeof mockRequestEvent>) {
  expect(event.cookies.delete).toHaveBeenCalledWith(authStateCookie.name, {
    path: '/auth',
  });
}

type CallbackEventParams = {
  query: string;
  returnTo?: string;
};

function callbackEvent(
  { query, returnTo = '/dashboard' }: CallbackEventParams,
) {
  const event = mockRequestEvent({
    url: `http://vite-upstream/auth/callback?${query}`,
    locals: { oauthApp: OAuthAppMappedMock },
  });
  authStateCookie.write(event.cookies, {
    nonce: 'nonce',
    codeVerifier: 'code-verifier',
    returnTo,
  });

  return event;
}

describe('GET /auth/callback', () => {
  it('should exchange a verified code with the OAuth App callback URL, clear the state cookie and redirect to returnTo', async () => {
    const exchangeBodies: Array<Record<string, unknown>> = [];
    const userAgents: Array<string | null> = [];
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        async ({ request }) => {
          userAgents.push(request.headers.get('user-agent'));
          exchangeBodies.push(await request.json() as Record<string, unknown>);
          return HttpResponse.json(OAuthTokenResponseMock);
        },
      ),
    );
    const event = callbackEvent({ query: 'code=code&state=nonce' });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/dashboard',
    });
    expect(exchangeBodies).toEqual([{
      grant_type: 'authorization_code',
      code: 'code',
      client_id: 'client-id',
      redirect_uri: OAuthAppMappedMock.callbackUrl,
      code_verifier: 'code-verifier',
    }]);
    expect(userAgents).toEqual([OAuthAppMappedMock.userAgent]);
    expect(event.locals.auth?.access).toBe(OAuthTokenResponseMock.access_token);
    expect(sessionPersistence.read(event)?.access).toBe(
      OAuthTokenResponseMock.access_token,
    );
    expectStateCookieCleared(event);
  });

  it('should clear the state cookie and return a state error for a mismatched nonce', async () => {
    const event = callbackEvent({ query: 'code=code&state=wrong' });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/?error=state',
    });
    expectStateCookieCleared(event);
  });

  it('should return a state error for a state cookie without a code verifier', async () => {
    const event = mockRequestEvent({
      url: 'http://localhost/auth/callback?code=code&state=nonce',
      locals: { oauthApp: OAuthAppMappedMock },
      cookieHandler: (name) =>
        name === authStateCookie.name
          ? JSON.stringify({ nonce: 'nonce', returnTo: '/dashboard' })
          : null,
    });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/?error=state',
    });
  });

  it('should clear the state cookie and return an exchange error when OAuth returns an error with a code', async () => {
    const event = mockRequestEvent({
      url:
        'http://localhost/auth/callback?error=temporarily_unavailable&code=code',
      locals: { oauthApp: OAuthAppMappedMock },
    });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/?error=exchange',
    });
    expectStateCookieCleared(event);
  });

  it('should redirect to the returnTo the state cookie holds', async () => {
    const event = callbackEvent({
      query: 'code=code&state=nonce',
      returnTo: '/calendar?week=1',
    });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/calendar?week=1',
    });
  });

  it('should redirect to the dashboard when the state cookie holds an off-origin returnTo', async () => {
    const event = callbackEvent({
      query: 'code=code&state=nonce',
      returnTo: '//evil.example.com/calendar',
    });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/dashboard',
    });
  });

  it('should clear the state cookie and return a denied error when the viewer declines', async () => {
    const event = callbackEvent({ query: 'error=access_denied&state=nonce' });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/?error=denied',
    });
    expectStateCookieCleared(event);
  });

  it('should clear the state cookie and return an exchange error without a code', async () => {
    const event = callbackEvent({ query: 'state=nonce' });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/?error=exchange',
    });
    expectStateCookieCleared(event);
  });

  it('should return a rate-limit error when the auth host answers the exchange with 429', async () => {
    silenceWarnings();
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ error: 'refused' }, { status: 429 }),
      ),
    );
    const event = callbackEvent({ query: 'code=code&state=nonce' });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/?error=rate_limited',
    });
  });

  it('should return an exchange error when the auth host refuses the code', async () => {
    silenceWarnings();
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ error: 'refused' }, { status: 403 }),
      ),
    );
    const event = callbackEvent({ query: 'code=code&state=nonce' });

    await expect(GET(event)).rejects.toMatchObject({
      status: 303,
      location: '/?error=exchange',
    });
  });
});
