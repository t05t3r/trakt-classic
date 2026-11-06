import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import type { RatingRow } from '$lib/features/ratings/stores/useRatingsItems.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { UserRatingsMappedMock } from '$mocks/data/users/mapped/UserRatingsMappedMock.ts';
import { settledButton } from '$test/beds/buttons/settledButton.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { blankCardLines } from '$test/beds/media-card/blankCardLines.ts';
import { cardLines } from '$test/beds/media-card/cardLines.ts';
import { screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { tick } from 'svelte';
import { describe, expect, it } from 'vitest';
import RatingGridCard from './RatingGridCard.svelte';

function entryOfType(type: RatingRow['entry']['type']) {
  return assertDefined(
    UserRatingsMappedMock.find((entry) => entry.type === type),
  );
}

function rowOf(entry: RatingRow['entry'], isFaded = false): RatingRow {
  return { entry, card: toListItemCard(entry), isFaded };
}

async function renderCard(row: RatingRow) {
  const { container, userLoaded } = renderComponent(RatingGridCard, {
    props: { row },
  });
  await userLoaded;
  emulateHydrated();
  await tick();

  return container;
}

describe('component: RatingGridCard', () => {
  describe('lines', () => {
    it.each(
      [
        {
          type: 'movie',
          title: 'Heretic',
          rated: '16 Jan 2025 17:39',
          line: '10 — Totally Ninja!',
        },
        {
          type: 'show',
          title: 'Silo',
          rated: '16 Jan 2025 17:39',
          line: '9 — Superb',
        },
        {
          type: 'season',
          title: 'Season 1',
          rated: '16 Jan 2025 17:41',
          line: '8 — Great',
        },
        {
          type: 'episode',
          title: '1x01 Freedom Day',
          rated: '16 Jan 2025 17:40',
          line: '7 — Good',
        },
      ] as const,
    )(
      'should set the rated time and the rating under the title of a $type card, with no show line',
      async ({ type, title, rated, line }) => {
        const container = await renderCard(rowOf(entryOfType(type)));

        expect(screen.getByRole('heading', { level: 3 }))
          .toHaveTextContent(title);
        expect(cardLines(container)).toEqual([rated, line]);
        expect(blankCardLines(container)).toHaveLength(0);
      },
    );

    it('should colour the rating line by the rating', async () => {
      const container = await renderCard(rowOf(entryOfType('season')));

      expect(container.querySelector('.trakt-rating-line'))
        .toHaveAttribute('data-rating', '8');
    });

    it('should not swap the rated time to a relative one', async () => {
      await renderCard(rowOf(entryOfType('movie')));

      expect(screen.getByText('16 Jan 2025 17:39')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '16 Jan 2025 17:39' }))
        .not.toBeInTheDocument();
    });

    it('should leave the date line blank until the page has hydrated, keeping the rating', async () => {
      const { container, userLoaded } = renderComponent(RatingGridCard, {
        props: { row: rowOf(entryOfType('movie')) },
      });
      await userLoaded;

      expect(cardLines(container)).toEqual(['10 — Totally Ninja!']);
      expect(blankCardLines(container)).toHaveLength(1);
    });
  });

  describe('poster', () => {
    it("should show a season's own poster", async () => {
      await renderCard(rowOf(entryOfType('season')));

      expect(screen.getByRole('img', { name: '"Silo" poster' }))
        .toHaveAttribute(
          'src',
          '/img/seasons/000/257/490/posters/thumb/091450c60d.jpg.webp',
        );
    });
  });

  describe('badges', () => {
    it("should ribbon an episode card with its episode's type", async () => {
      await renderCard(rowOf(entryOfType('episode')));

      expect(screen.getByText('Series Premiere')).toBeInTheDocument();
    });

    it.each(['movie', 'show', 'season'] as const)(
      'should draw no ribbon on a %s card',
      async (type) => {
        const container = await renderCard(rowOf(entryOfType(type)));

        expect(container.querySelector('.trakt-episode-type-ribbon'))
          .not.toBeInTheDocument();
      },
    );

    it("should badge a show card with its row's dropped date", async () => {
      const container = await renderCard({
        ...rowOf(entryOfType('show')),
        droppedAt: new Date(2026, 2, 4, 21, 5),
      });

      expect(container.querySelector('.trakt-poster-card'))
        .toHaveClass('is-dropped');
    });
  });

  describe('watch icon', () => {
    it('should read selected and ask with the count, with no single-play choice', async () => {
      await renderCard(rowOf(entryOfType('movie')));

      const watch = await settledButton('Remove "Heretic" from your History');
      expect(watch).toHaveClass('is-selected');
      await userEvent.click(watch);

      expect(
        await screen.findByText(
          'Remove the play of "Heretic" from your history?',
        ),
      ).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Only this play' }))
        .not.toBeInTheDocument();
    });
  });

  describe('fade', () => {
    it('should fade the card of a faded row', async () => {
      const container = await renderCard(rowOf(entryOfType('movie'), true));

      expect(container.querySelector('.trakt-user-grid-card'))
        .toHaveClass('is-faded');
    });
  });
});
