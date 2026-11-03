import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ListGridCard from './ListGridCard.svelte';

type CardParams = {
  entry: ListItem;
  sortBy?: SortBy;
  isFaded?: boolean;
  droppedAt?: Date;
  hasRank?: boolean;
  favorite?: boolean;
};

async function renderCard(
  { entry, sortBy = 'rank', isFaded = false, droppedAt, ...flags }: CardParams,
) {
  const { container, userLoaded } = renderComponent(ListGridCard, {
    props: {
      entry,
      card: toListItemCard(entry),
      sortBy,
      isFaded,
      ...(droppedAt && { droppedAt }),
      ...flags,
    },
  });
  await userLoaded;

  return container;
}

function lines() {
  return screen.queryAllByRole('heading', { level: 4 })
    .map((heading) => heading.textContent?.trim());
}

function blankLines(container: HTMLElement) {
  return container.querySelectorAll('.card-subtitle[aria-hidden="true"]');
}

describe('component: ListGridCard', () => {
  describe('lines', () => {
    it.each(
      [
        { type: 'movie', title: 'The Batman', line: '49,710' },
        { type: 'show', title: 'Slow Horses', line: '10,028' },
      ] as const,
    )(
      'should set the sort value on the first line of a $type card',
      async ({ type, title, line }) => {
        const container = await renderCard({
          entry: itemOfType(type),
          sortBy: 'votes',
        });

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
          title,
        );
        expect(lines()).toEqual([line]);
        expect(blankLines(container)).toHaveLength(1);
      },
    );

    it.each(
      [
        { type: 'season', title: 'Season 3', show: 'Silo', line: '343' },
        {
          type: 'episode',
          title: '1x01 The Heirs of the Dragon',
          show: 'House of the Dragon',
          line: '7,477',
        },
      ] as const,
    )(
      'should set the sort value under the show line of a $type card',
      async ({ type, title, show, line }) => {
        await renderCard({ entry: itemOfType(type), sortBy: 'votes' });

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
          title,
        );
        expect(lines()).toEqual([show, line]);
      },
    );

    it('should hold both lines of a movie card blank under rank', async () => {
      const container = await renderCard({ entry: itemOfType('movie') });

      expect(lines()).toEqual([]);
      expect(blankLines(container)).toHaveLength(2);
    });

    it('should hold the line under the show line blank under rank', async () => {
      const container = await renderCard({ entry: itemOfType('season') });

      expect(lines()).toEqual(['Silo']);
      expect(blankLines(container)).toHaveLength(1);
    });
  });

  describe('badges', () => {
    it("should ribbon an episode card with its episode's type", async () => {
      await renderCard({ entry: itemOfType('episode') });

      expect(screen.getByText('Series Premiere')).toBeInTheDocument();
    });

    it("should set the viewer's rating in the corner", async () => {
      await renderCard({
        entry: { ...itemOfType('movie'), entry: MovieHereticMappedMock },
      });

      expect(
        await screen.findByRole('img', { name: 'Your rating: 10' }),
      ).toBeInTheDocument();
    });

    it('should badge a dropped show card', async () => {
      const container = await renderCard({
        entry: itemOfType('show'),
        droppedAt: new Date(2026, 2, 4, 21, 5),
      });

      expect(container.querySelector('.trakt-poster-card')).toHaveClass(
        'is-dropped',
      );
    });
  });

  describe('rank', () => {
    it("should badge the card with its entry's rank on a ranked list", async () => {
      const container = await renderCard({
        entry: { ...itemOfType('movie'), rank: 7 },
        hasRank: true,
      });

      expect(container.querySelector('.trakt-rank-badge'))
        .toHaveTextContent(/^7$/);
    });

    it('should badge no rank by default', async () => {
      const container = await renderCard({
        entry: { ...itemOfType('movie'), rank: 7 },
      });

      expect(container.querySelector('.trakt-rank-badge')).toBeNull();
    });
  });

  describe('favourite', () => {
    it('should add the favourite quick-icon when asked', async () => {
      await renderCard({
        entry: { ...itemOfType('movie'), entry: MovieHereticMappedMock },
        favorite: true,
      });

      expect(
        await screen.findByRole('button', {
          name: 'Remove "Heretic" from your Favorites',
        }),
      ).toHaveAttribute('data-action', 'favorite');
    });

    it('should leave the favourite quick-icon out by default', async () => {
      const container = await renderCard({ entry: itemOfType('movie') });

      await screen.findByRole('button', { name: /^Mark .* as watched$/ });
      expect(container.querySelector('[data-action="favorite"]')).toBeNull();
    });
  });

  describe('fade', () => {
    it.each([true, false])(
      'should mark the card faded: %s',
      async (isFaded) => {
        const container = await renderCard({
          entry: itemOfType('movie'),
          isFaded,
        });

        expect(
          container.querySelector('.trakt-list-grid-card')?.classList
            .contains('is-faded'),
        ).toBe(isFaded);
      },
    );
  });
});
