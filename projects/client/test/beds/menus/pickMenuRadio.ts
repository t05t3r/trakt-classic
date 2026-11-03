import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

export async function pickMenuRadio(name: string): Promise<void> {
  await userEvent.click(screen.getByRole('menuitemradio', { name }));
  await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
}
