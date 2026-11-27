import { screen } from '@testing-library/svelte';

const RADIO_STATES: ReadonlyArray<string | null> = ['true', 'false'];

export function readCheckedMenuRow(): string | undefined {
  const rows = screen.getAllByRole('menuitemradio');
  const states = rows.map((row) => row.getAttribute('aria-checked'));
  if (!states.every((state) => RADIO_STATES.includes(state))) {
    throw new Error(
      `Every radio row needs aria-checked true or false, not ${
        JSON.stringify(states)
      }`,
    );
  }

  const checked = rows.filter((_, index) => states.at(index) === 'true');
  if (checked.length > 1) {
    throw new Error(`${checked.length} radio rows are checked; one at most is`);
  }

  return checked.at(0)?.textContent?.trim();
}
