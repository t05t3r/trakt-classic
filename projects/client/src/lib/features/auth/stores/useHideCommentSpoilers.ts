import {
  combineLatest,
  distinctUntilChanged,
  map,
  type Observable,
} from 'rxjs';
import { useAuth } from './useAuth.ts';
import { useUser } from './useUser.ts';

// `undefined` while a signed-in viewer's settings load; a failed read counts as showing them.
export function useHideCommentSpoilers(): Observable<boolean | undefined> {
  const { isAuthorized } = useAuth();

  return combineLatest([isAuthorized, useUser().user]).pipe(
    map(([$isAuthorized, $user]) => {
      if (!$isAuthorized) return false;
      if ($user.isPending) return undefined;

      return $user.data?.preferences.hideCommentSpoilers ?? false;
    }),
    distinctUntilChanged(),
  );
}
