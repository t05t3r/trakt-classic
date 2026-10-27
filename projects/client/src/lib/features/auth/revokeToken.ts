import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import type { createOAuthApp } from './createOAuthApp.ts';
import { postToAuthHost } from './_internal/postToAuthHost.ts';

type RevokeTokenParams = {
  app: Pick<
    ReturnType<typeof createOAuthApp>,
    'clientId' | 'authHost' | 'userAgent'
  >;
  accessToken: string;
  fetch?: typeof globalThis.fetch;
};

export async function revokeToken({
  app,
  accessToken,
  fetch = globalThis.fetch,
}: RevokeTokenParams) {
  try {
    const response = await postToAuthHost({
      app,
      fetch,
      path: '/oauth/revoke',
      body: { token: accessToken, client_id: app.clientId },
    });
    response.body?.cancel().catch(NOOP_FN);
  } catch {
    // Logout is local even when auth.trakt.tv cannot be reached.
  }
}
