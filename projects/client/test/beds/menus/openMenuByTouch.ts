import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { expect, onTestFinished } from 'vitest';

export async function openMenuByTouch(
  trigger: HTMLElement,
  menuName: string,
): Promise<HTMLElement> {
  const restore = () => {
    Reflect.deleteProperty(trigger, 'focus');
  };
  // Registers the restore first, so a call outside a test throws before focus is stubbed.
  onTestFinished(restore);
  // bits-ui focuses the trigger as the menu mounts in jsdom, so the bed holds that off.
  Object.defineProperty(trigger, 'focus', {
    configurable: true,
    value: NOOP_FN,
  });

  await userEvent.pointer({ keys: '[TouchA]', target: trigger });
  const menu = await screen.findByRole('menu', { name: menuName });
  await waitFor(() => expect(menu.contains(document.activeElement)).toBe(true));
  restore();

  return menu;
}
