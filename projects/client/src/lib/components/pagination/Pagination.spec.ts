import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { expectDirectionalIcon } from '$test/beds/direction/expectDirectionalIcon.ts';
import { render, screen, within } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import Pagination from './Pagination.svelte';

function urlAt(search = '') {
  return new URL(`http://localhost${WATCHLIST_PATH}${search}`);
}

function pagination() {
  return screen.getByRole('navigation', { name: 'Pagination' });
}

describe('component: Pagination', () => {
  it('should link each shown page, keeping the other params', () => {
    render(Pagination, {
      props: { current: 2, total: 3, url: urlAt('?sort=added,desc&page=2') },
    });

    const nav = pagination();
    expect(within(nav).getByRole('link', { name: '1' })).toHaveAttribute(
      'href',
      `${WATCHLIST_PATH}?sort=added,desc`,
    );
    expect(within(nav).getByRole('link', { name: '3' })).toHaveAttribute(
      'href',
      `${WATCHLIST_PATH}?sort=added,desc&page=3`,
    );
  });

  it('should mark only the current page as the current one', () => {
    render(Pagination, {
      props: { current: 2, total: 3, url: urlAt('?page=2') },
    });

    const nav = pagination();
    expect(within(nav).getByRole('link', { name: '2' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: '1' })).not
      .toHaveAttribute('aria-current');
    expect(within(nav).getByRole('link', { name: '3' })).not
      .toHaveAttribute('aria-current');
  });

  it('should link the arrows to the pages either side of the current one', () => {
    render(Pagination, {
      props: { current: 2, total: 3, url: urlAt('?page=2') },
    });

    const nav = pagination();
    expect(within(nav).getByRole('link', { name: 'Previous page' }))
      .toHaveAttribute('href', WATCHLIST_PATH);
    expect(within(nav).getByRole('link', { name: 'Next page' }))
      .toHaveAttribute('href', `${WATCHLIST_PATH}?page=3`);
    within(nav).getAllByRole('link').forEach((link) => {
      expect(link).not.toHaveAttribute('aria-disabled');
    });
  });

  it('should disable the previous arrow on the first page', () => {
    render(Pagination, { props: { current: 1, total: 3, url: urlAt() } });

    const previous = within(pagination()).getByRole('link', {
      name: 'Previous page',
    });
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).not.toHaveAttribute('href');
    previous.focus();
    expect(previous).not.toHaveFocus();
  });

  it('should disable the next arrow on the last page', () => {
    render(Pagination, {
      props: { current: 3, total: 3, url: urlAt('?page=3') },
    });

    const next = within(pagination()).getByRole('link', { name: 'Next page' });
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(next).not.toHaveAttribute('href');
    next.focus();
    expect(next).not.toHaveFocus();
  });

  // The router preloads every anchor on the page, and an anchor with no href throws there.
  it.each([1, 2])(
    'should render no anchor without an href on page %i of 2',
    (current) => {
      const { container } = render(Pagination, {
        props: { current, total: 2, url: urlAt(`?page=${current}`) },
      });

      expect(container.querySelectorAll('a:not([href])')).toHaveLength(0);
    },
  );

  it('should fold a long run of pages into a gap with no link', () => {
    const { container } = render(Pagination, {
      props: { current: 1, total: 13, url: urlAt() },
    });

    const names = within(pagination()).getAllByRole('link').map((link) =>
      link.getAttribute('aria-label') ?? link.textContent?.trim()
    );
    expect(names).toEqual([
      'Previous page',
      '1',
      '2',
      '3',
      '4',
      '5',
      '12',
      '13',
      'Next page',
    ]);
    const gap = container.querySelector('svg.tabler-icon-dots');
    expect(gap?.closest('a')).toBeNull();
    expect(gap?.closest('li')).toHaveAttribute('aria-hidden', 'true');
  });

  it('should mark its arrows as directional and hide them from assistive technology', () => {
    const { container } = render(Pagination, {
      props: { current: 2, total: 3, url: urlAt('?page=2') },
    });

    const left = container.querySelector('svg.tabler-icon-arrow-left');
    const right = container.querySelector('svg.tabler-icon-arrow-right');
    [left, right].forEach(expectDirectionalIcon);
  });

  it('should treat a current page past the total as the last page', () => {
    render(Pagination, {
      props: { current: 20, total: 13, url: urlAt('?page=20') },
    });

    const nav = pagination();
    expect(within(nav).getByRole('link', { name: '13' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: 'Next page' }))
      .toHaveAttribute('aria-disabled', 'true');
    expect(within(nav).getByRole('link', { name: 'Previous page' }))
      .toHaveAttribute('href', `${WATCHLIST_PATH}?page=12`);
  });

  it('should name the navigation by the label it is handed', () => {
    render(Pagination, {
      props: { current: 1, total: 3, url: urlAt(), label: 'Pagination, top' },
    });

    expect(screen.getByRole('navigation', { name: 'Pagination, top' }))
      .toBeVisible();
  });

  it.each([1, 0])('should render nothing for a total of %i', (total) => {
    const { container } = render(Pagination, {
      props: { current: 1, total, url: urlAt() },
    });

    expect(container.children).toHaveLength(0);
  });
});
