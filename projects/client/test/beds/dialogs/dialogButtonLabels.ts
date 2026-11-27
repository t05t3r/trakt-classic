import { within } from '@testing-library/svelte';

export function dialogButtonLabels(
  dialog: HTMLElement,
): ReadonlyArray<string | undefined> {
  return within(dialog).getAllByRole('button')
    .map((button) => button.textContent?.trim());
}
