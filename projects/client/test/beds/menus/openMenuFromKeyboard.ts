import { waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { expect } from 'vitest';
import { nextFrame } from '$test/beds/promise/nextFrame.ts';

export async function openMenuFromKeyboard(
  trigger: HTMLElement,
  firstItem: string,
): Promise<void> {
  trigger.focus();
  await userEvent.keyboard('{Enter}');
  // Any menu item role, so a radio or checkbox row can come first.
  await waitFor(() => {
    expect(document.activeElement?.getAttribute('role')).toMatch(/^menuitem/);
    expect(document.activeElement).toHaveAccessibleName(firstItem);
  });
  // bits-ui refocuses the menu content on the next frame, which hands focus back to the first item.
  await nextFrame();
}
