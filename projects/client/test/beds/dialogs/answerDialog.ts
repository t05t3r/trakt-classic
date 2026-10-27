import { bodyUnlocked } from '$test/beds/scroll-lock/bodyUnlocked.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { expect } from 'vitest';

// Resolves once the dialog has closed and the body takes a press again.
export async function answerDialog(name: string, button: string) {
  const dialog = await screen.findByRole('dialog', { name });
  await userEvent.click(within(dialog).getByRole('button', { name: button }));
  await waitFor(() => expect(dialog).not.toBeInTheDocument());
  await bodyUnlocked();
}
