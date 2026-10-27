import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { MAX_DATE } from '$lib/utils/MAX_DATE.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import EpisodeFanartCard from './EpisodeFanartCard.svelte';
import type { EpisodeFanartCardProps } from './EpisodeFanartCardProps.ts';

// Silo's 1x01 is the episode the viewer rated, with a 10.
const RATED_EPISODE = assertDefined(ShowSiloSeasonEpisodesMappedMock.at(0));

// The list icon renders only once the device layout is known.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

async function renderCard(props: Partial<EpisodeFanartCardProps> = {}) {
  const { container, userLoaded } = renderComponent(EpisodeFanartCard, {
    props: {
      show: ShowSiloMappedMock,
      episode: ShowSiloLastEpisodeMappedMock,
      ...props,
    },
  });
  await userLoaded;
  return assertDefined(container.querySelector<HTMLElement>(
    '.trakt-fanart-card',
  ));
}

function captionTags(card: HTMLElement) {
  return [...(card.querySelector('.caption')?.children ?? [])]
    .map((tag) => tag.textContent?.trim());
}

describe('component: EpisodeFanartCard', () => {
  beforeEach(() => setLayout('desktop'));

  it('should title the card with the episode, linked to its page, and no show line', async () => {
    const card = await renderCard();

    const title = assertDefined(card.querySelector('h3'));
    expect(title).toHaveTextContent('1x10 Outside');
    expect(title.querySelector('a')).toHaveAttribute(
      'href',
      '/shows/silo/seasons/1/episodes/10',
    );
    expect(card.querySelector('h5')).toBeNull();
  });

  it("should set the episode's screenshot, named after its show and number", async () => {
    await renderCard();

    expect(screen.getByRole('img', { name: 'Silo 1x10 screenshot' }))
      .toBeInTheDocument();
  });

  it("should caption the card with the episode's type alone by default", async () => {
    const card = await renderCard();

    expect(captionTags(card)).toEqual(['Season Finale']);
  });

  it('should caption the card with the air time after the type when asked', async () => {
    const card = await renderCard({ withAirDate: true });

    expect(captionTags(card)).toEqual(['Season Finale', '30 Jun 2023 01:00']);
  });

  // The mapper reads a missing first_aired as MAX_DATE.
  it('should leave out the air time of an episode with no air date', async () => {
    const card = await renderCard({
      withAirDate: true,
      episode: { ...ShowSiloLastEpisodeMappedMock, airDate: MAX_DATE },
    });

    expect(captionTags(card)).toEqual(['Season Finale']);
  });

  it('should leave out the air time of an episode with an invalid air date', async () => {
    const card = await renderCard({
      withAirDate: true,
      episode: { ...ShowSiloLastEpisodeMappedMock, airDate: new Date(NaN) },
    });

    expect(captionTags(card)).toEqual(['Season Finale']);
  });

  it('should give the card the watch and list icons with the community rating', async () => {
    const card = await renderCard();

    const icons = await waitFor(() => {
      const found = [...card.querySelectorAll('.trakt-quick-icon')];
      expect(found).toHaveLength(2);
      return found;
    });
    expect(icons.map((icon) => icon.getAttribute('aria-label'))).toEqual([
      'Mark "Outside" as watched',
      'Add or remove "Outside" from lists',
    ]);
    expect(card.querySelector('.trakt-community-rating'))
      .toHaveTextContent('83%');
  });

  it("should show the viewer's rating in the corner of a rated episode", async () => {
    await renderCard({ episode: RATED_EPISODE });

    expect(await screen.findByRole('img', { name: 'Your rating: 10' }))
      .toBeInTheDocument();
  });

  it('should show no rating corner on an episode the viewer has not rated', async () => {
    await renderCard();

    await waitNegativeClaim();
    expect(screen.queryByRole('img', { name: /^Your rating/ })).toBeNull();
  });

  it("should show the new episode's own rating once the episode changes", async () => {
    const props = { show: ShowSiloMappedMock, episode: RATED_EPISODE };
    const { rerender } = renderComponent(EpisodeFanartCard, { props });
    await screen.findByRole('img', { name: 'Your rating: 10' });

    await rerender({ ...props, episode: ShowSiloLastEpisodeMappedMock });

    await waitFor(() =>
      expect(screen.queryByRole('img', { name: /^Your rating/ })).toBeNull()
    );
  });

  it.each(['always', 'phone'] as const)(
    'should pass the titles option %s to the card',
    async (titles) => {
      const card = await renderCard({ titles });

      expect(card).toHaveAttribute('data-titles', titles);
    },
  );
});
