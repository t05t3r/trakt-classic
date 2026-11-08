import { DEVS_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_ACTIONS_TARGET.ts';
import { DEVS_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_SEASON_ACTIONS_TARGET.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { MATRIX_ACTIONS_TARGET } from '$mocks/data/media-actions/MATRIX_ACTIONS_TARGET.ts';
import { SILO_EPISODE_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_EPISODE_ACTIONS_TARGET.ts';
import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';
import { HERETIC_RELEASES_URL } from '$mocks/data/movies/HERETIC_RELEASES_URL.ts';
import { HISTORY_ID } from '$mocks/data/users/HISTORY_ID.ts';
import { USER_SETTINGS_URL } from '$mocks/data/users/USER_SETTINGS_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { EarlyRatingsUserSettingsResponseMock } from '$mocks/data/users/response/EarlyRatingsUserSettingsResponseMock.ts';
import { server } from '$mocks/server.ts';
import { waitForEnabled } from '$test/beds/buttons/waitForEnabled.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import CardCommunityRatingHost from '$test/beds/media-card/CardCommunityRatingHost.svelte';
import { serveMoviePlays } from '$test/beds/media-actions/serveMoviePlays.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import type { ComponentProps } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import CardCommunityRating from './CardCommunityRating.svelte';

type Card = ComponentProps<typeof CardCommunityRatingHost>['cards'][number];

const RELEASED = { value: 0.74, earliestReleaseDate: new Date('2020-05-01') };
const UNRELEASED = { value: 0.81, earliestReleaseDate: new Date('2999-05-01') };

function renderRatings() {
  return renderComponent(CardCommunityRatingHost, {
    props: {
      cards: [
        { rating: RELEASED, target: MATRIX_ACTIONS_TARGET },
        { rating: UNRELEASED, target: HERETIC_ACTIONS_TARGET },
      ],
    },
  });
}

describe('component: CardCommunityRating', () => {
  it("should hide an unreleased title's rating from a user who does not display early ratings", async () => {
    const { container, userLoaded } = renderRatings();

    await userLoaded;

    expect(screen.getByText('74%')).toBeVisible();
    expect(container.querySelectorAll('.trakt-community-rating'))
      .toHaveLength(1);
    expect(screen.queryByText('81%')).not.toBeInTheDocument();
  });

  it("should show an unreleased title's rating to a user who displays early ratings", async () => {
    server.use(
      http.get(
        USER_SETTINGS_URL,
        () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
      ),
    );
    renderRatings();

    expect(await screen.findByText('81%')).toBeVisible();
    expect(screen.getByText('74%')).toBeVisible();
  });

  it("should hide an unreleased title's rating while the user loads", async () => {
    const settings = holdRequest({
      method: 'get',
      url: USER_SETTINGS_URL,
      answer: () => HttpResponse.json(EarlyRatingsUserSettingsResponseMock),
    });
    renderRatings();

    await settings.requested;

    expect(screen.getByText('74%')).toBeVisible();
    expect(screen.queryByText('81%')).not.toBeInTheDocument();
  });

  describe('the rating control', () => {
    const BLOCKED_REASON = 'Watch it first to rate it';

    const renderCard = (
      props: Partial<Card> = {},
    ) =>
      renderComponent(CardCommunityRatingHost, {
        props: {
          cards: [{
            rating: RELEASED,
            target: MATRIX_ACTIONS_TARGET,
            ...props,
          }],
        },
      });

    const control = () => screen.findByRole('button', { name: /^74%/ });

    // The control ignores a press until the history is known.
    const settledControl = async () => waitForEnabled(await control());

    const hoverReads = async (button: HTMLElement, text: string) => {
      await userEvent.hover(button);
      await waitFor(() => expect(button).toHaveAccessibleDescription(text));
    };

    beforeEach(() => {
      stubClientRects();
    });

    it.each(
      [
        ['movie', MATRIX_ACTIONS_TARGET, 'Rate this movie'],
        ['show', DEVS_ACTIONS_TARGET, 'Rate this show'],
        ['season', DEVS_SEASON_ACTIONS_TARGET, 'Rate this season'],
        ['episode', SILO_EPISODE_ACTIONS_TARGET, 'Rate this episode'],
      ] as const,
    )(
      'should invite rating an unrated %s with a Play, naming the picker the same',
      async (_, target, text) => {
        const { userLoaded } = renderCard({ target, hasPlay: true });
        await userLoaded;
        const button = await settledControl();

        await hoverReads(button, text);
        await userEvent.click(button);

        expect(await screen.findByRole('dialog', { name: text })).toBeVisible();
      },
    );

    it('should open on a Play the watched history holds', async () => {
      serveMoviePlays([MATRIX_ACTIONS_TARGET.id]);
      renderCard();

      await userEvent.click(await settledControl());

      expect(await screen.findByRole('dialog')).toBeVisible();
    });

    it('should offer a change on a stored rating with no Play', async () => {
      serveMoviePlays([]);
      const { userLoaded } = renderCard({ target: HERETIC_ACTIONS_TARGET });
      await userLoaded;
      const button = await settledControl();

      await hoverReads(button, 'Change your rating');
      await userEvent.click(button);

      expect(await screen.findByRole('dialog')).toBeVisible();
    });

    it('should open below the card', async () => {
      renderCard({ hasPlay: true });

      await userEvent.click(await settledControl());

      expect(await screen.findByRole('dialog')).toHaveAttribute(
        'data-side',
        'bottom',
      );
    });

    it('should let the pointer through its tooltip to the title under it', async () => {
      renderCard({ hasPlay: true });

      await hoverReads(await settledControl(), 'Rate this movie');

      const text = document.querySelector('.trakt-tooltip');
      expect(text).toHaveStyle({ pointerEvents: 'none' });
      expect(text?.parentElement).toHaveStyle({ pointerEvents: 'none' });
    });

    it('should drop its tooltip while the picker is open', async () => {
      renderCard({ hasPlay: true });
      const button = await settledControl();
      await hoverReads(button, 'Rate this movie');

      await userEvent.click(button);
      await screen.findByRole('dialog');

      await waitFor(() => expect(button).not.toHaveAccessibleDescription());
      await waitNegativeClaim();
      expect(button).not.toHaveAccessibleDescription();
    });

    it('should block a title with no Play and no rating, starting no write and keeping the reason up', async () => {
      serveMoviePlays([]);
      const writes = recordWrites();
      renderCard();
      const button = await control();
      await waitFor(() => expect(button).toHaveClass('is-blocked'));
      await hoverReads(button, BLOCKED_REASON);

      await userEvent.click(button);
      await userEvent.keyboard('{Enter}');

      await waitNegativeClaim();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(writes).toEqual([]);
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveAccessibleDescription(BLOCKED_REASON);
    });

    it('should give the blocked reason on keyboard focus', async () => {
      serveMoviePlays([]);
      renderComponent(CardCommunityRating, {
        props: {
          rating: RELEASED,
          target: MATRIX_ACTIONS_TARGET,
          hasPlay: false,
        },
      });
      const button = await control();
      await waitFor(() => expect(button).toHaveClass('is-blocked'));

      await userEvent.tab();

      expect(button).toHaveFocus();
      await waitFor(() =>
        expect(button).toHaveAccessibleDescription(BLOCKED_REASON)
      );
    });

    it('should refuse a press with no reason while the history is not known', async () => {
      holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
      const { userLoaded } = renderCard();
      await userLoaded;
      const button = await control();

      await userEvent.hover(button);
      await userEvent.click(button);
      await waitNegativeClaim();

      expect(screen.queryByRole('dialog')).toBeNull();
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).not.toHaveClass('is-blocked');
      expect(button).not.toHaveAccessibleDescription();
    });

    it.each(
      [
        ['historyId', { historyId: HISTORY_ID }],
        ['hasPlay', { hasPlay: true }],
      ] as const,
    )(
      "should open a Play's card by its %s while the history is not known",
      async (_, play) => {
        holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
        renderCard(play);

        await userEvent.click(await settledControl());

        expect(await screen.findByRole('dialog')).toBeVisible();
      },
    );

    it("should rate through the picker, keeping the community's percentage", async () => {
      const writes = recordWrites();
      renderCard({ hasPlay: true });
      const button = await settledControl();
      await userEvent.click(button);
      await screen.findByRole('dialog');

      await userEvent.click(
        screen.getByRole('button', { name: '7 hearts, Good' }),
      );

      await waitFor(() => expect(writes).toEqual(['POST /sync/ratings']));
      expect(await control()).toHaveTextContent('74%');
    });

    describe('its name', () => {
      it('should invite rating, after the visible percentage', async () => {
        renderCard({ hasPlay: true });

        expect(await settledControl())
          .toHaveAccessibleName('74%, Rate this movie');
      });

      it('should offer a change on a stored rating', async () => {
        serveMoviePlays([]);
        renderCard({ target: HERETIC_ACTIONS_TARGET });

        await waitFor(async () =>
          expect(await control())
            .toHaveAccessibleName('74%, Change your rating')
        );
      });

      it('should give the blocked reason', async () => {
        serveMoviePlays([]);
        renderCard();
        const button = await control();

        await waitFor(() =>
          expect(button)
            .toHaveAccessibleName('74%, Watch it first to rate it')
        );
      });

      it('should read only the percentage while the history is not known', async () => {
        holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
        const { userLoaded } = renderCard();
        await userLoaded;
        const button = await control();
        await waitNegativeClaim();

        expect(button).toHaveAccessibleName('74%');
      });
    });

    describe('through a refetch of the history', () => {
      const renderRefetched = async (props: Partial<Card> = {}) => {
        const invalidator = Promise.withResolvers<
          (action: InvalidateActionOptions) => Promise<void>
        >();
        renderComponent(CardCommunityRatingHost, {
          props: {
            cards: [{
              rating: RELEASED,
              target: MATRIX_ACTIONS_TARGET,
              ...props,
            }],
            output: invalidator.resolve,
          },
        });

        return async () => {
          const refetch = holdRequest({
            method: 'get',
            url: WATCHED_MOVIES_URL,
          });
          const invalidation = (await invalidator.promise)(
            InvalidateAction.MarkAsWatched('movie'),
          );
          await refetch.requested;
          await waitNegativeClaim();

          return { refetch, invalidation };
        };
      };

      it('should keep an open tooltip and take a press, with a Play', async () => {
        serveMoviePlays([MATRIX_ACTIONS_TARGET.id]);
        const refetching = await renderRefetched();
        const button = await settledControl();
        await hoverReads(button, 'Rate this movie');

        await refetching();

        expect(button).not.toHaveAttribute('aria-disabled');
        expect(button).toHaveAccessibleDescription('Rate this movie');
        await userEvent.click(button);
        expect(await screen.findByRole('dialog')).toBeVisible();
      });

      it('should keep a blocked control dimmed, its reason up', async () => {
        serveMoviePlays([]);
        const refetching = await renderRefetched();
        const button = await control();
        await waitFor(() => expect(button).toHaveClass('is-blocked'));
        await hoverReads(button, BLOCKED_REASON);

        await refetching();

        expect(button).toHaveClass('is-blocked');
        expect(button).toHaveAccessibleDescription(BLOCKED_REASON);
      });
    });

    describe("a movie's earliest release", () => {
      const RELEASES = 'releases';
      const UNRELEASED_MOVIE = { ...UNRELEASED, movieSlug: 'heretic-2024' };

      it('should show a rating its own date hides once an earlier release is in', async () => {
        const requests = await captureRequests(async () => {
          renderComponent(CardCommunityRating, {
            props: {
              rating: UNRELEASED_MOVIE,
              target: HERETIC_ACTIONS_TARGET,
              hasPlay: true,
            },
          });
          expect(await screen.findByRole('button', { name: /^81%,/ }))
            .toBeVisible();
        }, { pathIncludes: RELEASES });

        expect(requests).toEqual(['GET /movies/heretic-2024/releases']);
      });

      it('should keep the rating hidden while every release is still ahead', async () => {
        server.use(
          http.get(
            HERETIC_RELEASES_URL,
            () => HttpResponse.json([{ release_date: '2999-01-01' }]),
          ),
        );
        const requests = await captureRequests(async () => {
          renderComponent(CardCommunityRating, {
            props: {
              rating: UNRELEASED_MOVIE,
              target: HERETIC_ACTIONS_TARGET,
              hasPlay: true,
            },
          });
          await waitNegativeClaim();
        }, { pathIncludes: RELEASES });

        expect(requests).toHaveLength(1);
        expect(screen.queryByRole('button', { name: /^81%,/ })).toBeNull();
      });

      it.each([
        {
          when: 'it is already released',
          rating: { ...RELEASED, movieSlug: 'heretic-2024' },
        },
        {
          when: 'it has no rating',
          rating: { ...UNRELEASED_MOVIE, value: null },
        },
        { when: 'it is not a movie', rating: UNRELEASED },
      ])('should read no releases when $when', async ({ rating }) => {
        const requests = await captureRequests(async () => {
          renderComponent(CardCommunityRating, {
            props: { rating, target: HERETIC_ACTIONS_TARGET, hasPlay: true },
          });
          await waitNegativeClaim();
        }, { pathIncludes: RELEASES });

        expect(requests).toEqual([]);
      });
    });

    it('should read each request once for three cards', async () => {
      const requests = await captureRequests(async () => {
        renderComponent(CardCommunityRatingHost, {
          props: {
            cards: [
              { rating: RELEASED, target: MATRIX_ACTIONS_TARGET },
              { rating: RELEASED, target: HERETIC_ACTIONS_TARGET },
              { rating: RELEASED, target: SILO_EPISODE_ACTIONS_TARGET },
            ],
          },
        });
        await waitFor(() =>
          expect(screen.getAllByRole('button', { name: /^74%,/ }))
            .toHaveLength(3)
        );
      }, { pathIncludes: '/' });

      // Only the watched reads repeat: each ends at an empty page.
      const sorted = requests.toSorted();
      expect(sorted.filter((request, index) => sorted[index - 1] === request))
        .toEqual([
          'GET /users/me/watched/movies',
          'GET /users/me/watched/shows',
        ]);
    });

    it('should render no control when no percentage shows', async () => {
      const { container, userLoaded } = renderComponent(
        CardCommunityRatingHost,
        {
          props: {
            cards: [
              {
                rating: { ...RELEASED, value: null },
                target: MATRIX_ACTIONS_TARGET,
              },
              { rating: UNRELEASED, target: HERETIC_ACTIONS_TARGET },
            ],
          },
        },
      );

      await userLoaded;

      expect(screen.queryByRole('button', { name: /%/ })).toBeNull();
      expect(container.querySelector('.trakt-community-rating')).toBeNull();
    });
  });
});
