import { screen } from '@testing-library/svelte';

export function dateFieldDialog(label: string): HTMLElement | null {
  return screen.queryByRole('dialog', { name: label });
}
