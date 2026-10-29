import { goto } from '$app/navigation';
import { openAt } from '$test/beds/url/openAt.ts';
import { onTestFinished, vi } from 'vitest';

// Each replace of the mocked goto lands at once, then runs `onLanded`.
export function landReplaces(onLanded: () => void = () => {}): void {
  vi.mocked(goto).mockImplementation(async (url) => {
    openAt(String(url));
    onLanded();
  });
  onTestFinished(() => {
    vi.mocked(goto).mockReset();
  });
}
