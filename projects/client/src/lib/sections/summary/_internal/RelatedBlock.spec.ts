import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import type { MovieEntry } from '$lib/requests/models/MovieEntry.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { MovieMatrixMappedMock } from '$mocks/data/summary/movies/matrix/MovieMatrixMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { render, screen, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import RelatedBlock from './RelatedBlock.svelte';

type RelatedMovie = { type: 'movie'; movie: MovieEntry };

const REGION_NAME = 'If you like FROM, check out...';

// Heretic, which the viewer rated 10, then five unrated Matrix copies.
const RELATED: ReadonlyArray<RelatedMovie> = [
  { type: 'movie', movie: MovieHereticMappedMock },
  ...Array.from({ length: 5 }, (_, index) => ({
    type: 'movie' as const,
    movie: {
      ...MovieMatrixMappedMock,
      id: MovieMatrixMappedMock.id + index,
      key: `movie-${MovieMatrixMappedMock.id + index}`,
      slug: `${MovieMatrixMappedMock.slug}-${index}`,
    },
  })),
];

function renderBlock(status: SectionStatus<ReadonlyArray<RelatedMovie>>) {
  return renderComponent(RelatedBlock, { props: { title: 'FROM', status } });
}

describe('section: RelatedBlock', () => {
  it('should title the block with the title in bold', async () => {
    renderBlock({ kind: 'ready', data: RELATED });

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: REGION_NAME,
    });
    expect(heading.querySelector('b')?.textContent).toBe('FROM');
    expect(screen.getByRole('region', { name: REGION_NAME })).toBeVisible();
  });

  it("should render six poster cards, each with the viewer's corner rating once rated", async () => {
    renderBlock({ kind: 'ready', data: RELATED });

    const region = await screen.findByRole('region', { name: REGION_NAME });
    const cards = [
      ...region.querySelectorAll<HTMLElement>('.trakt-poster-card'),
    ];
    const [first] = cards;
    if (!first) throw new Error('no card');

    expect(cards).toHaveLength(6);
    expect(
      await within(first).findByRole('img', { name: 'Your rating: 10' }),
    ).toBeVisible();
    expect(region.querySelectorAll('.trakt-corner-rating')).toHaveLength(1);
  });

  it('should give each card the smaller community rating', async () => {
    renderBlock({ kind: 'ready', data: RELATED });

    const region = await screen.findByRole('region', { name: REGION_NAME });
    const ratings = [...region.querySelectorAll('.trakt-community-rating')];

    expect(ratings).toHaveLength(6);
    expect(ratings.map((rating) => rating.getAttribute('data-variant')))
      .toEqual(Array(6).fill('smaller'));
  });

  // Hiding the last two on tablets and the flush, undivided rows are CSS keyed on these marks.
  it('should mark the grid flush and undivided, with the last two cells past the tablet limit', async () => {
    renderBlock({ kind: 'ready', data: RELATED });

    const region = await screen.findByRole('region', { name: REGION_NAME });
    const grid = region.querySelector('.trakt-poster-grid');
    const cells = [...region.querySelectorAll('.poster-grid-cell')];

    expect(grid).toHaveAttribute('data-phone-divider', 'none');
    expect(grid).toHaveAttribute('data-gaps', 'none');
    expect(
      cells.map((cell) => cell.classList.contains('is-past-tablet-limit')),
    ).toEqual([false, false, false, false, true, true]);
  });

  it('should show the heading with its spinner, and no cards, while loading', async () => {
    renderBlock({ kind: 'loading' });

    const region = await screen.findByRole('region', { name: REGION_NAME });
    const heading = within(region).getByRole('heading', { level: 2 });

    expect(heading.querySelector('.trakt-pending-spinner')).not.toBeNull();
    expect(region.querySelector('.trakt-poster-card')).toBeNull();
  });

  // The block reads no store, so it renders at once, outside the test bed.
  it('should render nothing when there are no related titles', () => {
    const { container } = render(RelatedBlock, {
      props: { title: 'FROM', status: { kind: 'empty' } },
    });

    expect(container.querySelector('*')).toBeNull();
  });

  it('should show the error box and retry on Retry', async () => {
    const retry = vi.fn();
    renderBlock({ kind: 'error', retry });

    const region = await screen.findByRole('region', { name: REGION_NAME });
    expect(region).toHaveTextContent("Couldn't load this section.");

    await userEvent.click(
      within(region).getByRole('button', { name: 'Retry' }),
    );

    expect(retry).toHaveBeenCalledOnce();
  });
});
