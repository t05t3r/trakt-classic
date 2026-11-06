import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import type { SortBy } from '$lib/models/SortBy.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { blankCardLines } from '$test/beds/media-card/blankCardLines.ts';
import { cardLines } from '$test/beds/media-card/cardLines.ts';
import { screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ListGridCard from './ListGridCard.svelte';

type CardParams = {
  entry: ListItem;
  sortBy?: SortBy;
  hasRank?: boolean;
  isFaded?: boolean;
  droppedAt?: Date;
};

async function renderCard({ entry, sortBy = 'rank', ...flags }: CardParams) {
  const { container, userLoaded } = renderComponent(ListGridCard, {
    props: {
      entry,
      card: toListItemCard(entry),
      sortBy,
      isFaded: false,
      ...flags,
    },
  });
  await userLoaded;

  return container;
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
        expect(cardLines(container)).toEqual([line]);
        expect(blankCardLines(container)).toHaveLength(1);
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
        const container = await renderCard({
          entry: itemOfType(type),
          sortBy: 'votes',
        });

        expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(
          title,
        );
        expect(cardLines(container)).toEqual([show, line]);
      },
    );

    it('should hold both lines of a movie card blank under rank', async () => {
      const container = await renderCard({ entry: itemOfType('movie') });

      expect(cardLines(container)).toEqual([]);
      expect(blankCardLines(container)).toHaveLength(2);
    });

    it('should hold the line under the show line blank under rank', async () => {
      const container = await renderCard({ entry: itemOfType('season') });

      expect(cardLines(container)).toEqual(['Silo']);
      expect(blankCardLines(container)).toHaveLength(1);
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

  describe('row', () => {
    it('should fade the card of a faded row', async () => {
      const container = await renderCard({
        entry: itemOfType('movie'),
        isFaded: true,
      });

      expect(container.querySelector('.trakt-user-grid-card'))
        .toHaveClass('is-faded');
    });

    it("should badge the card with its row's dropped date", async () => {
      const container = await renderCard({
        entry: itemOfType('show'),
        droppedAt: new Date(2026, 2, 4, 21, 5),
      });

      expect(container.querySelector('.trakt-poster-card'))
        .toHaveClass('is-dropped');
    });
  });

  describe('favourite', () => {
    it('should leave the favourite quick-icon out by default', async () => {
      const container = await renderCard({ entry: itemOfType('movie') });

      await screen.findByRole('button', { name: /^Mark .* as watched$/ });
      expect(container.querySelector('[data-action="favorite"]')).toBeNull();
    });
  });
});
