import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { MATRIX_ACTIONS_TARGET } from '$mocks/data/media-actions/MATRIX_ACTIONS_TARGET.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { SYNC_FAVORITES_REMOVE_URL } from '$mocks/data/sync/SYNC_FAVORITES_REMOVE_URL.ts';
import { SYNC_FAVORITES_URL } from '$mocks/data/sync/SYNC_FAVORITES_URL.ts';
import { SYNC_HISTORY_URL } from '$mocks/data/sync/SYNC_HISTORY_URL.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { time } from '$lib/utils/timing/time.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import QuickActionsHost from '$test/beds/media-actions/QuickActionsHost.svelte';
import QuickActions from './QuickActions.svelte';
import type { QuickActionsTarget } from './QuickActionsProps.ts';

const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const spinnerOf = (element: Element) =>
  element.querySelector('.trakt-pending-spinner');

// A known state reads `aria-disabled` false.
const settledButton = async (name: string) => {
  await waitFor(() =>
    expect(button(name)).toHaveAttribute('aria-disabled', 'false')
  );
  return button(name);
};

// Its show's watched history holds this episode's play.
const SILO_EPISODE: QuickActionsTarget = {
  type: 'episode',
  id: 1,
  title: 'Freedom Day',
  season: 1,
  number: 1,
  show: { id: 180770, title: 'Silo' },
  airDate: AIRED,
};

const button = (name: string) => screen.getByRole('button', { name });

describe('component: QuickActions', () => {
  beforeEach(() => {
    stubClientRects();
    setLayout('desktop');
  });

  it.each([
    {
      target: HERETIC_ACTIONS_TARGET,
      selected: [
        'Remove "Heretic" from your History',
        'Remove "Heretic" from your Favorites',
      ],
      unselected: ['Add or remove "Heretic" from lists'],
    },
    {
      target: MATRIX_ACTIONS_TARGET,
      selected: ['Add or remove "The Matrix" from lists'],
      unselected: [
        'Mark "The Matrix" as watched',
        'Add "The Matrix" to your Favorites',
      ],
    },
  ])(
    'should show the watched, watchlisted and favourite states of $target.title from the stores',
    async ({ target, selected, unselected }) => {
      renderComponent(QuickActions, { props: { target, favorite: true } });

      await waitFor(() => {
        selected.forEach((name) =>
          expect(button(name)).toHaveClass('is-selected')
        );
        unselected.forEach((name) =>
          expect(button(name)).not.toHaveClass('is-selected')
        );
      });
    },
  );

  it.each([
    { count: 1, name: 'Remove "Silo" from your History', selected: true },
    { count: 17, name: 'Mark "Silo" as watched', selected: false },
  ])(
    'should read a show with $count episodes as watched: $selected',
    async ({ count, name, selected }) => {
      renderComponent(QuickActions, {
        props: { target: { ...SILO_ACTIONS_TARGET, episode: { count } } },
      });

      await waitFor(() =>
        expect(button(name)).toHaveAttribute('aria-disabled', 'false')
      );
      expect(button(name).classList.contains('is-selected')).toBe(selected);
    },
  );

  it.each([
    {
      store: 'watched',
      url: WATCHED_MOVIES_URL,
      name: 'Mark "The Matrix" as watched',
    },
    {
      store: 'favourites',
      url: 'http://localhost/users/me/favorites/movies*',
      name: 'Add "The Matrix" to your Favorites',
    },
  ])(
    'should show the icon unselected and send nothing on a click while the $store store is not known',
    async ({ url, name }) => {
      const known = holdRequest({
        method: 'get',
        url,
        answer: () => pagedResponse({ body: [] }),
      });
      const writes = recordWrites();
      renderComponent(QuickActions, {
        props: { target: MATRIX_ACTIONS_TARGET, favorite: true },
      });
      const icon = await screen.findByRole('button', { name });

      await userEvent.click(icon);

      expect(icon).toHaveAttribute('aria-disabled', 'true');
      expect(icon).not.toHaveClass('is-selected');
      known.release();
      await settledButton(name);
      await waitNegativeClaim();
      expect(writes).toEqual([]);
    },
  );

  it.each([
    {
      icon: 'an unselected watch',
      target: MATRIX_ACTIONS_TARGET,
      name: 'Mark "The Matrix" as watched',
      write: 'POST /sync/history',
    },
    {
      icon: 'an unselected favourite',
      target: MATRIX_ACTIONS_TARGET,
      name: 'Add "The Matrix" to your Favorites',
      write: 'POST /sync/favorites',
    },
    {
      icon: 'a selected favourite',
      target: HERETIC_ACTIONS_TARGET,
      name: 'Remove "Heretic" from your Favorites',
      write: 'POST /sync/favorites/remove',
    },
  ])('should send $write from $icon', async ({ target, name, write }) => {
    const writes = recordWrites();
    renderComponent(QuickActions, { props: { target, favorite: true } });

    await userEvent.click(await settledButton(name));

    await waitFor(() => expect(writes).toEqual([write]));
  });

  it('should ask to confirm before removing a watched Target from the history', async () => {
    const writes = recordWrites();
    renderComponent(QuickActions, {
      props: { target: HERETIC_ACTIONS_TARGET },
    });

    await userEvent.click(
      await settledButton('Remove "Heretic" from your History'),
    );

    expect(await screen.findByText('Remove from history?')).toBeVisible();
    await waitNegativeClaim();
    expect(writes).toEqual([]);
  });

  it('should show the spinner on a pending watch and send nothing on a click', async () => {
    const write = holdRequest({
      method: 'post',
      url: SYNC_HISTORY_URL,
      answer: () => new HttpResponse(null, { status: 201 }),
    });
    const writes = recordWrites();
    renderComponent(QuickActions, { props: { target: MATRIX_ACTIONS_TARGET } });
    await userEvent.click(await settledButton('Mark "The Matrix" as watched'));
    const icon = await screen.findByRole('button', {
      name: 'Remove "The Matrix" from your History',
    });
    await waitFor(() => expect(spinnerOf(icon)).not.toBeNull());

    await userEvent.click(icon);

    expect(icon).toHaveAttribute('aria-busy', 'true');
    // The queue posts one write at a time, so a second waits for the release.
    write.release();
    // The refetched history mock holds no play of the Matrix.
    await settledButton('Mark "The Matrix" as watched');
    await waitNegativeClaim();
    expect(writes).toEqual(['POST /sync/history']);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('should keep a watched icon selected but inert, and start nothing on a click, while the history refetches', async () => {
    const hasWritten = { value: false };
    // Returning nothing hands the request on to the default handler.
    const refetch = holdResponse(() => undefined);
    server.use(
      http.post(SYNC_HISTORY_URL, () => {
        hasWritten.value = true;
        return new HttpResponse(null, { status: 201 });
      }),
      http.get(WATCHED_MOVIES_URL, () => {
        if (!hasWritten.value) return;
        return refetch.answer();
      }),
    );
    const writes = recordWrites();
    renderComponent(QuickActionsHost, {
      props: { targets: [HERETIC_ACTIONS_TARGET, MATRIX_ACTIONS_TARGET] },
    });
    const watched = await settledButton('Remove "Heretic" from your History');
    await userEvent.click(await settledButton('Mark "The Matrix" as watched'));
    await refetch.requested;
    await waitFor(() =>
      expect(watched).toHaveAttribute('aria-disabled', 'true')
    );

    await userEvent.click(watched);

    await waitNegativeClaim();
    expect(writes).toEqual(['POST /sync/history']);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(watched).toHaveClass('is-selected');
    expect(watched).toHaveAttribute('aria-busy', 'false');
  });

  it('should show a pending favourite selected, with no spinner', async () => {
    holdRequest({
      method: 'post',
      url: SYNC_FAVORITES_URL,
      answer: () => new HttpResponse(null, { status: 201 }),
    });
    renderComponent(QuickActions, {
      props: { target: MATRIX_ACTIONS_TARGET, favorite: true },
    });

    await userEvent.click(
      await settledButton('Add "The Matrix" to your Favorites'),
    );

    const icon = await screen.findByRole('button', {
      name: 'Remove "The Matrix" from your Favorites',
    });
    expect(icon).toHaveClass('is-selected');
    expect(icon).toHaveAttribute('aria-disabled', 'false');
    expect(icon).toHaveAttribute('aria-busy', 'false');
    expect(spinnerOf(icon)).toBeNull();
  });

  it.each([
    { airDate: new Date(Date.now() + time.weeks(1)), when: 'unaired' },
    { airDate: null, when: 'with no air date' },
  ])('should render no watch icon for a Target $when', async ({ airDate }) => {
    renderComponent(QuickActions, {
      props: { target: { ...MATRIX_ACTIONS_TARGET, airDate }, favorite: true },
    });

    await settledButton('Add "The Matrix" to your Favorites');
    expect(
      screen.queryByRole('button', { name: 'Mark "The Matrix" as watched' }),
    ).toBeNull();
  });

  it("should show a watched episode selected, with its show's favourite state", async () => {
    renderComponent(QuickActions, {
      props: { target: SILO_EPISODE, favorite: true },
    });

    const watch = await settledButton('Remove "Freedom Day" from your History');
    const favorite = await settledButton('Remove "Silo" from your Favorites');

    expect(watch).toHaveClass('is-selected');
    expect(favorite).toHaveClass('is-selected');
    expect(
      screen.getAllByRole('button').map((icon) => icon.dataset.action),
    ).toEqual(['watch', 'list', 'favorite']);
  });

  it("should write an episode's favourite to its show", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post(
        SYNC_FAVORITES_REMOVE_URL,
        async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 200 });
        },
      ),
    );
    renderComponent(QuickActions, {
      props: { target: SILO_EPISODE, favorite: true },
    });

    await userEvent.click(
      await settledButton('Remove "Silo" from your Favorites'),
    );

    await waitFor(() =>
      expect(bodies).toEqual([{ shows: [{ ids: { trakt: SILO.id } }] }])
    );
  });

  describe('for a season', () => {
    it('should name its icons after the season and its show, with its watched and watchlisted states', async () => {
      renderComponent(QuickActions, {
        props: { target: SILO_SEASON_ACTIONS_TARGET },
      });

      const watch = await settledButton('Mark "Season 1 of Silo" as watched');
      const list = button('Add or remove "Season 1 of Silo" from lists');

      await waitFor(() => expect(list).toHaveClass('is-selected'));
      expect(watch).not.toHaveClass('is-selected');
      expect(
        screen.getAllByRole('button').map((icon) => icon.dataset.action),
      ).toEqual(['watch', 'list']);
    });

    it('should read a season whose aired episodes are all watched as watched', async () => {
      renderComponent(QuickActions, {
        props: {
          target: {
            ...SILO_SEASON_ACTIONS_TARGET,
            episodes: { count: 1, aired: 1 },
          },
        },
      });

      expect(
        await settledButton('Remove "Season 1 of Silo" from your History'),
      ).toHaveClass('is-selected');
    });

    it('should confirm, then post the season from the watch icon', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(SYNC_HISTORY_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 201 });
        }),
      );
      renderComponent(QuickActions, {
        props: { target: SILO_SEASON_ACTIONS_TARGET },
      });

      await userEvent.click(
        await settledButton('Mark "Season 1 of Silo" as watched'),
      );
      await answerDialog('Mark as watched?', 'Mark as Watched');

      await waitFor(() =>
        expect(bodies).toEqual([
          { seasons: [{ ids: { trakt: 257490 }, watched_at: 'now' }] },
        ])
      );
    });

    it("should name and write a season's favourite as its show's", async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(
          SYNC_FAVORITES_REMOVE_URL,
          async ({ request }) => {
            bodies.push(await request.json());
            return new HttpResponse(null, { status: 200 });
          },
        ),
      );
      renderComponent(QuickActions, {
        props: { target: SILO_SEASON_ACTIONS_TARGET, favorite: true },
      });

      await userEvent.click(
        await settledButton('Remove "Silo" from your Favorites'),
      );

      await waitFor(() =>
        expect(bodies).toEqual([{ shows: [{ ids: { trakt: SILO.id } }] }])
      );
    });
  });

  it('should leave the favourite icon out unless the caller turns it on', async () => {
    renderComponent(QuickActions, {
      props: { target: HERETIC_ACTIONS_TARGET },
    });

    await settledButton('Remove "Heretic" from your History');
    expect(
      screen.getAllByRole('button').map((icon) => icon.dataset.action),
    ).toEqual(['watch', 'list']);
  });

  it.each([
    { state: 'known', hold: () => {} },
    {
      state: 'not known',
      hold: () =>
        holdRequest({
          method: 'get',
          url: WATCHLIST_URL,
          answer: () => pagedResponse({ body: [] }),
        }),
    },
  ])(
    'should open the List Menu from the list icon while the watchlist is $state',
    async ({ hold }) => {
      hold();
      renderComponent(QuickActions, {
        props: { target: MATRIX_ACTIONS_TARGET },
      });

      await userEvent.click(
        await screen.findByRole('button', {
          name: 'Add or remove "The Matrix" from lists',
        }),
      );

      expect(
        await screen.findByRole('menu', { name: 'Add to list' }),
      ).toBeVisible();
    },
  );

  it('should render the metadata snippet after the icons, at the size given', async () => {
    const metadata = createRawSnippet(() => ({
      render: () => '<span>74%</span>',
    }));
    renderComponent(QuickActions, {
      props: { target: HERETIC_ACTIONS_TARGET, size: 'smaller', metadata },
    });

    const percentage = await screen.findByText('74%');
    const strip = percentage.closest('.trakt-quick-actions');

    expect(strip).toHaveAttribute('data-size', 'smaller');
    expect(percentage.parentElement).toHaveClass('metadata');
    expect(
      button('Add or remove "Heretic" from lists').compareDocumentPosition(
        percentage,
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
