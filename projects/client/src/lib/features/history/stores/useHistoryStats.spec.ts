import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { UserStatsResponseMock } from '$mocks/data/users/response/UserStatsResponseMock.ts';
import { USER_STATS_URL } from '$mocks/data/users/USER_STATS_URL.ts';
import { server } from '$mocks/server.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { notFound } from '$test/beds/request/notFound.ts';
import { collectDistinctStates } from '$test/beds/store/collectDistinctStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { readSettled } from '$test/beds/store/readSettled.ts';
import { readsAfterParamsChange } from '$test/beds/store/readsAfterParamsChange.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { http, HttpResponse } from 'msw';
import type { Observable } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { useHistoryParams } from './useHistoryParams.ts';
import { useHistoryStats } from './useHistoryStats.ts';

// `UserStatsResponseMock`: 4900 episodes and 596 movies watched, 5200 and 900 played.
const ALL_STATS = { items: 5496, plays: 6100 };

function statsAt({ filters = '', search = '' } = {}) {
  openAt(`${HISTORY_PATH}${search}`);

  return () => useHistoryStats(useHistoryParams(valueObservable(filters)));
}

describe('store: useHistoryStats', () => {
  describe('the figures', () => {
    it.each([
      { filters: '', items: 5496, plays: 6100 },
      { filters: 'episodes', items: 4900, plays: 5200 },
      { filters: 'movies', items: 596, plays: 900 },
    ])(
      'should read $items items and $plays plays at "$filters"',
      async ({ filters, items, plays }) => {
        const stats = await renderStore(statsAt({ filters }));

        expect(await readKnown(stats)).toEqual({ items, plays });
      },
    );
  });

  it('should leave the items of "shows" to the read', async () => {
    const stats = await renderStore(statsAt({ filters: 'shows' }));

    expect(await readKnown(stats)).toEqual({ plays: 5200 });
  });

  describe('hidden', () => {
    it.each([
      { name: 'genres', search: '?genres=drama' },
      { name: 'a start bound', search: '?start_at=2026-06-07' },
      { name: 'an end bound', search: '?end_at=2026-06-30' },
      { name: 'a day link', search: '?start_at=2026-06-07&days=1' },
      { name: 'a movie filter', search: '?movie=12' },
      { name: 'an episode filter', search: '?episode=12' },
      { name: 'a show filter', search: '?show=12' },
      { name: 'a season filter', search: '?season=12' },
    ])('should read nothing under $name', async ({ search }) => {
      expect(await readSettled(statsAt({ search }))).toBeUndefined();
    });

    it('should stay readable on a later page', async () => {
      const stats = await renderStore(statsAt({ search: '?page=3' }));

      expect(await readKnown(stats)).toEqual(ALL_STATS);
    });
  });

  describe('the read', () => {
    it('should read nothing while the stats load', async () => {
      const hold = holdRequest({ method: 'get', url: USER_STATS_URL });
      const stats = await renderStore(statsAt());
      const seen = collectDistinctStates(stats);

      await hold.requested;
      expect(seen).toEqual([undefined]);

      hold.release();
      expect(await readKnown(stats)).toEqual(ALL_STATS);
    });

    it('should read nothing when the stats fail', async () => {
      server.use(http.get(USER_STATS_URL, notFound));

      expect(await readSettled(statsAt())).toBeUndefined();
    });

    it('should keep its figures, and repeat none, when a refetch fails', async () => {
      const read = statsAt();
      const { stats, invalidate, waitForQueriesIdle } = await renderStore(
        () => ({
          stats: read(),
          ...useInvalidator(),
          waitForQueriesIdle: useWaitForQueriesIdle(),
        }),
      );
      const seen = collectDistinctStates(stats);
      await readKnown(stats);

      failOnce(USER_STATS_URL);
      await invalidate(InvalidateAction.MarkAsWatched('movie'));
      await waitForQueriesIdle();

      expect(seen).toEqual([undefined, ALL_STATS]);
    });
  });

  describe('a change', () => {
    it('should read new figures when only the items change', async () => {
      const reads = await readsAfterParamsChange({
        from: 'shows',
        to: 'episodes',
        store: (filters: Observable<string>) =>
          useHistoryStats(useHistoryParams(filters)),
        pick: (stats) => stats,
        loadedFrom: readKnown,
        loadedTo: () => Promise.resolve(),
      });

      expect(reads).toEqual([{ items: 4900, plays: 5200 }]);
    });

    it('should read new figures when only the plays change', async () => {
      const read = statsAt();
      const { stats, invalidate, waitForQueriesIdle } = await renderStore(
        () => ({
          stats: read(),
          ...useInvalidator(),
          waitForQueriesIdle: useWaitForQueriesIdle(),
        }),
      );
      const seen = collectDistinctStates(stats);
      await readKnown(stats);

      server.use(http.get(USER_STATS_URL, () =>
        HttpResponse.json({
          ...UserStatsResponseMock,
          movies: { ...UserStatsResponseMock.movies, plays: 901 },
        })));
      await invalidate(InvalidateAction.MarkAsWatched('movie'));
      await waitForQueriesIdle();

      expect(seen).toEqual([undefined, ALL_STATS, {
        items: 5496,
        plays: 6101,
      }]);
    });
  });
});
