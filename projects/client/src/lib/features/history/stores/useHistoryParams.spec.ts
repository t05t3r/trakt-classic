import { useViewParam } from '$lib/features/view-params/stores/useViewParam.ts';
import { HISTORY_PATH } from '$mocks/data/users/HISTORY_PATH.ts';
import { collectStates } from '$test/beds/store/collectStates.ts';
import { readKnown } from '$test/beds/store/readKnown.ts';
import { renderStore } from '$test/beds/store/renderStore.ts';
import { valueObservable } from '$test/beds/store/valueObservable.ts';
import { expectOneReplace } from '$test/beds/url/expectOneReplace.ts';
import { followReplaces } from '$test/beds/url/followReplaces.svelte.ts';
import { lastPush } from '$test/beds/url/lastPush.ts';
import { lastReplace } from '$test/beds/url/lastReplace.ts';
import { openAt } from '$test/beds/url/openAt.ts';
import { BehaviorSubject, firstValueFrom, type Observable } from 'rxjs';
import { tick } from 'svelte';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  type HistoryTypeFilter,
  useHistoryParams,
} from './useHistoryParams.ts';

function renderParams(filters = '') {
  return renderStore(() => useHistoryParams(valueObservable(filters)));
}

describe('store: useHistoryParams', () => {
  describe('type', () => {
    it('should type the type as a history type or all', () => {
      expectTypeOf(useHistoryParams).returns.toHaveProperty('type')
        .toEqualTypeOf<Observable<HistoryTypeFilter>>();
      expectTypeOf<HistoryTypeFilter>()
        .toEqualTypeOf<'episodes' | 'shows' | 'movies' | 'all'>();
    });

    it.each([
      { filters: '', type: 'all' },
      { filters: 'movies', type: 'movies' },
      { filters: 'shows/plays', type: 'shows' },
      { filters: 'seasons', type: 'all' },
    ])('should read "$filters" as $type', async ({ filters, type }) => {
      openAt(HISTORY_PATH);
      const params = await renderParams(filters);

      expect(await readKnown(params.type)).toBe(type);
    });

    it('should follow the route while the store lives', async () => {
      openAt(HISTORY_PATH);
      const filters = new BehaviorSubject('movies');
      const params = await renderStore(() => useHistoryParams(filters));
      const seen = collectStates(params.type);

      filters.next('movies/plays');
      filters.next('shows');
      filters.next('');

      expect(seen).toEqual(['movies', 'shows', 'all']);
    });
  });

  describe('item', () => {
    it.each([
      { search: '', item: null },
      { search: '?movie=12', item: { type: 'movie', id: 12 } },
      { search: '?episode=12', item: { type: 'episode', id: 12 } },
      { search: '?show=12', item: { type: 'show', id: 12 } },
      { search: '?season=12', item: { type: 'season', id: 12 } },
      { search: '?movie=abc', item: null },
      { search: '?show=12a', item: null },
      { search: '?season=-1', item: null },
      { search: '?episode=', item: null },
      { search: '?movie=0', item: null },
    ])('should read "$search"', async ({ search, item }) => {
      openAt(`${HISTORY_PATH}${search}`);
      const params = await renderParams();

      expect(await firstValueFrom(params.item)).toEqual(item);
    });

    it('should let the first key win, whatever the order in the URL', async () => {
      openAt(`${HISTORY_PATH}?season=3&show=2&episode=1`);
      const params = await renderParams();

      expect(await firstValueFrom(params.item))
        .toEqual({ type: 'episode', id: 1 });
    });

    it.each([
      { what: 'past the safe integers', id: '9007199254740993' },
      { what: 'of 22 digits', id: '1000000000000000000000' },
    ])('should skip an id $what', async ({ id }) => {
      openAt(`${HISTORY_PATH}?movie=${id}&show=2`);
      const params = await renderParams();

      expect(await firstValueFrom(params.item))
        .toEqual({ type: 'show', id: 2 });
    });

    it('should skip a key whose value is not an id', async () => {
      openAt(`${HISTORY_PATH}?movie=abc&show=2`);
      const params = await renderParams();

      expect(await firstValueFrom(params.item))
        .toEqual({ type: 'show', id: 2 });
    });

    it.each([
      { search: '?movie=12', filters: '', type: 'movies' },
      { search: '?movie=12', filters: 'shows', type: 'movies' },
      { search: '?episode=12', filters: '', type: 'episodes' },
      { search: '?show=12', filters: 'episodes', type: 'episodes' },
      { search: '?show=12', filters: 'movies', type: 'episodes' },
      { search: '?season=12', filters: 'episodes', type: 'episodes' },
      { search: '?movie=abc', filters: 'shows', type: 'shows' },
    ])(
      'should read "$search" at "$filters" as $type',
      async ({ search, filters, type }) => {
        openAt(`${HISTORY_PATH}${search}`);
        const params = await renderParams(filters);

        expect(await readKnown(params.type)).toBe(type);
      },
    );

    it('should clear the filter and the page and keep the date range and the path', async () => {
      openAt(
        `${HISTORY_PATH}/episodes?show=12&start_at=2026-06-07&end_at=2026-06-30&page=3`,
      );
      const { clearItem } = await renderParams('episodes');

      await clearItem();

      expectOneReplace();
      expect(lastReplace()).toBe(
        `${HISTORY_PATH}/episodes?start_at=2026-06-07&end_at=2026-06-30`,
      );
    });

    it('should fall back to the path once the filter is cleared', async () => {
      followReplaces(HISTORY_PATH);
      const { params, setMovie } = await renderStore(() => ({
        params: useHistoryParams(valueObservable('')),
        setMovie: useViewParam({
          movie: { values: () => true, fallback: null },
        }).set,
      }));
      const types = collectStates(params.type);
      const items = collectStates(params.item);

      await setMovie({ movie: '12' });
      await tick();
      await params.clearItem();
      await tick();

      expect(types).toEqual(['all', 'movies', 'all']);
      expect(items).toEqual([null, { type: 'movie', id: 12 }, null]);
    });
  });

  describe('genres', () => {
    it.each([
      { search: '', genres: null },
      { search: '?genres=drama', genres: 'drama' },
      { search: '?genres=science-fiction', genres: 'science-fiction' },
      { search: '?genres=music', genres: 'music' },
      { search: '?genres=not-in-the-list-7', genres: 'not-in-the-list-7' },
      { search: '?genres=drama,comedy', genres: null },
      { search: '?genres=Drama', genres: null },
      { search: '?genres=', genres: null },
      { search: '?genres=drama%20comedy', genres: null },
    ])('should read "$search" as $genres', async ({ search, genres }) => {
      openAt(`${HISTORY_PATH}${search}`);
      const params = await renderParams();

      expect(await firstValueFrom(params.genres)).toBe(genres);
    });

    it('should read the genre on every type', async () => {
      openAt(`${HISTORY_PATH}/movies?genres=drama`);
      const params = await renderParams('movies');

      expect(await firstValueFrom(params.genres)).toBe('drama');
    });
  });

  describe('range', () => {
    it('should emit no bounds with no active param', async () => {
      openAt(`${HISTORY_PATH}?genres=drama&page=2`);
      const params = await renderParams();

      expect(await readKnown(params.range)).toStrictEqual({});
    });

    it('should read the three params into the range', async () => {
      openAt(`${HISTORY_PATH}?start_at=2026-06-07&days=1`);
      const params = await renderParams();

      expect(await readKnown(params.range)).toStrictEqual({
        startDate: new Date('2026-06-07T00:00:00.000Z'),
        endDate: new Date('2026-06-08T00:00:00.000Z'),
      });
    });

    it("should read a raw + in a Classic link through the URL's search", async () => {
      openAt(`${HISTORY_PATH}?start_at=2026-06-07T00:00:00+03:00`);
      const params = await renderParams();

      expect(await readKnown(params.range)).toStrictEqual({
        startDate: new Date('2026-06-07T00:00:00.000Z'),
      });
    });

    it("should read a %2B in a Classic link through the URL's search", async () => {
      openAt(`${HISTORY_PATH}?start_at=2026-06-07T00:00:00%2B03:00`);
      const params = await renderParams();

      expect(await readKnown(params.range)).toStrictEqual({
        startDate: new Date('2026-06-07T00:00:00.000Z'),
      });
    });

    it('should read end_at through the URL', async () => {
      openAt(`${HISTORY_PATH}?end_at=2026-06-30`);
      const params = await renderParams();

      expect(await readKnown(params.range)).toStrictEqual({
        endDate: new Date('2026-06-30T23:59:59.999Z'),
      });
    });

    it('should emit a new range only when a range param changes', async () => {
      followReplaces(HISTORY_PATH);
      const { params, setStart } = await renderStore(() => ({
        params: useHistoryParams(valueObservable('')),
        setStart: useViewParam({
          start_at: { values: () => true, fallback: null },
        }).set,
      }));
      const ranges = collectStates(params.range);
      const pages = collectStates(params.page);

      await setStart({ start_at: '2026-06-07' });
      await tick();
      await params.replacePage(3);
      await tick();

      expect(pages).toEqual([1, 3]);
      expect(ranges).toStrictEqual([
        {},
        { startDate: new Date('2026-06-07T00:00:00.000Z') },
      ]);
    });
  });

  describe('page', () => {
    it('should read ?page=4 as page 4', async () => {
      openAt(`${HISTORY_PATH}?page=4`);
      const params = await renderParams();

      expect(await readKnown(params.page)).toBe(4);
    });

    it('should replace the page and keep the rest', async () => {
      openAt(`${HISTORY_PATH}?genres=drama&page=4`);
      const { replacePage } = await renderParams();

      await replacePage(2);

      expect(lastReplace()).toBe(`${HISTORY_PATH}?genres=drama&page=2`);
    });
  });

  describe('setRange', () => {
    it('should write both params and drop days and the page in one replace', async () => {
      openAt(`${HISTORY_PATH}?start_at=2026-01-01&days=3&page=4`);
      const { setRange } = await renderParams();

      await setRange({ start: '2026-06-07', end: '2026-06-30' });

      expectOneReplace();
      expect(lastReplace())
        .toBe(`${HISTORY_PATH}?start_at=2026-06-07&end_at=2026-06-30`);
    });

    it.each([
      {
        field: 'start',
        days: { start: '', end: '2026-06-30' },
        search: '?end_at=2026-06-30',
      },
      {
        field: 'end',
        days: { start: '2026-06-07', end: '' },
        search: '?start_at=2026-06-07',
      },
    ])('should drop the param of an empty $field', async ({ days, search }) => {
      openAt(`${HISTORY_PATH}?start_at=2026-01-01&end_at=2026-01-31`);
      const { setRange } = await renderParams();

      await setRange(days);

      expect(lastReplace()).toBe(`${HISTORY_PATH}${search}`);
    });

    it('should swap a start later than the end', async () => {
      openAt(HISTORY_PATH);
      const { setRange } = await renderParams();

      await setRange({ start: '2026-06-30', end: '2026-06-07' });

      expect(lastReplace())
        .toBe(`${HISTORY_PATH}?start_at=2026-06-07&end_at=2026-06-30`);
    });

    it('should keep the genre and the path', async () => {
      openAt(`${HISTORY_PATH}/movies?genres=drama&page=2`);
      const { setRange } = await renderParams('movies');

      await setRange({ start: '2026-06-07', end: '2026-06-30' });

      expect(lastReplace()).toBe(
        `${HISTORY_PATH}/movies?genres=drama&start_at=2026-06-07&end_at=2026-06-30`,
      );
    });

    it('should read the written range back', async () => {
      followReplaces(HISTORY_PATH);
      const params = await renderParams();
      const ranges = collectStates(params.range);

      await params.setRange({ start: '2026-06-07', end: '2026-06-07' });
      await tick();

      expect(ranges).toStrictEqual([
        {},
        {
          startDate: new Date('2026-06-07T00:00:00.000Z'),
          endDate: new Date('2026-06-07T23:59:59.999Z'),
        },
      ]);
    });
  });

  describe('clearRange', () => {
    it('should drop both params, days and the page in one replace', async () => {
      openAt(
        `${HISTORY_PATH}?start_at=2026-06-07&end_at=2026-06-30&days=3&page=4`,
      );
      const { clearRange } = await renderParams();

      await clearRange();

      expectOneReplace();
      expect(lastReplace()).toBe(HISTORY_PATH);
    });

    it('should keep the genre and the path', async () => {
      openAt(`${HISTORY_PATH}/shows?start_at=2026-06-07&genres=drama`);
      const { clearRange } = await renderParams('shows');

      await clearRange();

      expect(lastReplace()).toBe(`${HISTORY_PATH}/shows?genres=drama`);
    });
  });

  describe('setType', () => {
    it('should push the type, drop the page and keep the rest', async () => {
      openAt(`${HISTORY_PATH}?genres=drama&page=4&start_at=2026-06-07`);
      const { setType } = await renderParams();

      await setType('movies');

      expect(lastPush()).toBe(
        `${HISTORY_PATH}/movies?genres=drama&start_at=2026-06-07`,
      );
    });

    it.each(['movie', 'episode', 'show', 'season'])(
      'should clear a %s filter and keep the date range',
      async (key) => {
        openAt(`${HISTORY_PATH}?${key}=12&start_at=2026-06-07`);
        const { setType } = await renderParams();

        await setType('shows');

        expect(lastPush())
          .toBe(`${HISTORY_PATH}/shows?start_at=2026-06-07`);
      },
    );

    it('should push the bare path for all', async () => {
      openAt(`${HISTORY_PATH}/shows?page=4&genres=drama`);
      const { setType } = await renderParams('shows');

      await setType('all');

      expect(lastPush()).toBe(`${HISTORY_PATH}?genres=drama`);
    });
  });
});
