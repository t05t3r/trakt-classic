import { Buffer } from 'node:buffer';
import type { createOAuthApp } from './createOAuthApp.ts';
import { toCodeChallenge } from './toCodeChallenge.ts';

type CreateAuthorizationRequestParams = {
  app: Pick<
    ReturnType<typeof createOAuthApp>,
    'authHost' | 'clientId' | 'callbackUrl'
  >;
};

type AuthorizationRequest = {
  url: string;
  nonce: string;
  codeVerifier: string;
};

// 32 random bytes encode to 43 base64url characters, the shortest verifier PKCE allows.
function createRandomBase64url(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString(
    'base64url',
  );
}

export async function createAuthorizationRequest({
  app,
}: CreateAuthorizationRequestParams): Promise<AuthorizationRequest> {
  const nonce = createRandomBase64url();
  const codeVerifier = createRandomBase64url();
  const codeChallenge = await toCodeChallenge(codeVerifier);

  const url = new URL('/oauth/authorize', app.authHost);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: app.clientId,
    redirect_uri: app.callbackUrl,
    state: nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  }).toString();

  return { url: url.toString(), nonce, codeVerifier };
}
