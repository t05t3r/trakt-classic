import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { time } from '$lib/utils/timing/time.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import {
  InvalidateAction,
  type InvalidateActionOptions,
} from '$lib/requests/models/InvalidateAction.ts';
import { DEVS_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_ACTIONS_TARGET.ts';
import { DEVS_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/DEVS_SEASON_ACTIONS_TARGET.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { MATRIX_ACTIONS_TARGET } from '$mocks/data/media-actions/MATRIX_ACTIONS_TARGET.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_EPISODE_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_EPISODE_ACTIONS_TARGET.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { SYNC_FAVORITES_REMOVE_URL } from '$mocks/data/sync/SYNC_FAVORITES_REMOVE_URL.ts';
import { SYNC_HISTORY_REMOVE_URL } from '$mocks/data/sync/SYNC_HISTORY_REMOVE_URL.ts';
import { SYNC_HISTORY_URL } from '$mocks/data/sync/SYNC_HISTORY_URL.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { applyDateField } from '$test/beds/forms/applyDateField.ts';
import { dateField } from '$test/beds/forms/dateField.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { readMenuRows } from '$test/beds/menus/readMenuRows.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import ActionColumnHost from '$test/beds/media-actions/ActionColumnHost.svelte';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { serveHeaderlessPages } from '$test/beds/request/serveHeaderlessPages.ts';
import { serveMoviePlays } from '$test/beds/media-actions/serveMoviePlays.ts';
import { bodyUnlocked } from '$test/beds/scroll-lock/bodyUnlocked.ts';
import { fireEvent, screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import ActionColumn from './ActionColumn.svelte';
import type { QuickActionsTarget } from './QuickActionsProps.ts';

const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const UNAIRED = new Date(Date.now() + time.weeks(1));

const EARLIER_PLAYS = ['2024-11-15T20:00:00.000Z', '2024-12-01T20:00:00.000Z'];
const LATEST_PLAY = '2025-05-09T21:14:00.000Z';
const THREE_PLAYS = [...EARLIER_PLAYS, LATEST_PLAY];

// The dates and times of the mocked history's plays.
const HERETIC_PLAYED = '27 Dec 2024 16:15';
const SILO_PLAYED = '27 Dec 2024 16:13';
const DEVS_PLAYED = '27 Dec 2024 16:28';

const REMOVE_PROMPT = 'Remove from history?';
const DROP_PROMPT = 'When did you drop this?';
const WATCH_PROMPT = 'When did you watch this?';

const NOT_WATCHED = {
  label: 'Add to history',
  underInfo: undefined,
  selected: false,
};

const progressOf = (completed: number, total: number) => ({
  kind: 'ready' as const,
  data: { completed, total },
});
const LOADING = { kind: 'loading' } as const;
const EMPTY = { kind: 'empty' } as const;
const FAILED = { kind: 'error', retry: () => undefined } as const;

// Its show's watched history holds one play of its one special.
const DEVS_SPECIALS_TARGET: QuickActionsTarget = {
  type: 'season',
  id: 1000,
  title: 'Specials of Devs',
  number: 0,
  episodes: { count: 1, aired: 1 },
  airDate: AIRED,
  show: { id: DEVS.id, title: 'Devs' },
};

const serveNoShowPlays = () =>
  serveHeaderlessPages({ url: WATCHED_SHOWS_URL, pages: [{}] });

const mainOf = (container: HTMLElement, index: number) => {
  const main = container.querySelectorAll('.action-button-main').item(index);
  if (!(main instanceof HTMLButtonElement)) {
    throw new Error(`No action button at ${index}`);
  }
  return main;
};

// A known state reads `aria-disabled` false.
const settledMain = async (container: HTMLElement, index: number) => {
  await waitFor(() =>
    expect(mainOf(container, index)).toHaveAttribute('aria-disabled', 'false')
  );
  return mainOf(container, index);
};

// The side controls ignore a press until their state is known.
async function settledSide(name: string) {
  const control = await screen.findByRole('button', { name });
  await waitFor(() =>
    expect(control).not.toHaveAttribute('aria-disabled', 'true')
  );
  return control;
}

const MORE = 'More actions';

const openMore = async () => {
  await userEvent.click(await settledSide(MORE));
  return screen.findByRole('menu', { name: MORE });
};

const readMoreRows = async () => {
  await openMore();
  return readMenuRows();
};

const pathOf = (url: string) => new URL(url).pathname;

const applyField = async (name: string, value?: string) => {
  await waitFor(() => expect(dateField(name)).toHaveFocus());
  if (value) await fireEvent.input(dateField(name), { target: { value } });
  await applyDateField();
};

const historyButton = (container: HTMLElement) => readButtons(container).at(0);

const readButtons = (container: HTMLElement) =>
  [...container.querySelectorAll('.trakt-action-button')].map((button) => ({
    label: button.querySelector('.action-button-label')?.textContent?.trim(),
    underInfo: button.querySelector('.action-button-under-info')?.textContent
      ?.trim(),
    selected: button.classList.contains('is-selected'),
    bar: button.querySelector('[role="progressbar"]')
      ?.getAttribute('aria-valuenow') ?? undefined,
  }));

describe('component: ActionColumn', () => {
  beforeEach(() => {
    stubClientRects();
    setLayout('desktop');
  });

  it.each([
    {
      target: HERETIC_ACTIONS_TARGET,
      buttons: [
        { label: '1 play', underInfo: HERETIC_PLAYED, selected: true },
        { label: 'Add to watchlist', underInfo: undefined, selected: false },
        { label: 'Favorited', underInfo: 'Added 16 Jan 2025', selected: true },
      ],
    },
    {
      target: MATRIX_ACTIONS_TARGET,
      buttons: [
        { label: 'Add to history', underInfo: undefined, selected: false },
        {
          label: 'In watchlist',
          underInfo: 'Added 1 Jan 2024',
          selected: true,
        },
        { label: 'Add to Favorites', underInfo: undefined, selected: false },
      ],
    },
  ])(
    "should label and fill $target.title's history, watchlist and favorites from the stores",
    async ({ target, buttons }) => {
      const { container } = renderComponent(ActionColumn, {
        props: { target, favorite: true },
      });

      await waitFor(() => expect(readButtons(container)).toEqual(buttons));
    },
  );

  describe('a Target that has not aired', () => {
    const UNPLAYED = [
      {
        target: { ...MATRIX_ACTIONS_TARGET, airDate: UNAIRED },
        name: 'an unaired movie',
      },
      {
        target: { ...SILO_EPISODE_ACTIONS_TARGET, airDate: UNAIRED },
        name: 'an unaired episode',
      },
      {
        target: { ...SILO_ACTIONS_TARGET, airDate: UNAIRED },
        name: 'an unaired show',
      },
      {
        target: { ...SILO_ACTIONS_TARGET, airDate: null },
        name: 'a show with no air date',
      },
      {
        target: { ...SILO_ACTIONS_TARGET, episode: { count: 0 } },
        name: 'a show with no aired episode',
      },
      {
        target: { ...SILO_SEASON_ACTIONS_TARGET, airDate: UNAIRED },
        name: 'an unaired season',
      },
      {
        target: {
          ...SILO_SEASON_ACTIONS_TARGET,
          episodes: { count: 10, aired: 0 },
        },
        name: 'a season with no aired episode',
      },
    ];

    it.each(UNPLAYED)(
      'should offer no history button or its side icons on $name with no Play',
      async ({ target }) => {
        serveMoviePlays([]);
        serveNoShowPlays();
        const { container } = renderComponent(ActionColumn, {
          props: { target, favorite: true },
        });

        await settledMain(container, 0);
        await waitNegativeClaim();

        expect(readButtons(container).map(({ label }) => label)).not.toContain(
          'Add to history',
        );
        expect(screen.queryByRole('button', { name: 'Add another play' }))
          .toBeNull();
        expect(screen.queryByRole('button', { name: MORE })).toBeNull();
      },
    );

    it.each([
      {
        target: { ...HERETIC_ACTIONS_TARGET, airDate: UNAIRED },
        name: 'an unaired movie',
        label: '1 play',
      },
      {
        target: { ...SILO_EPISODE_ACTIONS_TARGET, airDate: UNAIRED },
        name: 'an unaired episode',
        label: '1 play',
      },
      {
        target: { ...SILO_ACTIONS_TARGET, episode: { count: 0 } },
        name: 'a show with no aired episode',
        label: '1 play',
      },
      {
        target: {
          ...SILO_SEASON_ACTIONS_TARGET,
          episodes: { count: 10, aired: 0 },
        },
        name: 'a season with no aired episode',
        label: '1 play',
      },
    ])(
      'should keep the history button on $name that has a Play',
      async ({ target, label }) => {
        const { container } = renderComponent(ActionColumn, {
          props: { target },
        });

        await waitFor(() =>
          expect(historyButton(container)).toMatchObject({
            label,
            selected: true,
          })
        );
      },
    );
  });

  describe('the side strip', () => {
    const sideIcons = (container: HTMLElement) =>
      [...container.querySelectorAll('.trakt-action-button')].at(0)
        ?.querySelectorAll('.trakt-action-side-icon');

    const iconLabels = (container: HTMLElement) =>
      [...(sideIcons(container) ?? [])].map((icon) =>
        icon.getAttribute('aria-label')
      );

    const PLAYED_MOVIE = { target: HERETIC_ACTIONS_TARGET };
    const PLAYED_SHOW = {
      target: SILO_ACTIONS_TARGET,
      progress: progressOf(4, 10),
    };

    it.each([
      {
        name: 'a movie with a Play',
        props: PLAYED_MOVIE,
        icons: ['Add another play', 'More actions'],
      },
      {
        name: 'an episode with a Play',
        props: { target: SILO_EPISODE_ACTIONS_TARGET },
        icons: ['Add another play', 'More actions'],
      },
      {
        name: 'a show with episodes watched',
        props: PLAYED_SHOW,
        icons: ['Add another play', 'More actions'],
      },
      {
        name: 'a dropped show',
        props: { target: DEVS_ACTIONS_TARGET, progress: progressOf(3, 8) },
        icons: ['Add another play', 'More actions'],
      },
      {
        name: 'a season with episodes watched',
        props: {
          target: SILO_SEASON_ACTIONS_TARGET,
          progress: progressOf(4, 10),
        },
        icons: ['Add another play', 'More actions'],
      },
      {
        name: 'an unaired movie with a Play',
        props: { target: { ...HERETIC_ACTIONS_TARGET, airDate: UNAIRED } },
        icons: ['More actions'],
      },
      {
        name: 'an unaired episode with a Play',
        props: { target: { ...SILO_EPISODE_ACTIONS_TARGET, airDate: UNAIRED } },
        icons: ['More actions'],
      },
      {
        name: 'a show with a Play and no aired episode',
        props: { target: { ...SILO_ACTIONS_TARGET, episode: { count: 0 } } },
        icons: ['More actions'],
      },
      {
        name: 'a season with a Play and no aired episode',
        props: {
          target: {
            ...SILO_SEASON_ACTIONS_TARGET,
            episodes: { count: 10, aired: 0 },
          },
        },
        icons: ['More actions'],
      },
    ])('should offer $icons on $name', async ({ props, icons }) => {
      const { container } = renderComponent(ActionColumn, { props });

      await waitFor(() => expect(iconLabels(container)).toEqual(icons));
    });

    it.each([
      { name: 'a movie', target: MATRIX_ACTIONS_TARGET },
      { name: 'a show', target: SILO_ACTIONS_TARGET },
    ])(
      'should offer only the add icon on $name with no Play',
      async ({ target }) => {
        serveMoviePlays([]);
        serveNoShowPlays();
        const { container } = renderComponent(ActionColumn, {
          props: { target },
        });

        await settledMain(container, 0);
        await waitNegativeClaim();

        expect(iconLabels(container)).toEqual(['Add another play']);
      },
    );

    it('should offer no more icon while the progress loads', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: { target: SILO_ACTIONS_TARGET, progress: LOADING },
      });

      await waitNegativeClaim();

      expect(iconLabels(container)).toEqual(['Add another play']);
    });
  });

  describe('the first load', () => {
    it.each([
      {
        name: 'a movie, before the history is in',
        target: HERETIC_ACTIONS_TARGET,
        progress: undefined,
        heldUrl: WATCHED_MOVIES_URL,
      },
      {
        name: 'an episode, before the history is in',
        target: SILO_EPISODE_ACTIONS_TARGET,
        progress: undefined,
        heldUrl: WATCHED_SHOWS_URL,
      },
      {
        name: 'a show, before its progress is in',
        target: SILO_ACTIONS_TARGET,
        progress: LOADING,
        heldUrl: undefined,
      },
      {
        name: 'a season, before its progress is in',
        target: SILO_SEASON_ACTIONS_TARGET,
        progress: LOADING,
        heldUrl: undefined,
      },
    ])(
      'should read outlined Add to history, and ignore a click, on $name',
      async ({ target, progress, heldUrl }) => {
        if (heldUrl) holdRequest({ method: 'get', url: heldUrl });
        const writes = recordWrites();
        const { container } = renderComponent(ActionColumn, {
          props: { target, progress },
        });
        await settledMain(container, 1);

        await userEvent.click(mainOf(container, 0));
        await waitNegativeClaim();

        expect(historyButton(container)).toEqual(NOT_WATCHED);
        expect(mainOf(container, 0)).toHaveAttribute('aria-disabled', 'true');
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(writes).toEqual([]);
      },
    );
  });

  describe('just after an add', () => {
    it.each([
      {
        name: 'a movie',
        target: MATRIX_ACTIONS_TARGET,
        progress: undefined,
        confirm: false,
      },
      {
        name: 'an episode',
        target: SILO_EPISODE_ACTIONS_TARGET,
        progress: undefined,
        confirm: false,
      },
      {
        name: 'a show',
        target: SILO_ACTIONS_TARGET,
        progress: progressOf(0, 17),
        confirm: true,
      },
      {
        name: 'a season',
        target: SILO_SEASON_ACTIONS_TARGET,
        progress: progressOf(0, 10),
        confirm: true,
      },
    ])(
      'should fill $name at once and read Watched with no under line',
      async ({ target, progress, confirm }) => {
        serveNoShowPlays();
        const write = holdRequest({
          method: 'post',
          url: SYNC_HISTORY_URL,
          answer: () => new HttpResponse(null, { status: 201 }),
        });
        const { container } = renderComponent(ActionColumn, {
          props: { target, progress },
        });

        await userEvent.click(await settledMain(container, 0));
        if (confirm) await answerDialog('Mark as watched?', 'Mark as Watched');
        await write.requested;

        expect(historyButton(container)).toEqual({
          label: 'Watched',
          underInfo: undefined,
          selected: true,
        });
      },
    );

    it('should read the refreshed counts once they arrive', async () => {
      serveMoviePlays([]);
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_URL,
        answer: () => {
          serveMoviePlays([MATRIX_ACTIONS_TARGET.id]);
          return new HttpResponse(null, { status: 201 });
        },
      });
      const { container } = renderComponent(ActionColumn, {
        props: { target: MATRIX_ACTIONS_TARGET },
      });

      await userEvent.click(await settledMain(container, 0));
      await write.requested;
      write.release();

      await waitFor(() =>
        expect(historyButton(container)).toEqual({
          label: '1 play',
          underInfo: '27 Dec 2024 16:15',
          selected: true,
        })
      );
    });
  });

  describe('just after a remove', () => {
    it.each([
      {
        name: 'a movie',
        target: HERETIC_ACTIONS_TARGET,
        progress: undefined,
      },
      {
        name: 'an episode',
        target: SILO_EPISODE_ACTIONS_TARGET,
        progress: undefined,
      },
      {
        name: 'a show',
        target: SILO_ACTIONS_TARGET,
        progress: progressOf(11, 17),
      },
      {
        name: 'a season',
        target: SILO_SEASON_ACTIONS_TARGET,
        progress: progressOf(4, 10),
      },
    ])(
      'should outline $name at once and read Add to history',
      async ({ target, progress }) => {
        const write = holdRequest({
          method: 'post',
          url: SYNC_HISTORY_REMOVE_URL,
          answer: () => new HttpResponse(null, { status: 200 }),
        });
        const { container } = renderComponent(ActionColumn, {
          props: { target, progress },
        });

        await userEvent.click(await settledMain(container, 0));
        await answerDialog('Remove from history?', 'Remove from History');
        await write.requested;

        expect(historyButton(container)).toEqual(NOT_WATCHED);
      },
    );
  });

  describe("a movie's or episode's history button", () => {
    it.each([
      {
        name: 'movie',
        target: MATRIX_ACTIONS_TARGET,
      },
      {
        name: 'episode',
        target: SILO_EPISODE_ACTIONS_TARGET,
      },
    ])(
      'should read Add to history on a $name with no Play, and add one at once',
      async ({ target }) => {
        serveNoShowPlays();
        const bodies = recordBodies(SYNC_HISTORY_URL, { status: 201 });
        const { container } = renderComponent(ActionColumn, {
          props: { target },
        });
        const main = await settledMain(container, 0);

        expect(historyButton(container)).toEqual(NOT_WATCHED);

        await userEvent.click(main);

        await waitFor(() => expect(bodies).toHaveLength(1));
        expect(screen.queryByRole('dialog')).toBeNull();
      },
    );

    it.each([
      {
        name: 'movie',
        target: HERETIC_ACTIONS_TARGET,
        played: HERETIC_PLAYED,
      },
      {
        name: 'episode',
        target: SILO_EPISODE_ACTIONS_TARGET,
        played: SILO_PLAYED,
      },
    ])(
      'should read 1 play and its date on a $name, and confirm a remove',
      async ({ target, played }) => {
        const { container } = renderComponent(ActionColumn, {
          props: { target },
        });

        const main = await settledMain(container, 0);
        await userEvent.click(main);

        expect(historyButton(container)).toEqual({
          label: '1 play',
          underInfo: played,
          selected: true,
        });
        expect(
          await screen.findByRole('dialog', { name: 'Remove from history?' }),
        ).toBeVisible();
      },
    );

    it.each([
      {
        name: 'movie',
        target: HERETIC_ACTIONS_TARGET,
        serve: () =>
          serveHeaderlessPages({
            url: WATCHED_MOVIES_URL,
            pages: [{ [HERETIC_ACTIONS_TARGET.id]: THREE_PLAYS }],
          }),
      },
      {
        name: 'episode',
        target: SILO_EPISODE_ACTIONS_TARGET,
        serve: () =>
          serveHeaderlessPages({
            url: WATCHED_SHOWS_URL,
            pages: [{
              [SILO.id]: {
                [`102|${SILO_EPISODE_ACTIONS_TARGET.season}`]: {
                  [SILO_EPISODE_ACTIONS_TARGET.id]: THREE_PLAYS,
                },
              },
            }],
          }),
      },
    ])(
      "should read a $name's several plays and the latest one's date and time",
      async ({ target, serve }) => {
        serve();
        const { container } = renderComponent(ActionColumn, {
          props: { target },
        });

        await waitFor(() =>
          expect(historyButton(container)).toEqual({
            label: '3 plays',
            underInfo: '9 May 2025 21:14',
            selected: true,
          })
        );

        await userEvent.click(await settledMain(container, 0));

        expect(await screen.findByRole('dialog', { name: REMOVE_PROMPT }))
          .toBeVisible();
      },
    );
  });

  describe("a show's history button", () => {
    it.each([
      { progress: progressOf(0, 17), when: 'reads no episode watched' },
      { progress: EMPTY, when: 'reads empty' },
      { progress: FAILED, when: 'failed to load' },
      { progress: undefined, when: 'is not given' },
    ])(
      'should read Add to history with no Play when its progress $when',
      async ({ progress }) => {
        serveNoShowPlays();
        const { container } = renderComponent(ActionColumn, {
          props: { target: SILO_ACTIONS_TARGET, progress },
        });

        await settledMain(container, 0);

        expect(historyButton(container)).toEqual(NOT_WATCHED);
      },
    );

    it('should add every aired episode, with a confirm, with no Play', async () => {
      serveNoShowPlays();
      const { container } = renderComponent(ActionColumn, {
        props: { target: SILO_ACTIONS_TARGET, progress: progressOf(0, 17) },
      });

      await userEvent.click(await settledMain(container, 0));

      expect(await screen.findByRole('dialog', { name: 'Mark as watched?' }))
        .toBeVisible();
    });

    it.each([
      {
        row: 'partly watched',
        progress: progressOf(25, 30),
        button: {
          label: '83% watched',
          underInfo: '25/30 eps — 1 play',
          selected: true,
          bar: '83',
        },
      },
      {
        row: 'complete',
        progress: progressOf(30, 30),
        button: {
          label: '100% watched',
          underInfo: '30/30 eps — 1 play',
          selected: true,
          bar: '100',
        },
      },
      {
        row: 'with an episode watched and no total',
        progress: progressOf(1, 0),
        button: {
          label: '1 play',
          underInfo: SILO_PLAYED,
          selected: true,
        },
      },
      {
        row: 'with Plays and no episode counted',
        progress: progressOf(0, 17),
        button: {
          label: '1 play',
          underInfo: SILO_PLAYED,
          selected: true,
        },
      },
      {
        row: 'with an empty progress',
        progress: EMPTY,
        button: {
          label: '1 play',
          underInfo: SILO_PLAYED,
          selected: true,
        },
      },
      {
        row: 'with a failed progress',
        progress: FAILED,
        button: {
          label: '1 play',
          underInfo: SILO_PLAYED,
          selected: true,
        },
      },
      {
        row: 'with no progress given',
        progress: undefined,
        button: {
          label: '1 play',
          underInfo: SILO_PLAYED,
          selected: true,
        },
      },
    ])('should fill and read a show $row', async ({ progress, button }) => {
      const { container } = renderComponent(ActionColumn, {
        props: { target: SILO_ACTIONS_TARGET, progress },
      });

      await settledMain(container, 0);

      expect(historyButton(container)).toEqual(button);
    });

    it.each([
      {
        row: 'with progress',
        progress: progressOf(6, 8),
        button: {
          label: '75% watched',
          underInfo: '6/8 eps — 11 plays · Dropped',
          selected: true,
          bar: '75',
        },
      },
      {
        row: 'complete',
        progress: progressOf(8, 8),
        button: {
          label: '100% watched',
          underInfo: '8/8 eps — 11 plays · Dropped',
          selected: true,
          bar: '100',
        },
      },
      {
        row: 'with an empty progress',
        progress: EMPTY,
        button: { label: '11 plays', underInfo: 'Dropped', selected: true },
      },
      {
        row: 'with a failed progress',
        progress: FAILED,
        button: { label: '11 plays', underInfo: 'Dropped', selected: true },
      },
    ])(
      'should fill and read a dropped show $row, and remove all its Plays with the count dialog',
      async ({ progress, button }) => {
        const { container } = renderComponent(ActionColumn, {
          props: { target: DEVS_ACTIONS_TARGET, progress },
        });
        await settledSide(MORE);
        await waitFor(() => expect(historyButton(container)).toEqual(button));

        await userEvent.click(await settledMain(container, 0));

        const dialog = await screen.findByRole('dialog', {
          name: 'Remove from history?',
        });
        expect(
          within(dialog).getByText(
            'Remove all 11 plays of "Devs" from your history?',
          ),
        ).toBeVisible();
      },
    );

    it.each([
      { progress: progressOf(25, 30), row: 'partly watched' },
      { progress: progressOf(30, 30), row: 'complete' },
      { progress: EMPTY, row: 'with an empty progress' },
      { progress: FAILED, row: 'with a failed progress' },
      { progress: undefined, row: 'with no progress given' },
    ])(
      'should remove all Plays, with the count dialog, from a show $row',
      async ({ progress }) => {
        const bodies = recordBodies(SYNC_HISTORY_REMOVE_URL);
        const { container } = renderComponent(ActionColumn, {
          props: { target: SILO_ACTIONS_TARGET, progress },
        });

        await userEvent.click(await settledMain(container, 0));
        await answerDialog('Remove from history?', 'Remove from History');

        await waitFor(() =>
          expect(bodies).toEqual([{ shows: [{ ids: { trakt: SILO.id } }] }])
        );
      },
    );

    it('should read the counts with no plays part, and stay inert, while the Plays are not known', async () => {
      holdRequest({ method: 'get', url: WATCHED_SHOWS_URL });
      const writes = recordWrites();
      const { container } = renderComponent(ActionColumn, {
        props: { target: SILO_ACTIONS_TARGET, progress: progressOf(25, 30) },
      });
      await settledMain(container, 1);

      await userEvent.click(mainOf(container, 0));
      await waitNegativeClaim();

      expect(historyButton(container)).toEqual({
        label: '83% watched',
        underInfo: '25/30 eps',
        selected: true,
        bar: '83',
      });
      expect(mainOf(container, 0)).toHaveAttribute('aria-disabled', 'true');
      expect(writes).toEqual([]);
    });

    it('should read the counts with no plays part while the Plays read 0, and say the history changed on a click', async () => {
      serveNoShowPlays();
      const writes = recordWrites();
      const { container } = renderComponent(ActionColumn, {
        props: { target: SILO_ACTIONS_TARGET, progress: progressOf(25, 30) },
      });
      const main = await settledMain(container, 0);

      expect(historyButton(container)).toEqual({
        label: '83% watched',
        underInfo: '25/30 eps',
        selected: true,
        bar: '83',
      });

      await userEvent.click(main);

      expect(
        within(await screen.findByRole('status')).getByText(
          'Your history changed. Try again.',
        ),
      ).toBeVisible();
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(writes).toEqual([]);
    });

    it('should stay inert, and start nothing on a click, before progress is in', async () => {
      const writes = recordWrites();
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count: 1 } },
          progress: LOADING,
        },
      });
      await settledMain(container, 1);

      await userEvent.click(mainOf(container, 0));
      await waitNegativeClaim();

      expect(mainOf(container, 0)).toHaveAttribute('aria-disabled', 'true');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(writes).toEqual([]);
    });

    it('should stay inert on a dropped show before progress is in', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: { target: DEVS_ACTIONS_TARGET, progress: LOADING },
      });
      await settledMain(container, 1);
      await settledSide(MORE);
      await waitNegativeClaim();

      expect(mainOf(container, 0)).toHaveAttribute('aria-disabled', 'true');
    });

    it('should turn live once progress comes in', async () => {
      const target = { ...SILO_ACTIONS_TARGET, episode: { count: 1 } };
      const { container, rerender } = renderComponent(ActionColumn, {
        props: { target, progress: LOADING },
      });
      await settledMain(container, 1);
      const before = mainOf(container, 0).getAttribute('aria-disabled');

      await rerender({ target, progress: progressOf(11, 17) });

      expect(before).toBe('true');
      expect(await settledMain(container, 0)).toBeEnabled();
      expect(historyButton(container)).toEqual({
        label: '64% watched',
        underInfo: '11/17 eps — 1 play',
        selected: true,
        bar: '64',
      });
    });

    it("should read the add's value while it writes, and Add to history while it counts the episodes", async () => {
      serveNoShowPlays();
      const read = holdRequest({
        method: 'get',
        url: SILO_PROGRESS_URL,
        answer: () => HttpResponse.json(ShowSiloProgressResponseMock),
      });
      const write = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_URL,
        answer: () => new HttpResponse(null, { status: 201 }),
      });
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: SILO_ACTIONS_TARGET,
          progress: progressOf(0, 17),
        },
      });

      await userEvent.click(await settledMain(container, 0));
      await read.requested;
      const whileCounting = historyButton(container);
      read.release();
      await answerDialog('Mark as watched?', 'Mark as Watched');
      await write.requested;
      const whileWriting = historyButton(container);
      write.release();

      expect(whileCounting).toMatchObject({
        label: 'Add to history',
        selected: false,
      });
      expect(whileWriting).toMatchObject({ label: 'Watched', selected: true });
    });

    it.each([
      { progress: progressOf(0, 17), when: 'with no episode watched' },
      { progress: EMPTY, when: 'whose progress reads no plays' },
      { progress: FAILED, when: 'whose progress failed to load' },
    ])('should offer no Drop show on a show $when', async ({ progress }) => {
      renderComponent(ActionColumn, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count: 1 } },
          progress,
        },
      });

      expect(await readMoreRows()).toEqual(['View history']);
    });
  });

  describe("the history button's more menu", () => {
    const PARTLY_WATCHED = {
      target: { ...SILO_ACTIONS_TARGET, episode: { count: 1 } },
      progress: progressOf(11, 17),
    };
    const DROPPED_WITH_PLAYS = {
      target: DEVS_ACTIONS_TARGET,
      progress: progressOf(3, 8),
    };
    const DROPPED_NO_PLAY = {
      target: DEVS_ACTIONS_TARGET,
      progress: progressOf(0, 8),
    };
    const DROP_WRITE = `POST ${pathOf(DROP_URL)}`;
    const RESTORE_WRITE = `POST ${pathOf(RESTORE_URL)}`;

    const moreTrigger = () => screen.getByRole('button', { name: MORE });
    const openRestoreDialog = async () => {
      await openMore();
      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Restore show' }),
      );
    };

    it('should read View history, then Drop show, on a partly watched show', async () => {
      renderComponent(ActionColumn, { props: PARTLY_WATCHED });

      expect(await readMoreRows()).toEqual(['View history', 'Drop show']);
    });

    it('should read View history, then Restore show, on a dropped show with Plays, and keep its Dropped line', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: DROPPED_WITH_PLAYS,
      });

      expect(await readMoreRows()).toEqual(['View history', 'Restore show']);
      expect(historyButton(container)?.underInfo)
        .toBe('3/8 eps — 11 plays · Dropped');
    });

    it('should read View history, then Restore show, on a dropped show with no episode watched', async () => {
      renderComponent(ActionColumn, { props: DROPPED_NO_PLAY });

      expect(await readMoreRows()).toEqual(['View history', 'Restore show']);
    });

    it('should hold only Restore show on a dropped show with no Play', async () => {
      serveNoShowPlays();
      renderComponent(ActionColumn, { props: DROPPED_NO_PLAY });

      expect(await readMoreRows()).toEqual(['Restore show']);
    });

    it.each([
      { name: 'a movie', props: { target: HERETIC_ACTIONS_TARGET } },
      { name: 'an episode', props: { target: SILO_EPISODE_ACTIONS_TARGET } },
      {
        name: 'a season',
        props: {
          target: SILO_SEASON_ACTIONS_TARGET,
          progress: progressOf(4, 10),
        },
      },
      {
        name: 'a season of a dropped show',
        props: {
          target: DEVS_SEASON_ACTIONS_TARGET,
          progress: progressOf(8, 8),
        },
      },
    ])('should hold only View history on $name', async ({ props }) => {
      renderComponent(ActionColumn, { props });

      expect(await readMoreRows()).toEqual(['View history']);
    });

    it('should keep the menu, with no add icon, on a show with a Play and no aired episode', async () => {
      renderComponent(ActionColumn, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count: 0 } },
          progress: progressOf(1, 1),
        },
      });

      expect(await readMoreRows()).toEqual(['View history', 'Drop show']);
      expect(screen.queryByRole('button', { name: 'Add another play' }))
        .toBeNull();
    });

    it('should drop the show at the date its field applies, and at no other time', async () => {
      const bodies = recordBodies(DROP_URL, { status: 201 });
      const writes = recordWrites();
      renderComponent(ActionColumn, { props: PARTLY_WATCHED });
      await openMore();

      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Drop show' }),
      );
      await waitNegativeClaim();

      expect(writes).toEqual([]);

      await applyField(DROP_PROMPT, '2026-01-15T12:00');

      await waitFor(() => expect(writes).toEqual([DROP_WRITE]));
      expect(bodies).toEqual([{
        shows: [{
          ids: { trakt: SILO.id },
          hidden_at: '2026-01-15T12:00:00.000Z',
        }],
      }]);
    });

    it('should write only once Restore show is confirmed', async () => {
      const bodies = recordBodies(RESTORE_URL);
      const writes = recordWrites();
      renderComponent(ActionColumn, { props: DROPPED_WITH_PLAYS });

      await openRestoreDialog();
      await screen.findByRole('dialog', { name: 'Restore this show?' });
      const whileAsked = [...writes];
      await answerDialog('Restore this show?', 'Yes, restore it!');

      await waitFor(() => expect(writes).toEqual([RESTORE_WRITE]));
      expect(whileAsked).toEqual([]);
      expect(bodies).toEqual([{ shows: [{ ids: { trakt: DEVS.id } }] }]);
    });

    it('should write nothing when Restore show is declined', async () => {
      const writes = recordWrites();
      renderComponent(ActionColumn, { props: DROPPED_WITH_PLAYS });

      await openRestoreDialog();
      await answerDialog('Restore this show?', 'No');
      await waitNegativeClaim();

      expect(writes).toEqual([]);
    });

    it('should offer View history alone while the dropped shows load', async () => {
      holdRequest({
        method: 'get',
        url: DROPPED_URL,
        answer: () => pagedResponse({ body: [] }),
      });
      const { container } = renderComponent(ActionColumn, {
        props: PARTLY_WATCHED,
      });
      await settledMain(container, 0);

      expect(await readMoreRows()).toEqual(['View history']);
    });

    it('should offer View history alone while a drop is saved', async () => {
      const saving = holdRequest({
        method: 'post',
        url: DROP_URL,
        answer: () => new HttpResponse(null, { status: 201 }),
      });
      renderComponent(ActionColumn, { props: PARTLY_WATCHED });
      await openMore();
      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Drop show' }),
      );
      await applyField(DROP_PROMPT);
      await saving.requested;
      await bodyUnlocked();

      expect(await readMoreRows()).toEqual(['View history']);
    });

    it('should offer View history alone while a restore is saved', async () => {
      const saving = holdRequest({
        method: 'post',
        url: RESTORE_URL,
        answer: () => new HttpResponse(null, { status: 200 }),
      });
      renderComponent(ActionColumn, { props: DROPPED_WITH_PLAYS });
      await openRestoreDialog();
      await answerDialog('Restore this show?', 'Yes, restore it!');
      await saving.requested;
      await bodyUnlocked();

      expect(await readMoreRows()).toEqual(['View history']);
    });

    it('should leave, with no Drop show to offer, while a removal of every Play is saved', async () => {
      const saving = holdRequest({
        method: 'post',
        url: SYNC_HISTORY_REMOVE_URL,
        answer: () => new HttpResponse(null, { status: 200 }),
      });
      const { container } = renderComponent(ActionColumn, {
        props: PARTLY_WATCHED,
      });

      await userEvent.click(await settledMain(container, 0));
      await answerDialog('Remove from history?', 'Remove from History');
      await saving.requested;

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: MORE })).toBeNull()
      );
    });

    it('should open from its trigger once the drop has saved', async () => {
      const bodies = recordBodies(DROP_URL, { status: 201 });
      renderComponent(ActionColumn, { props: PARTLY_WATCHED });
      await openMore();
      await userEvent.click(
        screen.getByRole('menuitem', { name: 'Drop show' }),
      );
      await applyField(DROP_PROMPT);
      await waitFor(() => expect(bodies).toHaveLength(1));
      await bodyUnlocked();

      expect(await openMore()).toBeVisible();
    });

    describe('where the focus lands', () => {
      it('should land on the field from Drop show, then return to the trigger on Apply', async () => {
        holdRequest({ method: 'post', url: DROP_URL });
        renderComponent(ActionColumn, { props: PARTLY_WATCHED });
        await openMenuFromKeyboard(await settledSide(MORE), 'View history');

        await userEvent.keyboard('{ArrowDown}{Enter}');
        await applyField(DROP_PROMPT);

        await waitFor(() => expect(moreTrigger()).toHaveFocus());
      });

      it('should return to the trigger once a restore that keeps the menu is confirmed', async () => {
        holdRequest({ method: 'post', url: RESTORE_URL });
        renderComponent(ActionColumn, { props: DROPPED_WITH_PLAYS });
        await openMenuFromKeyboard(await settledSide(MORE), 'View history');

        await userEvent.keyboard('{ArrowDown}{Enter}');
        await answerDialog('Restore this show?', 'Yes, restore it!');

        await waitFor(() => expect(moreTrigger()).toHaveFocus());
      });

      it.each(REMOVALS)(
        'should pass to the add icon when a restore empties the menu, where removal $removal',
        async ({ emulate }) => {
          emulate();
          serveNoShowPlays();
          holdRequest({ method: 'post', url: RESTORE_URL });
          renderComponent(ActionColumn, { props: DROPPED_NO_PLAY });
          await openMenuFromKeyboard(await settledSide(MORE), 'Restore show');

          await userEvent.keyboard('{Enter}');
          await answerDialog('Restore this show?', 'Yes, restore it!');

          await waitFor(() =>
            expect(screen.queryByRole('button', { name: MORE })).toBeNull()
          );
          await waitFor(() =>
            expect(screen.getByRole('button', { name: 'Add another play' }))
              .toHaveFocus()
          );
        },
      );

      it('should leave the focus alone when a menu empties after its restore was declined', async () => {
        serveNoShowPlays();
        holdRequest({ method: 'post', url: RESTORE_URL });
        const declined = renderComponent(ActionColumn, {
          props: DROPPED_NO_PLAY,
        });
        const accepted = renderComponent(ActionColumn, {
          props: DROPPED_NO_PLAY,
        });
        const moreOf = (container: HTMLElement) =>
          within(container).findByRole('button', { name: MORE });
        await settledMain(declined.container, 0);
        await settledMain(accepted.container, 0);

        await userEvent.click(await moreOf(declined.container));
        await userEvent.click(
          await screen.findByRole('menuitem', { name: 'Restore show' }),
        );
        await answerDialog('Restore this show?', 'No');
        await userEvent.click(await moreOf(accepted.container));
        await userEvent.click(
          await screen.findByRole('menuitem', { name: 'Restore show' }),
        );
        await answerDialog('Restore this show?', 'Yes, restore it!');

        const addOf = (container: HTMLElement) =>
          within(container).getByRole('button', { name: 'Add another play' });
        await waitFor(() => expect(addOf(accepted.container)).toHaveFocus());
        await waitNegativeClaim();
        expect(addOf(accepted.container)).toHaveFocus();
      });
    });
  });

  describe("a season's column", () => {
    it('should read Add to history, and add every aired episode with a confirm, on a progress entry with no episode watched', async () => {
      serveNoShowPlays();
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: SILO_SEASON_ACTIONS_TARGET,
          progress: progressOf(0, 10),
        },
      });
      const main = await settledMain(container, 0);

      expect(historyButton(container)).toEqual(NOT_WATCHED);

      await userEvent.click(main);

      expect(await screen.findByRole('dialog', { name: 'Mark as watched?' }))
        .toBeVisible();
    });

    it.each([
      {
        row: 'partly watched',
        progress: progressOf(4, 10),
        button: {
          label: '40% watched',
          underInfo: '4/10 eps — 1 play',
          selected: true,
          bar: '40',
        },
      },
      {
        row: 'complete',
        progress: progressOf(10, 10),
        button: {
          label: '100% watched',
          underInfo: '10/10 eps — 1 play',
          selected: true,
          bar: '100',
        },
      },
      {
        row: 'with an empty entry',
        progress: EMPTY,
        button: {
          label: '1 play',
          underInfo: SILO_PLAYED,
          selected: true,
        },
      },
      {
        row: 'with a failed entry',
        progress: FAILED,
        button: {
          label: '1 play',
          underInfo: SILO_PLAYED,
          selected: true,
        },
      },
    ])(
      'should fill and read a season $row, and remove with the count dialog',
      async ({ progress, button }) => {
        const { container } = renderComponent(ActionColumn, {
          props: { target: SILO_SEASON_ACTIONS_TARGET, progress },
        });
        const main = await settledMain(container, 0);

        expect(historyButton(container)).toEqual(button);

        await userEvent.click(main);

        expect(
          await screen.findByRole('dialog', { name: 'Remove from history?' }),
        ).toBeVisible();
      },
    );

    it("should count the season's own Plays, and never read Dropped or offer Drop or Restore, on a dropped show", async () => {
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: DEVS_SEASON_ACTIONS_TARGET,
          progress: progressOf(8, 8),
        },
      });
      await settledMain(container, 0);
      await waitNegativeClaim();

      expect(historyButton(container)).toEqual({
        label: '100% watched',
        underInfo: '8/8 eps — 10 plays',
        selected: true,
        bar: '100',
      });
      expect(await readMoreRows()).toEqual(['View history']);
    });

    it('should read the counts with no plays part, and say the history changed on a click, while its Plays read 0', async () => {
      serveNoShowPlays();
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: SILO_SEASON_ACTIONS_TARGET,
          progress: progressOf(4, 10),
        },
      });
      const main = await settledMain(container, 0);

      expect(historyButton(container)).toEqual({
        label: '40% watched',
        underInfo: '4/10 eps',
        selected: true,
        bar: '40',
      });

      await userEvent.click(main);

      expect(
        within(await screen.findByRole('status')).getByText(
          'Your history changed. Try again.',
        ),
      ).toBeVisible();
    });

    it('should stay inert, and start nothing on a click, before its progress is in', async () => {
      const writes = recordWrites();
      const { container } = renderComponent(ActionColumn, {
        props: { target: SILO_SEASON_ACTIONS_TARGET, progress: LOADING },
      });
      await settledMain(container, 1);

      await userEvent.click(mainOf(container, 0));
      await waitNegativeClaim();

      expect(mainOf(container, 0)).toHaveAttribute('aria-disabled', 'true');
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(writes).toEqual([]);
    });

    it('should read the plays of the specials, given no progress entry', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: { target: DEVS_SPECIALS_TARGET },
      });

      const main = await settledMain(container, 0);

      expect(historyButton(container)).toEqual({
        label: '1 play',
        underInfo: DEVS_PLAYED,
        selected: true,
      });

      await userEvent.click(main);

      expect(await screen.findByRole('dialog', { name: REMOVE_PROMPT }))
        .toBeVisible();
    });

    it('should offer no Drop show on a season with episodes watched', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: SILO_SEASON_ACTIONS_TARGET,
          progress: progressOf(4, 10),
        },
      });
      await settledMain(container, 0);

      expect(await readMoreRows()).toEqual(['View history']);
      expect(screen.getByRole('button', { name: 'Add another play' }))
        .toBeVisible();
    });

    it('should offer no favourite on a season, even when the caller turns it on', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: { target: SILO_SEASON_ACTIONS_TARGET, favorite: true },
      });

      await settledMain(container, 0);
      await waitNegativeClaim();

      expect(readButtons(container).map(({ label }) => label)).toEqual([
        '1 play',
        'In watchlist',
      ]);
    });
  });

  describe("a movie's history button", () => {
    it('should keep its fill and count but stay inert, and start nothing on a click, once a refetch fails', async () => {
      const hasWritten = { value: false };
      server.use(
        http.post(SYNC_HISTORY_URL, () => {
          hasWritten.value = true;
          return new HttpResponse(null, { status: 201 });
        }),
        http.get(WATCHED_MOVIES_URL, () => {
          if (!hasWritten.value) return;
          return notFound();
        }),
      );
      const writes = recordWrites();
      const { container } = renderComponent(ActionColumn, {
        props: { target: HERETIC_ACTIONS_TARGET },
      });
      await settledMain(container, 0);

      await userEvent.click(await settledSide('Add another play'));
      const menu = await screen.findByRole('menu', {
        name: 'When did you watch this?',
      });
      await userEvent.click(
        within(menu).getByRole('menuitem', { name: 'Just now' }),
      );
      await bodyUnlocked();
      await waitFor(() => {
        expect(mainOf(container, 0)).toHaveAttribute('aria-busy', 'false');
        expect(mainOf(container, 0)).toHaveAttribute('aria-disabled', 'true');
      });
      await userEvent.click(mainOf(container, 0));
      await waitNegativeClaim();

      expect(historyButton(container)).toMatchObject({
        label: '1 play',
        selected: true,
      });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(writes).toEqual(['POST /sync/history']);
    });
  });

  describe('Other date on the add icon', () => {
    const openOtherDate = async () => {
      await userEvent.click(await settledSide('Add another play'));
      await userEvent.click(
        await screen.findByRole('menuitem', { name: 'Other date' }),
      );
    };

    it("should post a movie's Play at the date applied, and return to the icon", async () => {
      const bodies = recordBodies(SYNC_HISTORY_URL, { status: 201 });
      const { container } = renderComponent(ActionColumn, {
        props: { target: HERETIC_ACTIONS_TARGET },
      });
      await settledMain(container, 0);

      await openOtherDate();
      await applyField(WATCH_PROMPT, '2026-01-15T12:00');

      await waitFor(() =>
        expect(bodies).toEqual([{
          movies: [{
            ids: { trakt: HERETIC_ACTIONS_TARGET.id },
            watched_at: '2026-01-15T12:00:00.000Z',
          }],
        }])
      );
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Add another play' }))
          .toHaveFocus()
      );
    });

    it("should keep a show's date through its count dialog", async () => {
      const bodies = recordBodies(SYNC_HISTORY_URL, { status: 201 });
      renderComponent(ActionColumn, {
        props: { target: SILO_ACTIONS_TARGET, progress: progressOf(11, 17) },
      });

      await openOtherDate();
      await applyField(WATCH_PROMPT, '2026-01-15T12:00');
      await answerDialog('Mark as watched?', 'Mark as Watched');

      await waitFor(() =>
        expect(bodies).toEqual([{
          shows: [{
            ids: { trakt: SILO.id },
            watched_at: '2026-01-15T12:00:00.000Z',
          }],
        }])
      );
    });

    it('should write nothing when the count dialog declines a dated add', async () => {
      const writes = recordWrites();
      renderComponent(ActionColumn, {
        props: { target: SILO_ACTIONS_TARGET, progress: progressOf(11, 17) },
      });

      await openOtherDate();
      await applyField(WATCH_PROMPT, '2026-01-15T12:00');
      await answerDialog('Mark as watched?', 'Cancel');
      await waitNegativeClaim();

      expect(writes).toEqual([]);
      expect(screen.getByRole('button', { name: 'Add another play' }))
        .toHaveFocus();
    });
  });

  describe('through an in-flight refresh of the history', () => {
    it.each([
      {
        name: 'a show',
        target: DEVS_ACTIONS_TARGET,
        label: '37% watched',
        underInfo: '3/8 eps — 11 plays · Dropped',
      },
      {
        name: 'a season',
        target: DEVS_SEASON_ACTIONS_TARGET,
        label: '37% watched',
        underInfo: '3/8 eps — 10 plays',
      },
    ])(
      'should keep the fill, main line and bar of $name',
      async ({ target, label, underInfo }) => {
        const invalidator = Promise.withResolvers<
          (action: InvalidateActionOptions) => Promise<void>
        >();
        const { container } = renderComponent(ActionColumnHost, {
          props: {
            target,
            progress: progressOf(3, 8),
            output: invalidator.resolve,
          },
        });
        await settledMain(container, 0);
        const shown = { label, underInfo, selected: true, bar: '37' };
        expect(historyButton(container)).toEqual(shown);
        const refetch = holdRequest({ method: 'get', url: WATCHED_SHOWS_URL });

        const invalidation = (await invalidator.promise)(
          InvalidateAction.MarkAsWatched('show'),
        );
        await refetch.requested;
        await waitNegativeClaim();

        expect(historyButton(container)).toEqual(shown);
        refetch.release();
        await invalidation;
      },
    );
  });

  it('should open the list menu from the watchlist side icon', async () => {
    renderComponent(ActionColumn, { props: { target: MATRIX_ACTIONS_TARGET } });

    await userEvent.click(await settledSide('Add to list'));

    expect(await screen.findByRole('menu', { name: 'Add to list' }))
      .toBeVisible();
  });

  it('should flip a favourite to Add to Favorites while its removal saves', async () => {
    const write = holdRequest({
      method: 'post',
      url: SYNC_FAVORITES_REMOVE_URL,
      answer: () => new HttpResponse(null, { status: 200 }),
    });
    const { container } = renderComponent(ActionColumn, {
      props: { target: HERETIC_ACTIONS_TARGET, favorite: true },
    });

    await userEvent.click(await settledMain(container, 2));
    await write.requested;

    expect(readButtons(container).at(2)).toMatchObject({
      label: 'Add to Favorites',
      selected: false,
    });
  });

  describe("the favourite's Play gate", () => {
    const BLOCKED_REASON = 'Watch it first to favorite it';

    it('should block adding a movie with no Play, describing why, and send nothing on a click', async () => {
      const writes = recordWrites();
      const { container } = renderComponent(ActionColumn, {
        props: { target: MATRIX_ACTIONS_TARGET, favorite: true },
      });
      await waitFor(() =>
        expect(mainOf(container, 2)).toHaveAttribute('title', BLOCKED_REASON)
      );

      await userEvent.click(mainOf(container, 2));

      await waitNegativeClaim();
      expect(writes).toEqual([]);
      expect(mainOf(container, 2)).toHaveFocus();
      expect(mainOf(container, 2)).toHaveAttribute('aria-disabled', 'true');
      expect(mainOf(container, 2)).toHaveAccessibleName('Add to Favorites');
      expect(mainOf(container, 2).parentElement).toHaveClass('is-blocked');
    });

    it.each([
      {
        action: 'add a movie once it has a Play',
        target: MATRIX_ACTIONS_TARGET,
        plays: [MATRIX_ACTIONS_TARGET.id],
        write: 'POST /sync/favorites',
      },
      {
        action: 'remove a favourite with no Play',
        target: HERETIC_ACTIONS_TARGET,
        plays: [],
        write: 'POST /sync/favorites/remove',
      },
    ])('should $action', async ({ target, plays, write }) => {
      serveMoviePlays(plays);
      const writes = recordWrites();
      const { container } = renderComponent(ActionColumn, {
        props: { target, favorite: true },
      });

      await userEvent.click(await settledMain(container, 2));

      await waitFor(() => expect(writes).toEqual([write]));
      expect(mainOf(container, 2)).not.toHaveAttribute('title');
    });
  });
});
