import { revokeToken } from '$lib/features/auth/revokeToken.ts';
import { sessionPersistence } from '$lib/features/auth/sessionPersistence.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { redirect, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async (event) => {
  const { fetch, locals } = event;
  if (locals.auth) {
    await revokeToken({
      app: locals.oauthApp,
      accessToken: locals.auth.access,
      fetch,
    });
  }
  sessionPersistence.end(event);
  throw redirect(303, UrlBuilder.landing());
};
