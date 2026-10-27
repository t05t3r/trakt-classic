import { useUser } from '$lib/features/auth/stores/useUser.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { filter, firstValueFrom, Subscription } from 'rxjs';
import { onTestFinished } from 'vitest';

type History = ReturnType<typeof useUser>['history'];

// Registers the unsubscribe first, so a call outside a test throws before it subscribes.
export async function renderSettledHistory<
  T extends object & { history?: never },
>(factory: () => T): Promise<T & { history: History }> {
  const subscriptions = new Subscription();
  onTestFinished(() => subscriptions.unsubscribe());

  const { stores, history } = await renderStore(() => ({
    stores: factory(),
    history: useUser().history,
  }));
  subscriptions.add(history.subscribe());
  await firstValueFrom(history.pipe(filter(($history) => $history !== null)));

  return { ...stores, history };
}
