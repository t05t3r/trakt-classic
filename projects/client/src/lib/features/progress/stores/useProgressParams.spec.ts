import { goto } from '$app/navigation';
import { page } from '$app/state';
import { PROGRESS_SORTS } from '$lib/features/progress/PROGRESS_SORTS.ts';
import type { ProgressFilters } from '$lib/features/progress/ProgressFilters.ts';
import { UrlBuilder } from '$lib/utils/url/UrlBuilder.ts';
import { PROGRESS_ROUTE } from '$mocks/data/navigation/PROGRESS_ROUTE.ts';
import { SHOW_ROUTE } from '$mocks/data/navigation/SHOW_ROUTE.ts';
import { PROGRESS_PATH } from '$mocks/data/users/PROGRESS_PATH.ts';
import { waitNegativeClaim } from '$test/beds/promise/waitNegativeClaim.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { followPushes } from '$test/beds/url/followPushes.ts';
import { holdFirstNavigation } from '$test/beds/url/holdFirstNavigation.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { startNavigation } from '$test/beds/url/startNavigation.ts';
import { BehaviorSubject, type Observable } from 'rxjs';
import { describe, expect, expectTypeOf, it, vi } from 'vitest';
import { useProgressParams } from './useProgressParams.ts';

const WATCHED_TITLE: ProgressFilters<'watched'> = {
  view: 'watched',
  sort: { by: 'title', how: 'desc' },
};
const DROPPED_HIDDEN: ProgressFilters<'dropped'> = {
  view: 'dropped',
  sort: { by: 'hidden', how: 'asc' },
};

function renderParams(filters = '') {
  return renderStore(() => useProgressParams(valueObservable(filters)));
}

const segmentsOf = (path: string) => path.slice(PROGRESS_PATH.length + 1);

// The route hands the path's segments on, so the store gets what the URL shows.
function renderAt(filters: ProgressFilters, search = '') {
  const path = UrlBuilder.progress(filters);
  openAt(`${path}${search}`);
  return renderParams(segmentsOf(path));
}

describe('store: useProgressParams', () => {
  describe('filters', () => {
    it('should type the filters per view', () => {
      expectTypeOf(useProgressParams).returns.toHaveProperty('filters')
        .toEqualTypeOf<Observable<ProgressFilters>>();
    });

    it.each([
      { filters: 'watched/title/desc', expected: WATCHED_TITLE },
      { filters: 'dropped/hidden/asc', expected: DROPPED_HIDDEN },
    ])('should read $filters', async ({ filters, expected }) => {
      openAt(UrlBuilder.progress(expected));
      const params = await renderParams(filters);

      expect(await readKnown(params.filters)).toEqual(expected);
    });

    it('should follow the route and skip a path that reads the same', async () => {
      openAt(PROGRESS_PATH);
      const filters = new BehaviorSubject('');
      const params = await renderStore(() => useProgressParams(filters));
      const seen = collectStates(params.filters);

      filters.next('watched/added/asc');
      filters.next('watched/title/desc');
      filters.next('dropped/hidden/asc');

      expect(seen).toEqual([
        { view: 'watched', sort: { by: 'added', how: 'asc' } },
        WATCHED_TITLE,
        DROPPED_HIDDEN,
      ]);
    });
  });

  describe('setView', () => {
    it('should push the bare dropped view, keep hide and fade and drop show and page', async () => {
      const { setView } = await renderAt(
        WATCHED_TITLE,
        '?hide_completed=true&show=12&page=3&fade=watched',
      );

      await setView('dropped');

      expect(lastPush()).toBe(
        `${
          UrlBuilder.progress({ view: 'dropped' })
        }?hide_completed=true&fade=watched`,
      );
    });

    it('should push the bare watched view', async () => {
      const { setView } = await renderAt(
        DROPPED_HIDDEN,
        '?fade=watched&page=2',
      );

      await setView('watched');

      expect(lastPush()).toBe(`${PROGRESS_PATH}?fade=watched`);
    });
  });

  describe('selectSort', () => {
    it.each(PROGRESS_SORTS.watched)(
      'should push the watched view at $by $how and keep the query minus page',
      async ({ by, how }) => {
        const { selectSort } = await renderAt(
          WATCHED_TITLE,
          '?hide_completed=true&show=12&page=3&fade=watched&ref=feed',
        );

        await selectSort(by);

        expect(lastPush()).toBe(
          `${
            UrlBuilder.progress({ view: 'watched', sort: { by, how } })
          }?hide_completed=true&show=12&fade=watched&ref=feed`,
        );
      },
    );

    it.each(PROGRESS_SORTS.dropped)(
      'should push the dropped view at $by $how and keep the query minus page',
      async ({ by, how }) => {
        const { selectSort } = await renderAt(
          DROPPED_HIDDEN,
          '?page=3&fade=watched',
        );

        await selectSort(by);

        expect(lastPush()).toBe(
          `${
            UrlBuilder.progress({ view: 'dropped', sort: { by, how } })
          }?fade=watched`,
        );
      },
    );

    it('should push for the sort already showing', async () => {
      const [{ by, how }] = PROGRESS_SORTS.watched;
      openAt(PROGRESS_PATH);
      const { selectSort } = await renderParams();

      await selectSort(by);

      expect(lastPush()).toBe(
        UrlBuilder.progress({ view: 'watched', sort: { by, how } }),
      );
    });

    it.each([
      { filters: WATCHED_TITLE, by: 'hidden' as const },
      { filters: DROPPED_HIDDEN, by: 'released' as const },
    ])(
      'should not navigate for $by on the $filters.view view, which lacks it',
      async ({ filters, by }) => {
        const { selectSort } = await renderAt(filters, '?page=3');

        await selectSort(by);
        await waitNegativeClaim();

        expect(goto).not.toHaveBeenCalled();
      },
    );
  });

  describe('reverseSort', () => {
    it.each([
      {
        filters: WATCHED_TITLE,
        reversed: UrlBuilder.progress({
          view: 'watched',
          sort: { by: 'title', how: 'asc' },
        }),
      },
      {
        filters: DROPPED_HIDDEN,
        reversed: UrlBuilder.progress({
          view: 'dropped',
          sort: { by: 'hidden', how: 'desc' },
        }),
      },
    ])(
      'should push $reversed and keep the query minus page',
      async ({ filters, reversed }) => {
        const { reverseSort } = await renderAt(
          filters,
          '?fade=watched&page=3',
        );

        await reverseSort();

        expect(lastPush()).toBe(`${reversed}?fade=watched`);
      },
    );

    it('should reverse the default sort of the bare path', async () => {
      openAt(PROGRESS_PATH);
      const { reverseSort } = await renderParams();

      await reverseSort();

      expect(lastPush()).toBe(
        UrlBuilder.progress({ sort: { by: 'added', how: 'desc' } }),
      );
    });
  });

  describe('pushes in a row', () => {
    it('should flip the direction and flip it back on two presses with no wait between them', async () => {
      const { route, pushes } = followPushes(
        PROGRESS_PATH,
        `${UrlBuilder.progress(WATCHED_TITLE)}?fade=watched`,
      );
      const { reverseSort } = await renderStore(() => useProgressParams(route));

      await Promise.all([reverseSort(), reverseSort()]);

      expect(pushes()).toEqual([
        `${
          UrlBuilder.progress({
            view: 'watched',
            sort: { by: 'title', how: 'asc' },
          })
        }?fade=watched`,
        `${UrlBuilder.progress(WATCHED_TITLE)}?fade=watched`,
      ]);
    });

    it('should end on a sort picked just before a reverse, reversed', async () => {
      const { route, pushes } = followPushes(
        PROGRESS_PATH,
        UrlBuilder.progress(WATCHED_TITLE),
      );
      const { selectSort, reverseSort } = await renderStore(() =>
        useProgressParams(route)
      );

      await Promise.all([selectSort('plays'), reverseSort()]);

      expect(pushes()).toEqual([
        UrlBuilder.progress({
          view: 'watched',
          sort: { by: 'plays', how: 'desc' },
        }),
        UrlBuilder.progress({
          view: 'watched',
          sort: { by: 'plays', how: 'asc' },
        }),
      ]);
    });

    it('should sort the view set just before the sort pick', async () => {
      const { route, pushes } = followPushes(
        PROGRESS_PATH,
        UrlBuilder.progress(WATCHED_TITLE),
      );
      const { setView, selectSort } = await renderStore(() =>
        useProgressParams(route)
      );

      await Promise.all([setView('dropped'), selectSort('hidden')]);

      expect(pushes()).toEqual([
        UrlBuilder.progress({ view: 'dropped' }),
        UrlBuilder.progress({
          view: 'dropped',
          sort: { by: 'hidden', how: 'desc' },
        }),
      ]);
    });
    it('should not run a push queued behind a pending one once the route has left the progress page', async () => {
      const held = holdFirstNavigation();
      page.route.id = PROGRESS_ROUTE;
      const { reverseSort } = await renderAt(WATCHED_TITLE);

      const first = reverseSort();
      await vi.waitFor(() => expect(goto).toHaveBeenCalledOnce());
      const queued = reverseSort();
      await waitNegativeClaim();
      expect(goto).toHaveBeenCalledOnce();
      page.route.id = SHOW_ROUTE;
      held.resolve();
      await Promise.all([first, queued]);
      await waitNegativeClaim();

      expect(goto).toHaveBeenCalledOnce();
    });

    it('should run a press made during another navigation once it lands on the progress page', async () => {
      page.route.id = PROGRESS_ROUTE;
      const { reverseSort } = await renderAt(WATCHED_TITLE);
      const navigation = startNavigation();

      const pushed = reverseSort();
      await waitNegativeClaim();
      const beforeLanding = vi.mocked(goto).mock.calls.length;
      navigation.land();
      await pushed;

      expect(beforeLanding).toBe(0);
      expect(lastPush()).toBe(
        UrlBuilder.progress({
          view: 'watched',
          sort: { by: 'title', how: 'asc' },
        }),
      );
    });

    it('should drop a press made during another navigation that lands on another route', async () => {
      page.route.id = PROGRESS_ROUTE;
      const { reverseSort } = await renderAt(WATCHED_TITLE);
      const navigation = startNavigation();

      const pushed = reverseSort();
      page.route.id = SHOW_ROUTE;
      navigation.land();
      await pushed;
      await waitNegativeClaim();

      expect(goto).not.toHaveBeenCalled();
    });

    it('should still run a push after one that failed', async () => {
      vi.mocked(goto).mockImplementationOnce(() => {
        throw new Error('push failed');
      });
      const { reverseSort } = await renderAt(WATCHED_TITLE);

      const failed = reverseSort();
      await reverseSort();
      await failed;

      expect(goto).toHaveBeenCalledTimes(2);
      expect(lastPush()).toBe(
        UrlBuilder.progress({
          view: 'watched',
          sort: { by: 'title', how: 'asc' },
        }),
      );
    });
  });

  describe('watched', () => {
    it.each([
      { search: '?hide_completed=true', filter: 'hide' },
      { search: '?fade=watched', filter: 'fade' },
      { search: '?hide=watched', filter: null },
    ])('should read $search as $filter', async ({ search, filter }) => {
      const params = await renderAt(WATCHED_TITLE, search);

      expect(await readKnown(params.watched)).toBe(filter);
    });

    it.each(
      [
        {
          search: '?show=12&page=3',
          filter: 'hide',
          next: '?show=12&hide_completed=true',
        },
        {
          search: '?show=12&fade=watched&page=3',
          filter: 'hide',
          next: '?show=12&hide_completed=true',
        },
        {
          search: '?show=12&hide_completed=true&page=3',
          filter: 'fade',
          next: '?show=12&fade=watched',
        },
        {
          search: '?show=12&hide_completed=true&page=3',
          filter: null,
          next: '?show=12',
        },
      ] as const,
    )(
      'should drop the page from $search in the replace that sets $filter',
      async ({ search, filter, next }) => {
        const { setWatched } = await renderAt(WATCHED_TITLE, search);

        await setWatched(filter);

        expectOneReplace();
        expect(lastReplace()).toBe(
          `${UrlBuilder.progress(WATCHED_TITLE)}${next}`,
        );
      },
    );

    it.each(
      [
        {
          search: '?show=12&page=3',
          filter: 'fade',
          next: '?show=12&page=3&fade=watched',
        },
        {
          search: '?show=12&fade=watched&page=3',
          filter: null,
          next: '?show=12&page=3',
        },
      ] as const,
    )(
      'should keep the page from $search in the replace that sets $filter',
      async ({ search, filter, next }) => {
        const { setWatched } = await renderAt(WATCHED_TITLE, search);

        await setWatched(filter);

        expectOneReplace();
        expect(lastReplace()).toBe(
          `${UrlBuilder.progress(WATCHED_TITLE)}${next}`,
        );
      },
    );
  });

  describe('show', () => {
    it.each([
      { search: '', show: null },
      { search: '?show=12', show: 12 },
      { search: '?show=0', show: null },
      { search: '?show=12a', show: null },
      { search: '?show=-1', show: null },
    ])('should read $search as $show', async ({ search, show }) => {
      const params = await renderAt(WATCHED_TITLE, search);

      expect(await readKnown(params.show)).toBe(show);
    });

    it('should read null on the dropped view', async () => {
      const params = await renderAt(DROPPED_HIDDEN, '?show=12');

      expect(await readKnown(params.show)).toBeNull();
    });

    it('should clear the show and the page in one replace and keep the rest', async () => {
      const { clearShow } = await renderAt(
        WATCHED_TITLE,
        '?hide_completed=true&show=12&page=3&fade=watched',
      );

      await clearShow();

      expectOneReplace();
      expect(lastReplace()).toBe(
        `${
          UrlBuilder.progress(WATCHED_TITLE)
        }?hide_completed=true&fade=watched`,
      );
    });
  });

  describe('page', () => {
    it('should read ?page=4 as page 4', async () => {
      const params = await renderAt(WATCHED_TITLE, '?page=4');

      expect(await readKnown(params.page)).toBe(4);
    });

    it('should replace the page and keep the rest', async () => {
      const { replacePage } = await renderAt(
        DROPPED_HIDDEN,
        '?fade=watched&page=4',
      );

      await replacePage(2);

      expectOneReplace();
      expect(lastReplace()).toBe(
        `${UrlBuilder.progress(DROPPED_HIDDEN)}?fade=watched&page=2`,
      );
    });
  });
});
