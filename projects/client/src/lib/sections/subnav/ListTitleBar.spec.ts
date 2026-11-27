import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ListTitleBar from './ListTitleBar.svelte';
import type { ListTitleBarProps } from './ListTitleBarProps.ts';

function renderBar(overrides: Partial<ListTitleBarProps> = {}) {
  render(ListTitleBar, {
    props: {
      title: 'Watchlist',
      href: WATCHLIST_PATH,
      titleId: 'list-title',
      loading: false,
      ...overrides,
    },
  });
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
});
