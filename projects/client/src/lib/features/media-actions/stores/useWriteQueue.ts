import { getWriteQueueContext } from '../_internal/getWriteQueueContext.ts';

export function useWriteQueue() {
  return getWriteQueueContext();
}
