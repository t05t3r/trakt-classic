import { screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

export function applyDateField(): Promise<void> {
  return userEvent.click(screen.getByRole('button', { name: 'Apply' }));
}
