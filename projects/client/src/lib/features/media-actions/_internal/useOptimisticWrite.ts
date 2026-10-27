import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import type { InvalidateActionOptions } from '$lib/requests/models/InvalidateAction.ts';
import type { WriteTask } from './createWriteQueue.ts';
import { getWriteQueueContext } from './getWriteQueueContext.ts';
import { notifyWriteFailure } from './notifyWriteFailure.ts';
import {
  type PendingOverride,
  type PendingOverrideKey,
  pendingOverrides,
} from './pendingOverrides.ts';

export type OptimisticWrite = {
  keys: ReadonlyArray<PendingOverrideKey>;
  value: PendingOverride['value'];
  task: WriteTask;
  invalidation:
    | InvalidateActionOptions
    | ReadonlyArray<InvalidateActionOptions>;
  // Off when the caller's own checks (pending, history, confirm) span awaits before run:
  // a superseding write would act on what they read, such as a confirmed play count.
  supersede?: boolean;
};

export function useOptimisticWrite() {
  const queue = getWriteQueueContext();
  const { invalidateAll } = useInvalidator();

  // Resolves true once the write lands; false when refused, superseded or rolled back.
  const run = async (
    { keys, value, task, invalidation, supersede = true }: OptimisticWrite,
  ): Promise<boolean> => {
    // Check and set before the first await, so no other write can slip between.
    const pending = keys.map((key) => pendingOverrides.get(key));
    if (pending.some((override) => override?.value === value)) return false;
    if (!supersede && pending.some((override) => override !== undefined)) {
      return false;
    }

    const requestId = crypto.randomUUID();
    keys.forEach((key) => pendingOverrides.set({ ...key, value, requestId }));

    // Checked at every attempt: a write superseded on every key before it posts,
    // or before its retry after a 429, does not post.
    const outcome = { superseded: false };
    const isSuperseded = () =>
      keys.length > 0 &&
      !keys.some((key) => pendingOverrides.get(key)?.requestId === requestId);
    const postUnlessSuperseded: WriteTask = (params) => {
      if (!isSuperseded()) return task(params);

      outcome.superseded = true;
      return Promise.resolve();
    };

    try {
      await queue.enqueue(postUnlessSuperseded);
      if (outcome.superseded) return false;

      await invalidateAll([invalidation].flat());
      return true;
    } catch (error) {
      notifyWriteFailure(error);
      return false;
    } finally {
      keys.forEach((key) => pendingOverrides.clear({ ...key, requestId }));
    }
  };

  return { run };
}
