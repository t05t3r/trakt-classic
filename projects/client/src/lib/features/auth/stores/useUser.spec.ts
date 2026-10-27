import { DEVS } from '$mocks/data/media-actions/DEVS.ts';
import { MATRIX } from '$mocks/data/media-actions/MATRIX.ts';
import { SILO } from '$mocks/data/media-actions/SILO.ts';
import { SILO_SEASON } from '$mocks/data/media-actions/SILO_SEASON.ts';
import { WATCHLIST_URL } from '$mocks/data/sync/WATCHLIST_URL.ts';
import { DROPPED_URL } from '$mocks/data/users/DROPPED_URL.ts';
import { server } from '$mocks/server.ts';
import { listedAtOf } from '$test/beds/media-actions/listedAtOf.ts';
import { movieListItem } from '$test/beds/request/movieListItem.ts';
import { pagedResponse } from '$test/beds/request/pagedResponse.ts';
import { recordSearches } from '$test/beds/request/recordSearches.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { http } from 'msw';
import { describe, expect, it } from 'vitest';
import { useUser } from './useUser.ts';

const SILO_EPISODE_1_ID = 5165667;
const LISTED_AT = '2024-01-01T12:00:00.000Z';

describe('store: useUser', () => {
  describe('watchlist', () => {
    it('should hold the watchlisted ids of every type, with their listed dates', async () => {
      const { watchlist } = await renderStore(useUser);

      const $watchlist = await readKnown(watchlist);

      expect([...$watchlist.movies]).toEqual([[MATRIX.id, listedAtOf(MATRIX)]]);
      expect([...$watchlist.shows]).toEqual([[SILO.id, listedAtOf(SILO)]]);
      expect([...$watchlist.seasons]).toEqual([
        [SILO_SEASON.id, listedAtOf(SILO_SEASON)],
      ]);
      expect([...$watchlist.episodes]).toEqual([
        [
          SILO_EPISODE_1_ID,
          listedAtOf({ type: 'episode', id: SILO_EPISODE_1_ID }),
        ],
      ]);
    });

    it('should fetch every page', async () => {
      server.use(
        http.get(
          WATCHLIST_URL,
          ({ request }) => {
            const page = Number(
              new URL(request.url).searchParams.get('page') ?? 1,
            );
            const id = page === 2 ? 2 : 1;

            return pagedResponse({
              body: [{ ...movieListItem(id), listed_at: LISTED_AT }],
              page,
              pageCount: 2,
            });
          },
        ),
      );
      const { watchlist } = await renderStore(useUser);

      const $watchlist = await readKnown(watchlist);

      expect([...$watchlist.movies.keys()]).toEqual([1, 2]);
    });
  });

  describe('dropped', () => {
    it('should hold the dropped show ids', async () => {
      const { dropped } = await renderStore(useUser);

      const $dropped = await readKnown(dropped);

      expect([...$dropped.shows]).toEqual([DEVS.id]);
    });

    it('should request 250 dropped shows per page', async () => {
      const searches = recordSearches(DROPPED_URL, []);
      const { dropped } = await renderStore(useUser);

      await readKnown(dropped);

      expect(searches.map((search) => search.get('limit'))).toEqual(['250']);
    });
  });
});
