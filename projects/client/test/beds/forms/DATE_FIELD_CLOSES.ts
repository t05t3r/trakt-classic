import { closeFromOutside } from '$test/beds/menus/closeFromOutside.ts';
import { screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

type DateFieldClose = { name: string; close: () => Promise<unknown> };

export const DATE_FIELD_CLOSES: ReadonlyArray<DateFieldClose> = [
  {
    name: 'Cancel',
    close: () =>
      userEvent.click(screen.getByRole('button', { name: 'Cancel' })),
  },
  { name: 'Escape', close: () => userEvent.keyboard('{Escape}') },
  {
    name: 'a press outside',
    close: () => closeFromOutside(() => screen.queryByRole('dialog')),
  },
];
