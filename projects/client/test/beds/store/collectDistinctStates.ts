import { collectStates } from '$test/beds/store/collectStates.ts';
import { distinctUntilChanged, type Observable } from 'rxjs';

// Records the first value too, so a leading `undefined` is never lost.
export function collectDistinctStates<T>(
  source: Observable<T>,
): ReadonlyArray<T> {
  return collectStates(source.pipe(distinctUntilChanged()));
}
