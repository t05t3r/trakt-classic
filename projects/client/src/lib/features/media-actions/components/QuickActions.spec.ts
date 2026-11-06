import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { settledButton } from '$test/beds/buttons/settledButton.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { DEVS_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_ACTIONS_TARGET.ts';
import { DEVS_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_SEASON_ACTIONS_TARGET.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { MATRIX_ACTIONS_TARGET } from '$mocks/data/media-actions/MATRIX_ACTIONS_TARGET.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_EPISODE_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_EPISODE_ACTIONS_TARGET.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { UNPLAYED_SHOW } from '$mocks/data/media-actions/UNPLAYED_SHOW.ts';
import { SYNC_FAVORITES_REMOVE_URL } from '$mocks/data/sync/SYNC_FAVORITES_REMOVE_URL.ts';
import { SYNC_FAVORITES_URL } from '$mocks/data/sync/SYNC_FAVORITES_URL.ts';
import { SYNC_HISTORY_REMOVE_URL } from '$mocks/data/sync/SYNC_HISTORY_REMOVE_URL.ts';
import { SYNC_HISTORY_URL } from '$mocks/data/sync/SYNC_HISTORY_URL.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { HISTORY_ID } from '$mocks/data/users/HISTORY_ID.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { holdResponse } from '$test/beds/request/holdResponse.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { serveMoviePlays } from '$test/beds/media-actions/serveMoviePlays.ts';
import { time } from '$lib/utils/timing/time.ts';
import { screen, waitFor } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { createRawSnippet } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import QuickActionsHost from '$test/beds/media-actions/QuickActionsHost.svelte';
import QuickActions from './QuickActions.svelte';
import type {
  QuickActionsProps,
  QuickActionsTarget,
} from './QuickActionsProps.ts';

const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const UNAIRED = new Date(Date.now() + time.weeks(1));

const spinnerOf = (element: Element) =>
  element.querySelector('.trakt-pending-spinner');

const button = (name: string) => screen.getByRole('button', { name });

const REMOVE_SILO = 'Remove "Silo" from your History';

// Silo's history holds no play of its second season.
const UNPLAYED_SILO_SEASON = { ...SILO_SEASON_ACTIONS_TARGET, number: 2 };

const SHOWS = [
  { show: 'complete', count: 1 },
  { show: 'partly watched', count: 17 },
  { show: 'not yet aired', count: 0 },
];

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

  describe.each([
    {
      kind: 'show',
      target: { ...DEVS_ACTIONS_TARGET, episode: { count: 30 } },
      remove: 'Remove "Devs" from your History',
      prompt: /Remove all 11 plays of "Devs"/,
      body: { shows: [{ ids: { trakt: DEVS.id } }] },
    },
    {
      kind: 'season',
      target: DEVS_SEASON_ACTIONS_TARGET,
      remove: 'Remove "Season 1 of Devs" from your History',
      prompt: /Remove all 10 plays of "Season 1 of Devs"/,
      body: { seasons: [{ ids: { trakt: DEVS_SEASON_ACTIONS_TARGET.id } }] },
    },
  ])('for a partly watched $kind', ({ target, remove, prompt, body }) => {
    const partly = (): QuickActionsTarget =>
      target.type === 'show'
        ? { ...target, episode: { count: 30 } }
        : { ...target, episodes: { count: 30, aired: 30 } };

    it('should fill the watch icon', async () => {
      renderComponent(QuickActions, { props: { target: partly() } });

      expect(await settledButton(remove)).toHaveClass('is-selected');
    });

    it('should remove every Play on a click, with the count dialog', async () => {
      const bodies = recordBodies(SYNC_HISTORY_REMOVE_URL);
      renderComponent(QuickActions, { props: { target: partly() } });

      await userEvent.click(await settledButton(remove));

      expect(await screen.findByText(prompt)).toBeVisible();
      await answerDialog('Remove from history?', 'Remove from History');
      await waitFor(() => expect(bodies).toEqual([body]));
    });

    it('should never add a Play on a click', async () => {
      const writes = recordWrites();
      renderComponent(QuickActions, { props: { target: partly() } });

      await userEvent.click(await settledButton(remove));
      await answerDialog('Remove from history?', 'Cancel');

      await waitNegativeClaim();
      expect(writes).toEqual([]);
    });
  });

  it.each([
    {
      kind: 'show',
      target: { ...SILO_ACTIONS_TARGET, ...UNPLAYED_SHOW },
      name: 'Mark "Unplayed" as watched',
    },
    {
      kind: 'season',
      target: UNPLAYED_SILO_SEASON,
      name: 'Mark "Season 1 of Silo" as watched',
    },
  ])('should leave a $kind with no Play unfilled', async ({ target, name }) => {
    renderComponent(QuickActions, { props: { target } });

    expect(await settledButton(name)).not.toHaveClass('is-selected');
  });

  it("should keep a partly watched show's icon filled while the history refetches", async () => {
    const hasWritten = { value: false };
    // Returning nothing hands the request on to the default handler.
    const refetch = holdResponse(() => undefined);
    server.use(
      http.post(SYNC_HISTORY_URL, () => {
        hasWritten.value = true;
        return new HttpResponse(null, { status: 201 });
      }),
      http.get(WATCHED_SHOWS_URL, () => {
        if (!hasWritten.value) return;
        return refetch.answer();
      }),
    );
    renderComponent(QuickActionsHost, {
      props: { targets: [SILO_ACTIONS_TARGET, UNPLAYED_SILO_SEASON] },
    });
    const show = await settledButton(REMOVE_SILO);

    await userEvent.click(
      await settledButton('Mark "Season 1 of Silo" as watched'),
    );
    await answerDialog('Mark as watched?', 'Mark as Watched');
    await refetch.requested;
    await waitFor(() => expect(show).toHaveAttribute('aria-disabled', 'true'));

    expect(show).toHaveClass('is-selected');
  });

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
      // Gives the favourite a Play; the watched row's hold, made after, wins over it.
      serveMoviePlays([MATRIX_ACTIONS_TARGET.id]);
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

    expect(
      await screen.findByText(
        'Remove the play of "Heretic" from your history?',
      ),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Only this play' })).toBeNull();
    await waitNegativeClaim();
    expect(writes).toEqual([]);
  });

  describe('with a history id', () => {
    const REMOVE_MATRIX = 'Remove "The Matrix" from your History';

    const renderPlay = () =>
      renderComponent(QuickActions, {
        props: { target: MATRIX_ACTIONS_TARGET, historyId: HISTORY_ID },
      });

    it('should read selected with the remove label though the history reads the Target unwatched', async () => {
      renderPlay();

      expect(await settledButton(REMOVE_MATRIX)).toHaveClass('is-selected');
    });

    it("should post the Play's id on Only this play, spinning with its label kept while it is held", async () => {
      const bodies: unknown[] = [];
      const write = holdResponse(() => new HttpResponse(null, { status: 200 }));
      server.use(
        http.post(SYNC_HISTORY_REMOVE_URL, async ({ request }) => {
          bodies.push(await request.json());
          return write.answer();
        }),
      );
      renderPlay();

      await userEvent.click(await settledButton(REMOVE_MATRIX));
      await answerDialog('Remove from history?', 'Only this play');
      await write.requested;

      expect(bodies).toEqual([{ ids: [HISTORY_ID] }]);
      const icon = button(REMOVE_MATRIX);
      await waitFor(() => expect(icon).toHaveAttribute('aria-busy', 'true'));
      expect(icon).toHaveClass('is-selected');
    });

    it('should never add a Play on a press', async () => {
      const writes = recordWrites();
      renderPlay();

      await userEvent.click(await settledButton(REMOVE_MATRIX));
      await answerDialog('Remove from history?', 'No');

      await waitNegativeClaim();
      expect(writes).toEqual([]);
    });

    it('should stay inert and open nothing while the watched state is not known', async () => {
      const known = holdRequest({
        method: 'get',
        url: WATCHED_MOVIES_URL,
        answer: () => pagedResponse({ body: [] }),
      });
      renderPlay();
      const icon = await screen.findByRole('button', { name: REMOVE_MATRIX });

      await userEvent.click(icon);

      expect(icon).toHaveAttribute('aria-disabled', 'true');
      known.release();
      await settledButton(REMOVE_MATRIX);
      await waitNegativeClaim();
      expect(screen.queryByRole('dialog')).toBeNull();
    });
  });

  describe('with a Play and no history id', () => {
    const renderShow = (count: number) =>
      renderComponent(QuickActions, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count } },
          hasPlay: true,
        },
      });

    it.each(SHOWS)(
      'should read a $show show selected, with the remove label',
      async ({ count }) => {
        renderShow(count);

        expect(await settledButton(REMOVE_SILO)).toHaveClass('is-selected');
      },
    );

    it.each(SHOWS)(
      'should ask with the count, then remove all of a $show show',
      async ({ count }) => {
        const bodies = recordBodies(SYNC_HISTORY_REMOVE_URL);
        renderShow(count);

        await userEvent.click(await settledButton(REMOVE_SILO));

        expect(
          await screen.findByText(
            'Remove the play of "Silo" from your history?',
          ),
        ).toBeVisible();
        expect(screen.queryByRole('button', { name: 'Only this play' }))
          .toBeNull();
        await answerDialog('Remove from history?', 'Remove from History');
        await waitFor(() =>
          expect(bodies).toEqual([{ shows: [{ ids: { trakt: SILO.id } }] }])
        );
      },
    );

    it('should never add a Play on a press of a partly watched show', async () => {
      const writes = recordWrites();
      renderShow(17);

      await userEvent.click(await settledButton(REMOVE_SILO));
      await answerDialog('Remove from history?', 'Cancel');

      await waitNegativeClaim();
      expect(writes).toEqual([]);
    });

    it('should stay selected and inert, and open nothing, while the watched state is not known', async () => {
      const known = holdRequest({ method: 'get', url: WATCHED_SHOWS_URL });
      renderShow(17);
      const icon = await screen.findByRole('button', { name: REMOVE_SILO });

      await userEvent.click(icon);

      expect(icon).toHaveAttribute('aria-disabled', 'true');
      expect(icon).toHaveClass('is-selected');
      known.release();
      await settledButton(REMOVE_SILO);
      await waitNegativeClaim();
      expect(screen.queryByRole('dialog')).toBeNull();
    });

    it('should open nothing and send nothing while the history holds no play of it', async () => {
      const writes = recordWrites();
      renderComponent(QuickActions, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, ...UNPLAYED_SHOW },
          hasPlay: true,
        },
      });

      await userEvent.click(
        await settledButton('Remove "Unplayed" from your History'),
      );

      await waitNegativeClaim();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(writes).toEqual([]);
    });
  });

  describe('hover text of the watch icon', () => {
    const HERETIC_WITH_RUNTIME = { ...HERETIC_ACTIONS_TARGET, runtime: 53 };
    const REMOVE_HERETIC = 'Remove "Heretic" from your History';
    const REMOVE_DEVS = 'Remove "Devs" from your History';
    const REMOVE_DEVS_SEASON = 'Remove "Season 1 of Devs" from your History';

    it.each(
      [
        {
          row: 'a title with no Play',
          props: { target: MATRIX_ACTIONS_TARGET },
          name: 'Mark "The Matrix" as watched',
          text: 'Add to watched history',
        },
        {
          row: "a Play's card",
          props: {
            target: HERETIC_WITH_RUNTIME,
            historyId: HISTORY_ID,
            playedAt: new Date('2026-11-04T22:19:00.000Z'),
          },
          name: REMOVE_HERETIC,
          text: 'Watched on 4 Nov 2026 53m',
        },
        {
          row: 'a watched movie on another page',
          props: { target: HERETIC_WITH_RUNTIME },
          name: REMOVE_HERETIC,
          text: '1 play 53m',
        },
        {
          row: 'a show with Plays, specials among the plays only',
          props: {
            target: { ...DEVS_ACTIONS_TARGET, episode: { count: 30 } },
          },
          name: REMOVE_DEVS,
          text: '26% watched 8/30 eps — 11 plays',
        },
        {
          row: 'a season with Plays',
          props: {
            target: {
              ...DEVS_SEASON_ACTIONS_TARGET,
              episodes: { count: 30, aired: 30 },
            },
          },
          name: REMOVE_DEVS_SEASON,
          text: '26% watched 8/30 eps — 10 plays',
        },
        {
          row: 'a show with no aired count',
          props: {
            target: { ...DEVS_ACTIONS_TARGET, episode: { count: NaN } },
          },
          name: REMOVE_DEVS,
          text: '11 plays',
        },
        {
          row: 'the specials season',
          props: { target: { ...DEVS_SEASON_ACTIONS_TARGET, number: 0 } },
          name: REMOVE_DEVS_SEASON,
          text: '1 play',
        },
      ] satisfies Array<{
        row: string;
        props: QuickActionsProps;
        name: string;
        text: string;
      }>,
    )('should read "$text" on $row', async ({ props, name, text }) => {
      renderComponent(QuickActions, { props });
      const watch = await settledButton(name);

      await userEvent.hover(watch);

      await waitFor(() => expect(watch).toHaveAccessibleDescription(text));
    });

    it('should open on keyboard focus too', async () => {
      renderComponent(QuickActions, {
        props: { target: MATRIX_ACTIONS_TARGET },
      });
      const watch = await settledButton('Mark "The Matrix" as watched');

      await userEvent.tab();

      expect(watch).toHaveFocus();
      await waitFor(() =>
        expect(watch).toHaveAccessibleDescription('Add to watched history')
      );
    });

    it('should stay disabled while the counts lag, until they arrive', async () => {
      const known = holdRequest({ method: 'get', url: WATCHED_SHOWS_URL });
      renderComponent(QuickActions, {
        props: { target: DEVS_ACTIONS_TARGET, hasPlay: true },
      });
      const watch = await screen.findByRole('button', { name: REMOVE_DEVS });

      // Keyboard focus opens at once, so the short window can see it.
      await userEvent.tab();
      expect(watch).toHaveFocus();
      await waitNegativeClaim();
      expect(watch).not.toHaveAttribute('aria-describedby');
      await userEvent.tab({ shift: true });

      known.release();

      await settledButton(REMOVE_DEVS);
      await userEvent.hover(watch);
      await waitFor(() =>
        expect(watch).toHaveAccessibleDescription(
          '100% watched 8/8 eps — 11 plays',
        )
      );
    });

    it.each(
      [
        { state: 'before the history lands', fails: false },
        { state: 'after the history failed', fails: true },
      ],
    )(
      'should offer no add on a watched title $state',
      async ({ fails }) => {
        const answered = Promise.withResolvers<void>();
        const read = holdRequest({
          method: 'get',
          url: WATCHED_MOVIES_URL,
          answer: () => {
            answered.resolve();
            return notFound();
          },
        });
        renderComponent(QuickActions, {
          props: { target: HERETIC_ACTIONS_TARGET },
        });
        const watch = await screen.findByRole('button', {
          name: 'Mark "Heretic" as watched',
        });
        await read.requested;
        if (fails) {
          read.release();
          await answered.promise;
          // The failure reaches the store a moment after its answer.
          await waitNegativeClaim();
        }

        // Keyboard focus opens at once, so the short window can see it.
        await userEvent.tab();
        expect(watch).toHaveFocus();
        await waitNegativeClaim();

        expect(watch).not.toHaveAttribute('aria-describedby');
      },
    );

    it('should offer the add once the history knows the title has no Play', async () => {
      const read = holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });
      renderComponent(QuickActions, {
        props: { target: MATRIX_ACTIONS_TARGET },
      });
      await read.requested;

      read.release();

      const watch = await settledButton('Mark "The Matrix" as watched');
      await userEvent.tab();
      await waitFor(() =>
        expect(watch).toHaveAccessibleDescription('Add to watched history')
      );
    });

    it('should let the pointer through its text to the title under it', async () => {
      renderComponent(QuickActions, {
        props: { target: MATRIX_ACTIONS_TARGET },
      });
      const watch = await settledButton('Mark "The Matrix" as watched');

      await userEvent.hover(watch);
      await waitFor(() =>
        expect(watch).toHaveAccessibleDescription('Add to watched history')
      );

      const text = document.querySelector('.trakt-tooltip');
      expect(text).toHaveStyle({ pointerEvents: 'none' });
      expect(text?.parentElement).toHaveStyle({ pointerEvents: 'none' });
    });

    it('should still run the click of a hovered icon', async () => {
      const writes = recordBodies(SYNC_HISTORY_URL, { status: 201 });
      serveMoviePlays([]);
      renderComponent(QuickActions, {
        props: { target: MATRIX_ACTIONS_TARGET },
      });
      const watch = await settledButton('Mark "The Matrix" as watched');

      await userEvent.hover(watch);
      await waitFor(() =>
        expect(watch).toHaveAccessibleDescription('Add to watched history')
      );
      await userEvent.click(watch);

      await waitFor(() => expect(writes).toHaveLength(1));
    });
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
    serveMoviePlays([MATRIX_ACTIONS_TARGET.id]);
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
    { airDate: UNAIRED, when: 'unaired' },
    { airDate: null, when: 'with no air date' },
  ])('should render no watch icon for a Target $when', async ({ airDate }) => {
    serveMoviePlays([]);
    renderComponent(QuickActions, {
      props: { target: { ...MATRIX_ACTIONS_TARGET, airDate }, favorite: true },
    });
    const favorite = await screen.findByRole('button', {
      name: 'Add "The Matrix" to your Favorites',
    });

    await waitFor(() => expect(favorite).toHaveClass('is-blocked'));
    expect(
      screen.queryByRole('button', { name: 'Mark "The Matrix" as watched' }),
    ).toBeNull();
  });

  describe('a title with Plays and nothing aired, off History', () => {
    const REMOVE_HERETIC = 'Remove "Heretic" from your History';
    const REMOVE_DEVS = 'Remove "Devs" from your History';
    const REMOVE_DEVS_SEASON = 'Remove "Season 1 of Devs" from your History';
    const SHOW = {
      ...DEVS_ACTIONS_TARGET,
      airDate: null,
      episode: { count: 0 },
    };
    const SEASON = {
      ...DEVS_SEASON_ACTIONS_TARGET,
      airDate: UNAIRED,
      episodes: { count: 10, aired: 0 },
    };

    it.each([
      {
        kind: 'movie',
        target: { ...HERETIC_ACTIONS_TARGET, airDate: UNAIRED },
        name: REMOVE_HERETIC,
      },
      { kind: 'show', target: SHOW, name: REMOVE_DEVS },
      { kind: 'season', target: SEASON, name: REMOVE_DEVS_SEASON },
    ])(
      'should fill the icon of a $kind from its history',
      async ({ target, name }) => {
        renderComponent(QuickActions, { props: { target } });

        expect(await settledButton(name)).toHaveClass('is-selected');
      },
    );

    it.each([
      { kind: 'show', target: SHOW, name: REMOVE_DEVS },
      { kind: 'season', target: SEASON, name: REMOVE_DEVS_SEASON },
    ])(
      'should keep the icon of a $kind while the history refetches',
      async ({ target, name }) => {
        const hasWritten = { value: false };
        // Returning nothing hands the request on to the default handler.
        const refetch = holdResponse(() => undefined);
        server.use(
          http.post(SYNC_HISTORY_URL, () => {
            hasWritten.value = true;
            return new HttpResponse(null, { status: 201 });
          }),
          http.get(WATCHED_SHOWS_URL, () => {
            if (!hasWritten.value) return;
            return refetch.answer();
          }),
        );
        renderComponent(QuickActionsHost, {
          props: { targets: [target, UNPLAYED_SILO_SEASON] },
        });
        const icon = await settledButton(name);

        await userEvent.click(
          await settledButton('Mark "Season 1 of Silo" as watched'),
        );
        await answerDialog('Mark as watched?', 'Mark as Watched');
        await refetch.requested;
        await waitFor(() =>
          expect(icon).toHaveAttribute('aria-disabled', 'true')
        );

        expect(screen.getByRole('button', { name })).toBe(icon);
        expect(icon).toHaveClass('is-selected');
      },
    );
  });

  it("should show a watched episode selected, with its show's favourite state", async () => {
    renderComponent(QuickActions, {
      props: { target: SILO_EPISODE_ACTIONS_TARGET, favorite: true },
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
    const bodies = recordBodies(SYNC_FAVORITES_REMOVE_URL);
    renderComponent(QuickActions, {
      props: { target: SILO_EPISODE_ACTIONS_TARGET, favorite: true },
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
        props: { target: UNPLAYED_SILO_SEASON },
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
      const bodies = recordBodies(SYNC_HISTORY_URL, { status: 201 });
      renderComponent(QuickActions, {
        props: { target: UNPLAYED_SILO_SEASON },
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
      const bodies = recordBodies(SYNC_FAVORITES_REMOVE_URL);
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

  describe("the favourite's Play gate", () => {
    const BLOCKED_REASON = 'Watch it first to favorite it';

    // Its show's watched history holds plays of other seasons only.
    const DEVS_SECOND_SEASON: QuickActionsTarget = {
      ...DEVS_SEASON_ACTIONS_TARGET,
      id: 1002,
      title: 'Season 2 of Devs',
      number: 2,
    };

    const UNPLAYED_EPISODE: QuickActionsTarget = {
      type: 'episode',
      id: 99,
      title: 'Pilot',
      season: 1,
      number: 1,
      show: UNPLAYED_SHOW,
      airDate: AIRED,
    };

    it.each([
      { card: 'a movie with no Play', target: MATRIX_ACTIONS_TARGET },
      { card: 'an episode of a show with none', target: UNPLAYED_EPISODE },
    ])(
      'should block adding $card, describing why, and send nothing on a click',
      async ({ target }) => {
        const writes = recordWrites();
        renderComponent(QuickActions, { props: { target, favorite: true } });
        const icon = await screen.findByRole('button', {
          name: /to your Favorites/,
        });
        await waitFor(() =>
          expect(icon).toHaveAttribute('title', BLOCKED_REASON)
        );

        await userEvent.click(icon);

        await waitNegativeClaim();
        expect(writes).toEqual([]);
        expect(icon).toHaveFocus();
        expect(icon).toHaveAttribute('aria-disabled', 'true');
        expect(icon).toHaveClass('is-blocked');
        expect(icon).toHaveAccessibleDescription(BLOCKED_REASON);
      },
    );

    it.each([
      {
        card: 'a movie once it has a Play',
        target: MATRIX_ACTIONS_TARGET,
        name: 'Add "The Matrix" to your Favorites',
      },
      {
        card: "a season's show once another of its seasons has a Play",
        target: DEVS_SECOND_SEASON,
        name: 'Add "Devs" to your Favorites',
      },
    ])('should add $card', async ({ target, name }) => {
      serveMoviePlays([MATRIX_ACTIONS_TARGET.id]);
      const writes = recordWrites();
      renderComponent(QuickActions, { props: { target, favorite: true } });

      await userEvent.click(await settledButton(name));

      await waitFor(() => expect(writes).toEqual(['POST /sync/favorites']));
      expect(button(name)).not.toHaveAttribute('title');
    });

    it('should remove a favourite with no Play', async () => {
      serveMoviePlays([]);
      const writes = recordWrites();
      renderComponent(QuickActions, {
        props: { target: HERETIC_ACTIONS_TARGET, favorite: true },
      });

      await userEvent.click(
        await settledButton('Remove "Heretic" from your Favorites'),
      );

      await waitFor(() =>
        expect(writes).toEqual(['POST /sync/favorites/remove'])
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
