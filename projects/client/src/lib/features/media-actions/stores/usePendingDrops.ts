import { distinctUntilChanged, map, type Observable } from 'rxjs';
import {
  type PendingOverride,
  pendingOverrides,
} from '../_internal/pendingOverrides.ts';
import { toTargetKey } from '../_internal/toTargetKey.ts';

const isSameSet = (
  previous: ReadonlySet<string>,
  next: ReadonlySet<string>,
) =>
  previous.size === next.size &&
  [...previous].every((targetKey) => next.has(targetKey));

const toDroppingKeys = (
  overrides: ReadonlyArray<PendingOverride>,
): ReadonlySet<string> =>
  new Set(
    overrides
      .filter((override) => override.value === true)
      .map((override) => override.targetKey),
  );

export function usePendingDrops(): Observable<(showId: number) => boolean> {
  return pendingOverrides.byAction$('drop').pipe(
    map(toDroppingKeys),
    distinctUntilChanged(isSameSet),
    map((dropping) => (showId: number) =>
      dropping.has(toTargetKey('show', showId))
    ),
  );
}
