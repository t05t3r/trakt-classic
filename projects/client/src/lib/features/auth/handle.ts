import { time } from '$lib/utils/timing/time.ts';
import type { Handle } from '@sveltejs/kit';
import { sessionPersistence } from './sessionPersistence.ts';

const REFRESH_THRESHOLD = time.days(1);

const isHtmlNavigation = (accept: string | null) =>
  accept?.includes('text/html') ?? false;

export const handle: Handle = async ({ event, resolve }) => {
  const session = sessionPersistence.read(event);

  if (!session || !isHtmlNavigation(event.request.headers.get('accept'))) {
    return resolve(event);
  }

  if (session.expiresAt - Date.now() > REFRESH_THRESHOLD) return resolve(event);

  const result = await sessionPersistence.rotate(event, session);
  event.locals.sessionEnded = result.kind === 'invalid-grant';
  return resolve(event);
};
