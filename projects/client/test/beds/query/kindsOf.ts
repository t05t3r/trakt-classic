import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { map, type Observable } from 'rxjs';

export function kindsOf<T>(
  status: Observable<SectionStatus<T>>,
): ReadonlyArray<SectionStatus<T>['kind']> {
  return collectDistinctStates(status.pipe(map(({ kind }) => kind)));
}
