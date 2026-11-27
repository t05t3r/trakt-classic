import { screen } from '@testing-library/svelte';

export function readMenuRows(
  role: 'menuitem' | 'menuitemradio' = 'menuitem',
): ReadonlyArray<string | undefined> {
  return screen.getAllByRole(role).map((row) => row.textContent?.trim());
}
