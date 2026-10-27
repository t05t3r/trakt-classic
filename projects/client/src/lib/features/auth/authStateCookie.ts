import { time } from '$lib/utils/timing/time.ts';
import { z } from 'zod';
import { createJsonCookie } from './_internal/createJsonCookie.ts';

const AuthStateSchema = z.object({
  nonce: z.string().min(1),
  codeVerifier: z.string().min(1),
  returnTo: z.string().startsWith('/'),
});

export const authStateCookie = createJsonCookie({
  name: 'trakt-auth-state',
  schema: AuthStateSchema,
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/auth',
    maxAge: time.minutes(10) / time.seconds(1),
  },
});
