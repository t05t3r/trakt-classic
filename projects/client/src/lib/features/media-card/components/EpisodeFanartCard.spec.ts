import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { SILO_FIRST_EPISODE } from '$mocks/data/summary/shows/silo/SILO_FIRST_EPISODE.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { emulateHydrated } from '$test/beds/hydration/emulateHydrated.ts';
import { captionTags } from '$test/beds/media-card/captionTags.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import EpisodeFanartCard from './EpisodeFanartCard.svelte';
import type { EpisodeFanartCardProps } from './EpisodeFanartCardProps.ts';

// Silo's 1x01 is the episode the viewer rated, with a 10.
const RATED_EPISODE = SILO_FIRST_EPISODE;

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

describe('component: EpisodeFanartCard', () => {
  beforeEach(() => setLayout('desktop'));

  it("should rate the card's own episode from its percentage", async () => {
    stubClientRects();
    const card = await renderCard({ episode: RATED_EPISODE });
    const button = await within(card).findByRole('button', {
      name: /^\d+%/,
    });

    await userEvent.hover(button);
    await waitFor(() =>
      expect(button).toHaveAccessibleDescription('Change your rating')
    );
    await userEvent.click(button);

    expect(await screen.findByRole('dialog', { name: 'Rate this episode' }))
      .toHaveAttribute('data-side', 'bottom');
  });

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

  it('should caption the card with the air time after the type when asked, once the page has hydrated', async () => {
    const card = await renderCard({ withAirDate: true });
    expect(captionTags(card)).toEqual(['Season Finale']);

    emulateHydrated();

    await waitFor(() =>
      expect(captionTags(card)).toEqual(['Season Finale', '30 Jun 2023 01:00'])
    );
  });

  it("should show the episode's show line on phones only when asked", async () => {
    const card = await renderCard({ showLine: 'phone' });

    expect(card.querySelector('h5')).toHaveTextContent('Silo');
    expect(card).toHaveAttribute('data-show-line', 'phone');
  });
});
