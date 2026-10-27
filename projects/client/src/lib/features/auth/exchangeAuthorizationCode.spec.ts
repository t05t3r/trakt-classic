import { OAuthAppMappedMock } from '$mocks/data/auth/mapped/OAuthAppMappedMock.ts';
import { OAuthTokenResponseMock } from '$mocks/data/auth/response/OAuthTokenResponseMock.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { server } from '$mocks/server.ts';
import { silenceWarnings } from '$test/beds/console/silenceWarnings.ts';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { exchangeAuthorizationCode } from './exchangeAuthorizationCode.ts';

function answerTokenWith(status: number) {
  server.use(
    http.post(
      OAUTH_TOKEN_URL,
      () => HttpResponse.json({ error: 'refused' }, { status }),
    ),
  );
}

function exchange() {
  return exchangeAuthorizationCode({
    app: OAuthAppMappedMock,
    code: 'code',
    codeVerifier: 'code-verifier',
    fetch,
  });
}

describe('exchangeAuthorizationCode', () => {
  it('should map the token response to a Session', async () => {
    expect(await exchange()).toMatchObject({
      kind: 'success',
      session: {
        access: OAuthTokenResponseMock.access_token,
        refresh: OAuthTokenResponseMock.refresh_token,
      },
    });
  });

  it('should report a failure when the token response is malformed', async () => {
    server.use(
      http.post(
        OAUTH_TOKEN_URL,
        () => HttpResponse.json({ access_token: 'access-token' }),
      ),
    );

    expect(await exchange()).toEqual({ kind: 'failed' });
  });

  it('should report a rate limit when the auth host answers 429', async () => {
    silenceWarnings();
    answerTokenWith(429);

    expect(await exchange()).toEqual({ kind: 'rate-limited' });
  });

  it('should report a failure when the auth host refuses the code', async () => {
    silenceWarnings();
    answerTokenWith(403);

    expect(await exchange()).toEqual({ kind: 'failed' });
  });
});
