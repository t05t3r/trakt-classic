import { screen } from '@testing-library/svelte';

// The field's dialog carries the same name as its input.
export function dateField(label: string): HTMLInputElement {
  return screen.getByLabelText<HTMLInputElement>(label, { selector: 'input' });
}
