import type { Session } from './models/Session.ts';

export function hasAuthSession(session: Session | Nil): session is Session {
  return session != null;
}
