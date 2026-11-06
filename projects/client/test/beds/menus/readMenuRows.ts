import { screen } from '@testing-library/svelte';

export function readMenuRows(): ReadonlyArray<string | undefined> {
  return screen.getAllByRole('menuitem').map((row) => row.textContent?.trim());
}
