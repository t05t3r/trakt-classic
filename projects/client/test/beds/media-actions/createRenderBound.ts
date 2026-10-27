import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { filter, firstValueFrom, type Observable, Subscription } from 'rxjs';
import { onTestFinished } from 'vitest';

type CreateRenderBoundParams<P, S> = {
  store: (target: P) => S;
  flag: (store: S) => Observable<unknown>;
  snapshot: (user: ReturnType<typeof useUser>) => Observable<unknown>;
};

// A bound surface keeps the snapshot query active, so a write refetches it.
export function createRenderBound<P, S>(
  { store, flag, snapshot }: CreateRenderBoundParams<P, S>,
): (target: P) => Promise<S> {
  // Registers the unsubscribe first, so a call outside a test throws before it renders.
  return async (target) => {
    const subscriptions = new Subscription();
    onTestFinished(() => subscriptions.unsubscribe());

    const bound = await renderStore(() => ({
      store: store(target),
      snapshot: snapshot(useUser()),
    }));
    subscriptions.add(flag(bound.store).subscribe());
    await firstValueFrom(bound.snapshot.pipe(filter(Boolean)));

    return bound.store;
  };
}
