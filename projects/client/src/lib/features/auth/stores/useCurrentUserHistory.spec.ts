import { useInvalidator } from '$lib/features/query/useInvalidator.ts';
import { InvalidateAction } from '$lib/requests/models/InvalidateAction.ts';
import { WatchedMoviesMappedMock } from '$mocks/data/users/mapped/WatchedMoviesMappedMock.ts';
import { WatchedShowsMappedMock } from '$mocks/data/users/mapped/WatchedShowsMappedMock.ts';
import { WATCHED_MOVIES_URL } from '$mocks/data/users/WATCHED_MOVIES_URL.ts';
import { WATCHED_SHOWS_URL } from '$mocks/data/users/WATCHED_SHOWS_URL.ts';
import { kindsOf } from '$test/beds/query/kindsOf.ts';
import { nextOf } from '$test/beds/query/nextOf.ts';
import { useWaitForQueriesIdle } from '$test/beds/query/useWaitForQueriesIdle.ts';
import { failOnce } from '$test/beds/request/failOnce.ts';
import { holdRequest } from '$test/beds/request/holdRequest.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { describe, expect, it } from 'vitest';
import { useCurrentUserHistory } from './useCurrentUserHistory.ts';

function renderHistory() {
  return renderStore(() => ({
    ...useCurrentUserHistory(),
    ...useInvalidator(),
    waitForQueriesIdle: useWaitForQueriesIdle(),
  }));
}

describe('store: useCurrentUserHistory', () => {
  describe('historyStatus', () => {
    it('should read loading, then both histories as ready', async () => {
      const { historyStatus } = await renderHistory();
      const kinds = kindsOf(historyStatus);

      const ready = await nextOf(historyStatus, 'ready');

      expect(kinds).toEqual(['loading', 'ready']);
      expect([...ready.data.movies.keys()]).toEqual(
        WatchedMoviesMappedMock.map(({ id }) => id),
      );
      expect([...ready.data.shows.keys()]).toEqual(
        WatchedShowsMappedMock.map(({ id }) => id),
      );
    });

    it('should hold the known history while a watch refetches it', async () => {
      const { historyStatus, invalidate } = await renderHistory();
      const known = await nextOf(historyStatus, 'ready');
      const kinds = kindsOf(historyStatus);
      const refetch = holdRequest({ method: 'get', url: WATCHED_MOVIES_URL });

      const invalidation = invalidate(InvalidateAction.MarkAsWatched('movie'));
      await refetch.requested;
      const during = await nextOf(historyStatus, 'ready');
      refetch.release();
      await invalidation;

      expect(during.data).toEqual(known.data);
      expect(kinds).toEqual(['ready']);
    });

    it.each([WATCHED_MOVIES_URL, WATCHED_SHOWS_URL])(
      'should read a failed first read of %s as error, and retry it',
      async (url) => {
        failOnce(url);
        const { historyStatus } = await renderHistory();
        const kinds = kindsOf(historyStatus);

        const failed = await nextOf(historyStatus, 'error');
        failed.retry();
        await nextOf(historyStatus, 'ready');

        expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
      },
    );

    it('should retry both reads at once when both fail', async () => {
      failOnce(WATCHED_MOVIES_URL);
      failOnce(WATCHED_SHOWS_URL);
      const { historyStatus, waitForQueriesIdle } = await renderHistory();
      const kinds = kindsOf(historyStatus);

      await waitForQueriesIdle();
      const failed = await nextOf(historyStatus, 'error');
      failed.retry();
      await nextOf(historyStatus, 'ready');

      expect(kinds).toEqual(['loading', 'error', 'loading', 'ready']);
    });
  });
});
