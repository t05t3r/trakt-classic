import { setContext } from 'svelte';
import {
  createWriteQueue,
  type CreateWriteQueueParams,
  type WriteQueue,
} from './createWriteQueue.ts';
import { WRITE_QUEUE_CONTEXT_KEY } from './WRITE_QUEUE_CONTEXT_KEY.ts';

export function createWriteQueueContext(
  params: CreateWriteQueueParams,
): WriteQueue {
  return setContext(WRITE_QUEUE_CONTEXT_KEY, createWriteQueue(params));
}
