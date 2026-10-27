import type { Session } from './Session.ts';

export type RefreshResult =
  | { kind: 'success'; session: Session }
  | { kind: 'invalid-grant' }
  | { kind: 'unavailable' };
