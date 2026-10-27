import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { HERETIC } from '$mocks/data/media-actions/HERETIC.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { EpisodeSiloStatsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloStatsMappedMock.ts';
import { MovieHereticRatingsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticRatingsMappedMock.ts';
import { MovieHereticStatsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticStatsMappedMock.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { SeasonSiloStatsMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloStatsMappedMock.ts';
import { SYNC_RATINGS_URL } from '$mocks/data/sync/SYNC_RATINGS_URL.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { emulateFocusVisible } from '$test/beds/focus/emulateFocusVisible.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import SummaryRatings from './SummaryRatings.svelte';
import type { SummaryRatingsProps } from './SummaryRatingsProps.ts';

const RELEASED = new Date('2024-10-31');
const UNRELEASED = new Date('2999-05-01');

const MOVIE: SummaryRatingsProps = {
  type: 'movie',
  id: MATRIX.id,
  rating: MovieHereticRatingsMappedMock,
  stats: MovieHereticStatsMappedMock,
  earliestReleaseDate: RELEASED,
};

const SEASON: Partial<SummaryRatingsProps> = {
  type: 'season',
  id: SeasonSiloMappedMock.id,
  rating: {
    trakt: {
      rating: assertDefined(SeasonSiloMappedMock.rating),
      votes: assertDefined(SeasonSiloMappedMock.votes),
    },
  },
  stats: SeasonSiloStatsMappedMock,
};

function renderRatings(props: Partial<SummaryRatingsProps> = {}) {
  return renderComponent(SummaryRatings, { props: { ...MOVIE, ...props } });
}

// The heart's gate reads the user's settings, so a claim about it waits for them to land.
async function renderSettled(props: Partial<SummaryRatingsProps>) {
  const rendered = renderRatings(props);

  await rendered.userLoaded;
  await waitNegativeClaim();

  return rendered;
}

const PROMPT = 'Rate this movie What did you think?';

function slot(name: string) {
  return screen.findByRole('button', { name });
}

function heartSlot(container: HTMLElement) {
  return container.querySelector('.ratings-community');
}

function kindsOf(container: HTMLElement, selector: string) {
  return Array.from(
    container.querySelectorAll(`${selector} > li`),
    (item) =>
      item.querySelector('.trakt-external-rating') ? 'rating' : 'counter',
  );
}

function itemsOf(container: HTMLElement, selector: string) {
  return Array.from(container.querySelectorAll(selector))
    .map((item) => item.textContent?.replace(/\s+/g, ' ').trim());
}

describe('component: SummaryRatings', () => {
  describe('the community heart', () => {
    it('should stay out while the earliest release is unknown', async () => {
      const { container } = await renderSettled({
        earliestReleaseDate: undefined,
      });

      expect(screen.queryByText('72%')).not.toBeInTheDocument();
      expect(heartSlot(container)?.matches(':not(:has(*))')).toBe(true);
    });

    it('should show the rating and its votes once the title is out', async () => {
      const { container } = renderRatings();

      expect(await screen.findByText('72%')).toBeVisible();
      expect(screen.getByText('3.8K votes')).toBeVisible();
      expect(heartSlot(container)?.matches(':not(:has(*))')).toBe(false);
    });

    it("should show a season's rating and its votes from the rating alone", async () => {
      renderRatings(SEASON);

      expect(await screen.findByText('81%')).toBeVisible();
      expect(screen.getByText('2.4K votes')).toBeVisible();
    });

    it('should stay out before the release for a user who does not display early ratings', async () => {
      const { container } = await renderSettled({
        earliestReleaseDate: UNRELEASED,
      });

      expect(screen.queryByText('72%')).not.toBeInTheDocument();
      expect(heartSlot(container)?.matches(':not(:has(*))')).toBe(true);
    });

    it('should show before the release to a user who displays early ratings', async () => {
      server.use(
        http.get(
          USER_SETTINGS_URL,
          () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
        ),
      );
      renderRatings({ earliestReleaseDate: UNRELEASED });

      expect(await screen.findByText('72%')).toBeVisible();
    });
  });

  describe('the user rating', () => {
    it("should name the slot's button after the movie's prompt while unrated", async () => {
      renderRatings();

      expect(await slot(PROMPT)).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it("should name the slot's button after the show's prompt on a show", async () => {
      renderRatings({ type: 'show' });

      expect(await slot('Rate this show What did you think?')).toBeVisible();
    });

    it("should name the slot's button after the episode's prompt on an episode", async () => {
      renderRatings({ type: 'episode', stats: EpisodeSiloStatsMappedMock });

      expect(await slot('Rate this episode What did you think?'))
        .toBeVisible();
    });

    it("should name the slot's button after the season's prompt on a season", async () => {
      renderRatings(SEASON);

      expect(await slot('Rate this season What did you think?'))
        .toBeVisible();
    });

    it('should show the stored rating in its colour, its label in white', async () => {
      const { container } = renderRatings({ id: HERETIC.id });

      expect(await slot('10 Totally Ninja!')).toHaveClass('is-rated');
      expect(container.querySelector('.ratings-user-heart'))
        .toHaveAttribute('data-rating', '10');
    });

    it("should describe the stored rating as the user's, named by its visible text alone", async () => {
      renderRatings({ id: HERETIC.id });

      expect(await slot('10 Totally Ninja!'))
        .toHaveAccessibleDescription('Your rating');
    });

    it('should leave a preview undescribed while unrated', async () => {
      stubClientRects();
      emulateFocusVisible();
      renderRatings();
      (await slot(PROMPT)).focus();

      await userEvent.keyboard('{Enter}');

      expect(await slot('1 Weak Sauce :(')).toHaveAccessibleDescription('');
    });

    it('should leave a preview of another heart undescribed while rated', async () => {
      stubClientRects();
      emulateFocusVisible();
      renderRatings({ id: HERETIC.id });
      (await slot('10 Totally Ninja!')).focus();

      await userEvent.keyboard('{Enter}');
      await slot('Unrate Totally Ninja!');
      await userEvent.keyboard('{ArrowLeft}');

      expect(await slot('9 Superb')).toHaveAccessibleDescription('');
    });

    it('should leave the prompt undescribed while unrated', async () => {
      renderRatings();

      expect(await slot(PROMPT)).toHaveAccessibleDescription('');
    });

    it('should leave the Unrate preview undescribed', async () => {
      stubClientRects();
      emulateFocusVisible();
      renderRatings({ id: HERETIC.id });
      (await slot('10 Totally Ninja!')).focus();

      await userEvent.keyboard('{Enter}');

      expect(await slot('Unrate Totally Ninja!'))
        .toHaveAccessibleDescription('');
    });

    it.each(
      [
        ['movie', 'Rate this movie What did you think?', 'Rate this movie'],
        ['show', 'Rate this show What did you think?', 'Rate this show'],
        ['season', 'Rate this season What did you think?', 'Rate this season'],
      ] as const,
    )(
      "should name the picker after a %s's prompt",
      async (type, prompt, name) => {
        stubClientRects();
        renderRatings({ type });

        await userEvent.click(await slot(prompt));

        expect(await screen.findByRole('dialog')).toHaveAccessibleName(name);
      },
    );

    it('should mark the slot open while the picker is open', async () => {
      stubClientRects();
      renderRatings();

      await userEvent.click(await slot(PROMPT));

      expect(await screen.findByRole('dialog')).toBeVisible();
      expect(screen.getByRole('button', { name: PROMPT }))
        .toHaveAttribute('data-state', 'open');
    });

    it('should show Unrate as a question and the label in grey while keyboard focus is on the current heart', async () => {
      stubClientRects();
      emulateFocusVisible();
      const { container } = renderRatings({ id: HERETIC.id });
      (await slot('10 Totally Ninja!')).focus();

      await userEvent.keyboard('{Enter}');

      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: '10 hearts, Totally Ninja!' }),
        )
          .toHaveFocus()
      );
      expect(await slot('Unrate Totally Ninja!')).not.toHaveClass('is-rated');
      expect(screen.getByText('Unrate')).toHaveClass('ratings-user-question');
      expect(container.querySelector('.ratings-user-heart'))
        .not.toHaveAttribute('data-rating');
    });

    it('should show the picked rating once the picker closes', async () => {
      stubClientRects();
      const write = holdResponse(() => new HttpResponse(null, { status: 201 }));
      server.use(http.post(SYNC_RATINGS_URL, write.answer));
      renderRatings();
      await userEvent.click(await slot(PROMPT));

      await userEvent.click(
        await screen.findByRole('button', { name: '8 hearts, Great' }),
      );

      await write.requested;
      expect(await slot('8 Great')).toHaveFocus();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it("should show the new title's own rating once the id changes", async () => {
      const { rerender } = renderRatings({ id: HERETIC.id });
      await slot('10 Totally Ninja!');

      await rerender({ ...MOVIE, id: MATRIX.id });

      expect(await slot(PROMPT)).toBeVisible();
      expect(screen.queryByRole('button', { name: '10 Totally Ninja!' }))
        .toBeNull();
    });
  });

  describe('the captions', () => {
    it("should size the prompt's caption as a tag", async () => {
      renderRatings();

      expect(await screen.findByText('What did you think?'))
        .toHaveClass('tag');
    });

    it("should size every counter's caption as a tag", async () => {
      const { container } = renderRatings();
      await screen.findByText('Rate this movie');

      const captions = Array.from(
        container.querySelectorAll('.ratings-counter .ratings-caption'),
      );

      expect(captions).toHaveLength(6);
      captions.forEach((caption) => expect(caption).toHaveClass('tag'));
    });
  });

  describe('the lists', () => {
    it('should keep only the heart and the user rating in the first list', async () => {
      const { container } = renderRatings();
      await screen.findByText('72%');

      const first = container.querySelector(
        '.ratings-list:not(.ratings-stats)',
      );

      expect(first?.children).toHaveLength(2);
      expect(first?.querySelector(':scope > .ratings-community'))
        .toHaveTextContent('72%');
      expect(first?.lastElementChild)
        .toHaveTextContent('Rate this movie What did you think?');
    });

    // Safari drops the list role of a list with no markers unless it is explicit.
    it('should keep an explicit list role on both lists', async () => {
      renderRatings();
      await screen.findByText('Rate this movie');

      expect(
        screen.getAllByRole('list').map((list) => list.getAttribute('role')),
      ).toEqual(['list', 'list']);
    });

    it('should open the stats list with the external ratings, then the counters', async () => {
      const { container } = renderRatings();
      await screen.findByText('Rate this movie');

      expect(kindsOf(container, '.ratings-stats')).toEqual([
        ...Array(3).fill('rating'),
        ...Array(6).fill('counter'),
      ]);
    });

    it('should render the external ratings while the stats are unknown', async () => {
      const { container } = renderRatings({ stats: undefined });
      await screen.findByText('Rate this movie');

      expect(kindsOf(container, '.ratings-stats')).toEqual(
        Array(3).fill('rating'),
      );
    });

    it('should render the counters while the ratings are unknown', async () => {
      const { container } = renderRatings({ rating: undefined });
      await screen.findByText('Rate this movie');

      expect(kindsOf(container, '.ratings-stats')).toEqual(
        Array(6).fill('counter'),
      );
    });

    it('should render no stats list while the ratings and the stats are unknown', async () => {
      const { container } = renderRatings({
        rating: undefined,
        stats: undefined,
      });
      await screen.findByText('Rate this movie');

      expect(container.querySelector('.ratings-stats')).toBeNull();
    });
  });

  describe('the external ratings', () => {
    it('should render one rating per source, in the bar order', async () => {
      const { container } = renderRatings();
      await screen.findByText('Rate this movie');

      const sources = Array.from(
        container.querySelectorAll('.trakt-external-rating img'),
        (logo) => logo.getAttribute('alt'),
      );

      expect(sources).toEqual(['IMDb', 'TMDB', 'Metacritic']);
    });

    it('should render none while the ratings are unknown', async () => {
      const { container } = renderRatings({ rating: undefined });
      await screen.findByText('Rate this movie');

      expect(container.querySelector('.trakt-external-rating')).toBeNull();
    });
  });

  describe('the community counters', () => {
    it("should count a movie's watchers, plays, libraries, comments, lists and favorites", async () => {
      const { container } = renderRatings();
      await screen.findByText('Rate this movie');

      expect(itemsOf(container, '.ratings-counter')).toEqual([
        '23.2K watchers',
        '30.9K plays',
        '12K libraries',
        '68 comments',
        '14.7K lists',
        '97 favorited',
      ]);
    });

    it('should leave favorites out of stats that do not count them', async () => {
      const { container } = renderRatings({
        stats: EpisodeSiloStatsMappedMock,
      });
      await screen.findByText('Rate this movie');

      expect(itemsOf(container, '.ratings-counter')).toEqual([
        '127.4K watchers',
        '1.5M plays',
        '16.8K libraries',
        '102 comments',
        '41.7K lists',
      ]);
    });

    it('should render no counters while the stats are unknown', async () => {
      const { container } = renderRatings({ stats: undefined });
      await screen.findByText('Rate this movie');

      expect(container.querySelector('.ratings-counter')).toBeNull();
    });
  });
});
