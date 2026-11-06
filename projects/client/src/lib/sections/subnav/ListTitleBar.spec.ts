import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { render, screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ListTitleBar from './ListTitleBar.svelte';
import type { ListTitleBarProps } from './ListTitleBarProps.ts';

const PANEL_ID = 'list-panel';
const GEAR_ID = 'list-gear';

function renderBar(overrides: Partial<ListTitleBarProps> = {}) {
  const ontoggle = vi.fn();
  render(ListTitleBar, {
    props: {
      title: 'Watchlist',
      href: WATCHLIST_PATH,
      titleId: 'list-title',
      loading: false,
      open: false,
      panelId: PANEL_ID,
      gearId: GEAR_ID,
      ontoggle,
      ...overrides,
    },
  });

  return {
    ontoggle,
    gear: screen.getByRole('button', { name: 'Options' }),
  };
}

describe('component: ListTitleBar', () => {
  it("should title the bar with a link to the List's own page", () => {
    renderBar();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Watchlist',
    });
    expect(heading).toHaveAttribute('id', 'list-title');
    expect(within(heading).getByRole('link', { name: 'Watchlist' }))
      .toHaveAttribute('href', WATCHLIST_PATH);
  });

  it('should show the pending spinner at the end of the title while loading', () => {
    renderBar({ loading: true });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.querySelector('.trakt-pending-spinner')).not.toBeNull();
  });

  it('should show no pending spinner once loaded', () => {
    renderBar({ loading: false });

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.querySelector('.trakt-pending-spinner')).toBeNull();
  });

  it('should hold the gear outside the title, toggling the panel when pressed', async () => {
    const { ontoggle, gear } = renderBar();

    const heading = screen.getByRole('heading', { level: 2 });
    expect(within(heading).queryByRole('button')).toBeNull();
    await userEvent.click(gear);

    expect(ontoggle).toHaveBeenCalledOnce();
  });
});
