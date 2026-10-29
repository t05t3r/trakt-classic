import { PAST_INVALIDATION_AGE } from '$test/beds/query/PAST_INVALIDATION_AGE.ts';
import { onTestFinished, vi } from 'vitest';

// Moves the clock only, so loaded query data reads `age` old and no timer fires.
export function ageLoadedData(age: number = PAST_INVALIDATION_AGE): void {
  onTestFinished(() => {
    vi.useRealTimers();
  });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.now() + age);
}
