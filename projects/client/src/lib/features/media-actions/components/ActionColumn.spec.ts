import { WELL_KNOWN_MEDIA_QUERY } from '$lib/stores/css/WELL_KNOWN_MEDIA_QUERY.ts';
import { time } from '$lib/utils/timing/time.ts';
import { AIRED } from '$mocks/data/media-actions/AIRED.ts';
import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { HERETIC_ACTIONS_TARGET } from '$mocks/data/media-actions/HERETIC_ACTIONS_TARGET.ts';
import { MATRIX_ACTIONS_TARGET } from '$mocks/data/media-actions/MATRIX_ACTIONS_TARGET.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_ACTIONS_TARGET.ts';
import { SILO_SEASON_ACTIONS_TARGET } from '$mocks/data/media-actions/SILO_SEASON_ACTIONS_TARGET.ts';
import { SILO_PROGRESS_URL } from '$mocks/data/shows/SILO_PROGRESS_URL.ts';
import { ShowSiloProgressResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloProgressResponseMock.ts';
import { SYNC_FAVORITES_REMOVE_URL } from '$mocks/data/sync/SYNC_FAVORITES_REMOVE_URL.ts';
import { SYNC_HISTORY_URL } from '$mocks/data/sync/SYNC_HISTORY_URL.ts';
import { DROP_URL } from '$mocks/data/users/DROP_URL.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { server } from '$mocks/server.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { renderComponent } from '$test/beds/component/renderComponent.ts';
import { fakeLayouts } from '$test/beds/css/fakeLayouts.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { recordWrites } from '$test/beds/request/recordWrites.ts';
import { bodyUnlocked } from '$test/beds/scroll-lock/bodyUnlocked.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import ActionColumn from './ActionColumn.svelte';
import type { QuickActionsTarget } from './QuickActionsProps.ts';

const setLayout = fakeLayouts({ desktop: WELL_KNOWN_MEDIA_QUERY.desktop });

const LAST_WATCHED = new Date('2024-12-27T19:40:28.000Z');

const progressOf = (completed: number, total: number) => ({
  kind: 'ready' as const,
  data: { completed, total, lastWatchedAt: LAST_WATCHED },
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

// On the dropped shows.
const DEVS_TARGET: QuickActionsTarget = {
  ...DEVS,
  title: 'Devs',
  slug: 'devs',
  airDate: AIRED,
  episode: { count: 8 },
};

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

const historyButton = (container: HTMLElement) => readButtons(container).at(0);

const readButtons = (container: HTMLElement) =>
  [...container.querySelectorAll('.trakt-action-button')].map((button) => ({
    label: button.querySelector('.action-button-label')?.textContent?.trim(),
    underInfo: button.querySelector('.action-button-under-info')?.textContent
      ?.trim(),
    selected: button.classList.contains('is-selected'),
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
        {
          label: 'Watched',
          underInfo: '1 play · last 27 Dec 2024',
          selected: true,
        },
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

  it.each([
    {
      airDate: new Date(Date.now() + time.weeks(1)),
      count: 17,
      when: 'unaired',
    },
    { airDate: null, count: 17, when: 'with no air date' },
    { airDate: AIRED, count: 0, when: 'with no aired episode' },
  ])(
    'should offer no history button or its side icons for a Target $when',
    async ({ airDate, count }) => {
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count }, airDate },
          progress: progressOf(1, 17),
          favorite: true,
        },
      });

      await waitFor(() =>
        expect(readButtons(container).map(({ label }) => label)).toEqual([
          'In watchlist',
          'Favorited',
        ])
      );
      expect(screen.queryByRole('button', { name: 'Add another play' }))
        .toBeNull();
      expect(screen.queryByRole('button', { name: 'Drop' })).toBeNull();
    },
  );

  describe("a show's history button", () => {
    it.each([
      {
        progress: progressOf(11, 17),
        // Its watched history reads the show watched.
        count: 1,
        button: {
          label: 'Add to history',
          underInfo: '11 of 17 episodes · last 27 Dec 2024',
          selected: false,
        },
      },
      {
        progress: progressOf(17, 17),
        // Its watched history reads the show unwatched.
        count: 17,
        button: {
          label: 'Watched',
          underInfo: '17 of 17 episodes · last 27 Dec 2024',
          selected: true,
        },
      },
      {
        progress: progressOf(0, 0),
        // An unknown count keeps the button; a count of 0 hides it.
        count: NaN,
        button: {
          label: 'Add to history',
          underInfo: undefined,
          selected: false,
        },
      },
    ])(
      'should follow progress $progress.data.completed of $progress.data.total over the history',
      async ({ progress, count, button }) => {
        const { container } = renderComponent(ActionColumn, {
          props: {
            target: { ...SILO_ACTIONS_TARGET, episode: { count } },
            progress,
          },
        });

        await waitFor(() => expect(historyButton(container)).toEqual(button));
      },
    );

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
        props: { target: DEVS_TARGET, progress: LOADING },
      });
      await settledMain(container, 1);
      await settledSide('Restore');
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
        label: 'Add to history',
        underInfo: '11 of 17 episodes · last 27 Dec 2024',
        selected: false,
      });
    });

    it.each([
      { progress: progressOf(11, 17), count: 1, dialog: 'Mark as watched?' },
      {
        progress: progressOf(17, 17),
        count: 17,
        dialog: 'Remove from history?',
      },
    ])(
      'should ask $dialog at progress $progress.data.completed of $progress.data.total',
      async ({ progress, count, dialog }) => {
        const { container } = renderComponent(ActionColumn, {
          props: {
            target: { ...SILO_ACTIONS_TARGET, episode: { count } },
            progress,
          },
        });

        await userEvent.click(await settledMain(container, 0));

        expect(await screen.findByRole('dialog', { name: dialog }))
          .toBeVisible();
      },
    );

    it("should read the add's value while it writes, and progress while it counts the episodes", async () => {
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
      // Its watched history reads the show watched.
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count: 1 } },
          progress: progressOf(11, 17),
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

    it('should drop the show from the Drop side icon', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(DROP_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 201 });
        }),
      );
      renderComponent(ActionColumn, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count: 1 } },
          progress: progressOf(11, 17),
        },
      });

      await userEvent.click(await settledSide('Drop'));
      const menu = await screen.findByRole('menu', {
        name: 'When did you drop this?',
      });
      await userEvent.click(
        within(menu).getByRole('menuitem', { name: 'Right now' }),
      );

      await waitFor(() =>
        expect(bodies).toEqual([{ shows: [{ ids: { trakt: SILO.id } }] }])
      );
    });

    it.each([
      { progress: LOADING, when: 'before progress is in' },
      { progress: progressOf(0, 17), when: 'with no episode watched' },
      { progress: EMPTY, when: 'whose progress reads no plays' },
      { progress: FAILED, when: 'whose progress failed to load' },
    ])('should offer no Drop on a show $when', async ({ progress }) => {
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: { ...SILO_ACTIONS_TARGET, episode: { count: 1 } },
          progress,
        },
      });
      await settledMain(container, 1);
      await waitNegativeClaim();

      expect(screen.queryByRole('button', { name: 'Drop' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Add another play' }))
        .toBeVisible();
    });

    it.each([
      { progress: EMPTY, when: 'reads no plays' },
      { progress: FAILED, when: 'failed to load' },
      { progress: undefined, when: 'is not given' },
    ])(
      'should read its watched history when its progress $when',
      async ({ progress }) => {
        // Its watched history reads the show watched, with one play.
        const { container } = renderComponent(ActionColumn, {
          props: {
            target: { ...SILO_ACTIONS_TARGET, episode: { count: 1 } },
            progress,
          },
        });

        await settledMain(container, 0);

        expect(historyButton(container)).toEqual({
          label: 'Watched',
          underInfo: '1 play · last 27 Dec 2024',
          selected: true,
        });
      },
    );

    it.each([
      { progress: EMPTY, count: 17, dialog: 'Mark as watched?' },
      { progress: FAILED, count: 1, dialog: 'Remove from history?' },
    ])(
      'should ask $dialog from its watched history when its progress reads $progress.kind',
      async ({ progress, count, dialog }) => {
        const { container } = renderComponent(ActionColumn, {
          props: {
            target: { ...SILO_ACTIONS_TARGET, episode: { count } },
            progress,
          },
        });

        await userEvent.click(await settledMain(container, 0));

        expect(await screen.findByRole('dialog', { name: dialog }))
          .toBeVisible();
      },
    );

    it('should offer Restore on a dropped show with no episode watched', async () => {
      renderComponent(ActionColumn, {
        props: { target: DEVS_TARGET, progress: progressOf(0, 8) },
      });

      expect(await settledSide('Restore')).toBeVisible();
    });

    it('should read Add to history, unselected, on a dropped show with every episode watched', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: { target: DEVS_TARGET, progress: progressOf(8, 8) },
      });

      await waitFor(() =>
        expect(historyButton(container)).toEqual({
          label: 'Add to history',
          underInfo: 'Dropped',
          selected: false,
        })
      );
    });

    it('should read Dropped and restore the show once the restore is confirmed', async () => {
      const bodies: unknown[] = [];
      server.use(
        http.post(RESTORE_URL, async ({ request }) => {
          bodies.push(await request.json());
          return new HttpResponse(null, { status: 200 });
        }),
      );
      const { container } = renderComponent(ActionColumn, {
        props: { target: DEVS_TARGET, progress: progressOf(3, 8) },
      });

      await waitFor(() =>
        expect(historyButton(container)).toEqual({
          label: 'Add to history',
          underInfo: 'Dropped',
          selected: false,
        })
      );
      await userEvent.click(await settledSide('Restore'));
      await answerDialog('Restore this show?', 'Yes, restore it!');

      await waitFor(() =>
        expect(bodies).toEqual([{ shows: [{ ids: { trakt: DEVS.id } }] }])
      );
    });
  });

  describe("a season's column", () => {
    it.each([
      {
        progress: progressOf(4, 10),
        // Its watched history reads the season watched.
        aired: 1,
        button: {
          label: 'Add to history',
          underInfo: '4 of 10 episodes · last 27 Dec 2024',
          selected: false,
        },
      },
      {
        progress: progressOf(10, 10),
        // Its watched history reads the season unwatched.
        aired: 10,
        button: {
          label: 'Watched',
          underInfo: '10 of 10 episodes · last 27 Dec 2024',
          selected: true,
        },
      },
    ])(
      'should follow its progress entry $progress.data.completed of $progress.data.total over the history',
      async ({ progress, aired, button }) => {
        const { container } = renderComponent(ActionColumn, {
          props: {
            target: {
              ...SILO_SEASON_ACTIONS_TARGET,
              episodes: { count: 10, aired },
            },
            progress,
          },
        });

        await settledMain(container, 0);

        expect(historyButton(container)).toEqual(button);
      },
    );

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

      await settledMain(container, 0);

      expect(historyButton(container)).toEqual({
        label: 'Watched',
        underInfo: '1 play · last 27 Dec 2024',
        selected: true,
      });
    });

    it('should offer no Drop on a season with episodes watched', async () => {
      const { container } = renderComponent(ActionColumn, {
        props: {
          target: SILO_SEASON_ACTIONS_TARGET,
          progress: progressOf(4, 10),
        },
      });
      await settledMain(container, 0);
      await waitNegativeClaim();

      expect(screen.queryByRole('button', { name: 'Drop' })).toBeNull();
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
        'Add to history',
        'In watchlist',
      ]);
    });
  });

  describe("a movie's history button", () => {
    it('should keep its watched state but stay inert, and start nothing on a click, once a refetch fails', async () => {
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
        label: 'Watched',
        selected: true,
      });
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(writes).toEqual(['POST /sync/history']);
    });
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
});
