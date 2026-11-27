import { countStat } from '$test/beds/stats/countStat.ts';
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { assertDefined } from '$lib/utils/assert/assertDefined.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { EpisodeSiloResponseMock } from '$mocks/data/summary/episodes/silo/response/EpisodeSiloResponseMock.ts';
import { ShowDevsResponseMock } from '$mocks/data/summary/shows/devs/ShowDevsResponseMock.ts';
import { ShowSiloResponseMock } from '$mocks/data/summary/shows/silo/response/ShowSiloResponseMock.ts';
import { LATEST_WATCHED_AT } from '$mocks/data/sync/LATEST_WATCHED_AT.ts';
import { WATCHED_PROGRESS_URL } from '$mocks/data/sync/WATCHED_PROGRESS_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { HIDE_PROGRESS_URL } from '$mocks/data/users/HIDE_PROGRESS_URL.ts';
import { PROGRESS_PATH } from '$mocks/data/users/PROGRESS_PATH.ts';
import { RESTORE_URL } from '$mocks/data/users/RESTORE_URL.ts';
import { SILO_DROPPED } from '$mocks/data/users/SILO_DROPPED.ts';
import { DroppedShowsResponseMock } from '$mocks/data/users/response/DroppedShowsResponseMock.ts';
import { settledButton } from '$test/beds/buttons/settledButton.ts';
import { waitForEnabled } from '$test/beds/buttons/waitForEnabled.ts';
import { answerDialog } from '$test/beds/dialogs/answerDialog.ts';
import { REMOVALS } from '$test/beds/focus/REMOVALS.ts';
import { renderFiltersPage } from '$test/beds/lists/renderFiltersPage.ts';
import { openMenuFromKeyboard } from '$test/beds/menus/openMenuFromKeyboard.ts';
import { stubClientRects } from '$test/beds/menus/stubClientRects.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdPost } from '$test/beds/request/holdPost.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { captureRequests } from '$test/beds/request/captureRequests.ts';
import { serveSiloHidingSeasonTwo } from '$test/beds/progress/serveSiloHidingSeasonTwo.ts';
import { PROGRESS_PAGE_SIZE } from '$lib/utils/PROGRESS_PAGE_SIZE.ts';
import { recordBodies } from '$test/beds/request/recordBodies.ts';
import { servePaged } from '$test/beds/request/servePaged.ts';
import { watchedProgressRow } from '$test/beds/request/watchedProgressRow.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { startNavigation } from '$test/beds/url/startNavigation.ts';
import { screen, waitFor, within } from '@testing-library/svelte';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProgressPage from './ProgressPage.svelte';

const renderPage = renderFiltersPage(ProgressPage, PROGRESS_PATH);

const SILO_ROW = watchedProgressRow({
  show: ShowSiloResponseMock,
  lastWatchedAt: LATEST_WATCHED_AT,
  aired: 10,
  completed: 4,
});

// Silo with the episodes before the next one watched.
const siloWatchedTo = (completed: number) =>
  watchedProgressRow({
    show: ShowSiloResponseMock,
    lastWatchedAt: LATEST_WATCHED_AT,
    aired: 10,
    completed,
    nextEpisode: {
      ...EpisodeSiloResponseMock,
      ids: { ...EpisodeSiloResponseMock.ids, trakt: 7001 + completed },
      number: completed + 1,
      title: `Episode ${completed + 1}`,
    },
  });

const DEVS_WATCHED_AT = '2025-01-30T23:12:41.000Z';

const devsWatchedTo = (completed: number) =>
  watchedProgressRow({
    show: ShowDevsResponseMock,
    lastWatchedAt: DEVS_WATCHED_AT,
    aired: 6,
    completed,
  });

const DEVS_ROW = devsWatchedTo(6);

// The mocks drop Devs, and the page lists no dropped show.
const serveRows = (body: ReadonlyArray<unknown> = [SILO_ROW, DEVS_ROW]) => {
  servePaged({ url: DROPPED_URL, body: [] });
  servePaged({ url: WATCHED_PROGRESS_URL, body });
};

const rows = (container: HTMLElement) => [
  ...container.querySelectorAll<HTMLElement>('.trakt-progress-list > li'),
];

// The row's heading comes first; the card holds headings of its own.
const rowHeading = (row: HTMLElement) =>
  assertDefined(within(row).getAllByRole('heading', { level: 3 }).at(0));

const rowTitles = (container: HTMLElement) =>
  rows(container).map((row) => rowHeading(row).textContent?.trim());

// The card links to the show as well.
const titleLink = (row: HTMLElement) =>
  within(rowHeading(row)).getByRole('link');

const EMPTY_WATCHED = "You haven't started any shows yet.";
const EMPTY_HIDDEN = 'Every show is complete — nothing to hide.';
const EMPTY_SHOW = "This show isn't in your watched progress.";
const EMPTY_DROPPED = "You haven't dropped any shows.";
const EMPTY_TEXTS = [EMPTY_WATCHED, EMPTY_HIDDEN, EMPTY_SHOW, EMPTY_DROPPED];

const clearButton = () =>
  screen.queryByRole('button', { name: 'Back to all shows' });

const gear = () => screen.getByRole('button', { name: 'Options' });

const expectBlankStats = () => {
  expect(countStat('Watched')).toHaveTextContent(/^Watched$/);
  expect(countStat('shows')).toHaveTextContent(/^shows$/);
};

const busy = (container: HTMLElement) =>
  container.querySelector('[aria-busy="true"]');

const expectLoading = (container: HTMLElement) => {
  expect(busy(container)).not.toBeNull();
  expect(rows(container)).toHaveLength(0);
  EMPTY_TEXTS.forEach((text) => expect(screen.queryByText(text)).toBeNull());
};

describe('section: ProgressPage', () => {
  it('should title the document Progress', async () => {
    await renderPage();

    await waitFor(() =>
      expect(document.title).toBe('Progress · Trakt Classic')
    );
  });

  describe('rows', () => {
    it('should list a row for each watched show, in the served order, with no title bar', async () => {
      serveRows();
      const { container } = await renderPage();

      await waitFor(() =>
        expect(rowTitles(container)).toEqual(['Silo', 'Devs'])
      );
      expect(container.querySelector('.trakt-list-title-bar')).toBeNull();
    });

    it('should fade only the complete row under Fade', async () => {
      serveRows();
      const { container } = await renderPage({ search: '?fade=watched' });

      await waitFor(() =>
        expect(rowTitles(container)).toEqual(['Silo', 'Devs'])
      );
      expect(
        rows(container).map((row) =>
          row.querySelector('.trakt-progress-row')?.classList.contains(
            'is-faded',
          )
        ),
      ).toEqual([false, true]);
    });

    it('should draw the first row as the cover, under the Progress tab', async () => {
      serveRows();
      const { container } = await renderPage();

      await waitFor(() =>
        expect(container.querySelector('img[data-position="cover"]'))
          .not.toBeNull()
      );
      expect(screen.getByRole('link', { name: 'Progress' }))
        .toHaveAttribute('aria-current', 'page');
    });
  });

  describe('states', () => {
    it('should stay busy, with no rows and no copy, while the rows load', async () => {
      const read = holdRequest({ method: 'get', url: WATCHED_PROGRESS_URL });
      const { container } = await renderPage();
      await read.requested;

      expectLoading(container);
    });

    it.each([
      { name: 'no show', search: '', body: [], text: EMPTY_WATCHED },
      {
        name: 'no show left to hide',
        search: '?hide_completed=true',
        body: [],
        text: EMPTY_HIDDEN,
      },
      {
        name: 'a show matching no row',
        search: '?show=4242',
        body: [SILO_ROW],
        text: EMPTY_SHOW,
      },
      {
        name: 'a show matching no row while hiding',
        search: '?show=4242&hide_completed=true',
        body: [SILO_ROW],
        text: EMPTY_SHOW,
      },
    ])('should give its own copy for $name', async ({ search, body, text }) => {
      serveRows(body);
      await renderPage({ search });

      expect(await screen.findByText(text)).toBeVisible();
      EMPTY_TEXTS.filter((other) => other !== text).forEach((other) =>
        expect(screen.queryByText(other)).toBeNull()
      );
    });

    it('should show the error box and land the rows on Retry', async () => {
      serveRows();
      failOnce(WATCHED_PROGRESS_URL);
      const { container } = await renderPage();

      await userEvent.click(
        await screen.findByRole('button', { name: 'Retry' }),
      );

      await waitFor(() =>
        expect(rowTitles(container)).toEqual(['Silo', 'Devs'])
      );
    });
  });

  describe('stats', () => {
    it("should leave the toolbar's stats blank until the rows land, then sum them", async () => {
      serveRows();
      const read = holdRequest({ method: 'get', url: WATCHED_PROGRESS_URL });
      await renderPage();
      await read.requested;

      expectBlankStats();

      read.release();

      await waitFor(() =>
        expect(countStat('shows')).toHaveTextContent(/^2 shows$/)
      );
      expect(countStat('Watched'))
        .toHaveTextContent(/^62% Watched 10 \/ 16 episodes$/);
    });
  });

  describe('pages', () => {
    it('should replace a page past the last with the last page', async () => {
      serveRows();
      await renderPage({ search: '?fade=watched&page=5' });

      await waitFor(() =>
        expect(lastReplace()).toBe(`${PROGRESS_PATH}?fade=watched`)
      );
    });

    it('should replace a page past the last that a navigation reaches on a warm cache, once it lands, and list the rows', async () => {
      serveRows();
      const { container } = await renderPage({ follows: true });
      await waitFor(() => expect(rows(container)).toHaveLength(2));
      const navigation = startNavigation('popstate');

      // The URL moves while the navigation is in flight, as SvelteKit's does.
      await goto(resolve(`${PROGRESS_PATH}?page=5`));
      await waitNegativeClaim();
      const beforeLanding = vi.mocked(goto).mock.calls.length;
      navigation.land();

      await waitFor(() => expect(rows(container)).toHaveLength(2));
      expect(beforeLanding).toBe(1);
      expect(lastReplace()).toBe(PROGRESS_PATH);
      expect(busy(container)).toBeNull();
    });
  });

  describe('the show filter', () => {
    it('should narrow the rows to the show, under a band that clears it', async () => {
      serveRows();
      const { container } = await renderPage({ search: `?show=${SILO.id}` });

      await waitFor(() => expect(rowTitles(container)).toEqual(['Silo']));
      expect(clearButton()).toHaveTextContent(/^Back to all shows$/);
    });

    it('should keep the band over a show that matches no row', async () => {
      serveRows();
      await renderPage({ search: '?show=4242' });

      expect(await screen.findByText(EMPTY_SHOW)).toBeVisible();
      expect(clearButton()).toBeVisible();
    });

    it('should show no band with no show', async () => {
      serveRows();
      const { container } = await renderPage();

      await waitFor(() => expect(rows(container)).toHaveLength(2));
      expect(clearButton()).toBeNull();
    });

    it('should replace the URL without the show and the page, keeping the rest', async () => {
      serveRows();
      await renderPage({
        search: `?show=${SILO.id}&page=2&hide_completed=true`,
      });

      await userEvent.click(
        await screen.findByRole('button', { name: 'Back to all shows' }),
      );

      await waitFor(() =>
        expect(lastReplace()).toBe(`${PROGRESS_PATH}?hide_completed=true`)
      );
    });

    describe('once cleared', () => {
      const renderNarrowed = async () => {
        serveRows();
        const { container } = await renderPage({
          follows: true,
          show: SILO.id,
        });
        await waitFor(() => expect(rowTitles(container)).toEqual(['Silo']));

        return container;
      };

      it('should list every row again', async () => {
        const container = await renderNarrowed();

        await userEvent.click(
          await screen.findByRole('button', { name: 'Back to all shows' }),
        );

        await waitFor(() =>
          expect(rowTitles(container)).toEqual(['Silo', 'Devs'])
        );
        expect(clearButton()).toBeNull();
      });

      it.each(REMOVALS)(
        "should hand the button's focus to the phone gear, where removal $removal",
        async ({ emulate }) => {
          emulate();
          await renderNarrowed();

          clearButton()?.focus();
          await userEvent.keyboard('{Enter}');

          await waitFor(() => expect(clearButton()).toBeNull());
          await waitFor(() => expect(gear()).toHaveFocus());
        },
      );

      it("should hand the button's focus to the view menu where the gear is not displayed", async () => {
        await renderNarrowed();
        gear().hidden = true;

        clearButton()?.focus();
        await userEvent.keyboard('{Enter}');

        await waitFor(() => expect(clearButton()).toBeNull());
        await waitFor(() =>
          expect(screen.getByRole('button', { name: 'View: Watched' }))
            .toHaveFocus()
        );
      });
    });
  });

  describe('the dropped view', () => {
    const DEVS_DROPPED = assertDefined(DroppedShowsResponseMock.at(0));

    // Silo was watched last, so it lists first under the default Watched Date.
    const serveDropped = (
      { dropped = [SILO_DROPPED, DEVS_DROPPED], body = [SILO_ROW, DEVS_ROW] }: {
        dropped?: ReadonlyArray<unknown>;
        body?: ReadonlyArray<unknown>;
      } = {},
    ) => {
      servePaged({ url: DROPPED_URL, body: dropped });
      servePaged({ url: WATCHED_PROGRESS_URL, body });
    };

    const renderDropped = (search = '') =>
      renderPage({ filters: 'dropped', search });

    it('should title the document Dropped progress', async () => {
      serveDropped();
      await renderDropped();

      await waitFor(() =>
        expect(document.title).toBe('Dropped progress · Trakt Classic')
      );
    });

    it('should stay busy, with no rows, no copy and blank stats, while the rows load', async () => {
      serveDropped();
      const read = holdRequest({ method: 'get', url: WATCHED_PROGRESS_URL });
      const { container } = await renderDropped();
      await read.requested;

      expect(screen.getByRole('button', { name: 'View: Dropped' }))
        .toBeVisible();
      expectLoading(container);
      expectBlankStats();
    });

    it("should drop the watched view's rows and stats on a change to it", async () => {
      serveRows();
      // Hide reads a page of its own, so the dropped view's read is a new one, which the hold keeps.
      const { container, rerender } = await renderPage({
        search: '?hide_completed=true',
      });
      await waitFor(() => expect(rows(container)).toHaveLength(2));
      expect(countStat('shows')).not.toHaveTextContent(/^shows$/);
      const read = holdRequest({ method: 'get', url: WATCHED_PROGRESS_URL });

      await rerender({ filters: 'dropped' });
      await read.requested;
      await waitNegativeClaim();

      expectLoading(container);
      expectBlankStats();
    });

    it('should list a row for each dropped show, by Watched Date, and sum them', async () => {
      serveDropped();
      const { container } = await renderDropped();

      await waitFor(() =>
        expect(rowTitles(container)).toEqual(['Silo', 'Devs'])
      );
      expect(countStat('shows')).toHaveTextContent(/^2 shows$/);
    });

    it('should badge and date each dropped row, and no watched one', async () => {
      serveDropped({ dropped: [DEVS_DROPPED] });
      const { container, rerender } = await renderPage();
      await waitFor(() => expect(rowTitles(container)).toEqual(['Silo']));
      expect(container.querySelector('.trakt-dropped-badge')).toBeNull();

      await rerender({ filters: 'dropped' });

      await waitFor(() => expect(rowTitles(container)).toEqual(['Devs']));
      const devs = assertDefined(rows(container).at(0));
      expect(devs.querySelector('.trakt-dropped-badge')).not.toBeNull();
      expect(within(devs).getByRole('button', { name: /^Dropped/ }))
        .toBeVisible();
    });

    it.each([
      { name: 'no dropped show', search: '', dropped: [] },
      {
        name: 'Hide taking every dropped row off',
        search: '?hide_completed=true',
        dropped: [DEVS_DROPPED],
      },
    ])('should give its own copy for $name', async ({ search, dropped }) => {
      serveDropped({ dropped });
      await renderDropped(search);

      expect(await screen.findByText(EMPTY_DROPPED)).toBeVisible();
      EMPTY_TEXTS.filter((other) => other !== EMPTY_DROPPED).forEach((other) =>
        expect(screen.queryByText(other)).toBeNull()
      );
    });

    it.each([
      { read: 'progress', url: WATCHED_PROGRESS_URL },
      { read: 'dropped', url: DROPPED_URL },
    ])(
      'should show the error box and land the rows on Retry, where the $read read fails',
      async ({ url }) => {
        serveDropped();
        failOnce(url);
        const { container } = await renderDropped();

        await userEvent.click(
          await screen.findByRole('button', { name: 'Retry' }),
        );

        await waitFor(() =>
          expect(rowTitles(container)).toEqual(['Silo', 'Devs'])
        );
      },
    );

    it("should swap the watched view's rows for the dropped ones on a change to it", async () => {
      serveDropped({ dropped: [DEVS_DROPPED] });
      const { container, rerender } = await renderPage();
      await waitFor(() => expect(rowTitles(container)).toEqual(['Silo']));

      await rerender({ filters: 'dropped' });

      await waitFor(() => expect(rowTitles(container)).toEqual(['Devs']));
      expect(document.title).toBe('Dropped progress · Trakt Classic');
    });

    describe('a row restored', () => {
      it.each(
        REMOVALS.flatMap((removal) => [
          { ...removal, restored: 'Silo', next: 'Devs', to: 'next' },
          { ...removal, restored: 'Devs', next: 'Silo', to: 'previous' },
        ]),
      )(
        'should leave once confirmed and hand the focus to the $to row, restoring $restored, where removal $removal',
        async ({ emulate, restored, next }) => {
          stubClientRects();
          serveDropped();
          const { container } = await renderDropped();
          await waitFor(() => expect(rows(container)).toHaveLength(2));
          const cells = rows(container);
          const leaving = assertDefined(
            cells.find((cell) =>
              rowHeading(cell).textContent?.trim() === restored
            ),
          );
          const staying = assertDefined(
            cells.find((cell) => cell !== leaving),
          );
          const status = await waitForEnabled(
            await within(leaving).findByRole('button', { name: 'Dropped' }),
          );
          const write = holdPost(RESTORE_URL);
          emulate();

          await openMenuFromKeyboard(status, 'Dropped');
          await userEvent.keyboard('{ArrowDown}{Enter}');
          await answerDialog('Restore this show?', 'Yes, restore it!');

          await waitFor(() => expect(leaving.isConnected).toBe(false));
          expect(within(staying).getAllByRole('link', { name: next }).at(0))
            .toHaveFocus();

          serveDropped({
            dropped: [restored === 'Silo' ? DEVS_DROPPED : SILO_DROPPED],
          });
          await write.requested;
          write.release();
          await waitFor(() => expect(rowTitles(container)).toEqual([next]));
          expect(within(staying).getAllByRole('link', { name: next }).at(0))
            .toHaveFocus();
        },
      );
    });
  });

  describe('a row that leaves', () => {
    // Silo's last aired episode is next, so watching it completes the show.
    const SILO_LAST_ROW = siloWatchedTo(9);

    const DEVS_LEFT_ROW = devsWatchedTo(3);

    it.each(REMOVALS)(
      'should hand the focus to the next row under Hide, where removal $removal',
      async ({ emulate }) => {
        serveRows([SILO_LAST_ROW, DEVS_LEFT_ROW]);
        const { container } = await renderPage({
          search: '?hide_completed=true',
        });
        await waitFor(() => expect(rows(container)).toHaveLength(2));
        const [first, second] = rows(container);
        const silo = assertDefined(first);
        const devs = assertDefined(second);
        const watch = await settledButton('Mark "Episode 10" as watched', silo);
        emulate();

        serveRows([DEVS_LEFT_ROW]);
        watch.focus();
        await userEvent.keyboard('{Enter}');

        await waitFor(() => expect(silo.isConnected).toBe(false));
        expect(within(devs).getAllByRole('link', { name: 'Devs' }).at(0))
          .toHaveFocus();
      },
    );

    it('should hand the focus to the next row once a confirmed hide of the whole show takes its row out', async () => {
      stubClientRects();
      serveRows([SILO_ROW, DEVS_LEFT_ROW]);
      const bodies = recordBodies(HIDE_PROGRESS_URL, { status: 201 });
      const { container } = await renderPage();
      await waitFor(() => expect(rows(container)).toHaveLength(2));
      const [first, second] = rows(container);
      const silo = assertDefined(first);
      const devs = assertDefined(second);
      await userEvent.click(
        within(silo).getByRole('button', { name: 'Seasons' }),
      );
      await userEvent.click(
        await waitForEnabled(
          await within(silo).findByRole('button', { name: 'Season 1 actions' }),
        ),
      );
      await userEvent.click(
        await screen.findByRole('menuitem', {
          name: 'Hide Season 1 and later',
        }),
      );

      serveRows([DEVS_LEFT_ROW]);
      await answerDialog('Hide the whole show?', 'Yes, hide it!');

      await waitFor(() => expect(silo.isConnected).toBe(false));
      expect(bodies).toHaveLength(1);
      expect(within(devs).getAllByRole('link', { name: 'Devs' }).at(0))
        .toHaveFocus();
    });
  });

  describe('a row that stays', () => {
    const watchNextOnSilo = async (
      { search = '', emulate }: { search?: string; emulate: () => void },
    ) => {
      serveRows([siloWatchedTo(4), DEVS_ROW]);
      const { container } = await renderPage({ search });
      await waitFor(() => expect(rows(container)).not.toHaveLength(0));
      const silo = assertDefined(rows(container).at(0));
      const watch = await settledButton('Mark "Episode 5" as watched', silo);
      emulate();

      serveRows([siloWatchedTo(5), DEVS_ROW]);
      watch.focus();
      await userEvent.keyboard('{Enter}');

      await settledButton('Mark "Episode 6" as watched', silo);
      return silo;
    };

    it.each(REMOVALS)(
      "should keep the focus on the row's title link once the next episode lands, where removal $removal",
      async ({ emulate }) => {
        const silo = await watchNextOnSilo({ emulate });

        expect(titleLink(silo)).toHaveFocus();
      },
    );

    it.each(REMOVALS)(
      "should keep the focus on the only row's title link under a show, where removal $removal",
      async ({ emulate }) => {
        const silo = await watchNextOnSilo({
          search: `?show=${SILO.id}`,
          emulate,
        });

        expect(titleLink(silo)).toHaveFocus();
      },
    );
  });

  // The global IntersectionObserver mock reports every row in view.
  describe("the rows' own reads", () => {
    // Devs under ids and a title of its own, so each row is its own show.
    const devsNumbered = (index: number) =>
      watchedProgressRow({
        show: {
          ...ShowDevsResponseMock,
          title: `Devs ${index}`,
          ids: {
            ...ShowDevsResponseMock.ids,
            trakt: ShowDevsResponseMock.ids.trakt + index + 1,
            slug: `devs-${index}`,
          },
        },
        lastWatchedAt: DEVS_WATCHED_AT,
        aired: 6,
        completed: 3,
      });

    const FULL_PAGE_OF_OTHERS = Array.from(
      { length: PROGRESS_PAGE_SIZE - 1 },
      (_, index) => devsNumbered(index),
    );

    it("should read no row's show progress for a full page of shows that hide no season, on load or after a watch", async () => {
      serveRows([siloWatchedTo(4), ...FULL_PAGE_OF_OTHERS]);

      const requests = await captureRequests(async () => {
        const { container } = await renderPage();
        await waitFor(() =>
          expect(rows(container)).toHaveLength(PROGRESS_PAGE_SIZE)
        );
        const silo = assertDefined(rows(container).at(0));
        const watch = await settledButton('Mark "Episode 5" as watched', silo);

        serveRows([siloWatchedTo(5), ...FULL_PAGE_OF_OTHERS]);
        await userEvent.click(watch);

        await settledButton('Mark "Episode 6" as watched', silo);
        await waitNegativeClaim();
      }, { pathIncludes: '/shows/' });

      expect(requests).toEqual([]);
    });

    it('should read the show progress of a row whose show hides a season, and of no other row', async () => {
      serveSiloHidingSeasonTwo();
      serveRows([SILO_ROW, DEVS_ROW]);

      const requests = await captureRequests(async () => {
        const { container } = await renderPage();
        await waitFor(() => expect(rows(container)).toHaveLength(2));
        await waitNegativeClaim();
      }, { pathIncludes: '/shows/' });

      expect(requests).toEqual(['GET /shows/silo/progress/watched']);
    });
  });
});
