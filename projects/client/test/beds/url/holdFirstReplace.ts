import { goto } from '$app/navigation';
import { onTestFinished, vi } from 'vitest';
import { openAt } from '$test/beds/url/openAt.ts';
import { landReplaces } from '$test/beds/url/_internal/landReplaces.ts';

// The first replace lands once released; the ones after it land at once.
export function holdFirstReplace() {
  const held = Promise.withResolvers<void>();
  landReplaces();
  vi.mocked(goto).mockImplementationOnce(async (url) => {
    await held.promise;
    openAt(String(url));
  });
  onTestFinished(() => {
    held.resolve();
  });
  return held;
}
