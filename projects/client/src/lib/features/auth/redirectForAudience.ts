import { redirect } from '@sveltejs/kit';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { hasAuthSession } from './hasAuthSession.ts';
import type { Session } from './models/Session.ts';

type AuthenticatedAudienceParams = {
  audience: 'authenticated';
  session: Session | Nil;
  sessionEnded: boolean;
  pathAndSearch: string;
};

type PublicAudienceParams = {
  audience: 'public';
  session: Session | Nil;
  returnTo: string;
};

type RedirectForAudienceParams =
  | AuthenticatedAudienceParams
  | PublicAudienceParams;

const AUTH_ROUTE_PREFIX = '/auth/';

// The Login Page would loop back here, and the auth routes restart or end sign-in.
function signedInTarget(returnTo: string) {
  const pathname = returnTo.split('?').at(0) ?? '';
  const isSignInRoute = pathname === UrlBuilder.landing() ||
    pathname.startsWith(AUTH_ROUTE_PREFIX);
  return isSignInRoute ? UrlBuilder.dashboard() : returnTo;
}

function redirectMissingSession(
  { session, sessionEnded, pathAndSearch }: AuthenticatedAudienceParams,
) {
  if (hasAuthSession(session)) return;

  throw redirect(
    307,
    UrlBuilder.landing({
      returnTo: pathAndSearch,
      error: sessionEnded ? 'expired' : undefined,
    }),
  );
}

function redirectSession({ session, returnTo }: PublicAudienceParams) {
  if (!hasAuthSession(session)) return;

  throw redirect(307, signedInTarget(returnTo));
}

export function redirectForAudience(params: RedirectForAudienceParams) {
  if (params.audience === 'public') return redirectSession(params);

  return redirectMissingSession(params);
}
