import { screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

export async function openDialogByClick(
  trigger: string | RegExp,
  dialog: string,
): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: trigger }));
  return screen.findByRole('dialog', { name: dialog });
}
