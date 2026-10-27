import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import type { Observable } from 'rxjs';

// The last read once every query has settled, a failed one included.
export async function readSettled<T>(
  factory: () => Observable<T>,
): Promise<T | undefined> {
  const { read, waitForQueriesIdle } = await renderStore(() => ({
    read: factory(),
    waitForQueriesIdle: useWaitForQueriesIdle(),
  }));
  const reads = collectDistinctStates(read);
  await waitForQueriesIdle();

  return reads.at(-1);
}
