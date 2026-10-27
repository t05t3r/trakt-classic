import { environmentManager } from '@tanstack/query-core';
import { onTestFinished } from 'vitest';

// Turns on query-core's stale timers, which it skips on a server such as Deno.
export function runStaleTimers() {
  const wasServer = environmentManager.isServer();
  environmentManager.setIsServer(() => false);
  onTestFinished(() => environmentManager.setIsServer(() => wasServer));
}
