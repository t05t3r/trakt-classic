import { goto } from '$app/navigation';
import { onTestFinished, vi } from 'vitest';
import { openAt } from '$test/beds/url/openAt.ts';

// The first replace lands once released; the ones after it land at once.
export function holdFirstReplace() {
  const held = Promise.withResolvers<void>();
  vi.mocked(goto)
    .mockImplementationOnce(async (url) => {
      await held.promise;
      openAt(String(url));
    })
    .mockImplementation(async (url) => openAt(String(url)));
  onTestFinished(() => {
    held.resolve();
    vi.mocked(goto).mockReset();
  });
  return held;
}
