import { waitFor } from '@testing-library/svelte';
import { expect } from 'vitest';

// bits-ui locks the body while a menu or a dialog is open, and unlocks it on a timer once both close.
export function bodyUnlocked(): Promise<void> {
  return waitFor(() => {
    expect(document.body.style.overflow).toBe('');
    expect(document.body.style.pointerEvents).toBe('');
  });
}
