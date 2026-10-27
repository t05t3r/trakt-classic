import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import type { createOAuthApp } from './createOAuthApp.ts';
import { mapToSession } from './_internal/mapToSession.ts';
import { postToAuthHost } from './_internal/postToAuthHost.ts';
import { OAuthTokenResponseSchema } from './models/OAuthTokenResponseSchema.ts';
import type { Session } from './models/Session.ts';

type ExchangeAuthorizationCodeParams = {
  app: Pick<
    ReturnType<typeof createOAuthApp>,
    'clientId' | 'callbackUrl' | 'authHost' | 'userAgent'
  >;
  code: string;
  codeVerifier: string;
  fetch?: typeof globalThis.fetch;
};

type ExchangeAuthorizationCodeResult =
  | { kind: 'success'; session: Session }
  | { kind: 'rate-limited' }
  | { kind: 'failed' };

export async function exchangeAuthorizationCode({
  app,
  code,
  codeVerifier,
  fetch = globalThis.fetch,
}: ExchangeAuthorizationCodeParams): Promise<ExchangeAuthorizationCodeResult> {
  try {
    const response = await postToAuthHost({
      app,
      fetch,
      path: '/oauth/token',
      body: {
        grant_type: 'authorization_code',
        code,
        client_id: app.clientId,
        redirect_uri: app.callbackUrl,
        code_verifier: codeVerifier,
      },
    });
    if (!response.ok) {
      response.body?.cancel().catch(NOOP_FN);
      return response.status === 429
        ? { kind: 'rate-limited' }
        : { kind: 'failed' };
    }

    const token = OAuthTokenResponseSchema.parse(await response.json());
    return {
      kind: 'success',
      session: mapToSession(token),
    };
  } catch {
    return { kind: 'failed' };
  }
}
