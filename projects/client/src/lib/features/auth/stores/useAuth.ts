import { getAuthContext } from '../_internal/getAuthContext.ts';

export function useAuth() {
  return getAuthContext();
}
