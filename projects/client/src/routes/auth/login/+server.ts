import { redirect, type RequestHandler } from '@sveltejs/kit';
import { authStateCookie } from '$lib/features/auth/authStateCookie.ts';
import { createAuthorizationRequest } from '$lib/features/auth/createAuthorizationRequest.ts';

export const GET: RequestHandler = async ({ cookies, locals, url }) => {
  const { oauthApp } = locals;
  const returnTo = oauthApp.returnTo(url.searchParams.get('returnTo'));
  const { url: authorizeUrl, nonce, codeVerifier } =
    await createAuthorizationRequest({ app: oauthApp });
  authStateCookie.write(cookies, { nonce, codeVerifier, returnTo });

  throw redirect(302, authorizeUrl);
};
