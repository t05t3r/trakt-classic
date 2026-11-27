import { screen } from '@testing-library/svelte';

// True while a menu's trigger takes the accent, its value off its default.
export function isTriggerChanged(name: string): boolean {
  return screen.getByRole('button', { name }).classList.contains('is-selected');
}
