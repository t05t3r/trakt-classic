import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import type { InvalidateActionOptions } from '$lib/requests/models/InvalidateAction.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { filter, firstValueFrom, type Observable, Subscription } from 'rxjs';
import { onTestFinished } from 'vitest';

// Registers the unsubscribe first, so a call outside a test throws before it subscribes.
export async function observeInvalidation(
  factory: () => Observable<{ readonly isSuccess: boolean }>,
): Promise<(...actions: InvalidateActionOptions[]) => Promise<string[]>> {
  const subscriptions = new Subscription();
  onTestFinished(() => subscriptions.unsubscribe());

  const { query, invalidate } = await renderStore(() => ({
    query: factory(),
    ...useInvalidator(),
  }));
  subscriptions.add(query.subscribe());
  await firstValueFrom(query.pipe(filter((result) => result.isSuccess)));

  return (...actions) =>
    captureRequests(() =>
      actions.reduce<Promise<void>>(
        (previous, action) => previous.then(() => invalidate(action)),
        Promise.resolve(),
      )
    );
}
