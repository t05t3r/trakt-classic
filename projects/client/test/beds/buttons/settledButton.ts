import { waitFor, within } from '@testing-library/svelte';
import { expect } from 'vitest';

// A known state reads `aria-disabled` false.
export async function settledButton(
  name: string,
  scope: HTMLElement = document.body,
) {
  await within(scope).findByRole('button', { name });

  return await waitFor(() => {
    const button = within(scope).getByRole('button', { name });
    expect(button).toHaveAttribute('aria-disabled', 'false');

    return button;
  });
}
