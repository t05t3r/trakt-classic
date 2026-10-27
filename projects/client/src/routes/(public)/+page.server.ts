import { redirectForAudience } from '$lib/features/auth/redirectForAudience.ts';
import {
  type LandingError,
  LandingErrorSchema,
} from '$lib/features/auth/models/LandingError.ts';
import type { PageServerLoad } from './$types';

const landingError = (params: URLSearchParams): LandingError | null =>
  params.has('error')
    ? LandingErrorSchema.catch('exchange').parse(params.get('error'))
    : null;

export const load: PageServerLoad = ({ locals, url }) => {
  const returnTo = locals.oauthApp.returnTo(url.searchParams.get('returnTo'));
  redirectForAudience({ audience: 'public', session: locals.auth, returnTo });
  return {
    returnTo,
    error: landingError(url.searchParams) ??
      (locals.sessionEnded ? 'expired' : null),
  };
};
