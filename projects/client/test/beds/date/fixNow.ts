import { onTestFinished, vi } from 'vitest';

// Fakes only `Date`, so no timer stops firing while the clock stands still.
export function fixNow(now: Date): void {
  onTestFinished(() => {
    vi.useRealTimers();
  });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(now);
}
