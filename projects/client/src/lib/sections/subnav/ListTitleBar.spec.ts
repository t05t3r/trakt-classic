import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { render, screen, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ListTitleBar from './ListTitleBar.svelte';
import type { ListTitleBarProps } from './ListTitleBarProps.ts';

const PANEL_ID = 'list-panel';

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
      ontoggle,
      ...overrides,
    },
  });

  return {
    ontoggle,
    gear: screen.getByRole('button', { name: 'List options' }),
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

  it.each([
    [false, 'false'],
    [true, 'true'],
  ])(
    'should mark the gear expanded %s, controlling the panel',
    (open, expanded) => {
      const { gear } = renderBar({ open });

      expect(gear).toHaveAttribute('aria-expanded', expanded);
      expect(gear).toHaveAttribute('aria-controls', PANEL_ID);
    },
  );

  it('should hold the gear outside the title', () => {
    renderBar();

    const heading = screen.getByRole('heading', { level: 2 });
    expect(within(heading).queryByRole('button')).toBeNull();
  });

  it('should toggle the panel when the gear is pressed', async () => {
    const { ontoggle, gear } = renderBar();

    await userEvent.click(gear);

    expect(ontoggle).toHaveBeenCalledOnce();
  });
});
