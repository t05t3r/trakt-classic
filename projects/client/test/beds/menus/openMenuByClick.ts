import { screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

export async function openMenuByClick(
  trigger: string,
  menu: string,
): Promise<HTMLElement> {
  await userEvent.click(screen.getByRole('button', { name: trigger }));
  return screen.findByRole('menu', { name: menu });
}
