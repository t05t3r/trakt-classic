import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { SILO_FIRST_EPISODE } from '$mocks/data/summary/shows/silo/SILO_FIRST_EPISODE.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { captionTags } from '$test/beds/media-card/captionTags.ts';
import { waitFor, within } from '@testing-library/svelte';
import type { ComponentProps } from 'svelte';
import { describe, expect, it } from 'vitest';
import ProgressRowCard from './ProgressRowCard.svelte';

type ProgressRowCardProps = ComponentProps<typeof ProgressRowCard>;

async function renderCard(props: Partial<ProgressRowCardProps> = {}) {
  const { container, userLoaded, rerender } = renderComponent(
    ProgressRowCard,
    {
      props: {
        show: ShowSiloMappedMock,
        nextEpisode: ShowSiloLastEpisodeMappedMock,
        isComplete: false,
        ...props,
      },
    },
  );
  await userLoaded;
  const cardNow = () =>
    assertDefined(container.querySelector<HTMLElement>('.trakt-fanart-card'));

  return { card: cardNow(), cardNow, rerender };
}

describe('component: ProgressRowCard', () => {
  // The root zeroes the caption tags' bottom margin, so they sit on the title.
  it('should seat the card in its own root', async () => {
    const { card } = await renderCard();

    expect(card.parentElement).toHaveClass('trakt-progress-row-card');
  });

  describe('with a next episode', () => {
    it("should draw the episode's card, with its show's name on phones only", async () => {
      const { card } = await renderCard();

      expect(card).toHaveAttribute('data-type', 'episode');
      expect(within(card).getByRole('heading', { level: 3 }))
        .toHaveTextContent('1x10 Outside');
      expect(within(card).getByRole('heading', { level: 5 }))
        .toHaveTextContent('Silo');
      expect(card).toHaveAttribute('data-show-line', 'phone');
    });

    it('should tag the episode with its type alone, then its air time once the page has hydrated, its art left bare', async () => {
      const { card } = await renderCard();

      expect(card.querySelector('.trakt-art-ribbon')).toBeNull();
      expect(captionTags(card)).toEqual(['Season Finale']);

      emulateHydrated();

      await waitFor(() =>
        expect(captionTags(card)).toEqual([
          'Season Finale',
          '30 Jun 2023 01:00',
        ])
      );
    });

    it.each(
      [
        { type: 'series_premiere', tag: 'Series Premiere' },
        { type: 'season_premiere', tag: 'Season Premiere' },
      ] as const,
    )('should tag a $type as "$tag"', async ({ type, tag }) => {
      const { card } = await renderCard({
        nextEpisode: { ...SILO_FIRST_EPISODE, type },
      });

      expect(captionTags(card)).toEqual([tag]);
    });

    it("should show the new episode's card once the next episode changes", async () => {
      const { rerender, cardNow } = await renderCard({
        nextEpisode: SILO_FIRST_EPISODE,
      });

      await rerender({
        show: ShowSiloMappedMock,
        nextEpisode: ShowSiloLastEpisodeMappedMock,
        isComplete: false,
      });

      expect(within(cardNow()).getByRole('heading', { level: 3 }))
        .toHaveTextContent('1x10 Outside');
      expect(
        within(cardNow()).getByRole('img', { name: 'Silo 1x10 screenshot' }),
      )
        .toBeInTheDocument();
    });
  });

  describe('for a caught-up show', () => {
    it("should draw the show's card, even with a next episode not yet aired", async () => {
      const { card } = await renderCard({ isComplete: true });

      expect(card).toHaveAttribute('data-type', 'show');
      const title = within(card).getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent(/^Silo 2023$/);
      expect(captionTags(card)).toEqual(['Returning']);
    });

    it('should show Caught Up in place of the watch and list icons, the rating kept', async () => {
      const { card } = await renderCard({ isComplete: true });

      const strip = assertDefined(
        card.querySelector<HTMLElement>('.trakt-quick-actions'),
      );
      expect(strip).toHaveTextContent(/^Caught Up \d+%$/);
      expect(
        within(strip).getAllByRole('button').map((button) =>
          button.getAttribute('aria-label')
        ),
      ).toEqual([expect.stringMatching(/^\d+%$/)]);
    });
  });

  describe('with no next episode', () => {
    it("should draw the show's card over its fanart, titled with its year and no show line", async () => {
      const { card } = await renderCard({ nextEpisode: null });

      expect(card).toHaveAttribute('data-type', 'show');
      const title = within(card).getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Silo 2023');
      expect(title.querySelector('a')).toHaveAttribute('href', '/shows/silo');
      expect(within(card).getByRole('img', { name: '"Silo" fanart' }))
        .toBeInTheDocument();
      expect(within(card).queryByRole('heading', { level: 5 })).toBeNull();
    });

    it.each(
      [
        { status: 'ended', tag: 'Ended' },
        { status: 'canceled', tag: 'Canceled' },
        { status: 'returning series', tag: 'Returning' },
        { status: 'in production', tag: 'Returning' },
        { status: 'unknown', tag: 'Returning' },
      ] as const,
    )(
      'should tag a show whose status is $status as "$tag"',
      async ({ status, tag }) => {
        const { card } = await renderCard({
          show: { ...ShowSiloMappedMock, status },
          nextEpisode: null,
        });

        expect(captionTags(card)).toEqual([tag]);
      },
    );
  });
});
