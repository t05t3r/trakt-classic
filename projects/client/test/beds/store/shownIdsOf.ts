import type { ProgressReading } from '$lib/features/progress/ProgressReading.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import { map, type Observable } from 'rxjs';

// Every status as the ids it lists, or its kind while it lists none.
export function shownIdsOf(reading: Observable<ProgressReading>) {
  return collectStates(
    statusOf(reading).pipe(
      map((status) =>
        status.kind === 'ready'
          ? status.data.map(({ entry }) => entry.show.id)
          : status.kind
      ),
    ),
  );
}
