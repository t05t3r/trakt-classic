import { useWaitForLateRequests } from '$test/beds/query/useWaitForLateRequests.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { BehaviorSubject, map, type Observable } from 'rxjs';

type ParamsChange<P, S, T> = {
  from: P;
  to: P;
  store: (params: Observable<P>) => S;
  pick: (store: S) => Observable<T>;
  // Resolve once the store has read the first params, and once it has read the new ones.
  loadedFrom: (store: S) => Promise<unknown>;
  loadedTo: (store: S) => Promise<unknown>;
};

// Every read emitted under the new params, until no late request is left.
export async function readsAfterParamsChange<P, S, T>(
  { from, to, store, pick, loadedFrom, loadedTo }: ParamsChange<P, S, T>,
): Promise<ReadonlyArray<T>> {
  const params$ = new BehaviorSubject(from);
  const { rendered, waitForLateRequests } = await renderStore(() => ({
    rendered: store(params$),
    waitForLateRequests: useWaitForLateRequests(),
  }));
  const reads = collectDistinctStates(
    pick(rendered).pipe(map((read) => ({ params: params$.value, read }))),
  );
  await loadedFrom(rendered);

  params$.next(to);
  await loadedTo(rendered);
  await waitForLateRequests();

  return reads.filter(({ params }) => params === to).map(({ read }) => read);
}
