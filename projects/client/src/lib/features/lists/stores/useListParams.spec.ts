import { FAVORITES_PATH } from '$mocks/data/users/FAVORITES_PATH.ts';
import { WATCHLIST_PATH } from '$mocks/data/users/WATCHLIST_PATH.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { LIST_TYPES } from '$lib/features/lists/LIST_TYPES.ts';
import type { Observable } from 'rxjs';
import { type ListParams, useListParams } from './useListParams.ts';

function renderWatchlistParams() {
  return renderStore(() => useListParams({ types: LIST_TYPES.watchlist }));
}

describe('store: useListParams', () => {
  describe('typing', () => {
    it("should type the favorites' type as a movie or a show", () => {
      const favorites =
        expectTypeOf(() => useListParams({ types: LIST_TYPES.favorites }))
          .returns;

      favorites.toHaveProperty('type')
        .toEqualTypeOf<Observable<'movie' | 'show' | null>>();
      favorites.toHaveProperty('setType').parameter(0)
        .toEqualTypeOf<'movie' | 'show' | null>();
    });

    it("should type the watchlist's type as any list type", () => {
      const watchlist =
        expectTypeOf(() => useListParams({ types: LIST_TYPES.watchlist }))
          .returns;

      watchlist.toHaveProperty('type').toEqualTypeOf<
        Observable<'movie' | 'show' | 'season' | 'episode' | null>
      >();
      watchlist.toHaveProperty('setType').parameter(0)
        .toEqualTypeOf<'movie' | 'show' | 'season' | 'episode' | null>();
    });

    it("should name the favorites' params as ListParams over its types", () => {
      expectTypeOf(() => useListParams({ types: LIST_TYPES.favorites }))
        .returns.toEqualTypeOf<ListParams<'movie' | 'show'>>();
    });
  });

  describe('types', () => {
    it('should return the types it was given', async () => {
      openAt(FAVORITES_PATH);
      const params = await renderStore(() =>
        useListParams({ types: LIST_TYPES.favorites })
      );

      expect(params.types).toEqual(['movie', 'show']);
    });
  });

  describe('reading', () => {
    it.each([
      { search: '', sort: { by: 'rank', how: 'asc' } },
      { search: '?sort=title,asc', sort: { by: 'title', how: 'asc' } },
      { search: '?sort=votes,asc', sort: { by: 'votes', how: 'asc' } },
      {
        search: '?sort=popularity,desc',
        sort: { by: 'popularity', how: 'desc' },
      },
      { search: '?sort=name,asc', sort: { by: 'rank', how: 'asc' } },
    ])(
      'should read $search as the sort $sort.by $sort.how',
      async ({ search, sort }) => {
        openAt(`${WATCHLIST_PATH}${search}`);
        const params = await renderWatchlistParams();

        expect(await readKnown(params.sort)).toEqual(sort);
      },
    );

    it.each([
      { search: '', type: null },
      { search: '?display=movie', type: 'movie' },
      { search: '?display=episode', type: 'episode' },
      { search: '?display=movies', type: null },
      { search: '?display=person', type: null },
      { search: '?display=movie,show', type: null },
    ])(
      'should read $search as the type $type on the watchlist',
      async ({ search, type }) => {
        openAt(`${WATCHLIST_PATH}${search}`);
        const params = await renderWatchlistParams();

        expect(await readKnown(params.type)).toBe(type);
      },
    );

    it.each([
      { search: '?display=show', type: 'show' },
      { search: '?display=season', type: null },
      { search: '?display=episode', type: null },
    ])(
      "should read $search as the type $type in the screen's own subset",
      async ({ search, type }) => {
        openAt(`${FAVORITES_PATH}${search}`);
        const params = await renderStore(() =>
          useListParams({ types: LIST_TYPES.favorites })
        );

        expect(await readKnown(params.type)).toBe(type);
      },
    );

    it.each([
      { search: '', genre: null },
      { search: '?genres=drama', genre: 'drama' },
      { search: '?genres=science-fiction', genre: 'science-fiction' },
      { search: '?genres=drama,horror', genre: null },
      { search: '?genres=telenovela', genre: null },
    ])('should read $search as the genre $genre', async ({ search, genre }) => {
      openAt(`${WATCHLIST_PATH}${search}`);
      const params = await renderWatchlistParams();

      expect(await readKnown(params.genre)).toBe(genre);
    });

    it.each([
      { search: '', page: 1 },
      { search: '?page=2', page: 2 },
      { search: '?page=13', page: 13 },
      { search: '?page=0', page: 1 },
      { search: '?page=1', page: 1 },
      { search: '?page=-2', page: 1 },
      { search: '?page=2.5', page: 1 },
      { search: '?page=abc', page: 1 },
      { search: '?page=99999999999999999999999', page: 1 },
    ])('should read $search as page $page', async ({ search, page }) => {
      openAt(`${WATCHLIST_PATH}${search}`);
      const params = await renderWatchlistParams();

      expect(await readKnown(params.page)).toBe(page);
    });

    it.each([
      { search: '', watched: null },
      { search: '?fade=watched', watched: 'fade' },
      { search: '?hide=watched', watched: 'hide' },
    ])(
      'should read $search as the watched filter $watched',
      async ({ search, watched }) => {
        openAt(`${WATCHLIST_PATH}${search}`);
        const params = await renderWatchlistParams();

        expect(await readKnown(params.watched)).toBe(watched);
      },
    );
  });

  describe('writing', () => {
    it('should select a sort at its default direction and drop the page in one replace', async () => {
      openAt(`${WATCHLIST_PATH}?page=3&hide=watched`);
      const { selectSort } = await renderWatchlistParams();

      await selectSort('added');

      expectOneReplace();
      expect(lastReplace()).toBe(
        `${WATCHLIST_PATH}?hide=watched&sort=added,desc`,
      );
    });

    it('should reverse the sort and drop the page in one replace', async () => {
      openAt(`${WATCHLIST_PATH}?sort=title,asc&page=3`);
      const { reverseSort } = await renderWatchlistParams();

      await reverseSort();

      expectOneReplace();
      expect(lastReplace()).toBe(`${WATCHLIST_PATH}?sort=title,desc`);
    });

    it('should set the type and drop the page in one replace', async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama&page=3`);
      const { setType } = await renderWatchlistParams();

      await setType('season');

      expectOneReplace();
      expect(lastReplace()).toBe(
        `${WATCHLIST_PATH}?genres=drama&display=season`,
      );
    });

    it('should clear the type and drop the page in one replace', async () => {
      openAt(`${WATCHLIST_PATH}?display=movie&page=3`);
      const { setType } = await renderWatchlistParams();

      await setType(null);

      expectOneReplace();
      expect(lastReplace()).toBe(WATCHLIST_PATH);
    });

    it('should set the genre and drop the page in one replace', async () => {
      openAt(`${WATCHLIST_PATH}?sort=title,asc&page=3`);
      const { setGenre } = await renderWatchlistParams();

      await setGenre('horror');

      expectOneReplace();
      expect(lastReplace()).toBe(
        `${WATCHLIST_PATH}?sort=title,asc&genres=horror`,
      );
    });

    it('should clear the genre and drop the page in one replace', async () => {
      openAt(`${WATCHLIST_PATH}?genres=horror&page=3`);
      const { setGenre } = await renderWatchlistParams();

      await setGenre(null);

      expectOneReplace();
      expect(lastReplace()).toBe(WATCHLIST_PATH);
    });

    it('should replace the page and keep the other params', async () => {
      openAt(`${WATCHLIST_PATH}?genres=drama&page=5`);
      const { replacePage } = await renderWatchlistParams();

      await replacePage(2);

      expectOneReplace();
      expect(lastReplace()).toBe(`${WATCHLIST_PATH}?genres=drama&page=2`);
    });

    it('should replace page 1 with no page in the URL', async () => {
      openAt(`${WATCHLIST_PATH}?sort=title,asc&page=3`);
      const { replacePage } = await renderWatchlistParams();

      await replacePage(1);

      expectOneReplace();
      expect(lastReplace()).toBe(`${WATCHLIST_PATH}?sort=title,asc`);
    });

    it('should set the watched filter and keep the page', async () => {
      openAt(`${WATCHLIST_PATH}?page=3&fade=watched`);
      const { setWatched } = await renderWatchlistParams();

      await setWatched('hide');

      expectOneReplace();
      expect(lastReplace()).toBe(`${WATCHLIST_PATH}?page=3&hide=watched`);
    });
  });
});
