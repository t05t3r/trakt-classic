import type { RequestEvent } from '@sveltejs/kit';
import { sessionCookie } from './_internal/sessionCookie.ts';
import type { RefreshResult } from './models/RefreshResult.ts';
import type { Session } from './models/Session.ts';

type SessionEvent = Pick<RequestEvent, 'cookies' | 'locals'>;

function read(event: SessionEvent): Session | null {
  const session = sessionCookie.read(event.cookies);
  event.locals.auth = session;
  return session;
}

function begin(event: SessionEvent, session: Session): void {
  sessionCookie.write(event.cookies, session);
  event.locals.auth = session;
}

function end(event: SessionEvent): void {
  sessionCookie.clear(event.cookies);
  event.locals.auth = null;
}

async function rotate(
  event: SessionEvent,
  session: Session,
): Promise<RefreshResult> {
  const result = await event.locals.sessionRotator.rotate(session);
  if (result.kind === 'success') begin(event, result.session);
  if (result.kind === 'invalid-grant') end(event);
  return result;
}

export const sessionPersistence = { read, begin, rotate, end };
