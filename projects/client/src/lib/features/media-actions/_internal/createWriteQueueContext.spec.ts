import { renderStore } from '$test/beds/store/renderStore.ts';
import { Subject } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { createWriteQueueContext } from './createWriteQueueContext.ts';
import { getWriteQueueContext } from './getWriteQueueContext.ts';

describe('createWriteQueueContext', () => {
  it('should hand getWriteQueueContext the queue it created', async () => {
    const [created, provided] = await renderStore(() => {
      const queue = createWriteQueueContext({
        sessionExpired$: new Subject<void>(),
      });
      return [queue, getWriteQueueContext()];
    });

    expect(provided).toBe(created);
  });
});
