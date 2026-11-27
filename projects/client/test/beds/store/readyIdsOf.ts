import type { ProgressReading } from '$lib/features/progress/ProgressReading.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { statusOf } from '$test/beds/store/statusOf.ts';
import type { Observable } from 'rxjs';

export async function readyIdsOf(reading: Observable<ProgressReading>) {
  const ready = await nextOf(statusOf(reading), 'ready');

  return ready.data.map(({ entry }) => entry.show.id);
}
