import { goto } from '$app/navigation';
import { onTestFinished, vi } from 'vitest';
import { openAt } from '$test/beds/url/openAt.ts';
import { landNavigations } from '$test/beds/url/landNavigations.ts';

// The first navigation, a push or a replace, lands once released; later ones land at once.
export function holdFirstNavigation() {
  const held = Promise.withResolvers<void>();
  landNavigations();
  vi.mocked(goto).mockImplementationOnce(async (url) => {
    await held.promise;
    openAt(String(url));
  });
  onTestFinished(() => {
    held.resolve();
  });
  return held;
}
