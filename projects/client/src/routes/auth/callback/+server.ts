import { exchangeAuthorizationCode } from '$lib/features/auth/exchangeAuthorizationCode.ts';
import { authStateCookie } from '$lib/features/auth/authStateCookie.ts';
import { sessionPersistence } from '$lib/features/auth/sessionPersistence.ts';
import type { LandingError } from '$lib/features/auth/models/LandingError.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { redirect, type RequestHandler } from '@sveltejs/kit';

const loginError = (error: LandingError) =>
  redirect(303, UrlBuilder.landing({ error }));

export const GET: RequestHandler = async (event) => {
  const { cookies, fetch, locals, url } = event;
  const { oauthApp } = locals;
  const error = url.searchParams.get('error');
  if (error) {
    authStateCookie.clear(cookies);
    throw loginError(error === 'access_denied' ? 'denied' : 'exchange');
  }
  const code = url.searchParams.get('code');
  const state = authStateCookie.read(cookies);
  authStateCookie.clear(cookies);
  if (!code) throw loginError('exchange');
  if (!state || state.nonce !== url.searchParams.get('state')) {
    throw loginError('state');
  }

  const exchange = await exchangeAuthorizationCode({
    app: oauthApp,
    code,
    codeVerifier: state.codeVerifier,
    fetch,
  });
  if (exchange.kind === 'rate-limited') throw loginError('rate_limited');
  if (exchange.kind !== 'success') throw loginError('exchange');

  sessionPersistence.begin(event, exchange.session);
  throw redirect(303, oauthApp.returnTo(state.returnTo));
};
