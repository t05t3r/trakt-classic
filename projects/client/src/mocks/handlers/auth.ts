import { http, HttpResponse } from 'msw';

import { OAUTH_REVOKE_URL } from '$mocks/data/auth/OAUTH_REVOKE_URL.ts';
import { OAUTH_TOKEN_URL } from '$mocks/data/auth/OAUTH_TOKEN_URL.ts';
import { OAuthTokenResponseMock } from '$mocks/data/auth/response/OAuthTokenResponseMock.ts';

export const auth = [
  http.post(
    OAUTH_TOKEN_URL,
    () => HttpResponse.json(OAuthTokenResponseMock),
  ),
  http.post(
    OAUTH_REVOKE_URL,
    () => new HttpResponse(null, { status: 204 }),
  ),
];
