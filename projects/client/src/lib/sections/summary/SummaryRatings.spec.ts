import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { DEVS_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_ACTIONS_TARGET.ts';
import { DEVS_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_SEASON_ACTIONS_TARGET.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { MATRIX_ACTIONS_TARGET } from '$mocks/data/media-actions/MATRIX_ACTIONS_TARGET.ts';
import { SILO_EPISODE_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_EPISODE_ACTIONS_TARGET.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { EpisodeSiloStatsMappedMock } from '$mocks/data/summary/episodes/silo/mapped/EpisodeSiloStatsMappedMock.ts';
import { MovieHereticRatingsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticRatingsMappedMock.ts';
import { MovieHereticStatsMappedMock } from '$mocks/data/summary/movies/heretic/mapped/MovieHereticStatsMappedMock.ts';
import { SeasonSiloMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloMappedMock.ts';
import { SeasonSiloStatsMappedMock } from '$mocks/data/summary/seasons/silo/mapped/SeasonSiloStatsMappedMock.ts';
import { SYNC_RATINGS_URL } from '$mocks/data/sync/SYNC_RATINGS_URL.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { waitForEnabled } from '$test/beds/buttons/waitForEnabled.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { emulateFocusVisible } from '$test/beds/focus/emulateFocusVisible.ts';
import { serveMoviePlays } from '$test/beds/media-actions/serveMoviePlays.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import SummaryRatingsHost from '$test/beds/summary/SummaryRatingsHost.svelte';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import SummaryRatings from './SummaryRatings.svelte';
import type { SummaryRatingsProps } from './SummaryRatingsProps.ts';

const RELEASED = new Date('2024-10-31');
const UNRELEASED = new Date('2999-05-01');

const MOVIE: SummaryRatingsProps = {
  target: MATRIX_ACTIONS_TARGET,
  rating: MovieHereticRatingsMappedMock,
  stats: MovieHereticStatsMappedMock,
  earliestReleaseDate: RELEASED,
};

const SEASON: Partial<SummaryRatingsProps> = {
  target: SILO_SEASON_ACTIONS_TARGET,
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

// The slot ignores a press until the history is known.
async function settledSlot(name: string) {
  return waitForEnabled(await slot(name));
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
    // The Matrix needs a Play for a first rating.
    beforeEach(() => {
      serveMoviePlays([MATRIX_ACTIONS_TARGET.id, HERETIC_ACTIONS_TARGET.id]);
    });

    it("should name the slot's button after the movie's prompt while unrated", async () => {
      renderRatings();

      expect(await slot(PROMPT)).toHaveAttribute('aria-haspopup', 'dialog');
    });

    it("should name the slot's button after the show's prompt on a show", async () => {
      renderRatings({ target: DEVS_ACTIONS_TARGET });

      expect(await slot('Rate this show What did you think?')).toBeVisible();
    });

    it("should name the slot's button after the episode's prompt on an episode", async () => {
      renderRatings({
        target: SILO_EPISODE_ACTIONS_TARGET,
        stats: EpisodeSiloStatsMappedMock,
      });

      expect(await slot('Rate this episode What did you think?'))
        .toBeVisible();
    });

    it("should name the slot's button after the season's prompt on a season", async () => {
      renderRatings(SEASON);

      expect(await slot('Rate this season What did you think?'))
        .toBeVisible();
    });

    it('should show the stored rating in its colour, its label in white', async () => {
      const { container } = renderRatings({ target: HERETIC_ACTIONS_TARGET });

      expect(await slot('10 Totally Ninja!')).toHaveClass('is-rated');
      expect(container.querySelector('.ratings-user-heart'))
        .toHaveAttribute('data-rating', '10');
    });

    it("should describe the stored rating as the user's, named by its visible text alone", async () => {
      renderRatings({ target: HERETIC_ACTIONS_TARGET });

      expect(await slot('10 Totally Ninja!'))
        .toHaveAccessibleDescription('Your rating');
    });

    it('should leave a preview undescribed while unrated', async () => {
      stubClientRects();
      emulateFocusVisible();
      renderRatings();
      (await settledSlot(PROMPT)).focus();

      await userEvent.keyboard('{Enter}');

      expect(await slot('1 Weak Sauce :(')).toHaveAccessibleDescription('');
    });

    it('should leave a preview of another heart undescribed while rated', async () => {
      stubClientRects();
      emulateFocusVisible();
      renderRatings({ target: HERETIC_ACTIONS_TARGET });
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
      renderRatings({ target: HERETIC_ACTIONS_TARGET });
      (await slot('10 Totally Ninja!')).focus();

      await userEvent.keyboard('{Enter}');

      expect(await slot('Unrate Totally Ninja!'))
        .toHaveAccessibleDescription('');
    });

    it.each(
      [
        ['movie', MATRIX_ACTIONS_TARGET, 'Rate this movie'],
        ['show', DEVS_ACTIONS_TARGET, 'Rate this show'],
        ['season', DEVS_SEASON_ACTIONS_TARGET, 'Rate this season'],
      ] as const,
    )(
      "should name the picker after a %s's prompt",
      async (_, target, name) => {
        stubClientRects();
        renderRatings({ target });

        await userEvent.click(await settledSlot(`${name} What did you think?`));

        expect(await screen.findByRole('dialog')).toHaveAccessibleName(name);
      },
    );

    it('should mark the slot open while the picker is open', async () => {
      stubClientRects();
      renderRatings();

      await userEvent.click(await settledSlot(PROMPT));

      expect(await screen.findByRole('dialog')).toBeVisible();
      expect(screen.getByRole('button', { name: PROMPT }))
        .toHaveAttribute('data-state', 'open');
    });

    it('should show Unrate as a question and the label in grey while keyboard focus is on the current heart', async () => {
      stubClientRects();
      emulateFocusVisible();
      const { container } = renderRatings({ target: HERETIC_ACTIONS_TARGET });
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
      await userEvent.click(await settledSlot(PROMPT));

      await userEvent.click(
        await screen.findByRole('button', { name: '8 hearts, Great' }),
      );

      await write.requested;
      expect(await slot('8 Great')).toHaveFocus();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it("should show the new title's own rating once the id changes", async () => {
      const { rerender } = renderRatings({ target: HERETIC_ACTIONS_TARGET });
      await slot('10 Totally Ninja!');

      await rerender(MOVIE);

      expect(await slot(PROMPT)).toBeVisible();
      expect(screen.queryByRole('button', { name: '10 Totally Ninja!' }))
        .toBeNull();
    });
  });

  describe("the user rating's Play gate", () => {
    const BLOCKED_REASON = 'Watch it first to rate it';

    it('should open nothing on a press or a key, describing why, while an unrated title has no Play', async () => {
      stubClientRects();
      renderRatings();
      const trigger = await slot(PROMPT);
      await waitFor(() =>
        expect(trigger).toHaveAttribute('title', BLOCKED_REASON)
      );

      await userEvent.click(trigger);
      await userEvent.keyboard('{Enter}');

      await waitNegativeClaim();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(trigger).toHaveFocus();
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).toHaveClass('is-blocked');
      expect(trigger).toHaveAccessibleDescription(BLOCKED_REASON);
    });

    it('should open the picker on a stored rating with no Play', async () => {
      stubClientRects();
      serveMoviePlays([]);
      renderRatings({ target: HERETIC_ACTIONS_TARGET });

      await userEvent.click(await slot('10 Totally Ninja!'));

      expect(await screen.findByRole('dialog')).toBeVisible();
    });

    it('should open nothing, with no reason, while the history is not known', async () => {
      stubClientRects();
      holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
      const { userLoaded } = renderRatings();
      await userLoaded;
      const trigger = await slot(PROMPT);

      await userEvent.click(trigger);

      await waitNegativeClaim();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toHaveAttribute('title');
      expect(trigger).not.toHaveClass('is-blocked');
    });

    it("should keep the open picker's trigger live, closing the picker on a press, while the history refetches", async () => {
      stubClientRects();
      serveMoviePlays([MATRIX_ACTIONS_TARGET.id]);
      const invalidator = Promise.withResolvers<
        (action: InvalidateActionOptions) => Promise<void>
      >();
      renderComponent(SummaryRatingsHost, {
        props: { ...MOVIE, output: invalidator.resolve },
      });
      const trigger = await settledSlot(PROMPT);
      await userEvent.click(trigger);
      await screen.findByRole('dialog');
      const refetch = holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });

      const invalidation = (await invalidator.promise)(
        InvalidateAction.MarkAsWatched('movie'),
      );
      await refetch.requested;
      await waitNegativeClaim();
      const disabledWhileRefetching = trigger.getAttribute('aria-disabled');
      await userEvent.click(trigger);

      expect(disabledWhileRefetching).toBeNull();
      await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
      expect(trigger).toHaveAttribute('aria-disabled', 'true');
      expect(trigger).not.toHaveAttribute('title');
      expect(trigger).not.toHaveClass('is-blocked');
      refetch.release();
      await invalidation;
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
