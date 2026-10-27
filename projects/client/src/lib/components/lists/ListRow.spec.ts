import { render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import ListRow from './ListRow.svelte';
import type { ListRowProps } from './ListRowProps.ts';

const LIST_HREF = '/lists/official/top-gun-collection';

const posters = createRawSnippet(() => ({
  render: () => '<img class="fan" src="/img/poster.webp" alt="" />',
}));

const avatar = createRawSnippet(() => ({
  render: () => '<img src="/img/avatar.webp" alt="" />',
}));

function renderRow(props: Partial<ListRowProps> = {}) {
  return render(ListRow, {
    props: {
      name: 'Top Gun Collection',
      owner: 'Official List',
      description: 'Every Top Gun film.',
      count: 2,
      posters,
      avatar,
      ...props,
    },
  });
}

describe('component: ListRow', () => {
  it('should link the name to the list', () => {
    renderRow({ href: LIST_HREF });

    expect(screen.getByRole('link', { name: 'Top Gun Collection' }))
      .toHaveAttribute('href', LIST_HREF);
  });

  it('should link the poster fan to the list, out of the tab order', () => {
    const { container } = renderRow({ href: LIST_HREF });

    const fanLink = container.querySelector('img.fan')?.closest('a');

    expect(fanLink).toHaveAttribute('href', LIST_HREF);
    expect(fanLink).toHaveAttribute('tabindex', '-1');
  });

  it('should announce one link, the name', () => {
    renderRow({ href: LIST_HREF });

    expect(screen.getAllByRole('link')).toEqual([
      screen.getByRole('link', { name: 'Top Gun Collection' }),
    ]);
  });

  it('should render the poster fan plain without an href', () => {
    const { container } = renderRow();

    expect(container.querySelector('img.fan')).toBeInTheDocument();
    expect(container.querySelector('a')).toBeNull();
  });

  it('should render the name plain without an href', () => {
    renderRow();

    expect(screen.getByRole('heading', { name: 'Top Gun Collection' }))
      .toBeInTheDocument();
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('should show an owner given as a string', () => {
    renderRow({ owner: 'Official List' });

    expect(screen.getByRole('heading', { name: 'Official List' }))
      .toBeInTheDocument();
  });

  it('should show an owner given as a snippet', () => {
    const owner = createRawSnippet(() => ({
      render: () => '<span>by <b>Dracid</b></span>',
    }));

    renderRow({ owner });

    expect(screen.getByRole('heading', { name: 'by Dracid' }))
      .toBeInTheDocument();
  });

  it('should show the item count, grouped, labelled Items', () => {
    renderRow({ count: 1190 });

    expect(screen.getByTitle('Items')).toHaveTextContent(/^1,190 Items$/);
  });

  it('should show the description, clamped', () => {
    renderRow({ description: 'Every Top Gun film.' });

    expect(screen.getByText('Every Top Gun film.').closest('.is-clamped'))
      .toBeInTheDocument();
  });

  it('should render no description box for an empty description', () => {
    const { container } = renderRow({ description: '' });

    expect(container.querySelector('.list-row-overview')).toBeNull();
  });

  it('should take no variant by default', () => {
    const { container } = renderRow();

    expect(container.querySelector('.trakt-list-row'))
      .not.toHaveAttribute('data-variant');
  });

  it("should mark the detail page's variant, which drops the description and the row gap on phones", () => {
    const { container } = renderRow({ variant: 'summary' });

    expect(container.querySelector('.trakt-list-row'))
      .toHaveAttribute('data-variant', 'summary');
  });
});
