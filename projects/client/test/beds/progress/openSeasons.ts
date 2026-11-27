import { within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';

// Resolves once Silo's last season, and so its whole list, is drawn.
export async function openSeasons(container: HTMLElement): Promise<void> {
  await userEvent.click(
    within(container).getByRole('button', { name: 'Seasons' }),
  );
  await within(container).findByRole('link', { name: 'Season 2' });
}
