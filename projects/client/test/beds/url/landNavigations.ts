import { goto } from '$app/navigation';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { nextFrame } from '$test/beds/promise/nextFrame.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { onTestFinished, vi } from 'vitest';

type LandNavigationsParams = {
  onLanded?: () => void;
  // As with SvelteKit's goto, the URL moves after the call and before goto resolves.
  isFrameLater?: boolean;
};

// Each navigation of the mocked goto lands, at once or a frame later, then runs `onLanded`.
export function landNavigations(
  { onLanded = NOOP_FN, isFrameLater = false }: LandNavigationsParams = {},
): void {
  vi.mocked(goto).mockImplementation(async (url) => {
    if (isFrameLater) await nextFrame();
    openAt(String(url));
    onLanded();
  });
  onTestFinished(() => {
    vi.mocked(goto).mockReset();
  });
}
