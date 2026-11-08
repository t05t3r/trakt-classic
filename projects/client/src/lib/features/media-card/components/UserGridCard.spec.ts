import type { PosterCardSubtitles } from '$lib/components/media/PosterCardProps.ts';
import { toListItemCard } from '$lib/features/media-card/toListItemCard.ts';
import type { ListItem } from '$lib/requests/models/ListItem.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { settledButton } from '$test/beds/buttons/settledButton.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { itemOfType } from '$test/beds/dashboard/itemOfType.ts';
import { blankCardLines } from '$test/beds/media-card/blankCardLines.ts';
import { cardLines } from '$test/beds/media-card/cardLines.ts';
import { screen } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { createRawSnippet } from 'svelte';
import { describe, expect, it } from 'vitest';
import UserGridCard from './UserGridCard.svelte';
import type { UserGridCardProps } from './UserGridCardProps.ts';

const LINE = createRawSnippet(() => ({ render: () => '<span>Played</span>' }));

type CardParams =
  & Partial<
    Pick<
      UserGridCardProps,
      'fanart' | 'isFaded' | 'droppedAt' | 'rank' | 'favorite'
    >
  >
  & PosterCardSubtitles;

async function renderCard(entry: ListItem, props: CardParams = {}) {
  const { container, userLoaded } = renderComponent(UserGridCard, {
    props: { card: toListItemCard(entry), isFaded: false, ...props },
  });
  await userLoaded;

  return container;
}

describe('component: UserGridCard', () => {
  describe('lines', () => {
    it('should set the lines it is given under the title', async () => {
      const container = await renderCard(itemOfType('movie'), {
        lines: [LINE, undefined],
      });

      expect(cardLines(container)).toEqual(['Played']);
      expect(blankCardLines(container)).toHaveLength(1);
    });

    it('should set a line under the show line of an episode card', async () => {
      const entry = itemOfType('episode');
      const card = toListItemCard(entry);
      const container = await renderCard(entry, {
        showHref: card.showHref,
        lines: [LINE],
      });

      expect(cardLines(container)).toEqual(['House of the Dragon', 'Played']);
    });
  });

  describe('fanart', () => {
    it('should draw the fanart it is given in place of the poster', async () => {
      const container = await renderCard(itemOfType('episode'), {
        fanart: { src: '/img/screenshot.jpg', alt: 'The screenshot' },
      });

      expect(screen.getByRole('img', { name: 'The screenshot' }))
        .toHaveAttribute('src', '/img/screenshot.jpg');
      expect(container.querySelector('.trakt-lazy-image'))
        .toHaveAttribute('data-kind', 'fanart');
    });
  });

  describe('watch icon', () => {
    it('should keep the remove-all without a history id', async () => {
      await renderCard({
        ...itemOfType('movie'),
        entry: MovieHereticMappedMock,
      });

      const watch = await settledButton('Remove "Heretic" from your History');
      await userEvent.click(watch);

      expect(
        await screen.findByText(
          'Remove the play of "Heretic" from your history?',
        ),
      ).toBeVisible();
    });
  });

  describe('badges', () => {
    it("should ribbon an episode card with its episode's type", async () => {
      await renderCard(itemOfType('episode'));

      expect(screen.getByText('Series Premiere')).toBeInTheDocument();
    });

    it("should set the viewer's rating in the corner", async () => {
      await renderCard({
        ...itemOfType('movie'),
        entry: MovieHereticMappedMock,
      });

      expect(
        await screen.findByRole('img', { name: 'Your rating: 10' }),
      ).toBeInTheDocument();
    });

    it('should badge a dropped show card', async () => {
      const container = await renderCard(itemOfType('show'), {
        droppedAt: new Date(2026, 2, 4, 21, 5),
      });

      expect(container.querySelector('.trakt-poster-card'))
        .toHaveClass('is-dropped');
    });

    it('should badge the rank it is given', async () => {
      const container = await renderCard(itemOfType('movie'), { rank: 7 });

      expect(container.querySelector('.trakt-rank-badge'))
        .toHaveTextContent(/^7$/);
    });

    it('should add the favourite quick-icon when asked', async () => {
      await renderCard(
        { ...itemOfType('movie'), entry: MovieHereticMappedMock },
        { favorite: true },
      );

      expect(
        await screen.findByRole('button', {
          name: 'Remove "Heretic" from your Favorites',
        }),
      ).toHaveAttribute('data-action', 'favorite');
    });
  });

  describe('fade', () => {
    it.each([true, false])(
      'should mark the card faded: %s',
      async (isFaded) => {
        const container = await renderCard(itemOfType('movie'), { isFaded });

        expect(
          container.querySelector('.trakt-user-grid-card')?.classList
            .contains('is-faded'),
        ).toBe(isFaded);
      },
    );
  });
});
