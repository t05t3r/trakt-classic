import { time } from '$lib/utils/timing/time.ts';
import { createJsonCookie } from './createJsonCookie.ts';
import { SessionSchema } from '../models/SessionSchema.ts';

export const sessionCookie = createJsonCookie({
  name: 'trakt-session',
  schema: SessionSchema,
  options: {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: time.years(1) / time.seconds(1),
  },
});
