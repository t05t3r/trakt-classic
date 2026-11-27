import { toEpisodeScreenshot } from '$lib/features/media-card/toEpisodeScreenshot.ts';
import { toMediaCard } from '$lib/features/media-card/toMediaCard.ts';
import { toMediaFanart } from '$lib/features/media-card/toMediaFanart.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MovieHereticMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticMappedMock.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { SILO_FIRST_EPISODE } from '$mocks/data/summary/shows/silo/SILO_FIRST_EPISODE.ts';
import { HISTORY_ID } from '$mocks/data/users/HISTORY_ID.ts';
import { settledButton } from '$test/beds/buttons/settledButton.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import MediaFanartCard from './MediaFanartCard.svelte';
import type { MediaFanartCardProps } from './MediaFanartCardProps.ts';

const HERETIC: MediaFanartCardProps = {
  card: toMediaCard({ type: 'movie', movie: MovieHereticMappedMock }),
  fanart: toMediaFanart(MovieHereticMappedMock),
};

const SILO_EPISODE: MediaFanartCardProps = {
  card: toMediaCard({
    type: 'episode',
    show: ShowSiloMappedMock,
    episode: SILO_FIRST_EPISODE,
  }),
  fanart: toEpisodeScreenshot({
    show: ShowSiloMappedMock,
    episode: SILO_FIRST_EPISODE,
  }),
};

const SILO_SHOW: MediaFanartCardProps = {
  card: toMediaCard({ type: 'show', show: ShowSiloMappedMock }),
  fanart: toMediaFanart(ShowSiloMappedMock),
};

const caption = createRawSnippet(() => ({
  render: () => '<span class="tag">Ended</span>',
}));

// The list icon renders only once the device layout is known.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

async function renderCard(props: MediaFanartCardProps) {
  const { container, userLoaded, rerender } = renderComponent(
    MediaFanartCard,
    { props },
  );
  await userLoaded;
  const cardNow = () =>
    assertDefined(container.querySelector<HTMLElement>('.trakt-fanart-card'));

  return { card: cardNow(), cardNow, rerender };
}

function iconCount(card: HTMLElement) {
  return card.querySelectorAll('.trakt-quick-icon').length;
}

describe('component: MediaFanartCard', () => {
  beforeEach(() => setLayout('desktop'));

  describe.each([
    {
      kind: 'movie',
      props: HERETIC,
      title: 'Heretic 2024',
      href: '/movies/heretic-2024',
      artName: 'Heretic',
      rating: 'Your rating: 10',
      watch: 'Remove "Heretic" from your History',
    },
    {
      kind: 'episode',
      props: SILO_EPISODE,
      title: '1x01 Freedom Day',
      href: '/shows/silo/seasons/1/episodes/1',
      artName: '1x01 Freedom Day',
      rating: 'Your rating: 10',
      watch: 'Mark "Freedom Day" as watched',
    },
    {
      kind: 'show',
      props: SILO_SHOW,
      title: 'Silo 2023',
      href: '/shows/silo',
      artName: 'Silo',
      rating: 'Your rating: 9',
      watch: 'Remove "Silo" from your History',
    },
  ])('for a $kind', ({ kind, props, title, href, artName, rating, watch }) => {
    it('should title the card, linked to its page, over its fanart', async () => {
      const { card } = await renderCard(props);

      expect(card).toHaveAttribute('data-type', kind);
      const heading = within(card).getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent(title);
      expect(heading.querySelector('a')).toHaveAttribute('href', href);
      const artLink = card.querySelector('a.fanart-link');
      expect(artLink).toHaveAccessibleName(artName);
      expect(artLink).toHaveAttribute('href', href);
    });

    it("should show the viewer's rating in the corner", async () => {
      const { card } = await renderCard(props);

      expect(await within(card).findByRole('img', { name: rating }))
        .toBeInTheDocument();
    });

    it('should give the card the full-size watch and list icons with the community rating', async () => {
      const { card } = await renderCard(props);

      await settledButton(watch, card);
      expect(iconCount(card)).toBe(2);
      expect(card.querySelector('.trakt-quick-actions'))
        .toHaveAttribute('data-size', 'full');
      expect(card.querySelector('.trakt-community-rating'))
        .toHaveAttribute('data-variant', 'default');
    });
  });

  it("should link an episode's show line to the show by default", async () => {
    const { card } = await renderCard(SILO_EPISODE);

    expect(within(card).getByRole('heading', { level: 5 }).querySelector('a'))
      .toHaveAttribute('href', '/shows/silo');
    expect(card).toHaveAttribute('data-show-line', 'always');
  });

  it('should pass the show line and titles options to the card', async () => {
    const { card } = await renderCard({
      ...SILO_EPISODE,
      showLine: 'phone',
      titles: 'phone',
    });

    expect(card).toHaveAttribute('data-show-line', 'phone');
    expect(card).toHaveAttribute('data-titles', 'phone');
  });

  it('should set the caption above the titles', async () => {
    const { card } = await renderCard({ ...SILO_SHOW, caption });

    expect(card.querySelector('.titles .caption')).toHaveTextContent('Ended');
  });

  it("should add the favourite icon, for an episode its show's, when asked", async () => {
    const { card } = await renderCard({ ...SILO_EPISODE, favorite: true });

    await settledButton('Remove "Silo" from your Favorites', card);
    expect(iconCount(card)).toBe(3);
  });

  it("should hand a Play's history id to the strip, whose watch removes that Play", async () => {
    const { card } = await renderCard({ ...HERETIC, historyId: HISTORY_ID });

    expect(await settledButton('Remove "Heretic" from your History', card))
      .toBeVisible();
  });

  // The viewer rated Silo and watched some of it, but neither rated nor watched its 1x10.
  it('should give a new Target its own rating and strip, keyed on the Target', async () => {
    const { card, cardNow, rerender } = await renderCard(SILO_SHOW);
    await within(card).findByRole('img', { name: 'Your rating: 9' });
    await settledButton('Remove "Silo" from your History', card);

    await rerender({
      card: toMediaCard({
        type: 'episode',
        show: ShowSiloMappedMock,
        episode: ShowSiloLastEpisodeMappedMock,
      }),
      fanart: toEpisodeScreenshot({
        show: ShowSiloMappedMock,
        episode: ShowSiloLastEpisodeMappedMock,
      }),
    });

    expect(await settledButton('Mark "Outside" as watched', cardNow()))
      .toBeVisible();
    await waitFor(() =>
      expect(screen.queryByRole('img', { name: /^Your rating/ })).toBeNull()
    );
  });
});
