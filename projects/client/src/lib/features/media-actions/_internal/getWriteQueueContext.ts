import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { getContext } from 'svelte';
import type { WriteQueue } from './createWriteQueue.ts';
import { WRITE_QUEUE_CONTEXT_KEY } from './WRITE_QUEUE_CONTEXT_KEY.ts';

export function getWriteQueueContext(): WriteQueue {
  return assertDefined(
    getContext<WriteQueue | undefined>(WRITE_QUEUE_CONTEXT_KEY),
    'The Write Queue can only be used within WriteQueueProvider.',
  );
}
