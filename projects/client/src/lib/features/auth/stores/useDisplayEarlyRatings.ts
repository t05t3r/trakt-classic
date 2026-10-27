import { map, type Observable } from 'rxjs';
import { useUser } from './useUser.ts';

export function useDisplayEarlyRatings(): Observable<boolean> {
  return useUser().user.pipe(
    map(($user) => $user.data?.preferences.displayEarlyRatings ?? false),
  );
}
