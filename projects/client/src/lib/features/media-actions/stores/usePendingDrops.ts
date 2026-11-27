import { map, type Observable } from 'rxjs';
import { pendingOverrides } from '../_internal/pendingOverrides.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';

// True while a show's Drop is pending or kept, false while its Restore is, undefined otherwise.
export type PendingDropLookup = (showId: number) => boolean | undefined;

export function usePendingDrops(): Observable<PendingDropLookup> {
  return pendingOverrides.valuesOf$('drop').pipe(
    map((valueOf) => (showId: number) => valueOf(toTargetKey('show', showId))),
  );
}
