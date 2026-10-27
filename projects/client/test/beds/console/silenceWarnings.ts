import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { type MockInstance, onTestFinished, vi } from 'vitest';

// Registers the restore first, so a call outside a test throws before console.warn is spied.
export function silenceWarnings(): MockInstance<typeof console.warn> {
  onTestFinished(() => warn.mockRestore());
  const warn = vi.spyOn(console, 'warn').mockImplementation(NOOP_FN);
  return warn;
}
