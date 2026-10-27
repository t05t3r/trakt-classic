import type { SectionStatus } from '$lib/components/feedback/SectionStatus.ts';
import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { NOOP_FN } from '$lib/utils/NOOP_FN.ts';
import { ShowSiloLastEpisodeMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloLastEpisodeMappedMock.ts';
import { ShowSiloMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloMappedMock.ts';
import { ShowSiloProgressMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloProgressMappedMock.ts';
import { ShowSiloSeasonEpisodesMappedMock } from '$mocks/data/summary/shows/silo/mapped/ShowSiloSeasonEpisodesMappedMock.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import type { RecentEpisodes } from '../_internal/recentEpisodes.ts';
import RecentEpisodesBlock from './RecentEpisodesBlock.svelte';

// The list icon renders only once the device layout is known.
const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const UP_NEXT = assertDefined(ShowSiloProgressMappedMock.nextEpisode);
const BEFORE_LAST = assertDefined(ShowSiloSeasonEpisodesMappedMock.at(-2));

const READY: SectionStatus<RecentEpisodes> = {
  kind: 'ready',
  data: {
    upNext: UP_NEXT,
    recentlyAired: [ShowSiloLastEpisodeMappedMock, BEFORE_LAST],
  },
};

const COMPLETE: SectionStatus<RecentEpisodes> = {
  kind: 'ready',
  data: {
    upNext: null,
    recentlyAired: [ShowSiloLastEpisodeMappedMock, BEFORE_LAST],
  },
};

const UP_NEXT_ONLY: SectionStatus<RecentEpisodes> = {
  kind: 'ready',
  data: { upNext: ShowSiloLastEpisodeMappedMock, recentlyAired: [] },
};

const LOADING: SectionStatus<RecentEpisodes> = { kind: 'loading' };

const ERROR: SectionStatus<RecentEpisodes> = { kind: 'error', retry: NOOP_FN };

async function renderBlock(status: SectionStatus<RecentEpisodes>) {
  const { container, userLoaded } = renderComponent(RecentEpisodesBlock, {
    props: { show: ShowSiloMappedMock, status },
  });
  await userLoaded;
  await screen.findAllByRole('heading', { level: 2 });
  return container;
}

// The main title follows the Up Next lead when there is one.
function mainTitle() {
  return assertDefined(screen.getAllByRole('heading', { level: 2 }).at(-1));
}

describe('component: RecentEpisodesBlock', () => {
  describe('header', () => {
    it('should lead with an Up Next title over the first card and title the rest Recently Aired', async () => {
      const container = await renderBlock(READY);

      const lead = container.querySelector('.up-next-lead');
      expect(lead?.querySelector('h2')).toHaveTextContent(/^Up Next$/);
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(2);
      const main = mainTitle();
      expect(main.querySelector('.wide-title')).toHaveTextContent(
        /^Recently Aired$/,
      );
      expect(main.querySelector('.narrow-title')).toHaveTextContent(
        /^Up Next$/,
      );
    });

    it('should title the whole row Recently Aired at every width without an Up Next card', async () => {
      const container = await renderBlock(COMPLETE);

      expect(container.querySelector('.up-next-lead')).toBeNull();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
      const main = mainTitle();
      expect(main).toHaveTextContent(/^Recently Aired$/);
      expect(main.querySelector('.narrow-title')).toBeNull();
    });

    it('should title the whole row Up Next at every width when Up Next is the only card', async () => {
      const container = await renderBlock(UP_NEXT_ONLY);

      expect(container.querySelector('.up-next-lead')).toBeNull();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
      const main = mainTitle();
      expect(main).toHaveTextContent(/^Up Next$/);
      expect(main.querySelector('.wide-title')).toBeNull();
    });

    it('should keep the Up Next form, spinning after the main title, while loading', async () => {
      const container = await renderBlock(LOADING);

      expect(container.querySelector('.up-next-lead h2')).toHaveTextContent(
        /^Up Next$/,
      );
      expect(mainTitle().querySelector('.trakt-pending-spinner'))
        .not.toBeNull();
      expect(container.querySelector('.trakt-fanart-card')).toBeNull();
    });

    it('should keep the Up Next form when the cards fail to load', async () => {
      const container = await renderBlock(ERROR);

      expect(container.querySelector('.up-next-lead h2')).toHaveTextContent(
        /^Up Next$/,
      );
      const main = mainTitle();
      expect(main.querySelector('.wide-title')).toHaveTextContent(
        /^Recently Aired$/,
      );
      expect(main.querySelector('.narrow-title')).toHaveTextContent(
        /^Up Next$/,
      );
    });
  });

  describe('region', () => {
    it.each([
      { form: 'with an Up Next card beside the aired ones', status: READY },
      { form: 'without an Up Next card', status: COMPLETE },
      { form: 'when Up Next is the only card', status: UP_NEXT_ONLY },
      { form: 'while loading', status: LOADING },
      { form: 'when the cards fail to load', status: ERROR },
    ])('should be named Recent Episodes $form', async ({ status }) => {
      await renderBlock(status);

      expect(screen.getByRole('region', { name: 'Recent Episodes' }))
        .toBeInTheDocument();
    });
  });

  describe('cards', () => {
    beforeEach(() => setLayout('desktop'));

    async function readyCards() {
      const container = await renderBlock(READY);
      return await waitFor(() => {
        const cards = [
          ...container.querySelectorAll<HTMLElement>('.trakt-fanart-card'),
        ];
        expect(cards).toHaveLength(3);
        return cards;
      });
    }

    it('should set the Up Next card first, then the last aired episodes, each linked to its episode', async () => {
      const cards = await readyCards();

      expect(
        cards.map((card) => card.querySelector('h3')?.textContent?.trim()),
      ).toEqual(['2x02 Order', '1x10 Outside', '1x09 The Getaway']);
      expect(
        cards.map((card) => card.querySelector('h3 a')?.getAttribute('href')),
      )
        .toEqual([
          '/shows/silo/seasons/2/episodes/2',
          '/shows/silo/seasons/1/episodes/10',
          '/shows/silo/seasons/1/episodes/9',
        ]);
    });

    it("should leave out each card's show line", async () => {
      const cards = await readyCards();

      cards.forEach((card) => expect(card.querySelector('h5')).toBeNull());
    });

    it('should mark the third card for hiding at tablet width', async () => {
      const cards = await readyCards();

      expect(
        cards.map((card) =>
          card.closest('li')?.classList.contains('is-past-tablet-limit')
        ),
      ).toEqual([false, false, true]);
    });

    // Classic stacks the cards flush below 768px; the CSS is keyed on this mark.
    it('should stack the cards flush on phones', async () => {
      const [first] = await readyCards();

      expect(first?.closest('.trakt-poster-grid'))
        .toHaveAttribute('data-phone-gaps', 'none');
    });

    it("should caption a card with its episode's type before its air time", async () => {
      const [, last] = await readyCards();

      const caption = last?.querySelector('.caption');
      expect(
        [...(caption?.children ?? [])].map((tag) => tag.textContent?.trim()),
      ).toEqual(['Season Finale', '30 Jun 2023 01:00']);
    });
  });

  // The block reads no store when empty, so it renders at once, outside the test bed.
  it('should render nothing when no episode has aired', () => {
    const { container } = render(RecentEpisodesBlock, {
      props: { show: ShowSiloMappedMock, status: { kind: 'empty' } },
    });

    expect(container.querySelector('*')).toBeNull();
  });
});
