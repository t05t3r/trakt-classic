import { waitFor } from '@testing-library/svelte';
import { expect } from 'vitest';

// A control that sets `aria-disabled` only while it refuses input reads known once it leaves.
export async function waitForEnabled(button: HTMLElement) {
  await waitFor(() => expect(button).not.toHaveAttribute('aria-disabled'));

  return button;
}
